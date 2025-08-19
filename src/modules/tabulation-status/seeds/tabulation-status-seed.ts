import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // First, insert tabulation statuses
  const tabulationStatuses = [
    { 
      id: '550e8400-e29b-41d4-a716-446655440010', 
      description: 'Completed Successfully',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440011', 
      description: 'Customer Unavailable',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440012', 
      description: 'Callback Requested',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440013', 
      description: 'Issue Resolved',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440014', 
      description: 'Escalated',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440015', 
      description: 'Cancelled',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440016', 
      description: 'Technical Issue',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440017', 
      description: 'Follow-up Required',
      active: true
    },
  ];

  await knex('tabulationStatus').insert(tabulationStatuses);

  // Then, insert tabulation status subs that reference the statuses
  const tabulationStatusSubs = [
    { 
      id: '550e8400-e29b-41d4-a716-446655440001', 
      description: 'Successfully completed',
      tabulationStatusId: '550e8400-e29b-41d4-a716-446655440010',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440002', 
      description: 'Customer not available',
      tabulationStatusId: '550e8400-e29b-41d4-a716-446655440011',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440003', 
      description: 'Customer requested callback',
      tabulationStatusId: '550e8400-e29b-41d4-a716-446655440012',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440004', 
      description: 'Issue resolved',
      tabulationStatusId: '550e8400-e29b-41d4-a716-446655440013',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440005', 
      description: 'Escalated to supervisor',
      tabulationStatusId: '550e8400-e29b-41d4-a716-446655440014',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440006', 
      description: 'Customer cancelled',
      tabulationStatusId: '550e8400-e29b-41d4-a716-446655440015',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440007', 
      description: 'Technical issue',
      tabulationStatusId: '550e8400-e29b-41d4-a716-446655440016',
      active: true
    },
    { 
      id: '550e8400-e29b-41d4-a716-446655440008', 
      description: 'Follow-up required',
      tabulationStatusId: '550e8400-e29b-41d4-a716-446655440017',
      active: true
    },
  ];

  await knex('tabulationStatusSub').insert(tabulationStatusSubs);
}
