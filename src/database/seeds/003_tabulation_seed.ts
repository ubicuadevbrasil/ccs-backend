import { Knex } from 'knex';
import { randomUUID } from 'crypto';
import { faker } from '@faker-js/faker';

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting tabulation seed...');

  // Clear existing data
  await knex('tabulation').del();
  console.log('🗑️  Cleared existing tabulation data');

  // Generate mock tabulation data
  // Tabulations are typically categories or types of customer service interactions
  const tabulationNames = [
    'Suporte Técnico',
    'Vendas',
    'Financeiro',
    'Reclamações',
    'Elogios',
    'Dúvidas sobre Produtos',
    'Cancelamento',
    'Reativação',
    'Atualização de Dados',
    'Problemas com Pedido',
    'Garantia',
    'Troca/Devolução',
    'Informações Gerais',
    'Solicitação de Orçamento',
    'Agendamento',
  ];

  const tabulations = tabulationNames.map((name, index) => {
    const createdAt = faker.date.past({ years: 2 });
    const isActive = faker.datatype.boolean({ probability: 0.85 }); // 85% are active
    const isEffective = faker.datatype.boolean({ probability: 0.4 }); // 40% are effective

    return {
      id: randomUUID(),
      name,
      description: faker.datatype.boolean({ probability: 0.7 })
        ? faker.lorem.sentence({ min: 5, max: 15 })
        : null,
      status: isActive ? 'active' : 'inactive',
      effective: isEffective,
      createdAt,
      updatedAt: faker.date.between({ from: createdAt, to: new Date() }),
    };
  });

  // Insert tabulations
  await knex('tabulation').insert(tabulations);

  console.log('✅ Tabulations seeded successfully!');
  console.log(`📊 Total tabulations created: ${tabulations.length}`);
  console.log('📋 Tabulations by status:');
  console.log(`   - active: ${tabulations.filter(t => t.status === 'active').length}`);
  console.log(`   - inactive: ${tabulations.filter(t => t.status === 'inactive').length}`);
  console.log('⭐ Tabulations by effectiveness:');
  console.log(`   - effective: ${tabulations.filter(t => t.effective).length}`);
  console.log(`   - not effective: ${tabulations.filter(t => !t.effective).length}`);
  console.log('📝 Tabulations with description:');
  console.log(`   - with description: ${tabulations.filter(t => t.description).length}`);
  console.log(`   - without description: ${tabulations.filter(t => !t.description).length}`);
}

