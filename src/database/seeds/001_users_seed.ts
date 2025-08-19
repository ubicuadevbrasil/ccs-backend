import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('users').del();

  // Hash the password (using the same hash from the original data)
  const hashedPassword = await bcrypt.hash('123456Ab!', 10); // Assuming the original password was '123456'

  // Map profile numbers to enum values
  const profileMap = {
    1: 'Admin',
    2: 'Supervisor', 
    3: 'Operator'
  };

  // Seed data
  const users = [
    {
      id: '1d597446-329f-11ec-a9d6-000c29a3e400',
      login: 'ubc.atendente',
      password: hashedPassword,
      name: 'Ubicua Atendente',
      email: 'ubcatende@ubicua.com',
      contact: '+5511999999991',
      profilePicture: null,
      status: 'Active',
      profile: profileMap[3],
      department: 'Personal',
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
      status: 'Active',
      profile: profileMap[2],
      department: 'Personal',
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
      status: 'Active',
      profile: profileMap[2],
      department: 'Personal',
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
      status: 'Active',
      profile: profileMap[3],
      department: 'Personal',
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
      status: 'Active',
      profile: profileMap[3],
      department: 'Personal',
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
      status: 'Active',
      profile: profileMap[2],
      department: 'Personal',
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
      status: 'Active',
      profile: profileMap[2],
      department: 'Fiscal',
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
      status: 'Active',
      profile: profileMap[3],
      department: 'Fiscal',
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
      status: 'Active',
      profile: profileMap[3],
      department: 'Fiscal',
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
      status: 'Active',
      profile: profileMap[3],
      department: 'Fiscal',
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
      status: 'Active',
      profile: profileMap[3],
      department: 'Accounting',
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
      status: 'Active',
      profile: profileMap[3],
      department: 'Accounting',
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
      status: 'Active',
      profile: profileMap[3],
      department: 'Accounting',
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
      status: 'Active',
      profile: profileMap[3],
      department: 'Financial',
      createdAt: new Date('2025-07-23 13:57:04'),
      updatedAt: new Date('2025-07-23 13:57:04'),
    },
  ];

  // Insert users
  await knex('users').insert(users);

  console.log('✅ Users seeded successfully!');
  console.log(`📊 Total users created: ${users.length}`);
  console.log('👥 Users by department:');
  console.log(`   - Personal: ${users.filter(u => u.department === 'Personal').length}`);
  console.log(`   - Fiscal: ${users.filter(u => u.department === 'Fiscal').length}`);
  console.log(`   - Accounting: ${users.filter(u => u.department === 'Accounting').length}`);
  console.log(`   - Financial: ${users.filter(u => u.department === 'Financial').length}`);
  console.log('👤 Users by profile:');
  console.log(`   - Admin: ${users.filter(u => u.profile === 'Admin').length}`);
  console.log(`   - Supervisor: ${users.filter(u => u.profile === 'Supervisor').length}`);
  console.log(`   - Operator: ${users.filter(u => u.profile === 'Operator').length}`);
} 