import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { Tabulation, TabulationSub, TabulationEntity, TabulationSubEntity, TabulationStatus } from './entities/tabulation.entity';
import { CreateTabulationDto, UpdateTabulationDto, TabulationQueryDto } from './dto/tabulation.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TabulationService {
  constructor(@InjectKnex() private readonly knex: Knex) {}

  /**
   * Create a new tabulation with subs
   */
  async createTabulation(createTabulationDto: CreateTabulationDto): Promise<Tabulation> {
    const { tabulationSubs, ...tabulationData } = createTabulationDto;
    
    // Check if tabulation with same name already exists
    const existingTabulation = await this.knex('tabulation')
      .where('name', tabulationData.name)
      .first();
    
    if (existingTabulation) {
      throw new ConflictException('Tabulation with this name already exists');
    }

    // Start transaction
    const trx = await this.knex.transaction();

    try {
      // Insert tabulation
      const [newTabulation] = await trx('tabulation')
        .insert({
          ...tabulationData,
          status: tabulationData.status || TabulationStatus.ACTIVE,
          createdAt: this.knex.fn.now(),
          updatedAt: this.knex.fn.now(),
        })
        .returning('*');

      // Insert subs if provided
      if (tabulationSubs && tabulationSubs.length > 0) {
        const subInserts = tabulationSubs.map(sub => ({
          tabulationId: newTabulation.id,
          name: sub.name,
          description: sub.description,
          status: sub.status || TabulationStatus.ACTIVE,
          createdAt: this.knex.fn.now(),
          updatedAt: this.knex.fn.now(),
        }));

        await trx('tabulationSub').insert(subInserts);
      }

      await trx.commit();

      // Fetch tabulation with subs
      const tabulationWithSubs = await this.findTabulationByIdWithSubs(newTabulation.id);
      return tabulationWithSubs;

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Find all tabulations with pagination and filtering
   */
  async findAllTabulations(query: TabulationQueryDto): Promise<PaginatedResult<Tabulation>> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    let queryBuilder = this.knex('tabulation');

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .whereILike('name', `%${query.search}%`)
          .orWhereILike('description', `%${query.search}%`);
      });
    }

    // Apply status filter
    if (query.status) {
      queryBuilder = queryBuilder.where('status', query.status);
    }

    // Get total count
    const totalQuery = queryBuilder.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    // Get paginated results
    const tabulations = await queryBuilder
      .select('*')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const tabulationEntities = tabulations.map(tabulation => new Tabulation(tabulation));

    return {
      data: tabulationEntities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find tabulation by ID
   */
  async findTabulationById(id: string): Promise<Tabulation> {
    const tabulation = await this.knex('tabulation')
      .where('id', id)
      .first();

    if (!tabulation) {
      throw new NotFoundException('Tabulation not found');
    }

    return new Tabulation(tabulation);
  }

  /**
   * Find tabulation by ID with subs
   */
  async findTabulationByIdWithSubs(id: string): Promise<Tabulation> {
    const tabulation = await this.knex('tabulation')
      .where('id', id)
      .first();

    if (!tabulation) {
      throw new NotFoundException('Tabulation not found');
    }

    const subs = await this.knex('tabulationSub')
      .where('tabulationId', id)
      .select('*')
      .orderBy('createdAt', 'asc');

    return new Tabulation({
      ...tabulation,
      tabulationSubs: subs.map(sub => new TabulationSub(sub)),
    });
  }

  /**
   * Update tabulation by ID with subs
   */
  async updateTabulation(id: string, updateTabulationDto: UpdateTabulationDto): Promise<Tabulation> {
    // Check if tabulation exists
    const existingTabulation = await this.knex('tabulation')
      .where('id', id)
      .first();

    if (!existingTabulation) {
      throw new NotFoundException('Tabulation not found');
    }

    const { tabulationSubs, ...tabulationData } = updateTabulationDto;

    // Check for unique constraints if updating name
    if (tabulationData.name && tabulationData.name !== existingTabulation.name) {
      const existingName = await this.knex('tabulation')
        .where('name', tabulationData.name)
        .whereNot('id', id)
        .first();
      
      if (existingName) {
        throw new ConflictException('Tabulation with this name already exists');
      }
    }

    // Start transaction
    const trx = await this.knex.transaction();

    try {
      // Update tabulation
      const [updatedTabulation] = await trx('tabulation')
        .where('id', id)
        .update({
          ...tabulationData,
          updatedAt: this.knex.fn.now(),
        })
        .returning('*');

      // Handle subs update if provided
      if (tabulationSubs !== undefined) {
        // Remove all existing subs
        await trx('tabulationSub')
          .where('tabulationId', id)
          .del();

        // Add new subs if any
        if (tabulationSubs.length > 0) {
          const subInserts = tabulationSubs.map(sub => ({
            tabulationId: id,
            name: sub.name,
            description: sub.description,
            status: sub.status || TabulationStatus.ACTIVE,
            createdAt: this.knex.fn.now(),
            updatedAt: this.knex.fn.now(),
          }));

          await trx('tabulationSub').insert(subInserts);
        }
      }

      await trx.commit();

      // Fetch tabulation with subs
      const tabulationWithSubs = await this.findTabulationByIdWithSubs(id);
      return tabulationWithSubs;

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Delete tabulation by ID (soft delete - set status to inactive)
   */
  async deleteTabulation(id: string): Promise<void> {
    const existingTabulation = await this.knex('tabulation')
      .where('id', id)
      .first();

    if (!existingTabulation) {
      throw new NotFoundException('Tabulation not found');
    }

    // Start transaction
    const trx = await this.knex.transaction();

    try {
      // Update tabulation status to inactive
      await trx('tabulation')
        .where('id', id)
        .update({
          status: TabulationStatus.INACTIVE,
          updatedAt: this.knex.fn.now(),
        });

      // Update all subs status to inactive
      await trx('tabulationSub')
        .where('tabulationId', id)
        .update({
          status: TabulationStatus.INACTIVE,
          updatedAt: this.knex.fn.now(),
        });

      await trx.commit();

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Add sub to tabulation
   */
  async addSubToTabulation(tabulationId: string, subData: { name: string; description?: string; status?: TabulationStatus }): Promise<TabulationSub> {
    // Check if tabulation exists
    const tabulation = await this.knex('tabulation')
      .where('id', tabulationId)
      .first();

    if (!tabulation) {
      throw new NotFoundException('Tabulation not found');
    }

    // Check if sub with same name already exists for this tabulation
    const existingSub = await this.knex('tabulationSub')
      .where('tabulationId', tabulationId)
      .where('name', subData.name)
      .first();

    if (existingSub) {
      throw new ConflictException('Sub with this name already exists for this tabulation');
    }

    const [newSub] = await this.knex('tabulationSub')
      .insert({
        tabulationId,
        name: subData.name,
        description: subData.description,
        status: subData.status || TabulationStatus.ACTIVE,
        createdAt: this.knex.fn.now(),
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return new TabulationSub(newSub);
  }

  /**
   * Remove sub from tabulation
   */
  async removeSubFromTabulation(tabulationId: string, subId: string): Promise<void> {
    const deletedRows = await this.knex('tabulationSub')
      .where('id', subId)
      .where('tabulationId', tabulationId)
      .del();

    if (deletedRows === 0) {
      throw new NotFoundException('Sub not found for this tabulation');
    }
  }

  /**
   * Get tabulation subs
   */
  async getTabulationSubs(tabulationId: string): Promise<TabulationSub[]> {
    const subs = await this.knex('tabulationSub')
      .where('tabulationId', tabulationId)
      .select('*')
      .orderBy('createdAt', 'asc');

    return subs.map(sub => new TabulationSub(sub));
  }

  /**
   * Update sub by ID
   */
  async updateSub(subId: string, updateData: { name?: string; description?: string; status?: TabulationStatus }): Promise<TabulationSub> {
    const existingSub = await this.knex('tabulationSub')
      .where('id', subId)
      .first();

    if (!existingSub) {
      throw new NotFoundException('Sub not found');
    }

    // Check for unique constraints if updating name
    if (updateData.name && updateData.name !== existingSub.name) {
      const existingName = await this.knex('tabulationSub')
        .where('tabulationId', existingSub.tabulationId)
        .where('name', updateData.name)
        .whereNot('id', subId)
        .first();
      
      if (existingName) {
        throw new ConflictException('Sub with this name already exists for this tabulation');
      }
    }

    const [updatedSub] = await this.knex('tabulationSub')
      .where('id', subId)
      .update({
        ...updateData,
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return new TabulationSub(updatedSub);
  }
}
