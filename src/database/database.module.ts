import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';
import knexConfig from '../../knexfile';

@Module({
  imports: [
    KnexModule.forRoot({
      config: knexConfig[process.env.NODE_ENV || 'development'],
    }),
  ],
  exports: [KnexModule],
})
export class DatabaseModule {} 