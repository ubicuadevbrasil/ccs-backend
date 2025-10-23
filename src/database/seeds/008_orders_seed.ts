import { Knex } from 'knex';
import axios from 'axios';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';

// Load environment variables
dotenv.config();

// Token cache to avoid repeated authentication calls
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

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
 * Helper function to look up history ID by sessionId or sessionBot
 */
async function lookupHistoryId(knex: Knex, sessionId: string): Promise<string | null> {
  try {
    if (!sessionId) return null;
    
    // First try to find by sessionId
    let history = await knex('history')
      .select('id')
      .where('sessionId', sessionId)
      .first();
    
    if (history) {
      return history.id;
    }
    
    // If not found by sessionId, try by sessionBot
    history = await knex('history')
      .select('id')
      .where('sessionBot', sessionId)
      .first();
    
    return history ? history.id : null;
  } catch (error) {
    console.error(`Error looking up history ID for sessionId ${sessionId}:`, error);
    return null;
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
  historyId: string | null; // Looked up from history table by sessionId
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
    console.log('⚠️  Cannot connect to external database. Skipping orders seed.');
    console.log(`Error: ${error.message}`);
    return;
  }

  try {
    const startTime = Date.now();
    
    // Step 1: Fetch ALL external data from MySQL tab_pedidos table
    console.log('📡 Fetching external data from MySQL tab_pedidos table...');
    const result = await externalKnex.raw(`
      SELECT id, sessionid, dtpedido, segmento, pedido, valor, faturado, orderStatus, status
      FROM tab_pedidos 
      WHERE pedido IS NOT NULL 
      AND YEAR(dtpedido) = 2025
    `);
    
    // Extract the actual data from knex.raw result
    const externalData: ExternalOrderData[] = result[0];
    
    console.log(`📊 Found ${externalData.length} external records`);

    if (externalData.length === 0) {
      console.log('⚠️  No external data found. Skipping orders seed.');
      return;
    }

    // Step 2: Fetch GraphQL details in batches
    const graphqlBatchSize = parseInt(process.env.GRAPHQL_BATCH_SIZE || '50');
    const orderDetailsMap = new Map<number, GraphQLOrderDetails | null>();
    
    console.log(`📦 Fetching GraphQL details in batches of ${graphqlBatchSize}...`);
    
    for (let i = 0; i < externalData.length; i += graphqlBatchSize) {
      const batch = externalData.slice(i, i + graphqlBatchSize);
      const batchNumber = Math.floor(i / graphqlBatchSize) + 1;
      const totalBatches = Math.ceil(externalData.length / graphqlBatchSize);
      const progressPercent = ((i / externalData.length) * 100).toFixed(1);
      
      console.log(`🔄 Fetching GraphQL batch ${batchNumber}/${totalBatches} (${batch.length} orders) - ${progressPercent}% complete...`);
      
      // Process GraphQL calls in parallel for this batch
      const graphqlPromises = batch.map(async (externalRecord) => {
        try {
          const orderDetails = await fetchOrderDetailsFromGraphQL(externalRecord.pedido);
          return { orderId: externalRecord.pedido, details: orderDetails };
        } catch (error) {
          console.error(`❌ Error fetching GraphQL details for order ${externalRecord.pedido}:`, error);
          return { orderId: externalRecord.pedido, details: null };
        }
      });
      
      // Wait for all GraphQL calls in this batch to complete
      const batchResults = await Promise.all(graphqlPromises);
      
      // Store results in map
      batchResults.forEach(({ orderId, details }) => {
        orderDetailsMap.set(orderId, details);
      });
      
      console.log(`✅ Completed GraphQL batch ${batchNumber}/${totalBatches}`);
    }

    // Step 3: Transform all data and prepare for insertion
    console.log('🔄 Transforming data and preparing for database insertion...');
    const ordersToInsert: OrderRecord[] = [];
    
    for (const externalRecord of externalData) {
      try {
        const orderDetails = orderDetailsMap.get(externalRecord.pedido) || null;
        const orderRecord = await transformToOrderRecord(knex, externalRecord, orderDetails);
        ordersToInsert.push(orderRecord);
      } catch (error) {
        console.error(`❌ Error transforming order ${externalRecord.pedido}:`, error);
        // Create a basic record without GraphQL details
        const basicOrder = await createBasicOrderRecord(knex, externalRecord);
        ordersToInsert.push(basicOrder);
      }
    }

    // Step 4: Insert all data in batches
    const insertBatchSize = parseInt(process.env.INSERT_BATCH_SIZE || '1000');
    let totalInserted = 0;
    
    console.log(`💾 Inserting ${ordersToInsert.length} orders in batches of ${insertBatchSize}...`);
    
    for (let i = 0; i < ordersToInsert.length; i += insertBatchSize) {
      const batch = ordersToInsert.slice(i, i + insertBatchSize);
      const batchNumber = Math.floor(i / insertBatchSize) + 1;
      const totalBatches = Math.ceil(ordersToInsert.length / insertBatchSize);
      
      console.log(`💾 Inserting database batch ${batchNumber}/${totalBatches} (${batch.length} orders)...`);
      
      await knex('orders').insert(batch);
      totalInserted += batch.length;
      
      console.log(`✅ Database batch ${batchNumber}/${totalBatches} inserted! Total inserted: ${totalInserted}`);
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000; // in seconds
    
    console.log('✅ Orders seeded successfully!');
    console.log(`📊 Total orders processed: ${externalData.length}`);
    console.log(`📊 Total orders inserted: ${totalInserted}`);
    console.log(`📊 GraphQL batches processed: ${Math.ceil(externalData.length / graphqlBatchSize)}`);
    console.log(`📊 Database batches processed: ${Math.ceil(ordersToInsert.length / insertBatchSize)}`);
    console.log(`⏱️  Total processing time: ${totalTime.toFixed(2)} seconds`);
    console.log(`📈 Average time per order: ${(totalTime / externalData.length).toFixed(3)} seconds`);
    console.log(`📈 Orders per second: ${(externalData.length / totalTime).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error during orders seed:', error);
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
 * Optimized for batch processing with timeout and retry logic
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

  // Set timeout for GraphQL calls (30 seconds)
  const timeout = 30000;
  
  // Try primary endpoint first with timeout
  let result = await Promise.race([
    tryGraphQLEndpoint(orderId, primaryEndpoint, primaryLogin || '', primaryPassword || '', 'primary'),
    new Promise<null>((_, reject) => 
      setTimeout(() => reject(new Error('Primary GraphQL timeout')), timeout)
    )
  ]).catch(() => null);
  
  // If primary fails, try secondary endpoint with timeout
  if (!result) {
    result = await Promise.race([
      tryGraphQLEndpoint(orderId, secondaryEndpoint, secondaryLogin, secondaryPassword, 'secondary'),
      new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Secondary GraphQL timeout')), timeout)
      )
    ]).catch(() => null);
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

    const response = await axios.post(endpoint, 
      { query }, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        timeout: 25000, // 25 second timeout for GraphQL queries
      }
    );

    const data = response.data as { data: { orderDetails: GraphQLOrderDetails } };

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
 * Gets GraphQL authentication token with caching
 */
async function getGraphQLToken(endpoint: string, login: string, password: string): Promise<string | null> {
  try {
    // Create cache key
    const cacheKey = `${endpoint}:${login}`;
    
    // Check if we have a valid cached token
    const cached = tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }
    
    const query = `
      mutation {
        createToken(login: "${login}", password: "${password}") {
          token
        }
      }
    `;

    const response = await axios.post(endpoint, 
      { query }, 
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000, // 10 second timeout for auth
      }
    );

    const result = response.data as { data: { createToken: { token: string } } };

    if (result && result.data && result.data.createToken) {
      const token = result.data.createToken.token;
      
      // Cache the token for 50 minutes (assuming tokens last 1 hour)
      tokenCache.set(cacheKey, {
        token,
        expiresAt: Date.now() + (50 * 60 * 1000)
      });
      
      return token;
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
async function transformToOrderRecord(knex: Knex, external: ExternalOrderData, details: GraphQLOrderDetails | null): Promise<OrderRecord> {
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

  // Look up history ID by sessionId
  const historyId = await lookupHistoryId(knex, external.sessionid);

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
    historyId: historyId,
    dateOrder: safeParseDate(details?.dateOrder) || safeParseDate(external.dtpedido) || now,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates a basic order record without GraphQL details
 */
async function createBasicOrderRecord(knex: Knex, external: ExternalOrderData): Promise<OrderRecord> {
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

  // Look up history ID by sessionId
  const historyId = await lookupHistoryId(knex, external.sessionid);

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
    historyId: historyId,
    dateOrder: safeParseDate(external.dtpedido) || now,
    createdAt: now,
    updatedAt: now,
  };
}
