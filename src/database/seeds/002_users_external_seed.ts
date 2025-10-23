import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';

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
  status: number;
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

/**
 * Helper function to generate unique login and email
 */
async function generateUniqueIdentifiers(
  knex: Knex, 
  originalLogin: string, 
  originalEmail: string | null,
  existingLogins: Set<string>,
  existingEmails: Set<string>
): Promise<{ login: string; email: string | null }> {
  let login = originalLogin;
  let email = originalEmail;
  
  // Check for duplicate login (both in database and current batch)
  let loginCounter = 1;
  while (true) {
    const existsInDb = await knex('user').where('login', login).first();
    const existsInBatch = existingLogins.has(login);
    
    if (!existsInDb && !existsInBatch) break;
    
    login = `${originalLogin}${loginCounter}`;
    loginCounter++;
  }
  
  // Check for duplicate email (if email exists)
  if (email) {
    let emailCounter = 1;
    const originalEmailBase = email.split('@')[0];
    const emailDomain = email.split('@')[1];
    
    while (true) {
      const existsInDb = await knex('user').where('email', email).first();
      const existsInBatch = existingEmails.has(email);
      
      if (!existsInDb && !existsInBatch) break;
      
      email = `${originalEmailBase}${emailCounter}@${emailDomain}`;
      emailCounter++;
    }
  }
  
  return { login, email };
}

/**
 * Transforms external user data into user record
 */
async function transformExternalUser(
  knex: Knex,
  external: ExternalUserData, 
  fallbackHashedPassword: string, 
  profileMap: Record<number, string>,
  statusMap: Record<number, string>,
  existingLogins: Set<string>,
  existingEmails: Set<string>
): Promise<any> {
  const now = new Date();
  
  // Use the original ID from external database
  const originalId = String(external.id);

  // Parse dates safely
  const createdAt = safeParseDate(external.dtCadastro) || now;

  // Generate unique login and email
  const { login, email } = await generateUniqueIdentifiers(
    knex, 
    external.usuario, 
    external.email != '' ? external.email : null,
    existingLogins,
    existingEmails
  );

  // Always use default password for all external users
  const finalPassword = fallbackHashedPassword;
  console.log(`🔐 Using default password for user ${login}`);

  return {
    id: originalId,
    login,
    password: finalPassword, // Always use default password for security
    name: safeParseText(external.nome) || 'Unknown User',
    email,
    contact: null, // Not available in external data
    profilePicture: safeParseText(external.photo),
    status: statusMap[external.status] || 'active',
    profile: profileMap[external.perfil] || 'operator',
    createdAt,
    updatedAt: now,
  };
}

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting external users seed...');
  
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

  // Try to fetch external users from MySQL
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
          u.nome,
          u.email,
          u.status,
          u.perfil,
          u.dtcadastro,
          u.photo
        FROM tab_usuarios u
      `);
      
      externalUsers = result[0];
      console.log(`📊 Found ${externalUsers.length} external users`);
    }
  } catch (error) {
    console.log('⚠️  Cannot connect to external database or no external users found.');
    console.log(`Error: ${error.message}`);
    return; // Exit early if no external connection
  }

  // Process external users in batches
  let totalExternalUsers = 0;
  if (externalUsers.length > 0) {
    const batchSize = parseInt(process.env.USERS_BATCH_SIZE || '50');
    const startTime = Date.now();
    
    console.log(`📦 Processing ${externalUsers.length} external users in batches of ${batchSize}...`);
    
    for (let i = 0; i < externalUsers.length; i += batchSize) {
      const batch = externalUsers.slice(i, i + batchSize);
      const usersToInsert: any[] = [];
      
      // Track existing logins and emails within this batch
      const existingLogins = new Set<string>();
      const existingEmails = new Set<string>();
      
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
            status: externalUser.status
          });
          
          // Transform external user data
          const userRecord = await transformExternalUser(knex, externalUser, hashedPassword, profileMap, statusMap, existingLogins, existingEmails);
          usersToInsert.push(userRecord);
          
          // Add the generated login and email to our tracking sets
          existingLogins.add(userRecord.login);
          if (userRecord.email) {
            existingEmails.add(userRecord.email);
          }
          
          console.log(`✅ Processed external user ${userRecord.login} (original: ${externalUser.usuario}, ID: ${externalUser.id})`);
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

  // Close external database connection if opened
  if (externalKnex) {
    await externalKnex.destroy();
    console.log('🔌 External database connection closed');
  }

  console.log('✅ External users seeded successfully!');
  console.log(`📊 Total external users processed: ${totalExternalUsers}`);
}
