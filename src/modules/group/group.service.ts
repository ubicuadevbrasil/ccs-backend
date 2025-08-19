import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectKnex } from 'nestjs-knex';
import { EvolutionService } from '../evolution/evolution.service';
import { MessagesService } from '../messages/messages.service';
import { SocketService } from '../socket/socket.service';
import {
  CreateGroupDto,
  UpdateGroupPictureDto,
  UpdateGroupSubjectDto,
  UpdateGroupDescriptionDto,
  SendInviteDto,
  UpdateParticipantDto,
  UpdateSettingDto,
  ToggleEphemeralDto,
  GroupInfoResponseDto,
  ParticipantResponseDto,
  UpdateGroupDto,
} from './dto/group.dto';
import { GroupFilters, ParticipantFilters } from './interfaces/group.interface';
import { MessageFrom, MessageDirection, MessageStatus, MessageType } from '../messages/interfaces/message.interface';

interface OperatorInfo {
  id: string;
  name: string;
}

@Injectable()
export class GroupService {
  private readonly logger = new Logger(GroupService.name);

  constructor(
    private readonly evolutionService: EvolutionService,
    private readonly messagesService: MessagesService,
    private readonly socketService: SocketService,
    @InjectKnex() private readonly knex: Knex
  ) { }

  /**
   * Auto-sync group after operations to ensure database consistency
   */
  private async autoSyncGroupAfterOperation(instance: string, groupJid: string, operation: string): Promise<void> {
    try {
      this.logger.log(`Auto-syncing group ${groupJid} after operation: ${operation}`);

      // Perform a quick sync to ensure database consistency
      await this.syncSpecificGroup(instance, groupJid);

      this.logger.log(`Auto-sync completed for group ${groupJid} after operation: ${operation}`);
    } catch (error) {
      this.logger.error(`Auto-sync failed for group ${groupJid} after operation: ${operation}:`, error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Create a system message in database and send socket event to operators
   */
  async createSystemMessage(
    instance: string,
    groupJid: string,
    message: string,
    operatorInfo?: OperatorInfo,
    operation: string = 'system_message'
  ): Promise<void> {
    try {
      this.logger.log(`Creating system message for group ${groupJid}: ${message}`);

      // Create system message in database
      await this.messagesService.createMessage({
        remoteJid: groupJid,
        instance,
        pushName: 'System',
        source: 'system',
        messageTimestamp: Date.now(),
        messageType: MessageType.CONVERSATION,
        from: MessageFrom.SYSTEM,
        direction: MessageDirection.OUTBOUND,
        content: message,
        status: MessageStatus.SENT,
        evolutionData: {
          operation,
          operatorId: operatorInfo?.id,
          operatorName: operatorInfo?.name,
          timestamp: new Date(),
        },
        metadata: {
          isSystemMessage: true,
          isGroupMessage: true,
          groupJid,
          operation,
          operatorId: operatorInfo?.id,
          operatorName: operatorInfo?.name,
        },
      });

      // Send socket event to all operators
      try {
        await this.socketService.broadcastToAll({
          type: 'group.system_message',
          data: {
            event: 'group.system_message',
            instance,
            groupJid,
            message,
            operatorInfo,
            operation,
            timestamp: new Date(),
          },
        });

        this.logger.log(`System message socket event sent for group ${groupJid}`);
      } catch (error) {
        this.logger.error(`Failed to send system message socket event:`, error);
      }

      this.logger.log(`System message created successfully for group ${groupJid}`);
    } catch (error) {
      this.logger.error(`Failed to create system message for group ${groupJid}:`, error);
      // Don't throw error to avoid breaking group operations
    }
  }

  /**
   * Create a new WhatsApp group
   */
  async createGroup(instance: string, createGroupDto: CreateGroupDto, operatorInfo: OperatorInfo): Promise<any> {
    try {
      this.logger.log(`Creating group for instance ${instance}: ${createGroupDto.subject} by operator ${operatorInfo.name}`);

      // Extract the basic group creation data
      const { picture, initialSubject, initialDescription, ...groupData } = createGroupDto;

      // Create the group
      const result = await this.evolutionService.createGroup(instance, groupData);

      // Get the group JID from the result
      const groupJid = result?.gid || result?.id;

      if (groupJid) {
        const updates: string[] = [];

        // Update group picture if provided
        if (picture) {
          try {
            await this.evolutionService.updateGroupPicture(instance, groupJid, { image: picture });
            updates.push('picture');
            this.logger.log(`Group picture updated for instance ${instance}, group ${groupJid}`);
          } catch (error) {
            this.logger.error(`Failed to update group picture for instance ${instance}, group ${groupJid}:`, error);
          }
        }

        // Update group subject if provided and different from main subject
        if (initialSubject && initialSubject !== createGroupDto.subject) {
          try {
            await this.evolutionService.updateGroupSubject(instance, groupJid, { subject: initialSubject });
            updates.push('subject');
            this.logger.log(`Group subject updated for instance ${instance}, group ${groupJid}`);
          } catch (error) {
            this.logger.error(`Failed to update group subject for instance ${instance}, group ${groupJid}:`, error);
          }
        }

        // Update group description if provided and different from main description
        if (initialDescription && initialDescription !== createGroupDto.description) {
          try {
            await this.evolutionService.updateGroupDescription(instance, groupJid, { description: initialDescription });
            updates.push('description');
            this.logger.log(`Group description updated for instance ${instance}, group ${groupJid}`);
          } catch (error) {
            this.logger.error(`Failed to update group description for instance ${instance}, group ${groupJid}:`, error);
          }
        }

        // Create system message about group creation
        try {
          const systemMessage = `${operatorInfo.name} criou o grupo "${createGroupDto.subject}" com sucesso.`;
          await this.createSystemMessage(instance, groupJid, systemMessage, operatorInfo, 'create_group');
        } catch (error) {
          this.logger.error(`Failed to create group creation system message:`, error);
        }

        // Auto-sync group to ensure database consistency
        try {
          await this.autoSyncGroupAfterOperation(instance, groupJid, 'create_group');
        } catch (error) {
          this.logger.error(`Failed to auto-sync group after creation: ${groupJid}`, error);
        }

        this.logger.log(`Group created successfully for instance ${instance} with updates: ${updates.join(', ')}`);
        return { ...result, updates };
      } else {
        this.logger.log(`Group created successfully for instance ${instance}`);
        return result;
      }
    } catch (error) {
      this.logger.error(`Failed to create group for instance ${instance}:`, error);
      throw new HttpException(
        error.message || 'Failed to create group',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update group picture
   */
  async updateGroupPicture(
    instance: string,
    groupJid: string,
    updateGroupPictureDto: UpdateGroupPictureDto,
    operatorInfo: OperatorInfo
  ): Promise<any> {
    try {
      this.logger.log(`Updating group picture for instance ${instance}, group ${groupJid} by operator ${operatorInfo.name}`);

      const result = await this.evolutionService.updateGroupPicture(
        instance,
        groupJid,
        updateGroupPictureDto
      );

      // Create system message about picture update
      try {
        const systemMessage = `${operatorInfo.name} alterou a foto do grupo.`;
        await this.createSystemMessage(instance, groupJid, systemMessage, operatorInfo, 'update_picture');
      } catch (error) {
        this.logger.error(`Failed to create picture update system message:`, error);
      }

      this.logger.log(`Group picture updated successfully for instance ${instance}, group ${groupJid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update group picture for instance ${instance}, group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to update group picture',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Unified method to update group information (picture, subject, description)
   */
  async updateGroup(
    instance: string,
    groupJid: string,
    updateGroupDto: UpdateGroupDto,
    operatorInfo: OperatorInfo
  ): Promise<any> {
    try {
      this.logger.log(`Updating group information for instance ${instance}, group ${groupJid} by operator ${operatorInfo.name}`);

      const updates: string[] = [];
      const results: any = {};

      // Update group picture if provided
      if (updateGroupDto.image) {
        try {
          const pictureResult = await this.evolutionService.updateGroupPicture(
            instance,
            groupJid,
            { image: updateGroupDto.image }
          );
          results.picture = pictureResult;
          updates.push('picture');
          this.logger.log(`Group picture updated for instance ${instance}, group ${groupJid}`);
        } catch (error) {
          this.logger.error(`Failed to update group picture for instance ${instance}, group ${groupJid}:`, error);
          throw new HttpException(
            error.message || 'Failed to update group picture',
            error.status || HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      }

      // Update group subject if provided
      if (updateGroupDto.subject) {
        try {
          const subjectResult = await this.evolutionService.updateGroupSubject(
            instance,
            groupJid,
            { subject: updateGroupDto.subject }
          );
          results.subject = subjectResult;
          updates.push('subject');
          this.logger.log(`Group subject updated for instance ${instance}, group ${groupJid}`);
        } catch (error) {
          this.logger.error(`Failed to update group subject for instance ${instance}, group ${groupJid}:`, error);
          throw new HttpException(
            error.message || 'Failed to update group subject',
            error.status || HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      }

      // Update group description if provided
      if (updateGroupDto.description) {
        try {
          const descriptionResult = await this.evolutionService.updateGroupDescription(
            instance,
            groupJid,
            { description: updateGroupDto.description }
          );
          results.description = descriptionResult;
          updates.push('description');
          this.logger.log(`Group description updated for instance ${instance}, group ${groupJid}`);
        } catch (error) {
          this.logger.error(`Failed to update group description for instance ${instance}, group ${groupJid}:`, error);
          throw new HttpException(
            error.message || 'Failed to update group description',
            error.status || HttpStatus.INTERNAL_SERVER_ERROR
          );
        }
      }

      // Create system message about the updates
      if (updates.length > 0) {
        try {
          let systemMessage = '';
          if (updates.length === 1) {
            switch (updates[0]) {
              case 'picture':
                systemMessage = `${operatorInfo.name} alterou a foto do grupo.`;
                break;
              case 'subject':
                systemMessage = `${operatorInfo.name} alterou o nome do grupo para: *${updateGroupDto.subject}*`;
                break;
              case 'description':
                systemMessage = `${operatorInfo.name} alterou a descrição do grupo.`;
                break;
            }
          } else {
            const updateText = updates.map(update => {
              switch (update) {
                case 'picture': return 'foto';
                case 'subject': return 'nome';
                case 'description': return 'descrição';
                default: return update;
              }
            }).join(', ');
            systemMessage = `${operatorInfo.name} alterou a ${updateText} do grupo.`;
          }

          await this.createSystemMessage(instance, groupJid, systemMessage, operatorInfo, 'update_group');
        } catch (error) {
          this.logger.error(`Failed to create group update system message:`, error);
        }
      }

      // Auto-sync group after updates to ensure database consistency
      try {
        await this.autoSyncGroupAfterOperation(instance, groupJid, 'update_group');
      } catch (error) {
        this.logger.error(`Failed to auto-sync group after update: ${groupJid}`, error);
      }

      this.logger.log(`Group information updated successfully for instance ${instance}, group ${groupJid}. Updates: ${updates.join(', ')}`);
      return {
        success: true,
        updates,
        results,
        message: `Group updated successfully. Updated fields: ${updates.join(', ')}`
      };
    } catch (error) {
    }
  }

  /**
   * Update group subject
   */
  async updateGroupSubject(
    instance: string,
    groupJid: string,
    updateGroupSubjectDto: UpdateGroupSubjectDto,
    operatorInfo: OperatorInfo
  ): Promise<any> {
    try {
      this.logger.log(`Updating group subject for instance ${instance}, group ${groupJid} by operator ${operatorInfo.name}`);

      const result = await this.evolutionService.updateGroupSubject(
        instance,
        groupJid,
        updateGroupSubjectDto
      );

      // Create system message about subject change
      try {
        const systemMessage = `${operatorInfo.name} alterou o nome do grupo para: *${updateGroupSubjectDto.subject}*`;
        await this.createSystemMessage(instance, groupJid, systemMessage, operatorInfo, 'update_subject');
      } catch (error) {
        this.logger.error(`Failed to create subject update system message:`, error);
      }

      this.logger.log(`Group subject updated successfully for instance ${instance}, group ${groupJid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update group subject for instance ${instance}, group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to update group subject',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update group description
   */
  async updateGroupDescription(
    instance: string,
    groupJid: string,
    updateGroupDescriptionDto: UpdateGroupDescriptionDto,
    operatorInfo: OperatorInfo
  ): Promise<any> {
    try {
      this.logger.log(`Updating group description for instance ${instance}, group ${groupJid} by operator ${operatorInfo.name}`);

      const result = await this.evolutionService.updateGroupDescription(
        instance,
        groupJid,
        updateGroupDescriptionDto
      );

      // Create system message about description change
      try {
        const systemMessage = `\n\n${operatorInfo.name} alterou a descrição do grupo.`;
        await this.createSystemMessage(instance, groupJid, systemMessage, operatorInfo, 'update_description');
      } catch (error) {
        this.logger.error(`Failed to create description update system message:`, error);
      }

      this.logger.log(`Group description updated successfully for instance ${instance}, group ${groupJid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update group description for instance ${instance}, group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to update group description',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get group invite code
   */
  async getInviteCode(instance: string, groupJid: string): Promise<any> {
    try {
      this.logger.log(`Getting invite code for instance ${instance}, group ${groupJid}`);

      const result = await this.evolutionService.getInviteCode(instance, groupJid);

      this.logger.log(`Invite code retrieved successfully for instance ${instance}, group ${groupJid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get invite code for instance ${instance}, group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to get invite code',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Revoke group invite code
   */
  async revokeInviteCode(instance: string, groupJid: string, operatorInfo: OperatorInfo): Promise<any> {
    try {
      this.logger.log(`Revoking invite code for instance ${instance}, group ${groupJid} by operator ${operatorInfo.name}`);

      const result = await this.evolutionService.revokeInviteCode(instance, groupJid);

      // Create system message about invite code revoked
      try {
        const systemMessage = `${operatorInfo.name} revogou o código de convite anterior. Um novo código será gerado quando necessário.`;
        await this.createSystemMessage(instance, groupJid, systemMessage, operatorInfo, 'revoke_invite_code');
      } catch (error) {
        this.logger.error(`Failed to create invite code revoked system message:`, error);
      }

      this.logger.log(`Invite code revoked successfully for instance ${instance}, group ${groupJid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to revoke invite code for instance ${instance}, group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to revoke invite code',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Send group invite
   */
  async sendInvite(instance: string, sendInviteDto: SendInviteDto, operatorInfo: OperatorInfo): Promise<any> {
    try {
      this.logger.log(`Sending group invite for instance ${instance}, group ${sendInviteDto.groupJid} by operator ${operatorInfo.name}`);

      const result = await this.evolutionService.sendInvite(instance, sendInviteDto);

      // Create system message about invite sent
      try {
        const inviteCount = sendInviteDto.numbers?.length || 0;
        const systemMessage = `${operatorInfo.name} enviou ${inviteCount} convite(s) para novos participantes.`;
        await this.createSystemMessage(instance, sendInviteDto.groupJid, systemMessage, operatorInfo, 'send_invite');
      } catch (error) {
        this.logger.error(`Failed to create invite system message:`, error);
      }

      this.logger.log(`Group invite sent successfully for instance ${instance}, group ${sendInviteDto.groupJid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send group invite for instance ${instance}, group ${sendInviteDto.groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to send group invite',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Send group invite without creating system message (for internal use)
   */
  private async sendInviteWithoutSystemMessage(instance: string, sendInviteDto: SendInviteDto): Promise<any> {
    try {
      this.logger.log(`Sending group invite without system message for instance ${instance}, group ${sendInviteDto.groupJid}`);

      const result = await this.evolutionService.sendInvite(instance, sendInviteDto);

      this.logger.log(`Group invite sent successfully for instance ${instance}, group ${sendInviteDto.groupJid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to send group invite for instance ${instance}, group ${sendInviteDto.groupJid}:`, error);
      throw error;
    }
  }

  /**
   * Get invite information
   */
  async getInviteInfo(instance: string, inviteCode: string): Promise<any> {
    try {
      this.logger.log(`Getting invite info for instance ${instance}, invite code ${inviteCode}`);

      const result = await this.evolutionService.getInviteInfo(instance, inviteCode);

      this.logger.log(`Invite info retrieved successfully for instance ${instance}, invite code ${inviteCode}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get invite info for instance ${instance}, invite code ${inviteCode}:`, error);
      throw new HttpException(
        error.message || 'Failed to get invite info',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Find group information - prioritize database first, only active groups
   */
  async findGroupInfos(instance: string, groupJid: string): Promise<GroupInfoResponseDto> {
    try {
      this.logger.log(`Finding group info for instance ${instance}, group ${groupJid} from database first`);

      // First try to find the active group in database
      const group = await this.knex('groups')
        .where('evolutionGroupId', groupJid)
        .where('status', 'active')
        .first();

      if (group) {
        const participants = await this.knex('groupParticipants')
          .where('groupId', group.id)
          .where('status', 'active')
          .orderBy('joinedAt', 'asc');

        const admins = participants
          .filter(p => p.role === 'admin' || p.role === 'owner')
          .map(p => p.participantId);

        this.logger.log(`Found active group info in database for group ${groupJid}`);

        return {
          id: group.evolutionGroupId,
          subject: group.subject,
          description: group.description,
          creation: group.creation,
          owner: group.owner,
          participants: participants.map(p => ({
            id: p.participantId,
            jid: p.jid,
            lid: p.lid,
            admin: p.admin,
          })),
          admins,
        };
      }

      // If group not in database or not active, fetch from Evolution API
      this.logger.log(`Active group ${groupJid} not found in database, fetching from Evolution API`);

      const result = await this.evolutionService.findGroupInfos(instance, groupJid);

      // Sync to database for future use
      try {
        await this.syncGroupFromEvolution(instance, result);
      } catch (error) {
        this.logger.error(`Failed to sync group ${groupJid}:`, error);
      }

      return result;
    } catch (error) {
      this.logger.error(`Failed to find group info for instance ${instance}, group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to find group info',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Sync a specific group from Evolution API to database
   */
  async syncSpecificGroup(instance: string, groupJid: string): Promise<any> {
    try {
      this.logger.log(`Syncing specific group ${groupJid} for instance ${instance}`);

      // Fetch group info from Evolution API
      const groupInfo = await this.evolutionService.findGroupInfos(instance, groupJid);

      if (!groupInfo) {
        throw new HttpException(`Group ${groupJid} not found in Evolution API`, HttpStatus.NOT_FOUND);
      }

      // Sync the group to database
      const syncedGroup = await this.syncGroupFromEvolution(instance, groupInfo);

      this.logger.log(`Successfully synced group ${groupJid} to database`);
      return syncedGroup;
    } catch (error) {
      this.logger.error(`Failed to sync specific group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to sync specific group',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Sync participants for a group from Evolution API to database
   */
  private async syncParticipantsFromEvolution(instance: string, groupId: string, evolutionGroupData: any): Promise<void> {
    try {
      this.logger.log(`Syncing participants for group ${evolutionGroupData.id}`);

      // Get participants from Evolution API
      const participantsResponse = await this.evolutionService.getParticipants(instance, evolutionGroupData.id);

      // Handle the response structure - it returns { participants: [...] }
      const participants = participantsResponse?.participants || participantsResponse;

      if (!participants || !Array.isArray(participants)) {
        this.logger.warn(`No participants found for group ${evolutionGroupData.id}`);
        return;
      }

      this.logger.log(`Found ${participants.length} participants for group ${evolutionGroupData.id}`);

      // Process each participant
      for (const participant of participants) {
        const participantData = {
          groupId,
          participantId: participant.id,
          jid: participant.jid || participant.id,
          lid: participant.lid || null,
          admin: participant.admin || null,
          role: participant.admin ? (participant.admin === 'superadmin' ? 'owner' : 'admin') : 'member',
          name: participant.name || null,
          phoneNumber: participant.id?.replace('@s.whatsapp.net', '') || null,
          profilePicture: participant.imgUrl || null,
          evolutionData: JSON.stringify(participant),
          metadata: JSON.stringify({}),
          status: 'active',
          updatedAt: new Date(),
        };

        // Check if participant already exists
        const existingParticipant = await this.knex('groupParticipants')
          .where('groupId', groupId)
          .where('participantId', participant.id)
          .first();

        if (existingParticipant) {
          // Update existing participant
          await this.knex('groupParticipants')
            .where('id', existingParticipant.id)
            .update({
              ...participantData,
              updatedAt: new Date(),
            });
        } else {
          // Insert new participant
          await this.knex('groupParticipants').insert({
            ...participantData,
            joinedAt: new Date(),
          });
        }
      }

      // Mark participants not in the current list as removed
      const currentParticipantIds = participants.map((p: any) => p.id);
      await this.knex('groupParticipants')
        .where('groupId', groupId)
        .whereNotIn('participantId', currentParticipantIds)
        .update({ status: 'removed', updatedAt: new Date() });

      this.logger.log(`Synced ${participants.length} participants for group ${evolutionGroupData.id}`);

    } catch (error) {
      this.logger.error(`Failed to sync participants for group ${evolutionGroupData.id}:`, error);
      // Don't throw error to avoid breaking group sync
    }
  }

  /**
   * Sync only participants for a specific group
   */
  async syncGroupParticipants(instance: string, groupJid: string): Promise<any> {
    try {
      this.logger.log(`Syncing participants for group ${groupJid}`);

      // First find the group in database
      const group = await this.knex('groups')
        .where('evolutionGroupId', groupJid)
        .first();

      if (!group) {
        throw new HttpException(`Group ${groupJid} not found in database`, HttpStatus.NOT_FOUND);
      }

      // Get participants from Evolution API
      const participantsResponse = await this.evolutionService.getParticipants(instance, groupJid);
      const participants = participantsResponse?.participants || participantsResponse;

      if (!participants || !Array.isArray(participants)) {
        this.logger.warn(`No participants found for group ${groupJid}`);
        return { groupId: group.id, participantsCount: 0 };
      }

      // Sync participants using the existing method
      await this.syncParticipantsFromEvolution(instance, group.id, { id: groupJid });

      // Get updated participant count
      const updatedParticipants = await this.knex('groupParticipants')
        .where('groupId', group.id)
        .where('status', 'active')
        .count('* as count')
        .first();

      this.logger.log(`Successfully synced ${participants.length} participants for group ${groupJid}`);

      return {
        groupId: group.id,
        groupJid,
        participantsCount: parseInt(updatedParticipants?.count as string) || 0,
        syncedParticipants: participants.length,
      };
    } catch (error) {
      this.logger.error(`Failed to sync participants for group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to sync group participants',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Sync group metadata and settings from Evolution API
   */
  async syncGroupMetadata(instance: string, groupJid: string): Promise<any> {
    try {
      this.logger.log(`Syncing metadata for group ${groupJid}`);

      // Get group info from Evolution API
      const groupInfo = await this.evolutionService.findGroupInfos(instance, groupJid);

      if (!groupInfo) {
        throw new HttpException(`Group ${groupJid} not found in Evolution API`, HttpStatus.NOT_FOUND);
      }

      // Find the group in database
      const group = await this.knex('groups')
        .where('evolutionGroupId', groupJid)
        .first();

      if (!group) {
        throw new HttpException(`Group ${groupJid} not found in database`, HttpStatus.NOT_FOUND);
      }

      // Update group metadata
      const updateData = {
        subject: groupInfo.subject,
        description: groupInfo.desc,
        descId: groupInfo.descId,
        pictureUrl: groupInfo.pictureUrl,
        subjectOwner: groupInfo.subjectOwner,
        subjectTime: groupInfo.subjectTime,
        size: groupInfo.size || 0,
        evolutionData: JSON.stringify(groupInfo),
        updatedAt: new Date(),
      };

      // Update the group
      await this.knex('groups')
        .where('id', group.id)
        .update(updateData);

      this.logger.log(`Successfully synced metadata for group ${groupJid}`);

      return {
        groupId: group.id,
        groupJid,
        updatedFields: Object.keys(updateData).filter(key => key !== 'updatedAt'),
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to sync metadata for group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to sync group metadata',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Comprehensive sync for a specific group - syncs everything
   */
  async syncGroupComprehensive(instance: string, groupJid: string): Promise<any> {
    try {
      this.logger.log(`Starting comprehensive sync for group ${groupJid}`);

      // Step 1: Sync group basic info and metadata
      const groupInfo = await this.evolutionService.findGroupInfos(instance, groupJid);

      if (!groupInfo) {
        throw new HttpException(`Group ${groupJid} not found in Evolution API`, HttpStatus.NOT_FOUND);
      }

      // Step 2: Sync group to database
      const syncedGroup = await this.syncGroupFromEvolution(instance, groupInfo);

      // Step 3: Get final group data
      const finalGroup = await this.knex('groups')
        .where('evolutionGroupId', groupJid)
        .first();

      // Step 4: Get participant count
      const participantCount = await this.knex('groupParticipants')
        .where('groupId', finalGroup.id)
        .where('status', 'active')
        .count('* as count')
        .first();

      this.logger.log(`Comprehensive sync completed for group ${groupJid}`);

      return {
        success: true,
        groupId: finalGroup.id,
        groupJid,
        group: finalGroup,
        participantsCount: parseInt(participantCount?.count as string) || 0,
        syncTimestamp: new Date(),
        message: `Group ${groupJid} successfully synced to database`,
      };
    } catch (error) {
      this.logger.error(`Failed to perform comprehensive sync for group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to perform comprehensive group sync',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Sync group data from Evolution API to database
   */
  private async syncGroupFromEvolution(instance: string, evolutionGroupData: any): Promise<any> {
    try {
      const groupData = {
        evolutionGroupId: evolutionGroupData.id,
        instance,
        subject: evolutionGroupData.subject,
        description: evolutionGroupData.desc,
        descId: evolutionGroupData.descId,
        pictureUrl: evolutionGroupData.pictureUrl,
        owner: evolutionGroupData.owner,
        subjectOwner: evolutionGroupData.subjectOwner,
        subjectTime: evolutionGroupData.subjectTime,
        creation: evolutionGroupData.creation,
        restrict: evolutionGroupData.restrict || false,
        announce: evolutionGroupData.announce || false,
        isCommunity: evolutionGroupData.isCommunity || false,
        isCommunityAnnounce: evolutionGroupData.isCommunityAnnounce || false,
        size: evolutionGroupData.size || 0,
        evolutionData: JSON.stringify(evolutionGroupData),
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Check if group already exists
      const existingGroup = await this.knex('groups')
        .where('evolutionGroupId', evolutionGroupData.id)
        .first();

      let groupId: string;

      if (existingGroup) {
        // Update existing group
        const [updatedGroup] = await this.knex('groups')
          .where('id', existingGroup.id)
          .update({
            ...groupData,
            updatedAt: new Date(),
          })
          .returning('*');

        groupId = updatedGroup.id;
        this.logger.log(`Group updated in database: ${evolutionGroupData.id}`);
      } else {
        // Create new group
        const [newGroup] = await this.knex('groups')
          .insert(groupData)
          .returning('*');

        groupId = newGroup.id;
        this.logger.log(`Group created in database: ${evolutionGroupData.id}`);
      }

      // Sync participants for this group
      await this.syncParticipantsFromEvolution(instance, groupId, evolutionGroupData);

      // Return the group data
      const finalGroup = existingGroup ?
        await this.knex('groups').where('id', groupId).first() :
        { id: groupId, ...groupData };

      return finalGroup;
    } catch (error) {
      this.logger.error('Failed to sync group from Evolution API:', error);
      throw error;
    }
  }

  /**
   * Fetch all groups - prioritize database first, only active groups
   */
  async fetchAllGroups(instance: string, getParticipants: boolean = false): Promise<any> {
    try {
      this.logger.log(`Fetching all active groups for instance ${instance} from database first`);

      // First try to get active groups from database
      const databaseGroups = await this.knex('groups')
        .where('instance', instance)
        .where('status', 'active')
        .orderBy('createdAt', 'desc');

      if (databaseGroups.length > 0) {
        this.logger.log(`Found ${databaseGroups.length} active groups in database for instance ${instance}`);

        // If participants are requested, fetch them for each group
        if (getParticipants) {
          const groupsWithParticipants = await Promise.all(
            databaseGroups.map(async (group) => {
              const participants = await this.knex('groupParticipants')
                .where('groupId', group.id)
                .where('status', 'active')
                .orderBy('joinedAt', 'asc');
              return {
                ...group,
                participants,
              };
            })
          );

          return groupsWithParticipants;
        }

        return databaseGroups;
      }

      // If no groups in database, fetch from Evolution API and sync
      this.logger.log(`No active groups found in database for instance ${instance}, fetching from Evolution API`);

      const result = await this.evolutionService.fetchAllGroups(instance, getParticipants);

      if (result && Array.isArray(result)) {
        // Sync groups to database
        const syncedGroups: any[] = [];
        for (const groupData of result) {
          try {
            const syncedGroup = await this.syncGroupFromEvolution(instance, groupData);
            syncedGroups.push(syncedGroup);
          } catch (error) {
            this.logger.error(`Failed to sync group ${groupData.id}:`, error);
          }
        }

        this.logger.log(`Synced ${syncedGroups.length} groups to database for instance ${instance}`);
        return syncedGroups;
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to fetch all groups for instance ${instance}:`, error);
      throw new HttpException(
        error.message || 'Failed to fetch all groups',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get group participants - prioritize database first, only active groups
   */
  async getParticipants(instance: string, groupJid: string): Promise<ParticipantResponseDto[]> {
    try {
      this.logger.log(`Getting participants for instance ${instance}, group ${groupJid} from database first`);

      // First try to find the active group in database
      const group = await this.knex('groups')
        .where('evolutionGroupId', groupJid)
        .where('status', 'active')
        .first();

      if (group) {
        const participants = await this.knex('groupParticipants')
          .where('groupId', group.id)
          .where('status', 'active')
          .orderBy('joinedAt', 'asc');

        this.logger.log(`Found ${participants.length} participants in database for active group ${groupJid}`);

        return participants.map(participant => ({
          id: participant.participantId,
          role: participant.role as 'admin' | 'member' | 'owner',
          name: participant.name,
          profilePicture: participant.profilePicture,
        }));
      }

      // If group not in database or not active, fetch from Evolution API
      this.logger.log(`Active group ${groupJid} not found in database, fetching from Evolution API`);

      const result = await this.evolutionService.getParticipants(instance, groupJid);

      // Handle the response structure - it returns { participants: [...] }
      const participants = result?.participants || result;

      if (participants && Array.isArray(participants)) {
        // Try to sync the group first if it doesn't exist
        try {
          const groupInfo = await this.evolutionService.findGroupInfos(instance, groupJid);
          await this.syncGroupFromEvolution(instance, groupInfo);
        } catch (error) {
          this.logger.error(`Failed to sync group ${groupJid}:`, error);
        }

        return participants.map((participant: any) => ({
          id: participant.id,
          role: participant.admin ? (participant.admin === 'superadmin' ? 'owner' : 'admin') : 'member',
          name: participant.name,
          profilePicture: participant.imgUrl,
        }));
      }

      return [];
    } catch (error) {
      this.logger.error(`Failed to get participants for instance ${instance}, group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to get participants',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update group participant
   */
  async updateParticipant(
    instance: string,
    groupJid: string,
    updateParticipantDto: UpdateParticipantDto,
    operatorInfo: OperatorInfo
  ): Promise<any> {
    try {
      this.logger.log(`Updating participant for instance ${instance}, group ${groupJid}, action: ${updateParticipantDto.action} by operator ${operatorInfo.name}`);

      // If adding participants, validate WhatsApp numbers first
      if (updateParticipantDto.action === 'add' && updateParticipantDto.participants?.length > 0) {
        try {
          // Extract phone numbers (remove @s.whatsapp.net if present)
          const phoneNumbers = updateParticipantDto.participants.map(p =>
            p.includes('@s.whatsapp.net') ? p.replace('@s.whatsapp.net', '') : p
          );

          // Check if numbers are valid WhatsApp contacts
          const validationResult = await this.evolutionService.checkWhatsAppNumbers(instance, {
            numbers: phoneNumbers
          });

          // Handle different response structures
          let validNumbers: string[] = [];

          if (Array.isArray(validationResult)) {
            // If response is an array, filter valid numbers
            validNumbers = validationResult
              .filter((result: any) =>
                result && result.exists === true
              )
              .map((result: any) => result.jid || result.number);
          } else if (validationResult && typeof validationResult === 'object') {
            // If response is an object with a results property
            if (Array.isArray(validationResult.results)) {
              validNumbers = validationResult.results
                .filter((result: any) =>
                  result && result.exists === true
                )
                .map((result: any) => result.jid || result.number);
            } else if (validationResult.exists === true) {
              // Single result case
              validNumbers = [validationResult.jid || validationResult.number];
            }
          }

          // Ensure all valid numbers have @s.whatsapp.net suffix
          validNumbers = validNumbers.map(number =>
            number.includes('@s.whatsapp.net') ? number : `${number}@s.whatsapp.net`
          );

          if (validNumbers.length === 0) {
            throw new HttpException(
              'None of the provided numbers are valid WhatsApp contacts',
              HttpStatus.BAD_REQUEST
            );
          }

          if (validNumbers.length < updateParticipantDto.participants.length) {
            this.logger.warn(`Some numbers are not valid WhatsApp contacts. Valid: ${validNumbers.length}, Total: ${updateParticipantDto.participants.length}`);
          }

          // Update participants list to only include valid numbers
          updateParticipantDto.participants = validNumbers;
        } catch (error) {
          this.logger.error(`Failed to validate WhatsApp numbers:`, error);
          throw new HttpException(
            'Failed to validate WhatsApp numbers',
            HttpStatus.BAD_REQUEST
          );
        }
      }

      const result = await this.evolutionService.updateParticipant(
        instance,
        groupJid,
        updateParticipantDto
      );

      // Handle 403 errors (participants that can't be added directly)
      if (result?.updateParticipants) {
        const failedParticipants = result.updateParticipants.filter(
          (participant: any) => participant.status === '403'
        );

        if (failedParticipants.length > 0) {
          this.logger.log(`Found ${failedParticipants.length} participants that require approval for group ${groupJid}`);

          try {
            // Get group name for the invite message
            let groupName = 'este grupo';
            try {
              const groupInfo = await this.evolutionService.findGroupInfos(instance, groupJid);
              if (groupInfo?.subject) {
                groupName = groupInfo.subject;
              }
            } catch (error) {
              this.logger.warn(`Could not retrieve group name for ${groupJid}:`, error);
            }

            // Extract phone numbers from failed participants
            const phoneNumbers = failedParticipants.map(p =>
              p.jid.replace('@s.whatsapp.net', '')
            );

            // Use the sendInvite function to send invites
            const sendInviteDto = {
              groupJid,
              description: `${operatorInfo.name} convidou para o grupo ${groupName}`,
              numbers: phoneNumbers
            };

            await this.sendInviteWithoutSystemMessage(instance, sendInviteDto);

            this.logger.log(`Successfully sent invites to ${phoneNumbers.length} participants for group ${groupJid}`);
          } catch (error) {
            this.logger.error(`Failed to send invites to failed participants:`, error);
          }
        }
      }

      // Create system message about participant change
      try {
        const participants = updateParticipantDto.participants || [];
        if (participants.length > 0) {
          const participantPhones = participants.map(p => p.replace('@s.whatsapp.net', ''));
          let systemMessage = '';

          // Check if there were any 403 errors
          const has403Errors = result?.updateParticipants?.some(
            (participant: any) => participant.status === '403'
          );

          switch (updateParticipantDto.action) {
            case 'add':
              if (has403Errors) {
                const failedCount = result.updateParticipants.filter(
                  (participant: any) => participant.status === '403'
                ).length;
                const successCount = participants.length - failedCount;

                if (successCount > 0 && failedCount > 0) {
                  systemMessage = `${operatorInfo.name} adicionou ${successCount} participante(s) ao grupo e enviou convites para ${failedCount} participante(s) que precisam de aprovação.`;
                } else if (failedCount > 0) {
                  systemMessage = `${operatorInfo.name} enviou convites para ${failedCount} participante(s) que precisam de aprovação para entrar no grupo.`;
                } else {
                  systemMessage = `${operatorInfo.name} adicionou ${participantPhones.join(', ')} ao grupo.`;
                }
              } else {
                systemMessage = `${operatorInfo.name} adicionou ${participantPhones.join(', ')} ao grupo.`;
              }
              break;
            case 'remove':
              systemMessage = `${operatorInfo.name} removeu ${participantPhones.join(', ')} do grupo.`;
              break;
            case 'promote':
              systemMessage = `${operatorInfo.name} promoveu ${participantPhones.join(', ')} a administradores.`;
              break;
            case 'demote':
              systemMessage = `${operatorInfo.name} removeu ${participantPhones.join(', ')} como administradores.`;
              break;
            default:
              systemMessage = `${operatorInfo.name} alterou as permissões de ${participantPhones.join(', ')}.`;
          }

          await this.createSystemMessage(instance, groupJid, systemMessage, operatorInfo, 'update_participant');
        }
      } catch (error) {
        this.logger.error(`Failed to create participant update system message:`, error);
      }

      // Auto-sync group after participant update to ensure database consistency
      try {
        await this.autoSyncGroupAfterOperation(instance, groupJid, 'update_participant');
      } catch (error) {
        this.logger.error(`Failed to auto-sync group after participant update: ${groupJid}`, error);
      }

      this.logger.log(`Participant updated successfully for instance ${instance}, group ${groupJid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update participant for instance ${instance}, group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to update participant',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update group setting
   */
  async updateSetting(
    instance: string,
    groupJid: string,
    updateSettingDto: UpdateSettingDto,
    operatorInfo: OperatorInfo
  ): Promise<any> {
    try {
      this.logger.log(`Updating setting for instance ${instance}, group ${groupJid}, action: ${updateSettingDto.action} by operator ${operatorInfo.name}`);

      const result = await this.evolutionService.updateSetting(
        instance,
        groupJid,
        updateSettingDto
      );

      // Create system message about setting change
      try {
        let systemMessage = '';
        switch (updateSettingDto.action) {
          case 'announcement':
            systemMessage = `${operatorInfo.name} configurou o grupo como grupo de anúncios.`;
            break;
          case 'not_announcement':
            systemMessage = `${operatorInfo.name} configurou o grupo para permitir mensagens de todos os participantes.`;
            break;
          case 'locked':
            systemMessage = `${operatorInfo.name} bloqueou o grupo. Apenas administradores podem alterar configurações.`;
            break;
          case 'unlocked':
            systemMessage = `${operatorInfo.name} desbloqueou o grupo.`;
            break;
          default:
            systemMessage = `${operatorInfo.name} alterou uma configuração do grupo.`;
        }

        await this.createSystemMessage(instance, groupJid, systemMessage, operatorInfo, 'update_setting');
      } catch (error) {
        this.logger.error(`Failed to create setting update system message:`, error);
      }

      this.logger.log(`Setting updated successfully for instance ${instance}, group ${groupJid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to update setting for instance ${instance}, group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to update setting',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Toggle ephemeral messages
   */
  async toggleEphemeral(
    instance: string,
    groupJid: string,
    toggleEphemeralDto: ToggleEphemeralDto,
    operatorInfo: OperatorInfo
  ): Promise<any> {
    try {
      this.logger.log(`Toggling ephemeral for instance ${instance}, group ${groupJid}, expiration: ${toggleEphemeralDto.expiration} by operator ${operatorInfo.name}`);

      const result = await this.evolutionService.toggleEphemeral(
        instance,
        groupJid,
        toggleEphemeralDto
      );

      // Create system message about ephemeral toggle
      try {
        const systemMessage = toggleEphemeralDto.expiration > 0
          ? `${operatorInfo.name} ativou mensagens efêmeras que expiram em ${toggleEphemeralDto.expiration} segundos.`
          : `${operatorInfo.name} desativou as mensagens efêmeras.`;

        await this.createSystemMessage(instance, groupJid, systemMessage, operatorInfo, 'toggle_ephemeral');
      } catch (error) {
        this.logger.error(`Failed to create ephemeral toggle system message:`, error);
      }

      this.logger.log(`Ephemeral toggled successfully for instance ${instance}, group ${groupJid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to toggle ephemeral for instance ${instance}, group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to toggle ephemeral',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Leave group
   */
  async leaveGroup(instance: string, groupJid: string, operatorInfo: OperatorInfo): Promise<any> {
    try {
      this.logger.log(`Leaving group for instance ${instance}, group ${groupJid} by operator ${operatorInfo.name}`);

      const result = await this.evolutionService.leaveGroup(instance, groupJid);

      // Create system message about leaving group
      try {
        const systemMessage = `${operatorInfo.name} removeu o grupo.`;
        await this.createSystemMessage(instance, groupJid, systemMessage, operatorInfo, 'leave_group');
      } catch (error) {
        this.logger.error(`Failed to create leave group system message:`, error);
      }

      // Update group status to inactive in database
      try {
        await this.knex('groups')
          .where('evolutionGroupId', groupJid)
          .update({
            status: 'inactive',
            updatedAt: new Date(),
          });

        this.logger.log(`Group status updated to inactive in database: ${groupJid}`);
      } catch (error) {
        this.logger.error(`Failed to update group status in database: ${groupJid}`, error);
      }

      // Auto-sync group after leaving to ensure database consistency
      try {
        await this.autoSyncGroupAfterOperation(instance, groupJid, 'leave_group');
      } catch (error) {
        this.logger.error(`Failed to auto-sync group after leaving: ${groupJid}`, error);
      }

      this.logger.log(`Left group successfully for instance ${instance}, group ${groupJid}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to leave group for instance ${instance}, group ${groupJid}:`, error);
      throw new HttpException(
        error.message || 'Failed to leave group',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Fetch groups from database with filters - only active groups by default
   */
  async fetchGroupsFromDatabase(filters: GroupFilters = {}): Promise<any> {
    try {
      this.logger.log('Fetching groups from database with filters:', filters);

      let query = this.knex('groups');

      // Always filter by active status unless explicitly requested otherwise
      if (filters.status === undefined) {
        query = query.where('status', 'active');
      } else if (filters.status) {
        query = query.where('status', filters.status);
      }

      if (filters.instance) {
        query = query.where('instance', filters.instance);
      }

      if (filters.owner) {
        query = query.where('owner', filters.owner);
      }

      if (filters.subject) {
        query = query.whereILike('subject', `%${filters.subject}%`);
      }

      if (filters.isCommunity !== undefined) {
        query = query.where('isCommunity', filters.isCommunity);
      }

      if (filters.announce !== undefined) {
        query = query.where('announce', filters.announce);
      }

      if (filters.restrict !== undefined) {
        query = query.where('restrict', filters.restrict);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      const groups = await query.orderBy('createdAt', 'desc');

      this.logger.log(`Retrieved ${groups.length} groups from database`);
      return groups;
    } catch (error) {
      this.logger.error('Failed to fetch groups from database:', error);
      throw new HttpException(
        error.message || 'Failed to fetch groups from database',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get group by ID with participants - only active groups
   */
  async getGroupById(groupId: string): Promise<any> {
    try {
      this.logger.log(`Getting active group by ID: ${groupId}`);

      const group = await this.knex('groups')
        .where('id', groupId)
        .where('status', 'active')
        .first();

      if (!group) {
        throw new HttpException('Active group not found', HttpStatus.NOT_FOUND);
      }

      const participants = await this.knex('groupParticipants')
        .where('groupId', groupId)
        .where('status', 'active')
        .orderBy('joinedAt', 'asc');

      const groupWithParticipants = {
        ...group,
        participants,
      };

      this.logger.log(`Retrieved active group: ${groupId}`);
      return groupWithParticipants;
    } catch (error) {
      this.logger.error(`Failed to get active group by ID: ${groupId}`, error);
      throw new HttpException(
        error.message || 'Failed to get active group',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Sync groups from Evolution API to database
   */
  async syncGroupsFromEvolution(instance: string): Promise<any> {
    try {
      this.logger.log(`Syncing groups from Evolution API for instance: ${instance}`);

      // Fetch all groups from Evolution API
      const evolutionGroups = await this.evolutionService.fetchAllGroups(instance, true);

      if (!evolutionGroups || !Array.isArray(evolutionGroups)) {
        throw new HttpException('Invalid response from Evolution API', HttpStatus.BAD_REQUEST);
      }

      const syncedGroups: any[] = [];

      // Sync each group to database
      for (const groupData of evolutionGroups) {
        try {
          const syncedGroup = await this.syncGroupFromEvolution(instance, groupData);
          syncedGroups.push(syncedGroup);
        } catch (error) {
          this.logger.error(`Failed to sync group ${groupData.id}:`, error);
        }
      }

      this.logger.log(`Synced ${syncedGroups.length} groups for instance: ${instance}`);
      return {
        totalGroups: evolutionGroups.length,
        syncedGroups: syncedGroups.length,
        groups: syncedGroups,
      };
    } catch (error) {
      this.logger.error(`Failed to sync groups from Evolution API for instance: ${instance}`, error);
      throw new HttpException(
        error.message || 'Failed to sync groups',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get group participants from database - only active groups
   */
  async getGroupParticipantsFromDatabase(groupId: string, filters: ParticipantFilters = {}): Promise<any> {
    try {
      this.logger.log(`Getting participants for active group: ${groupId}`);

      // First verify the group is active
      const group = await this.knex('groups')
        .where('id', groupId)
        .where('status', 'active')
        .first();

      if (!group) {
        throw new HttpException('Active group not found', HttpStatus.NOT_FOUND);
      }

      let query = this.knex('groupParticipants').where('groupId', groupId);

      if (filters.role) {
        query = query.where('role', filters.role);
      }

      if (filters.status) {
        query = query.where('status', filters.status);
      }

      if (filters.limit) {
        query = query.limit(filters.limit);
      }

      if (filters.offset) {
        query = query.offset(filters.offset);
      }

      const participants = await query.orderBy('joinedAt', 'asc');

      this.logger.log(`Retrieved ${participants.length} participants for active group: ${groupId}`);
      return participants;
    } catch (error) {
      this.logger.error(`Failed to get participants for active group: ${groupId}`, error);
      throw new HttpException(
        error.message || 'Failed to get participants',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update group in database - only active groups
   */
  async updateGroupInDatabase(groupId: string, updateData: any): Promise<any> {
    try {
      this.logger.log(`Updating active group in database: ${groupId}`);

      // First verify the group is active
      const existingGroup = await this.knex('groups')
        .where('id', groupId)
        .where('status', 'active')
        .first();

      if (!existingGroup) {
        throw new HttpException('Active group not found', HttpStatus.NOT_FOUND);
      }

      const result = await this.knex('groups')
        .where('id', groupId)
        .update({
          ...updateData,
          updatedAt: new Date(),
        });

      if (result === 0) {
        throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
      }

      const updatedGroup = await this.knex('groups')
        .where('id', groupId)
        .first();

      this.logger.log(`Updated active group: ${groupId}`);
      return updatedGroup;
    } catch (error) {
      this.logger.error(`Failed to update active group: ${groupId}`, error);
      throw new HttpException(
        error.message || 'Failed to update active group',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get group statistics - only active groups by default
   */
  async getGroupStatistics(instance?: string): Promise<any> {
    try {
      this.logger.log(`Getting group statistics${instance ? ` for instance: ${instance}` : ''}`);

      let query = this.knex('groups');

      if (instance) {
        query = query.where('instance', instance);
      }

      // By default, only count active groups
      query = query.where('status', 'active');

      const stats = await query
        .select(
          this.knex.raw('COUNT(*) as total_groups'),
          this.knex.raw('COUNT(CASE WHEN status = \'active\' THEN 1 END) as active_groups'),
          this.knex.raw('COUNT(CASE WHEN status = \'inactive\' THEN 1 END) as inactive_groups'),
          this.knex.raw('COUNT(CASE WHEN status = \'archived\' THEN 1 END) as archived_groups'),
          this.knex.raw('COUNT(CASE WHEN isCommunity = true THEN 1 END) as community_groups'),
          this.knex.raw('COUNT(CASE WHEN announce = true THEN 1 END) as announcement_groups'),
          this.knex.raw('COUNT(CASE WHEN restrict = true THEN 1 END) as restricted_groups'),
          this.knex.raw('AVG(size) as avg_group_size'),
          this.knex.raw('MAX(size) as max_group_size'),
          this.knex.raw('MIN(size) as min_group_size')
        )
        .first();

      // Get participant statistics for active groups only
      const participantStats = await this.knex('groupParticipants')
        .join('groups', 'groupParticipants.groupId', 'groups.id')
        .where('groups.status', 'active')
        .select(
          this.knex.raw('COUNT(*) as total_participants'),
          this.knex.raw('COUNT(CASE WHEN groupParticipants.status = \'active\' THEN 1 END) as active_participants'),
          this.knex.raw('COUNT(CASE WHEN groupParticipants.role = \'owner\' THEN 1 END) as owners'),
          this.knex.raw('COUNT(CASE WHEN groupParticipants.role = \'admin\' THEN 1 END) as admins'),
          this.knex.raw('COUNT(CASE WHEN groupParticipants.role = \'member\' THEN 1 END) as members')
        )
        .first();

      const result = {
        ...stats,
        ...participantStats,
      };

      this.logger.log(`Retrieved group statistics`);
      return result;
    } catch (error) {
      this.logger.error('Failed to get group statistics:', error);
      throw new HttpException(
        error.message || 'Failed to get group statistics',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Delete group from database (soft delete)
   */
  async deleteGroupFromDatabase(groupId: string): Promise<any> {
    try {
      this.logger.log(`Deleting group from database: ${groupId}`);

      const result = await this.knex('groups')
        .where('id', groupId)
        .update({
          status: 'archived',
          updatedAt: new Date(),
        });

      if (result === 0) {
        throw new HttpException('Group not found', HttpStatus.NOT_FOUND);
      }

      const deletedGroup = await this.knex('groups')
        .where('id', groupId)
        .first();

      this.logger.log(`Deleted group: ${groupId}`);
      return deletedGroup;
    } catch (error) {
      this.logger.error(`Failed to delete group: ${groupId}`, error);
      throw new HttpException(
        error.message || 'Failed to delete group',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 