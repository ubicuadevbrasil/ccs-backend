import { Knex } from 'knex';
import * as fetch from 'node-fetch';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';

// Load environment variables
dotenv.config();

/**
 * Helper function to safely parse dates
 */
function safeParseDate(dateString: any): Date | null {
  if (!dateString) return null;
  
  try {
    // Check if it's already a valid Date object
    if (dateString instanceof Date && !isNaN(dateString.getTime())) {
      return dateString;
    }
    
    // Check for invalid date strings
    const str = String(dateString);
    if (str.includes('NaN') || str.includes('Invalid') || str === 'null' || str === 'undefined' || str === '0NaN-NaN-NaNTNaN:NaN:NaN.NaN+NaN:NaN') {
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
 * Helper function to safely parse numeric values
 */
function safeParseNumber(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  
  try {
    const num = parseFloat(String(value));
    return isNaN(num) ? 0 : num;
  } catch (error) {
    return 0;
  }
}

/**
 * Interface for external order data from MySQL
 */
interface ExternalOrderData {
  id: number;
  sessionid: string;
  dtpedido: string;
  segmento: string;
  pedido: number;
  valor: number;
  faturado: number;
  orderStatus: string;
  status: string;
}

/**
 * Interface for GraphQL order details response
 */
interface GraphQLOrderDetails {
  id: number;
  code: string;
  extraInvoice: string;
  status: string;
  statusDescription: string;
  originOrdered: string;
  dateOrder: string;
  hourOrder: string;
  differentiatedMarginReleased: number;
  weightedAverageMargin: number;
  quantityDemanded: number;
  grossValueOrderFactoryPriceFloat: number;
  netValueOrderFactoryPriceFloat: number;
  grossAmountInvoicedFactoryPriceFloat: number;
  netValueBilledFactoryPriceFloat: number;
  billedQuantity: number;
  orderTotalValueFloat: number;
  invoiceReleaseDate: string;
  orderProduct: Array<{
    id: number;
    product: {
      id: number;
      monitorado: boolean;
      name: string;
      ean: string;
      brand: {
        id: number;
        name: string;
        active: boolean;
        createdAt: string;
        updatedAt: string;
      };
      division: {
        id: number;
        description: string;
      };
      active: boolean;
      createdAt: string;
      updatedAt: string;
      curveABC: string;
      excludedAt: string;
      price: number;
      sellingPrice: number;
      assortment: {
        id: number;
        name: string;
      };
      category: {
        id: number;
        name: string;
      };
      shippingBox: string;
    };
    quantityDemanded: number;
    grossValueOrder: number;
    netValueOrder: number;
    netValueBilled: number;
    grossAmountInvoiced: number;
    billedQuantity: number;
    discount: number;
    discountValue: number;
    discountInvoiceValue: number;
    discountPerc: number;
    discountPercInvoice: number;
    reasonBilling: {
      id: number;
      descriptionReason: string;
      codeReason: string;
      classification: string;
    };
  }>;
  wholesalerBranch: {
    id: number;
    code: string;
    name: string;
  };
  billingCondition: {
    id: number;
    code: string;
    description: string;
    typeCondition: string;
    beginsOn: string;
    expiresOn: string;
    minimumItemsCount: number;
    minimumAmount: number;
    availability: {
      labels: string[];
    };
    thumbnailImageUrl: string;
    smallImageUrl: string;
    imageUrl: string;
    fullDescription: string;
    status: string;
    deleted: boolean;
  };
  shippingOrders: Array<{
    priority: number;
    wholesaleBranch: {
      name: string;
    };
    billing: {
      type: string;
      term: string;
    };
  }>;
  subOrder: Array<{
    id: number;
    status: string;
    statusDescription: string;
    confirmed: boolean;
    order: any;
    subOrderInvoice: {
      id: number;
      reversalStatus: string;
      invoiceReleasedOn: string;
      invoiceProcessingDate: string;
      invoiceNumber: string;
      danfe: string;
    };
    motive: string;
    dateSubOrder: string;
    hourSubOrder: string;
    billingCondition: any;
  }>;
  customer: {
    id: number;
    code: string;
    codePdv: string;
    companyName: string;
    businessName: string;
    contact: string;
    phoneNumber: string;
    email: string;
    imsCategory: string;
    lastVisitDate: string;
    lastPurchaseOrderAmount: number;
    halfYearlyPurchasingAverage: number;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    labels: string[];
    buyer: string;
  };
  user: {
    id: number;
    name: string;
    login: string;
    language: string;
    phoneNumber: string;
    mail: string;
    level: {
      id: number;
      name: string;
      type: {
        id: number;
        name: string;
      };
    };
  };
}

/**
 * Interface for the final order record to be inserted
 */
interface OrderRecord {
  id: string;
  orderId: string;
  orderStatus: string; // From GraphQL: details.status
  orderDetails: GraphQLOrderDetails | any; // Complete GraphQL response or basic object
  originOrdered: string; // From GraphQL: details.originOrdered
  segment: string; // From MySQL: external.segmento (fallback)
  grossValue: number; // From GraphQL: details.grossValueOrderFactoryPriceFloat
  netValue: number; // From GraphQL: details.netValueOrderFactoryPriceFloat
  billedValue: number; // From GraphQL: details.netValueBilledFactoryPriceFloat
  totalValue: number; // From GraphQL: details.orderTotalValueFloat
  sessionId: string; // From MySQL: external.sessionid
  dateOrder: Date; // From GraphQL: details.dateOrder
  createdAt: Date;
  updatedAt: Date;
}

export async function seed(knex: Knex): Promise<void> {
  console.log('🌱 Starting orders seed...');

  // Clear existing data
  await knex('orders').del();
  console.log('🗑️  Cleared existing orders data');

  // Create external database connection (MySQL)
  const environment = process.env.NODE_ENV || 'development';
  const externalConfig = externalKnexConfig[environment];
  
  if (!externalConfig) {
    console.log('⚠️  External database configuration not found. Skipping orders seed.');
    return;
  }

  // Create external knex instance
  const externalKnex = require('knex')(externalConfig);
  
  try {
    // Test the external connection
    await externalKnex.raw('SELECT 1');
    console.log('✅ External database connection established');
  } catch (error) {
    console.log('⚠️  Cannot connect to external database. Using sample data instead.');
    console.log(`Error: ${error.message}`);
    await createSampleOrders(knex);
    return;
  }

  try {
    // Step 1: Fetch external data from MySQL tab_pedidos table
    console.log('📡 Fetching external data from MySQL tab_pedidos table...');
    const result = await externalKnex.raw(`
      SELECT id, sessionid, dtpedido, segmento, pedido, valor, faturado, orderStatus, status
      FROM tab_pedidos 
      WHERE pedido IS NOT NULL
    `);
    
    // Extract the actual data from knex.raw result
    const externalData: ExternalOrderData[] = result[0];
    
    console.log(`📊 Found ${externalData.length} external records`);

    if (externalData.length === 0) {
      console.log('⚠️  No external data found. Creating sample data...');
      await createSampleOrders(knex);
      return;
    }

    // Step 2: Process external records in batches
    const batchSize = parseInt(process.env.ORDERS_BATCH_SIZE || '100');
    let totalProcessed = 0;
    let totalInserted = 0;
    const startTime = Date.now();
    
    console.log(`📦 Processing ${externalData.length} records in batches of ${batchSize}...`);
    
    for (let i = 0; i < externalData.length; i += batchSize) {
      const batch = externalData.slice(i, i + batchSize);
      const ordersToInsert: OrderRecord[] = [];
      
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(externalData.length / batchSize);
      const progressPercent = ((i / externalData.length) * 100).toFixed(1);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} records) - ${progressPercent}% complete...`);
      
      for (const externalRecord of batch) {
        try {
          console.log(`🔍 Processing record ${totalProcessed + 1}/${externalData.length}:`, {
            id: externalRecord.id,
            pedido: externalRecord.pedido,
            sessionid: externalRecord.sessionid,
            segmento: externalRecord.segmento,
            dtpedido: externalRecord.dtpedido,
            valor: externalRecord.valor,
            faturado: externalRecord.faturado
          });
          
          // Step 2a: Fetch detailed order information via GraphQL
          const orderDetails = await fetchOrderDetailsFromGraphQL(externalRecord.pedido);
          
          // Step 2b: Transform and combine data
          const orderRecord = transformToOrderRecord(externalRecord, orderDetails);
          ordersToInsert.push(orderRecord);
          
          const detailsSource = orderDetails ? 'GraphQL' : 'MySQL (fallback)';
          console.log(`✅ Processed order ${externalRecord.pedido} with ${detailsSource} data`);
          
          totalProcessed++;
        } catch (error) {
          console.error(`❌ Error processing order ${externalRecord.pedido}:`, error);
          // Create a basic record without GraphQL details
          const basicOrder = createBasicOrderRecord(externalRecord);
          ordersToInsert.push(basicOrder);
          totalProcessed++;
        }
      }

      // Step 3: Insert batch into the database
      if (ordersToInsert.length > 0) {
        console.log(`💾 Inserting batch of ${ordersToInsert.length} orders into database...`);
        await knex('orders').insert(ordersToInsert);
        totalInserted += ordersToInsert.length;
        console.log(`✅ Batch inserted successfully! Total inserted: ${totalInserted}`);
      }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000; // in seconds
    
    console.log('✅ Orders seeded successfully!');
    console.log(`📊 Total orders processed: ${totalProcessed}`);
    console.log(`📊 Total orders inserted: ${totalInserted}`);
    console.log(`📊 Batches processed: ${Math.ceil(externalData.length / batchSize)}`);
    console.log(`⏱️  Total processing time: ${totalTime.toFixed(2)} seconds`);
    console.log(`📈 Average time per record: ${(totalTime / totalProcessed).toFixed(3)} seconds`);
    console.log(`📈 Records per second: ${(totalProcessed / totalTime).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error during orders seed:', error);
    console.log('🔄 Creating sample orders as fallback...');
    await createSampleOrders(knex);
  } finally {
    // Close external database connection
    if (externalKnex) {
      await externalKnex.destroy();
      console.log('🔌 External database connection closed');
    }
  }
}

/**
 * Fetches order details from GraphQL API with fallback to secondary endpoint
 */
async function fetchOrderDetailsFromGraphQL(orderId: number): Promise<GraphQLOrderDetails | null> {
  // Primary GraphQL endpoint
  const primaryEndpoint = process.env.GRAPHQL_ENDPOINT || 'https://webb.fidelize.com.br/index.php?r=api/graphql/index';
  const primaryLogin = process.env.GRAPHQL_LOGIN;
  const primaryPassword = process.env.GRAPHQL_PASSWORD;

  // Secondary GraphQL endpoint (fallback)
  const secondaryEndpoint = 'https://trade.fidelize.com.br/esanofi/index.php?r=api/graphql/index';
  const secondaryLogin = 'chat.bot';
  const secondaryPassword = 'Mudar@2023';

  // Try primary endpoint first
  let result = await tryGraphQLEndpoint(orderId, primaryEndpoint, primaryLogin || '', primaryPassword || '', 'primary');
  
  // If primary fails, try secondary endpoint
  if (!result) {
    console.log(`🔄 Primary GraphQL failed for order ${orderId}, trying secondary endpoint...`);
    result = await tryGraphQLEndpoint(orderId, secondaryEndpoint, secondaryLogin, secondaryPassword, 'secondary');
  }

  return result;
}

/**
 * Tries to fetch data from a specific GraphQL endpoint
 */
async function tryGraphQLEndpoint(orderId: number, endpoint: string, login: string, password: string, endpointType: string): Promise<GraphQLOrderDetails | null> {
  try {
    if (!login || !password) {
      console.log(`⚠️  ${endpointType} GraphQL credentials not configured.`);
      return null;
    }

    // First, get authentication token
    const token = await getGraphQLToken(endpoint, login, password);
    if (!token) {
      console.log(`❌ Failed to get token from ${endpointType} endpoint`);
      return null;
    }

    console.log(`📡 Fetching from ${endpointType} GraphQL endpoint for order ${orderId}`);

    // GraphQL query based on the provided orderDetails.txt
    const query = `
      query {
        orderDetails(updatedAfter: null, orderId: ${orderId}) {
          id
          code
          extraInvoice
          status
          statusDescription
          originOrdered
          dateOrder
          hourOrder
          differentiatedMarginReleased
          weightedAverageMargin
          quantityDemanded
          grossValueOrderFactoryPriceFloat
          netValueOrderFactoryPriceFloat
          grossAmountInvoicedFactoryPriceFloat
          netValueBilledFactoryPriceFloat
          billedQuantity
          orderTotalValueFloat
          invoiceReleaseDate
          orderProduct {
            id
            product {
              id
              monitorado
              name
              ean
              brand {
                id
                name
                active
                createdAt
                updatedAt
              }
              division {
                id
                description
              }
              active
              createdAt
              updatedAt
              curveABC
              excludedAt
              price
              sellingPrice
              assortment {
                id
                name
              }
              category {
                id
                name
              }
              shippingBox
            }
            quantityDemanded
            grossValueOrder
            netValueOrder
            netValueBilled
            grossAmountInvoiced
            billedQuantity
            discount
            discountValue
            discountInvoiceValue
            discountPerc
            discountPercInvoice
            reasonBilling {
              id
              descriptionReason
              codeReason
              classification
            }
          }
          wholesalerBranch {
            id
            code
            name
          }
          billingCondition {
            id
            code
            description
            typeCondition
            beginsOn
            expiresOn
            minimumItemsCount
            minimumAmount
            availability {
              labels
            }
            thumbnailImageUrl
            smallImageUrl
            imageUrl
            fullDescription
            status
            deleted
          }
          shippingOrders {
            priority
            wholesaleBranch {
              name
            }
            billing {
              type
              term
            }
          }
          subOrder {
            id
            status
            statusDescription
            confirmed
            subOrderInvoice {
              id
              reversalStatus
              invoiceReleasedOn
              invoiceProcessingDate
              invoiceNumber
              danfe
            }
            motive
            dateSubOrder
            hourSubOrder
          }
          customer {
            id
            code
            codePdv
            companyName
            businessName
            contact
            phoneNumber
            email
            imsCategory
            lastVisitDate
            lastPurchaseOrderAmount
            halfYearlyPurchasingAverage
            active
            createdAt
            updatedAt
            labels
            buyer
          }
          user {
            id
            name
            login
            language
            phoneNumber
            mail
            level {
              id
              name
              type {
                id
                name
              }
            }
          }
        }
      }
    `;

    const response = await fetch.default(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json() as { data: { orderDetails: GraphQLOrderDetails } };

    if (data && data.data && data.data.orderDetails) {
      console.log(`✅ Successfully fetched data from ${endpointType} endpoint for order ${orderId}`);
      return data.data.orderDetails;
    }

    console.log(`⚠️  No data returned from ${endpointType} endpoint for order ${orderId}`);
    return null;
  } catch (error) {
    console.error(`❌ Error fetching from ${endpointType} GraphQL endpoint for order ${orderId}:`, error);
    return null;
  }
}

/**
 * Gets GraphQL authentication token
 */
async function getGraphQLToken(endpoint: string, login: string, password: string): Promise<string | null> {
  try {
    const query = `
      mutation {
        createToken(login: "${login}", password: "${password}") {
          token
        }
      }
    `;

    const response = await fetch.default(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    const result = await response.json() as { data: { createToken: { token: string } } };

    if (result && result.data && result.data.createToken) {
      return result.data.createToken.token;
    }

    return null;
  } catch (error) {
    console.error('Error getting GraphQL token:', error);
    return null;
  }
}

/**
 * Transforms external data and GraphQL details into order record
 */
function transformToOrderRecord(external: ExternalOrderData, details: GraphQLOrderDetails | null): OrderRecord {
  const now = new Date();
  
  // Ensure we have a valid order ID
  const orderId = external.pedido ? String(external.pedido) : String(external.id);
  
  // Generate UUID for id field
  const idHash = crypto.createHash('md5').update(String(external.id)).digest('hex');
  const uuid = [
    idHash.substring(0, 8),
    idHash.substring(8, 12),
    idHash.substring(12, 16),
    idHash.substring(16, 20),
    idHash.substring(20),
  ].join('-');

  return {
    id: uuid,
    orderId: orderId,
    orderStatus: details?.status || external.orderStatus || 'pending',
    orderDetails: details || null,
    originOrdered: details?.originOrdered || 'external',
    segment: external.segmento || 'default',
    grossValue: safeParseNumber(details?.grossValueOrderFactoryPriceFloat) || safeParseNumber(external.valor),
    netValue: safeParseNumber(details?.netValueOrderFactoryPriceFloat) || safeParseNumber(external.faturado),
    billedValue: safeParseNumber(details?.netValueBilledFactoryPriceFloat),
    totalValue: safeParseNumber(details?.orderTotalValueFloat),
    sessionId: external.sessionid || '',
    dateOrder: safeParseDate(details?.dateOrder) || safeParseDate(external.dtpedido) || now,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates a basic order record without GraphQL details
 */
function createBasicOrderRecord(external: ExternalOrderData): OrderRecord {
  const now = new Date();
  
  // Ensure we have a valid order ID
  const orderId = external.pedido ? String(external.pedido) : String(external.id);
  
  // Generate UUID for id field
  const idHash = crypto.createHash('md5').update(String(external.id)).digest('hex');
  const uuid = [
    idHash.substring(0, 8),
    idHash.substring(8, 12),
    idHash.substring(12, 16),
    idHash.substring(16, 20),
    idHash.substring(20),
  ].join('-');

  return {
    id: uuid,
    orderId: orderId,
    orderStatus: external.orderStatus || 'pending',
    orderDetails: {
      basic: true,
      externalStatus: external.status,
      fetchedAt: now.toISOString(),
      note: 'Both GraphQL endpoints failed - using MySQL data only',
      endpointsTried: ['primary', 'secondary'],
    },
    originOrdered: 'external',
    segment: external.segmento || 'default',
    grossValue: safeParseNumber(external.valor),
    netValue: safeParseNumber(external.faturado),
    billedValue: safeParseNumber(external.faturado),
    totalValue: safeParseNumber(external.valor), // Fallback to gross value when no GraphQL data
    sessionId: external.sessionid || '',
    dateOrder: safeParseDate(external.dtpedido) || now,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates sample orders when external data is not available
 */
async function createSampleOrders(knex: Knex): Promise<void> {
  const sampleOrders: OrderRecord[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      orderId: '191004988',
      orderStatus: 'completed',
      orderDetails: {
        code: 'ORD-001',
        status: 'completed',
        statusDescription: 'Order completed successfully',
        originOrdered: 'web',
        sample: true,
      },
      originOrdered: 'web',
      segment: 'pharmaceutical',
      grossValue: 1500.50,
      netValue: 1350.45,
      billedValue: 1350.45,
      totalValue: 1350.45,
      sessionId: 'session-001',
      dateOrder: new Date('2024-01-15 10:30:00'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      orderId: '191004989',
      orderStatus: 'pending',
      orderDetails: {
        code: 'ORD-002',
        status: 'pending',
        statusDescription: 'Order is being processed',
        originOrdered: 'mobile',
        sample: true,
      },
      originOrdered: 'mobile',
      segment: 'healthcare',
      grossValue: 2200.75,
      netValue: 1980.68,
      billedValue: 0,
      totalValue: 1980.68,
      sessionId: 'session-002',
      dateOrder: new Date('2024-01-16 14:15:00'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      orderId: '191004990',
      orderStatus: 'shipped',
      orderDetails: {
        code: 'ORD-003',
        status: 'shipped',
        statusDescription: 'Order has been shipped',
        originOrdered: 'api',
        sample: true,
      },
      originOrdered: 'api',
      segment: 'pharmaceutical',
      grossValue: 850.25,
      netValue: 765.23,
      billedValue: 765.23,
      totalValue: 765.23,
      sessionId: 'session-003',
      dateOrder: new Date('2024-01-17 09:45:00'),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  await knex('orders').insert(sampleOrders);
  console.log('✅ Sample orders created successfully!');
  console.log(`📊 Total sample orders created: ${sampleOrders.length}`);
}
