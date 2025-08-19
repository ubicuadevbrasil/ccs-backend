import { Injectable, NotFoundException } from '@nestjs/common';
import type { Knex } from 'nestjs-knex';
import { InjectKnex } from 'nestjs-knex';
import { Tabulation, CreateTabulationDto, UpdateTabulationDto } from './interfaces/tabulation.interface';
import { TabulationStatusSubService } from '../tabulation-status/tabulation-status-sub.service';

@Injectable()
export class TabulationsService {
  constructor(
    @InjectKnex() private readonly knex: Knex,
    private readonly tabulationStatusSubService: TabulationStatusSubService,
  ) {}

  async create(createTabulationDto: CreateTabulationDto): Promise<Tabulation> {
    const [tabulation] = await this.knex('tabulations')
      .insert({
        ...createTabulationDto,
        tabulatedAt: new Date(),
      })
      .returning('*');

    return tabulation;
  }

  async findAll(): Promise<Tabulation[]> {
    return this.knex('tabulations')
      .select('*')
      .orderBy('tabulatedAt', 'desc');
  }

  async findOne(id: string): Promise<Tabulation> {
    const tabulation = await this.knex('tabulations')
      .select('*')
      .where({ id })
      .first();

    if (!tabulation) {
      throw new NotFoundException(`Tabulation with ID ${id} not found`);
    }

    return tabulation;
  }

  async findBySessionId(sessionId: string): Promise<Tabulation[]> {
    return this.knex('tabulations')
      .select('*')
      .where({ sessionId })
      .orderBy('tabulatedAt', 'desc');
  }

  async findByTabulatedBy(tabulatedBy: string): Promise<Tabulation[]> {
    return this.knex('tabulations')
      .select('*')
      .where({ tabulatedBy })
      .orderBy('tabulatedAt', 'desc');
  }

  async update(id: string, updateTabulationDto: UpdateTabulationDto): Promise<Tabulation> {
    const [updatedTabulation] = await this.knex('tabulations')
      .where({ id })
      .update({
        ...updateTabulationDto,
        updatedAt: new Date(),
      })
      .returning('*');

    if (!updatedTabulation) {
      throw new NotFoundException(`Tabulation with ID ${id} not found`);
    }

    return updatedTabulation;
  }

  async remove(id: string): Promise<void> {
    const deletedCount = await this.knex('tabulations')
      .where({ id })
      .del();

    if (deletedCount === 0) {
      throw new NotFoundException(`Tabulation with ID ${id} not found`);
    }
  }
}
