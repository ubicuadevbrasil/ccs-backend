import { Module } from '@nestjs/common';
import { KnexModule } from 'nestjs-knex';
import externalKnexConfig from '../../knexfile.external';

@Module({
  imports: [
    KnexModule.forRoot({
      config: externalKnexConfig[process.env.NODE_ENV || 'development'],
    }, 'external'),
  ],
  exports: [KnexModule],
})
export class ExternalDatabaseModule {}
