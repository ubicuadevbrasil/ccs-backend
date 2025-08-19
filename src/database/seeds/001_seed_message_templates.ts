import { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Check if table exists and has data
  const existingTemplates = await knex('messageTemplates').select('*').limit(1);
  
  if (existingTemplates.length > 0) {
    console.log('Message templates already seeded, skipping...');
    return;
  }

  const templates = [
    // Greeting templates
    {
      message: '¡Hola! Bienvenido a nuestro servicio de atención al cliente. ¿En qué puedo ayudarte hoy?',
      type: 'greeting',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      message: 'Hola, gracias por contactarnos. ¿Cómo estás?',
      type: 'greeting',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      message: '¡Buenos días! ¿En qué puedo asistirte?',
      type: 'greeting',
      createdAt: new Date(),
      updatedAt: new Date()
    },

    // Follow-up templates
    {
      message: 'Hola, solo quería verificar si tu consulta anterior fue resuelta. ¿Necesitas algo más?',
      type: 'follow_up',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      message: '¿Cómo va todo? ¿Hay algo más en lo que pueda ayudarte?',
      type: 'follow_up',
      createdAt: new Date(),
      updatedAt: new Date()
    },

    // Reminder templates
    {
      message: 'Recordatorio: Tienes una cita programada para mañana. ¿Confirmas tu asistencia?',
      type: 'reminder',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      message: 'No olvides que tu pedido estará listo hoy. Te esperamos.',
      type: 'reminder',
      createdAt: new Date(),
      updatedAt: new Date()
    },

    // Support templates
    {
      message: 'Entiendo tu situación. Déjame investigar esto para ti y te respondo en breve.',
      type: 'support',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      message: 'Lamento mucho que hayas tenido esta experiencia. Voy a escalar tu caso para una resolución rápida.',
      type: 'support',
      createdAt: new Date(),
      updatedAt: new Date()
    },

    // Marketing templates
    {
      message: '¡Oferta especial! Solo por hoy, 20% de descuento en todos nuestros productos.',
      type: 'marketing',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      message: 'Nuevo producto disponible. ¡Échale un vistazo antes de que se agote!',
      type: 'marketing',
      createdAt: new Date(),
      updatedAt: new Date()
    },

    // Notification templates
    {
      message: 'Tu pedido ha sido enviado. Número de seguimiento: #12345',
      type: 'notification',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      message: 'Tu cuenta ha sido actualizada exitosamente.',
      type: 'notification',
      createdAt: new Date(),
      updatedAt: new Date()
    },

    // Custom templates
    {
      message: 'Mensaje personalizado: Gracias por tu paciencia durante este proceso.',
      type: 'custom',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  await knex('messageTemplates').insert(templates);
  console.log(`Seeded ${templates.length} message templates`);
}
