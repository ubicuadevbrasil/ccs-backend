import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('tabulationSub').del();
  await knex('tabulation').del();

  // Seed data for tabulation table
  const tabulations = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Customer Support',
      description: 'Main tabulation for customer support operations and ticket management',
      status: 'active',
      createdAt: new Date('2024-01-15 09:00:00'),
      updatedAt: new Date('2024-01-15 09:00:00'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Sales Operations',
      description: 'Tabulation for sales processes, leads, and conversion tracking',
      status: 'active',
      createdAt: new Date('2024-01-15 09:15:00'),
      updatedAt: new Date('2024-01-15 09:15:00'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Technical Issues',
      description: 'Technical support and bug tracking tabulation',
      status: 'active',
      createdAt: new Date('2024-01-15 09:30:00'),
      updatedAt: new Date('2024-01-15 09:30:00'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Billing & Payments',
      description: 'Financial operations, billing inquiries, and payment processing',
      status: 'active',
      createdAt: new Date('2024-01-15 09:45:00'),
      updatedAt: new Date('2024-01-15 09:45:00'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      name: 'Product Feedback',
      description: 'User feedback, feature requests, and product improvement suggestions',
      status: 'active',
      createdAt: new Date('2024-01-15 10:00:00'),
      updatedAt: new Date('2024-01-15 10:00:00'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440006',
      name: 'Account Management',
      description: 'User account issues, profile management, and access control',
      status: 'active',
      createdAt: new Date('2024-01-15 10:15:00'),
      updatedAt: new Date('2024-01-15 10:15:00'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440007',
      name: 'Training & Onboarding',
      description: 'User training, documentation, and onboarding processes',
      status: 'inactive',
      createdAt: new Date('2024-01-15 10:30:00'),
      updatedAt: new Date('2024-01-15 10:30:00'),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440008',
      name: 'Compliance & Security',
      description: 'Security incidents, compliance issues, and policy violations',
      status: 'active',
      createdAt: new Date('2024-01-15 10:45:00'),
      updatedAt: new Date('2024-01-15 10:45:00'),
    },
  ];

  // Insert tabulations
  await knex('tabulation').insert(tabulations);

  // Seed data for tabulationSub table
  const tabulationSubs = [
    // Customer Support subs
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      tabulationId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'General Inquiries',
      description: 'General customer questions and information requests',
      status: 'active',
      createdAt: new Date('2024-01-15 09:05:00'),
      updatedAt: new Date('2024-01-15 09:05:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      tabulationId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Complaints',
      description: 'Customer complaints and service issues',
      status: 'active',
      createdAt: new Date('2024-01-15 09:10:00'),
      updatedAt: new Date('2024-01-15 09:10:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      tabulationId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Refunds & Returns',
      description: 'Refund requests and return processing',
      status: 'active',
      createdAt: new Date('2024-01-15 09:12:00'),
      updatedAt: new Date('2024-01-15 09:12:00'),
    },

    // Sales Operations subs
    {
      id: '660e8400-e29b-41d4-a716-446655440004',
      tabulationId: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Lead Qualification',
      description: 'New lead processing and qualification',
      status: 'active',
      createdAt: new Date('2024-01-15 09:20:00'),
      updatedAt: new Date('2024-01-15 09:20:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440005',
      tabulationId: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Demo Requests',
      description: 'Product demonstration requests and scheduling',
      status: 'active',
      createdAt: new Date('2024-01-15 09:25:00'),
      updatedAt: new Date('2024-01-15 09:25:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440006',
      tabulationId: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Contract Negotiation',
      description: 'Contract terms and pricing negotiations',
      status: 'active',
      createdAt: new Date('2024-01-15 09:28:00'),
      updatedAt: new Date('2024-01-15 09:28:00'),
    },

    // Technical Issues subs
    {
      id: '660e8400-e29b-41d4-a716-446655440007',
      tabulationId: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Bug Reports',
      description: 'Software bug reports and issue tracking',
      status: 'active',
      createdAt: new Date('2024-01-15 09:35:00'),
      updatedAt: new Date('2024-01-15 09:35:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440008',
      tabulationId: '550e8400-e29b-41d4-a716-446655440003',
      name: 'System Downtime',
      description: 'System outages and downtime incidents',
      status: 'active',
      createdAt: new Date('2024-01-15 09:40:00'),
      updatedAt: new Date('2024-01-15 09:40:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440009',
      tabulationId: '550e8400-e29b-41d4-a716-446655440003',
      name: 'Performance Issues',
      description: 'Slow performance and optimization requests',
      status: 'active',
      createdAt: new Date('2024-01-15 09:42:00'),
      updatedAt: new Date('2024-01-15 09:42:00'),
    },

    // Billing & Payments subs
    {
      id: '660e8400-e29b-41d4-a716-446655440010',
      tabulationId: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Payment Issues',
      description: 'Payment processing problems and failed transactions',
      status: 'active',
      createdAt: new Date('2024-01-15 09:50:00'),
      updatedAt: new Date('2024-01-15 09:50:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440011',
      tabulationId: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Invoice Questions',
      description: 'Invoice inquiries and billing questions',
      status: 'active',
      createdAt: new Date('2024-01-15 09:55:00'),
      updatedAt: new Date('2024-01-15 09:55:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440012',
      tabulationId: '550e8400-e29b-41d4-a716-446655440004',
      name: 'Subscription Changes',
      description: 'Plan upgrades, downgrades, and subscription modifications',
      status: 'active',
      createdAt: new Date('2024-01-15 10:00:00'),
      updatedAt: new Date('2024-01-15 10:00:00'),
    },

    // Product Feedback subs
    {
      id: '660e8400-e29b-41d4-a716-446655440013',
      tabulationId: '550e8400-e29b-41d4-a716-446655440005',
      name: 'Feature Requests',
      description: 'New feature requests and enhancement suggestions',
      status: 'active',
      createdAt: new Date('2024-01-15 10:05:00'),
      updatedAt: new Date('2024-01-15 10:05:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440014',
      tabulationId: '550e8400-e29b-41d4-a716-446655440005',
      name: 'User Experience',
      description: 'UX feedback and interface improvement suggestions',
      status: 'active',
      createdAt: new Date('2024-01-15 10:10:00'),
      updatedAt: new Date('2024-01-15 10:10:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440015',
      tabulationId: '550e8400-e29b-41d4-a716-446655440005',
      name: 'Integration Requests',
      description: 'Third-party integration and API requests',
      status: 'active',
      createdAt: new Date('2024-01-15 10:12:00'),
      updatedAt: new Date('2024-01-15 10:12:00'),
    },

    // Account Management subs
    {
      id: '660e8400-e29b-41d4-a716-446655440016',
      tabulationId: '550e8400-e29b-41d4-a716-446655440006',
      name: 'Login Issues',
      description: 'Password resets, login problems, and authentication issues',
      status: 'active',
      createdAt: new Date('2024-01-15 10:20:00'),
      updatedAt: new Date('2024-01-15 10:20:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440017',
      tabulationId: '550e8400-e29b-41d4-a716-446655440006',
      name: 'Profile Updates',
      description: 'User profile information updates and modifications',
      status: 'active',
      createdAt: new Date('2024-01-15 10:25:00'),
      updatedAt: new Date('2024-01-15 10:25:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440018',
      tabulationId: '550e8400-e29b-41d4-a716-446655440006',
      name: 'Access Permissions',
      description: 'Role changes, permission requests, and access control',
      status: 'active',
      createdAt: new Date('2024-01-15 10:30:00'),
      updatedAt: new Date('2024-01-15 10:30:00'),
    },

    // Training & Onboarding subs (inactive)
    {
      id: '660e8400-e29b-41d4-a716-446655440019',
      tabulationId: '550e8400-e29b-41d4-a716-446655440007',
      name: 'Documentation Requests',
      description: 'Requests for user guides and documentation',
      status: 'inactive',
      createdAt: new Date('2024-01-15 10:35:00'),
      updatedAt: new Date('2024-01-15 10:35:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440020',
      tabulationId: '550e8400-e29b-41d4-a716-446655440007',
      name: 'Training Sessions',
      description: 'Scheduled training sessions and workshops',
      status: 'inactive',
      createdAt: new Date('2024-01-15 10:40:00'),
      updatedAt: new Date('2024-01-15 10:40:00'),
    },

    // Compliance & Security subs
    {
      id: '660e8400-e29b-41d4-a716-446655440021',
      tabulationId: '550e8400-e29b-41d4-a716-446655440008',
      name: 'Security Incidents',
      description: 'Security breaches, suspicious activities, and incident reports',
      status: 'active',
      createdAt: new Date('2024-01-15 10:50:00'),
      updatedAt: new Date('2024-01-15 10:50:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440022',
      tabulationId: '550e8400-e29b-41d4-a716-446655440008',
      name: 'Data Privacy',
      description: 'GDPR requests, data deletion, and privacy concerns',
      status: 'active',
      createdAt: new Date('2024-01-15 10:55:00'),
      updatedAt: new Date('2024-01-15 10:55:00'),
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440023',
      tabulationId: '550e8400-e29b-41d4-a716-446655440008',
      name: 'Compliance Audits',
      description: 'Compliance reviews, audits, and regulatory requirements',
      status: 'active',
      createdAt: new Date('2024-01-15 11:00:00'),
      updatedAt: new Date('2024-01-15 11:00:00'),
    },
  ];

  // Insert tabulation subs
  await knex('tabulationSub').insert(tabulationSubs);

  console.log('✅ Tabulation and TabulationSub seeded successfully!');
  console.log(`📊 Total tabulations created: ${tabulations.length}`);
  console.log(`📊 Total tabulation subs created: ${tabulationSubs.length}`);
  console.log('📋 Tabulations by status:');
  console.log(`   - Active: ${tabulations.filter(t => t.status === 'active').length}`);
  console.log(`   - Inactive: ${tabulations.filter(t => t.status === 'inactive').length}`);
  console.log('📋 Tabulation subs by status:');
  console.log(`   - Active: ${tabulationSubs.filter(ts => ts.status === 'active').length}`);
  console.log(`   - Inactive: ${tabulationSubs.filter(ts => ts.status === 'inactive').length}`);
  console.log('📋 Tabulation subs by parent:');
  tabulations.forEach(tabulation => {
    const subsCount = tabulationSubs.filter(ts => ts.tabulationId === tabulation.id).length;
    console.log(`   - ${tabulation.name}: ${subsCount} subs`);
  });
}
