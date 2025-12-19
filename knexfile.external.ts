import { Knex } from 'knex';
import * as dotenv from 'dotenv';

dotenv.config();

const externalConfig: { [key: string]: Knex.Config } = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.EXTERNAL_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.EXTERNAL_DATABASE_PORT || '3306'),
      database: process.env.EXTERNAL_DATABASE_NAME || 'external_db',
      user: process.env.EXTERNAL_DATABASE_USER || 'external_user',
      password: process.env.EXTERNAL_DATABASE_PASSWORD || 'external_password',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  test: {
    client: 'mysql2',
    connection: {
      host: process.env.EXTERNAL_DATABASE_HOST || 'localhost',
      port: parseInt(process.env.EXTERNAL_DATABASE_PORT || '3306'),
      database: process.env.EXTERNAL_DATABASE_NAME || 'external_db_test',
      user: process.env.EXTERNAL_DATABASE_USER || 'external_user',
      password: process.env.EXTERNAL_DATABASE_PASSWORD || 'external_password',
    },
    pool: {
      min: 2,
      max: 10,
    },
  },

  production: {
    client: 'mysql2',
    connection: {
      host: process.env.EXTERNAL_DATABASE_HOST,
      port: parseInt(process.env.EXTERNAL_DATABASE_PORT || '3306'),
      database: process.env.EXTERNAL_DATABASE_NAME,
      user: process.env.EXTERNAL_DATABASE_USER,
      password: process.env.EXTERNAL_DATABASE_PASSWORD,
    },
    pool: {
      min: 2,
      max: 10,
    },
  },
};

export default externalConfig;
