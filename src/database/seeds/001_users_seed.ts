import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';
import * as crypto from 'crypto';

// Load environment variables
dotenv.config();

/**
 * Interface for external user data from MySQL tab_usuarios
 */
interface ExternalUserData {
  id: string;
  dtCadastro: string;
  perfil: number;
  photo: string;
  nome: string;
  usuario: string;
  email: string;
  senha: string;
  status: number;
  // segmanto: string;
}

/**
 * Helper function to safely parse dates
 */
function safeParseDate(dateString: any): Date | null {
  if (!dateString) return null;
  
  try {
    if (dateString instanceof Date && !isNaN(dateString.getTime())) {
      return dateString;
    }
    
    const str = String(dateString);
    if (str.includes('NaN') || str.includes('Invalid') || str === 'null' || str === 'undefined') {
      return null;
    }
    
    const date = new Date(str);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date;
  } catch (error) {
    return null;
  }
}

/**
 * Helper function to safely parse text values
 */
function safeParseText(value: any): string | null {
  if (value === null || value === undefined || value === '') return null;
  
  const str = String(value).trim();
  return str === '' ? null : str;
}

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting users seed...');
  
  // Clear existing data
  await knex('user').del();
  console.log('🗑️  Cleared existing users data');

  // Hash the password (using the same hash from the original data)
  const hashedPassword = await bcrypt.hash('123456Ab!', 10);

  // Map profile numbers to enum values (based on tab_usuarios.txt comments)
  const profileMap = {
    1: 'admin',      // Admin (if exists)
    2: 'supervisor', // Supervisor (as per comment: 2 - supervisor)
    3: 'operator'    // Operator (as per comment: 3 - operator)
  };

  // Map status numbers to enum values
  const statusMap = {
    0: 'inactive',
    1: 'active'
  };

  // Step 1: Try to fetch external users from MySQL
  let externalUsers: ExternalUserData[] = [];
  let externalKnex: any = null;

  try {
    // Create external database connection (MySQL)
    const environment = process.env.NODE_ENV || 'development';
    const externalConfig = externalKnexConfig[environment];
    
    if (externalConfig) {
      externalKnex = require('knex')(externalConfig);
      
      // Test the external connection
      await externalKnex.raw('SELECT 1');
      console.log('✅ External database connection established');
      
      // Fetch external data from MySQL tab_usuarios table
      console.log('📡 Fetching external data from MySQL tab_usuarios table...');
      const result = await externalKnex.raw(`
        SELECT 
          u.id,
          u.usuario,
          u.senha,
          u.nome,
          u.email,
          u.status,
          (CASE WHEN u.perfil = 2 THEN 'supervisor' ELSE 'operator' END) as role
        FROM tab_usuarios u
        WHERE u.dtcadastro = (
          SELECT MAX(u2.dtcadastro)
          FROM tab_usuarios u2
          WHERE u2.usuario = u.usuario
        )
      `);
      
      externalUsers = result[0];
      console.log(`📊 Found ${externalUsers.length} external users`);
    }
  } catch (error) {
    console.log('⚠️  Cannot connect to external database or no external users found.');
    console.log(`Error: ${error.message}`);
  }

  // Step 2: Process external users in batches
  let totalExternalUsers = 0;
  if (externalUsers.length > 0) {
    const batchSize = parseInt(process.env.USERS_BATCH_SIZE || '50');
    const startTime = Date.now();
    
    console.log(`📦 Processing ${externalUsers.length} external users in batches of ${batchSize}...`);
    
    for (let i = 0; i < externalUsers.length; i += batchSize) {
      const batch = externalUsers.slice(i, i + batchSize);
      const usersToInsert: any[] = [];
      
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(externalUsers.length / batchSize);
      const progressPercent = ((i / externalUsers.length) * 100).toFixed(1);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} users) - ${progressPercent}% complete...`);
      
      for (const externalUser of batch) {
        try {
          console.log(`🔍 Processing external user ${totalExternalUsers + 1}/${externalUsers.length}:`, {
            id: externalUser.id,
            nome: externalUser.nome,
            usuario: externalUser.usuario,
            email: externalUser.email,
            perfil: externalUser.perfil,
            status: externalUser.status,
            hasExternalPassword: !!externalUser.senha
          });
          
          // Transform external user data
          const userRecord = transformExternalUser(externalUser, hashedPassword, profileMap, statusMap);
          usersToInsert.push(userRecord);
          
          console.log(`✅ Processed external user ${externalUser.usuario}`);
          totalExternalUsers++;
        } catch (error) {
          console.error(`❌ Error processing external user ${externalUser.usuario}:`, error);
          totalExternalUsers++;
        }
      }

      // Insert batch into the database
      if (usersToInsert.length > 0) {
        console.log(`💾 Inserting batch of ${usersToInsert.length} external users into database...`);
        await knex('user').insert(usersToInsert);
        console.log(`✅ External users batch inserted successfully!`);
      }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000;
    
    console.log(`📊 Total external users processed: ${totalExternalUsers}`);
    console.log(`⏱️  External users processing time: ${totalTime.toFixed(2)} seconds`);
  }

  // Step 3: Add default/fallback users
  console.log('📝 Adding default users...');
  
  // Default seed data
  const defaultUsers = [
    {
      id: '1d597446-329f-11ec-a9d6-000c29a3e400',
      login: 'ubc.atendente',
      password: hashedPassword,
      name: 'Ubicua Atendente',
      email: 'ubcatende@ubicua.com',
      contact: '+5511999999991',
      profilePicture: null,
      status: 'active',
      profile: profileMap[3],
      createdAt: new Date('2021-10-21 15:45:51'),
      updatedAt: new Date('2021-10-21 15:45:51'),
    },
    {
      id: '48512c15-6497-11ee-8da1-ac1f6bf53052',
      login: 'ubc.supervisor',
      password: hashedPassword,
      name: 'Ubicua Supervisor',
      email: 'ubcsuper@ubicua.com',
      contact: '+5511999999992',
      profilePicture: null,
      status: 'active',
      profile: profileMap[2],
      createdAt: new Date('2023-10-06 19:25:41'),
      updatedAt: new Date('2023-10-06 19:25:41'),
    },
    {
      id: '51115431-67db-11f0-955f-000c2921356b',
      login: 'samara.carla',
      password: hashedPassword,
      name: 'Samara de Carla',
      email: 'samara@ubicua.com',
      contact: '+5511999999993',
      profilePicture: null,
      status: 'active',
      profile: profileMap[2],
      createdAt: new Date('2025-07-23 12:40:10'),
      updatedAt: new Date('2025-07-23 12:40:10'),
    },
    {
      id: '51118dfd-67db-11f0-955f-000c2921356b',
      login: 'andressa',
      password: hashedPassword,
      name: 'Andressa Monteiro',
      email: 'andressa@ubicua.com',
      contact: '+5511999999994',
      profilePicture: null,
      status: 'active',
      profile: profileMap[3],
      createdAt: new Date('2025-07-23 12:40:10'),
      updatedAt: new Date('2025-07-23 12:40:10'),
    },
    {
      id: '5111c31a-67db-11f0-955f-000c2921356b',
      login: 'thayse.lima',
      password: hashedPassword,
      name: 'Thayse Lima',
      email: 'thayse@ubicua.com',
      contact: '+5511999999995',
      profilePicture: null,
      status: 'active',
      profile: profileMap[3],
      createdAt: new Date('2025-07-23 12:40:10'),
      updatedAt: new Date('2025-07-23 12:40:10'),
    },
    {
      id: 'c7b2174a-667c-11f0-955f-000c2921356b',
      login: 'jc.mattiuzzi',
      password: hashedPassword,
      name: 'JCMattiuzzi',
      email: 'jc.mattiuzzi@ubicua.com',
      contact: '+5511999999996',
      profilePicture: null,
      status: 'active',
      profile: profileMap[2],
      createdAt: new Date('2025-07-21 18:50:56'),
      updatedAt: new Date('2025-07-21 18:50:56'),
    },
    {
      id: '8f978bff-67db-11f0-955f-000c2921356b',
      login: 'aline.guarnieri',
      password: hashedPassword,
      name: 'Aline Guarnieri',
      email: 'aline@ubicua.com',
      contact: '+5511999999997',
      profilePicture: null,
      status: 'active',
      profile: profileMap[2],
      createdAt: new Date('2025-07-23 12:41:55'),
      updatedAt: new Date('2025-07-23 12:41:55'),
    },
    {
      id: '8f97b9b3-67db-11f0-955f-000c2921356b',
      login: 'cristiane.andrino',
      password: hashedPassword,
      name: 'Cristiane Andrino',
      email: 'cristiane@ubicua.com',
      contact: '+5511999999998',
      profilePicture: null,
      status: 'active',
      profile: profileMap[3],
      createdAt: new Date('2025-07-23 12:41:55'),
      updatedAt: new Date('2025-07-23 12:41:55'),
    },
    {
      id: '8f97f9a3-67db-11f0-955f-000c2921356b',
      login: 'elaine.dias',
      password: hashedPassword,
      name: 'Elaine Dias',
      email: 'elaine@ubicua.com',
      contact: '+5511999999999',
      profilePicture: null,
      status: 'active',
      profile: profileMap[3],
      createdAt: new Date('2025-07-23 12:41:55'),
      updatedAt: new Date('2025-07-23 12:41:55'),
    },
    {
      id: '8f9817a3-67db-11f0-955f-000c2921356b',
      login: 'vinicius.facini',
      password: hashedPassword,
      name: 'Vinicius Facini',
      email: 'vinicius@ubicua.com',
      contact: '+5511999999990',
      profilePicture: null,
      status: 'active',
      profile: profileMap[3],
      createdAt: new Date('2025-07-23 12:41:55'),
      updatedAt: new Date('2025-07-23 12:41:55'),
    },
    {
      id: 'd817234e-67e5-11f0-955f-000c2921356b',
      login: 'renan.santos',
      password: hashedPassword,
      name: 'Renan Santos',
      email: 'renan@ubicua.com',
      contact: '+5511999999981',
      profilePicture: null,
      status: 'active',
      profile: profileMap[3],
      createdAt: new Date('2025-07-23 13:55:31'),
      updatedAt: new Date('2025-07-23 13:55:31'),
    },
    {
      id: 'd817786f-67e5-11f0-955f-000c2921356b',
      login: 'joao.victor',
      password: hashedPassword,
      name: 'João Victor',
      email: 'joao@ubicua.com',
      contact: '+5511999999982',
      profilePicture: null,
      status: 'active',
      profile: profileMap[3],
      createdAt: new Date('2025-07-23 13:55:31'),
      updatedAt: new Date('2025-07-23 13:55:31'),
    },
    {
      id: 'd817895d-67e5-11f0-955f-000c2921356b',
      login: 'victor.silva',
      password: hashedPassword,
      name: 'Victor Silva',
      email: 'victor@ubicua.com',
      contact: '+5511999999983',
      profilePicture: null,
      status: 'active',
      profile: profileMap[3],
      createdAt: new Date('2025-07-23 13:55:31'),
      updatedAt: new Date('2025-07-23 13:55:31'),
    },
    {
      id: '0f37b628-67e6-11f0-955f-000c2921356b',
      login: 'matheus.godoi',
      password: hashedPassword,
      name: 'Matheus Godoi',
      email: 'matheus@ubicua.com',
      contact: '+5511999999984',
      profilePicture: null,
      status: 'active',
      profile: profileMap[3],
      createdAt: new Date('2025-07-23 13:57:04'),
      updatedAt: new Date('2025-07-23 13:57:04'),
    },
  ];

  // Insert default users
  await knex('user').insert(defaultUsers);

  // Close external database connection if opened
  if (externalKnex) {
    await externalKnex.destroy();
    console.log('🔌 External database connection closed');
  }

  console.log('✅ Users seeded successfully!');
  console.log(`📊 Total external users processed: ${totalExternalUsers}`);
  console.log(`📊 Total default users created: ${defaultUsers.length}`);
  console.log(`📊 Total users in database: ${totalExternalUsers + defaultUsers.length}`);
  console.log('👤 Users by profile:');
  console.log(`   - admin: ${defaultUsers.filter(u => u.profile === 'admin').length}`);
  console.log(`   - supervisor: ${defaultUsers.filter(u => u.profile === 'supervisor').length}`);
  console.log(`   - operator: ${defaultUsers.filter(u => u.profile === 'operator').length}`);
}

/**
 * Helper function to safely parse password hash
 */
function safeParsePasswordHash(passwordHash: any): string | null {
  if (!passwordHash) return null;
  
  const str = String(passwordHash).trim();
  if (str === '' || str === 'null' || str === 'undefined') {
    return null;
  }
  
  // Check if it looks like a valid hash (bcrypt, md5, sha, etc.)
  if (str.length >= 32 && /^[a-fA-F0-9$./]+$/.test(str)) {
    return str;
  }
  
  return null;
}

/**
 * Transforms external user data into user record
 */
function transformExternalUser(
  external: ExternalUserData, 
  fallbackHashedPassword: string, 
  profileMap: Record<number, string>,
  statusMap: Record<number, string>
): any {
  const now = new Date();
  
  // Generate UUID for id field
  const idHash = crypto.createHash('md5').update(String(external.id)).digest('hex');
  const uuid = [
    idHash.substring(0, 8),
    idHash.substring(8, 12),
    idHash.substring(12, 16),
    idHash.substring(16, 20),
    idHash.substring(20),
  ].join('-');

  // Parse dates safely
  const createdAt = safeParseDate(external.dtCadastro) || now;

  // Use external password hash if valid, otherwise use fallback
  const externalPasswordHash = safeParsePasswordHash(external.senha);
  const finalPassword = externalPasswordHash || fallbackHashedPassword;
  
  if (externalPasswordHash) {
    console.log(`🔐 Using external password hash for user ${external.usuario}`);
  } else {
    console.log(`🔐 Using fallback password for user ${external.usuario}`);
  }

  return {
    id: uuid,
    login: external.usuario,
    password: finalPassword, // Use external hash if available, otherwise fallback
    name: safeParseText(external.nome) || 'Unknown User',
    email: external.email != '' ? external.email : null,
    contact: null, // Not available in external data
    profilePicture: safeParseText(external.photo),
    status: statusMap[external.status] || 'active',
    profile: profileMap[external.perfil] || 'operator',
    createdAt,
    updatedAt: now,
  };
} 