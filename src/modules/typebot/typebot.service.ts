import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { QueuesService } from '../queues/queues.service';
import { SocketService } from '../socket/socket.service';
import { EvolutionService } from '../evolution/evolution.service';
import {
  TypebotOperator,
  TypebotOperatorStatus,
  TypebotSessionStatus,
  GetOperatorsDto,
  CheckOperatorStatusDto,
  UpdateSessionStatusDto,
  ProcessChosenOperatorDto,
  CheckActiveQueueDto
} from './interfaces/typebot.interface';
import { UserProfile, UserStatus } from '../users/interfaces/user.interface';
import { QueueStatus, Department } from '../queues/interfaces/queue.interface';
import { QueueUpdate } from '../socket/interfaces/socket.interface';

@Injectable()
export class TypebotService {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => QueuesService))
    private readonly queuesService: QueuesService,
    @Inject(forwardRef(() => SocketService))
    private readonly socketService: SocketService,
    private readonly evolutionService: EvolutionService,
  ) { }

  async getOperatorsByDepartment(dto: GetOperatorsDto): Promise<{ message: string; operators: TypebotOperator[] }> {
    let department = dto.department;
    let queue: any = null;

    // If remoteJid is provided, try to find the session and get department from it
    if (dto.remoteJid) {
      const customerPhone = dto.remoteJid.replace('@s.whatsapp.net', '');
      queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

      if (queue && queue.department) {
        department = queue.department;

        // Update queue with customer department choice
        await this.queuesService.updateQueue(queue.id, {
          customerDepartmentChoice: dto.department,
          department: dto.department as any
        });
      }
    }

    const operators = await this.usersService.findByDepartment(dto.department);
    // Filter only operators and active users
    const filteredOperators = operators.filter(user =>
      user.profile !== UserProfile.ADMIN &&
      user.active === true
    );

    // Get department supervisor based on the same logic as getDepartmentSupervisor
    let supervisorName: string;
    if (dto.department === 'Personal') {
      supervisorName = 'Samara de Carla';
    } else {
      // For all other departments (Fiscal, Contabil, Financeiro)
      supervisorName = 'Aline Guarnieri';
    }

    // Find the supervisor by name from all users (not just department)
    const allUsers = await this.usersService.findAll();
    const supervisor = allUsers.find(user =>
      user.name === supervisorName &&
      user.profile === UserProfile.SUPERVISOR &&
      user.active === true
    );

    // Add supervisor to the operators list if found and not already present
    let finalOperators = [...filteredOperators];
    if (supervisor && !filteredOperators.some(op => op.id === supervisor.id)) {
      finalOperators.push(supervisor);
    }

    // Sort operators alphabetically by name
    finalOperators.sort((a, b) => a.name.localeCompare(b.name));

    // Add online status
    const operatorsWithStatus = await Promise.all(
      finalOperators.map(async (operator) => {
        const isOnline = await this.checkOperatorOnlineStatus(operator.id);
        return {
          ...operator,
          isOnline,
        };
      })
    );

    // Create the message for Typebot
    let message = 'Com quem deseja falar/interagir:\n_Informe apenas o número da opção._\n';

    operatorsWithStatus.forEach((operator, index) => {
      const position = index + 1;
      message += `\n**${position} – ${operator.name}** `;
    });

    return {
      message,
      operators: operatorsWithStatus
    };
  }

  async checkOperatorStatus(dto: CheckOperatorStatusDto): Promise<TypebotOperatorStatus> {
    const operator = await this.usersService.findOne(dto.operatorId);

    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    if (operator.profile !== UserProfile.OPERATOR) {
      throw new BadRequestException('User is not an operator');
    }

    const isOnline = await this.checkOperatorOnlineStatus(dto.operatorId);

    return {
      operatorId: dto.operatorId,
      isOnline,
      lastSeen: new Date(), // You might want to implement actual last seen tracking
    };
  }

  async updateSessionStatus(dto: UpdateSessionStatusDto): Promise<TypebotSessionStatus> {
    let queue;

    console.log('updateSessionStatus', dto);
    // Find queue by session ID or remoteJid
    if (dto.sessionId) {
      queue = await this.queuesService.findQueueBySessionId(dto.sessionId);
    } else if (dto.remoteJid) {
      const customerPhone = dto.remoteJid.replace('@s.whatsapp.net', '');
      queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);
    } else {
      throw new BadRequestException('Either sessionId or remoteJid must be provided');
    }

    if (!queue) {
      throw new NotFoundException('Session not found');
    }

    // Update queue status based on the new status
    let updateData: any = {};

    switch (dto.status) {
      case 'active':
        updateData.status = QueueStatus.TYPEBOT;
        break;
      case 'service':
        updateData.status = QueueStatus.SERVICE;
        try {
          const customerPhone = dto.remoteJid || `${queue.customerId}@s.whatsapp.net`;
          await this.evolutionService.changeSessionStatus(queue.evolutionInstance, {
            remoteJid: customerPhone,
            status: 'paused'
          });
        } catch (error) {
          console.error('Failed to pause typebot:', error);
        }
        break;
      case 'waiting':
        updateData.status = QueueStatus.WAITING;
        updateData.typebotCompletedAt = new Date();
        // Pause the typebot when status is set to waiting
        if (queue.evolutionInstance && (dto.remoteJid || queue.customerId)) {
          try {
            const customerPhone = dto.remoteJid || `${queue.customerId}@s.whatsapp.net`;
            await this.evolutionService.changeSessionStatus(queue.evolutionInstance, {
              remoteJid: customerPhone,
              status: 'paused'
            });
          } catch (error) {
            console.error('Failed to pause typebot:', error);
          }
        }
        break;
      case 'completed':
        updateData.status = QueueStatus.COMPLETED;
        break;
      case 'cancelled':
        updateData.status = QueueStatus.CANCELLED;
        break;
      default:
        throw new BadRequestException('Invalid status');
    }

    // If operator is provided, assign them
    if (dto.operatorId) {
      const operator = await this.usersService.findOne(dto.operatorId);
      if (!operator) {
        throw new BadRequestException('Invalid operator');
      }
      updateData.assignedOperatorId = dto.operatorId;
      updateData.status = QueueStatus.SERVICE;
      updateData.operatorAvailable = true;
      updateData.department = operator.department;
    }

    // If department is provided, update it
    if (dto.department) {
      updateData.department = dto.department;
    }

    const updatedQueue = await this.queuesService.updateQueue(queue.id, updateData);

    if (!updatedQueue) {
      throw new NotFoundException('Failed to update session status');
    }

    // Send event to operators after successful status update
    try {
      if (dto.status === 'waiting' || (dto.operatorId && dto.status === 'service')) {
        const queueUpdate: QueueUpdate = {
          id: updatedQueue.id,
          sessionId: updatedQueue.sessionId,
          customerPhone: updatedQueue.customerId,
          customerName: undefined, // Queue doesn't have customerName property
          status: updatedQueue.status,
          department: updatedQueue.department,
          assignedOperatorId: updatedQueue.assignedOperatorId,
          operatorName: updatedQueue.assignedOperatorId ?
            (await this.usersService.findOne(updatedQueue.assignedOperatorId))?.name : undefined,
          createdAt: updatedQueue.createdAt,
          assignedAt: updatedQueue.assignedAt,
          completedAt: updatedQueue.completedAt,
        };

        // If operator is assigned, send event specifically to them
        if (updatedQueue.assignedOperatorId) {
          this.socketService.broadcastToOperator(updatedQueue.assignedOperatorId, {
            type: 'queue.update',
            data: queueUpdate,
            target: updatedQueue.assignedOperatorId,
          });
        } else {
          // If no operator assigned, broadcast to department
          if (updatedQueue.department) {
            this.socketService.broadcastToDepartment(updatedQueue.department, {
              type: 'queue.update',
              data: queueUpdate,
              target: 'department',
              room: `department:${updatedQueue.department}`,
            });
          }
        }
      }
    } catch (error) {
      console.error('Failed to send event to operators:', error);
      // Don't fail the main operation if event emission fails
    }

    return {
      sessionId: dto.sessionId || queue.sessionId,
      queueId: updatedQueue.id,
      status: dto.status,
      operatorId: updatedQueue.assignedOperatorId,
      department: updatedQueue.department,
    };
  }

  async processChosenOperator(dto: ProcessChosenOperatorDto): Promise<{ message: string; assignedTo: string | undefined; isOnline: boolean }> {
    let queue;

    // Find queue by session ID or remoteJid
    if (dto.sessionId) {
      queue = await this.queuesService.findQueueBySessionId(dto.sessionId);
    } else if (dto.remoteJid) {
      const customerPhone = dto.remoteJid.replace('@s.whatsapp.net', '');
      queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);
    } else {
      throw new BadRequestException('Either sessionId or remoteJid must be provided');
    }

    if (!queue) {
      throw new NotFoundException('Session not found');
    }

    // Get operators from the department using the same logic as getOperatorsByDepartment
    const operators = await this.usersService.findByDepartment(queue.department);
    const filteredOperators = operators.filter(user =>
      user.profile !== UserProfile.ADMIN &&
      user.active === true
    );

    // Get department supervisor based on the same logic
    let supervisorName: string;
    if (queue.department === 'Personal') {
      supervisorName = 'Samara de Carla';
    } else {
      // For all other departments (Fiscal, Contabil, Financeiro)
      supervisorName = 'Aline Guarnieri';
    }

    // Find the supervisor by name from all users (not just department)
    const allUsers = await this.usersService.findAll();
    const supervisor = allUsers.find(user =>
      user.name === supervisorName &&
      user.profile === UserProfile.SUPERVISOR &&
      user.active === true
    );

    // Create final operators list (same as getOperatorsByDepartment)
    let finalOperators = [...filteredOperators];
    if (supervisor && !filteredOperators.some(op => op.id === supervisor.id)) {
      finalOperators.push(supervisor);
    }

    // Sort operators alphabetically by name (same as getOperatorsByDepartment)
    finalOperators.sort((a, b) => a.name.localeCompare(b.name));

    // Check if the chosen position is valid
    if (dto.operatorPosition < 1 || dto.operatorPosition > finalOperators.length) {
      throw new BadRequestException('Invalid operator position');
    }

    const chosenOperator = finalOperators[dto.operatorPosition - 1];
    const isOnline = await this.checkOperatorOnlineStatus(chosenOperator.id);

    // Update queue with the chosen operator and customer choice
    await this.queuesService.updateQueue(queue.id, {
      requestedOperatorId: chosenOperator.id,
      customerOperatorChoice: chosenOperator.name
    });

    let message: string;
    let assignedTo: string | undefined = undefined;

    if (isOnline) {
      // Operator is online, assign to them
      await this.queuesService.updateQueue(queue.id, {
        assignedOperatorId: chosenOperator.id
      });

      message = `Aguarde um momento por favor, iremos lhe transferir para ${chosenOperator.name}.`;
      assignedTo = chosenOperator.id;
    } else {
      // Operator is offline, assign to specific supervisor based on department
      if (supervisor) {
        // Check if the chosen operator is the same as the supervisor
        if (chosenOperator.id === supervisor.id) {
          // Chosen operator is the supervisor and they're offline
          message = `O operador selecionado não se encontra online, aguarde um momento por favor.`;
          await this.queuesService.updateQueue(queue.id, {
            supervisorId: supervisor.id
          });
        } else {
          const isSupervisorOnline = await this.checkOperatorOnlineStatus(supervisor.id);
          if (isSupervisorOnline) {
            message = `O operador selecionado não se encontra online, aguarde um momento por favor, iremos lhe transferir para o coordenador(a) ${supervisor.name}.`;
            assignedTo = supervisor.id;
          } else {
            message = `O operador selecionado não se encontra online, aguarde um momento por favor.`;
          }

          // Chosen operator is different from supervisor, assign to supervisor
          await this.queuesService.updateQueue(queue.id, {
            assignedOperatorId: assignedTo,
            supervisorId: supervisor.id
          });
        }
      } else {
        message = `O operador selecionado não se encontra online, aguarde um momento por favor.`;
      }
    }

    return {
      message,
      assignedTo,
      isOnline
    };
  }

  private async checkOperatorOnlineStatus(operatorId: string): Promise<boolean> {
    // Check if operator is connected via socket
    const connectedOperators = this.socketService.getConnectedOperators();
    const isConnected = connectedOperators.some(op => op.operatorId === operatorId);

    return isConnected;
  }

  private async getDepartmentSupervisor(department: string): Promise<any> {
    // Get all operators from the department
    const operators = await this.usersService.findByDepartment(department);

    let supervisorName: string;

    // Specific supervisor assignment logic
    if (department === 'Personal') {
      supervisorName = 'Samara de Carla';
    } else {
      // For all other departments (Fiscal, Contabil, Financeiro)
      supervisorName = 'Aline Guarnieri';
    }

    // Find the supervisor by name
    const supervisor = operators.find(user =>
      user.name === supervisorName &&
      user.profile === UserProfile.SUPERVISOR &&
      user.active === true
    );

    return supervisor || null;
  }

  async checkActiveQueue(dto: CheckActiveQueueDto): Promise<{ hasActiveQueue: boolean; queue?: any }> {
    const customerPhone = dto.remoteJid.replace('@s.whatsapp.net', '');
    const queue = await this.queuesService.findQueueByCustomerPhone(customerPhone);

    if (!queue) {
      return { hasActiveQueue: false };
    }

    // Check if the queue is active (not completed or cancelled)
    const hasActiveQueue = [QueueStatus.WAITING, QueueStatus.SERVICE].includes(queue.status);

    return {
      hasActiveQueue,
      queue: hasActiveQueue ? queue : undefined
    };
  }
} 