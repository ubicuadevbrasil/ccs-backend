import { Injectable, NotFoundException } from '@nestjs/common';
import type { Knex } from 'nestjs-knex';
import { InjectKnex } from 'nestjs-knex';
import { TabulationStatus } from './interfaces/tabulation-status.interface';
import { CreateTabulationStatusDto } from './dto/create-tabulation-status.dto';
import { UpdateTabulationStatusDto } from './dto/update-tabulation-status.dto';
import { TabulationStatusSubService } from './tabulation-status-sub.service';
import { CreateTabulationStatusWithSubsDto } from './dto/create-tabulation-status-with-subs.dto';
import { ManageTabulationStatusSubsResponseDto } from './dto/manage-tabulation-status-subs-response.dto';

@Injectable()
export class TabulationStatusService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    private readonly tabulationStatusSubService: TabulationStatusSubService
  ) {}

  async create(createTabulationStatusDto: CreateTabulationStatusWithSubsDto): Promise<TabulationStatus> {
    // Extract sub items from the DTO
    const { subItems, ...tabulationStatusData } = createTabulationStatusDto;
    
    // Create the main tabulation status
    const [tabulationStatus] = await this.knex('tabulationStatus')
      .insert(tabulationStatusData)
      .returning('*');

    // Create sub items if provided
    if (subItems && subItems.length > 0) {
      const subItemsToCreate = subItems.map(subItem => ({
        tabulationStatusId: tabulationStatus.id,
        description: subItem.description,
        active: subItem.active !== undefined ? subItem.active : true
      }));

      await this.tabulationStatusSubService.createMany(subItemsToCreate);
    }

    return tabulationStatus;
  }

  async manageSubItems(
    id: string,
    target: string,
    createItems?: any[],
    updateItems?: any[],
    deleteItems?: any[]
  ): Promise<ManageTabulationStatusSubsResponseDto> {
    // Verify the tabulation status exists
    await this.findOne(id);
    
    // Delegate to the sub service
    return this.tabulationStatusSubService.manageSubItems(
      id,
      target,
      createItems,
      updateItems,
      deleteItems
    );
  }

  async findAll(): Promise<TabulationStatus[]> {
    const tabulationStatuses = await this.knex('tabulationStatus')
      .select('tabulationStatus.*')
      .where({ 'tabulationStatus.active': true })
      .orderBy('tabulationStatus.description');

    // Fetch sub-statuses for each tabulation status
    const result = await Promise.all(
      tabulationStatuses.map(async (status) => {
        const subStatuses = await this.knex('tabulationStatusSub')
          .select('*')
          .where({ tabulationStatusId: status.id, active: true })
          .orderBy('description');

        return {
          ...status,
          tabulationStatusSub: subStatuses
        };
      })
    );

    return result;
  }

  async findAllIncludingInactive(): Promise<TabulationStatus[]> {
    const tabulationStatuses = await this.knex('tabulationStatus')
      .select('*')
      .orderBy('description');

    // Fetch sub-statuses for each tabulation status (including inactive)
    const result = await Promise.all(
      tabulationStatuses.map(async (status) => {
        const subStatuses = await this.knex('tabulationStatusSub')
          .select('*')
          .where({ tabulationStatusId: status.id })
          .orderBy('description');

        return {
          ...status,
          tabulationStatusSub: subStatuses
        };
      })
    );

    return result;
  }

  async findOne(id: string): Promise<TabulationStatus> {
    const tabulationStatus = await this.knex('tabulationStatus')
      .select('*')
      .where({ id })
      .first();

    if (!tabulationStatus) {
      throw new NotFoundException(`TabulationStatus with ID ${id} not found`);
    }

    // Fetch sub-statuses for this tabulation status
    const subStatuses = await this.knex('tabulationStatusSub')
      .select('*')
      .where({ tabulationStatusId: id })
      .orderBy('description');

    return {
      ...tabulationStatus,
      tabulationStatusSub: subStatuses
    };
  }

  async update(id: string, updateTabulationStatusDto: UpdateTabulationStatusDto): Promise<TabulationStatus> {
    const [updatedTabulationStatus] = await this.knex('tabulationStatus')
      .where({ id })
      .update(updateTabulationStatusDto)
      .returning('*');

    if (!updatedTabulationStatus) {
      throw new NotFoundException(`TabulationStatus with ID ${id} not found`);
    }

    return updatedTabulationStatus;
  }

  async remove(id: string): Promise<void> {
    const updatedCount = await this.knex('tabulationStatus')
      .where({ id })
      .update({ active: false });

    if (updatedCount === 0) {
      throw new NotFoundException(`TabulationStatus with ID ${id} not found`);
    }
  }

  async restore(id: string): Promise<TabulationStatus> {
    const [restoredTabulationStatus] = await this.knex('tabulationStatus')
      .where({ id })
      .update({ active: true })
      .returning('*');

    if (!restoredTabulationStatus) {
      throw new NotFoundException(`TabulationStatus with ID ${id} not found`);
    }

    return restoredTabulationStatus;
  }
}

