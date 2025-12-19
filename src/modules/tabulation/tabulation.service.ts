import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { randomUUID } from 'crypto';
import { Tabulation, TabulationEntity, TabulationStatus } from './entities/tabulation.entity';
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
   * Create a new tabulation
   */
  async createTabulation(createTabulationDto: CreateTabulationDto): Promise<Tabulation> {
    const tabulationData = createTabulationDto;
    
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
          id: randomUUID(),
          ...tabulationData,
          status: tabulationData.status || TabulationStatus.ACTIVE,
          effective: tabulationData.effective || false,
          createdAt: this.knex.fn.now(),
          updatedAt: this.knex.fn.now(),
        })
        .returning('*');

      await trx.commit();

      return new Tabulation(newTabulation);

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
   * Update tabulation by ID
   */
  async updateTabulation(id: string, updateTabulationDto: UpdateTabulationDto): Promise<Tabulation> {
    // Check if tabulation exists
    const existingTabulation = await this.knex('tabulation')
      .where('id', id)
      .first();

    if (!existingTabulation) {
      throw new NotFoundException('Tabulation not found');
    }

    const tabulationData = updateTabulationDto;

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

      await trx.commit();

      return new Tabulation(updatedTabulation);

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

      await trx.commit();

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

}
