import { Injectable, NotFoundException } from '@nestjs/common';
import type { Knex } from 'nestjs-knex';
import { InjectKnex } from 'nestjs-knex';
import { TabulationStatusSub, CreateTabulationStatusSubDto, UpdateTabulationStatusSubDto } from './interfaces/tabulation-status-sub.interface';
import { ManageTabulationStatusSubsResponseDto } from './dto/manage-tabulation-status-subs-response.dto';

@Injectable()
export class TabulationStatusSubService {
  constructor(@InjectKnex() private readonly knex: Knex) {}

  async create(createTabulationStatusSubDto: CreateTabulationStatusSubDto): Promise<TabulationStatusSub> {
    const [tabulationStatusSub] = await this.knex('tabulationStatusSub')
      .insert(createTabulationStatusSubDto)
      .returning('*');

    return tabulationStatusSub;
  }

  async createMany(createTabulationStatusSubDtos: CreateTabulationStatusSubDto[]): Promise<TabulationStatusSub[]> {
    if (createTabulationStatusSubDtos.length === 0) {
      return [];
    }

    // Ensure all items have the active field set
    const itemsWithActive = createTabulationStatusSubDtos.map(item => ({
      ...item,
      active: item.active !== undefined ? item.active : true
    }));

    const [tabulationStatusSubs] = await this.knex('tabulationStatusSub')
      .insert(itemsWithActive)
      .returning('*');

    return tabulationStatusSubs;
  }

  async findAll(): Promise<TabulationStatusSub[]> {
    return this.knex('tabulationStatusSub')
      .select('*')
      .where({ active: true })
      .orderBy('description');
  }

  async findAllIncludingInactive(): Promise<TabulationStatusSub[]> {
    return this.knex('tabulationStatusSub')
      .select('*')
      .orderBy('description');
  }

  async findOne(id: string): Promise<TabulationStatusSub> {
    const tabulationStatusSub = await this.knex('tabulationStatusSub')
      .select('*')
      .where({ id })
      .first();

    if (!tabulationStatusSub) {
      throw new NotFoundException(`TabulationStatusSub with ID ${id} not found`);
    }

    return tabulationStatusSub;
  }

  async findByTabulationStatusId(tabulationStatusId: string): Promise<TabulationStatusSub[]> {
    return this.knex('tabulationStatusSub')
      .select('*')
      .where({ tabulationStatusId, active: true })
      .orderBy('description');
  }

  async update(id: string, updateTabulationStatusSubDto: UpdateTabulationStatusSubDto): Promise<TabulationStatusSub> {
    const [updatedTabulationStatusSub] = await this.knex('tabulationStatusSub')
      .where({ id })
      .update(updateTabulationStatusSubDto)
      .returning('*');

    if (!updatedTabulationStatusSub) {
      throw new NotFoundException(`TabulationStatusSub with ID ${id} not found`);
    }

    return updatedTabulationStatusSub;
  }

  async remove(id: string): Promise<void> {
    const updatedCount = await this.knex('tabulationStatusSub')
      .where({ id })
      .update({ active: false });

    if (updatedCount === 0) {
      throw new NotFoundException(`TabulationStatusSub with ID ${id} not found`);
    }
  }

  async restore(id: string): Promise<TabulationStatusSub> {
    const [restoredTabulationStatusSub] = await this.knex('tabulationStatusSub')
      .where({ id })
      .update({ active: true })
      .returning('*');

    if (!restoredTabulationStatusSub) {
      throw new NotFoundException(`TabulationStatusSub with ID ${id} not found`);
    }

    return restoredTabulationStatusSub;
  }

  async manageSubItems(
    tabulationStatusId: string,
    target: string,
    createItems?: any[],
    updateItems?: any[],
    deleteItems?: any[]
  ): Promise<ManageTabulationStatusSubsResponseDto> {
    const result = { 
      created: [] as TabulationStatusSub[], 
      updated: [] as TabulationStatusSub[], 
      deleted: [] as TabulationStatusSub[] 
    };

    // Handle create operations
    if (target === 'create' && createItems && createItems.length > 0) {
      const itemsToCreate = createItems.map(item => ({
        tabulationStatusId,
        description: item.description,
        active: item.active !== undefined ? item.active : true
      }));
      result.created = await this.createMany(itemsToCreate);
    }

    // Handle update operations
    if (target === 'update' && updateItems && updateItems.length > 0) {
      for (const item of updateItems) {
        const updateData: any = { description: item.description };
        if (item.active !== undefined) {
          updateData.active = item.active;
        }
        const updated = await this.update(item.id, updateData);
        result.updated.push(updated);
      }
    }

    // Handle delete operations
    if (target === 'delete' && deleteItems && deleteItems.length > 0) {
      for (const item of deleteItems) {
        await this.remove(item.id);
        // Get the deleted item info before soft deleting
        const deletedItem = await this.findOne(item.id);
        result.deleted.push(deletedItem);
      }
    }

    return result;
  }
}
