import { Knex } from 'knex';
import axios from 'axios';
import * as crypto from 'crypto';
import * as dotenv from 'dotenv';
import externalKnexConfig from '../../../knexfile.external';

// Load environment variables
dotenv.config();

// Token cache to avoid repeated authentication calls
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

// Rate limiting detection and handling
let rateLimitDetected = false;
let rateLimitResetTime = 0;
let consecutiveFailures = 0;
const MAX_CONSECUTIVE_FAILURES = 5;

// Rate limiting: 100 requests per minute (60 seconds)
const MAX_REQUESTS_PER_MINUTE = 100;
const RATE_LIMIT_WINDOW = 60 * 1000; // 60 seconds in milliseconds
const requestTimes: number[] = [];

/**
 * Helper function to check if we should wait due to rate limiting
 */
async function checkRateLimit(): Promise<void> {
  if (rateLimitDetected && Date.now() < rateLimitResetTime) {
    const waitTime = Math.ceil((rateLimitResetTime - Date.now()) / 1000);
    console.log(`⏳ Rate limit active, waiting ${waitTime} seconds...`);
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    rateLimitDetected = false;
    console.log(`✅ Rate limit wait completed, resuming...`);
  }
}

/**
 * Helper function to enforce 100 requests per minute rate limit
 */
async function enforceRateLimit(): Promise<void> {
  const now = Date.now();
  
  // Remove requests older than 1 minute
  const cutoffTime = now - RATE_LIMIT_WINDOW;
  const validRequests = requestTimes.filter(time => time > cutoffTime);
  requestTimes.length = 0; // Clear array
  requestTimes.push(...validRequests); // Add back valid requests
  
  // Check if we're at the limit
  if (requestTimes.length >= MAX_REQUESTS_PER_MINUTE) {
    const oldestRequest = Math.min(...requestTimes);
    const waitTime = Math.ceil((oldestRequest + RATE_LIMIT_WINDOW - now) / 1000);
    
    console.log(`⏳ Rate limit reached (${requestTimes.length}/${MAX_REQUESTS_PER_MINUTE}), waiting ${waitTime} seconds...`);
    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));
    
    // Clean up after waiting
    const newNow = Date.now();
    const newCutoffTime = newNow - RATE_LIMIT_WINDOW;
    const newValidRequests = requestTimes.filter(time => time > newCutoffTime);
    requestTimes.length = 0;
    requestTimes.push(...newValidRequests);
  }
  
  // Record this request
  requestTimes.push(now);
  
  console.log(`🔍 [DEBUG] Rate limit status: ${requestTimes.length}/${MAX_REQUESTS_PER_MINUTE} requests in last minute`);
}

/**
 * Helper function to handle consecutive failures
 */
function handleConsecutiveFailure(): boolean {
  consecutiveFailures++;
  console.log(`🔍 [DEBUG] Consecutive failures: ${consecutiveFailures}/${MAX_CONSECUTIVE_FAILURES}`);
  
  if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
    console.error(`🚨 Too many consecutive failures (${consecutiveFailures}), stopping GraphQL requests`);
    return true; // Stop processing
  }
  
  return false; // Continue processing
}

/**
 * Helper function to reset failure counter on success
 */
function resetFailureCounter(): void {
  if (consecutiveFailures > 0) {
    console.log(`✅ GraphQL request succeeded, resetting failure counter (was ${consecutiveFailures})`);
    consecutiveFailures = 0;
  }
}

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
 * Helper function to check if order already exists with GraphQL details
 */
async function checkExistingOrder(knex: Knex, orderId: number): Promise<boolean> {
  try {
    const existingOrder = await knex('orders')
      .select('id', 'orderDetails')
      .where('orderId', String(orderId))
      .first();
    
    if (!existingOrder) {
      return false; // Order doesn't exist
    }
    
    // Check if orderDetails contains GraphQL data (not basic fallback data)
    const orderDetails = existingOrder.orderDetails;
    if (!orderDetails || typeof orderDetails !== 'object') {
      return false; // No details or invalid format
    }
    
    // Check if it's basic fallback data (has 'basic: true' property)
    if (orderDetails.basic === true) {
      return false; // Only has basic data, needs GraphQL details
    }
    
    // Check if it has GraphQL-specific fields
    const hasGraphQLData = orderDetails.id || orderDetails.code || orderDetails.customer || orderDetails.user;
    return hasGraphQLData; // Has GraphQL data
    
  } catch (error) {
    console.error(`Error checking existing order ${orderId}:`, error);
    return false; // On error, assume we need to fetch
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
    order: any; // Nested order with same structure as parent order
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

    // Step 2: Check existing orders and fetch GraphQL details in batches
    const graphqlBatchSize = parseInt(process.env.GRAPHQL_BATCH_SIZE || '10'); // Reduced from 50 to 10 for rate limiting
    const orderDetailsMap = new Map<number, GraphQLOrderDetails | null>();
    const existingOrdersMap = new Map<number, boolean>(); // Track which orders already exist (for insert vs update)
    
    console.log(`📦 Checking existing orders and fetching GraphQL details in batches of ${graphqlBatchSize}...`);
    console.log(`🔍 [DEBUG] Rate limit: ${MAX_REQUESTS_PER_MINUTE} requests per minute (${RATE_LIMIT_WINDOW/1000} seconds)`);
    
    for (let i = 0; i < externalData.length; i += graphqlBatchSize) {
      const batch = externalData.slice(i, i + graphqlBatchSize);
      const batchNumber = Math.floor(i / graphqlBatchSize) + 1;
      const totalBatches = Math.ceil(externalData.length / graphqlBatchSize);
      const progressPercent = ((i / externalData.length) * 100).toFixed(1);
      
      console.log(`🔄 Processing batch ${batchNumber}/${totalBatches} (${batch.length} orders) - ${progressPercent}% complete...`);
      
      // Check which orders already exist in the database (regardless of GraphQL data)
      const existingCheckPromises = batch.map(async (externalRecord) => {
        const exists = await knex('orders')
          .where('orderId', String(externalRecord.pedido))
          .first()
          .then(result => !!result);
        return { orderId: externalRecord.pedido, exists };
      });
      
      const existingResults = await Promise.all(existingCheckPromises);
      
      // Store existing status for later use (to determine insert vs update)
      existingResults.forEach(({ orderId, exists }) => {
        existingOrdersMap.set(orderId, exists);
      });
      
      // Always fetch fresh GraphQL data for all orders (to update with new nested structure)
      console.log(`📊 Batch ${batchNumber}: Fetching fresh GraphQL data for ${batch.length} orders...`);
      
      // Process GraphQL calls for ALL orders to get fresh data with updated structure
      // Process sequentially to respect rate limits (100 requests per minute)
      for (const externalRecord of batch) {
        try {
          const orderDetails = await fetchOrderDetailsFromGraphQL(externalRecord.pedido);
          orderDetailsMap.set(externalRecord.pedido, orderDetails);
          
          // Add a small delay between requests to be extra safe
          await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        } catch (error) {
          console.error(`❌ Error fetching GraphQL details for order ${externalRecord.pedido}:`, error);
          orderDetailsMap.set(externalRecord.pedido, null);
        }
      }
      
      console.log(`✅ Processed ${batch.length} GraphQL requests`);
      
      console.log(`✅ Completed batch ${batchNumber}/${totalBatches}`);
    }

    // Step 3: Transform all data and prepare for insertion/update
    console.log('🔄 Transforming data and preparing for database operations...');
    const ordersToInsert: OrderRecord[] = [];
    const ordersToUpdate: OrderRecord[] = [];
    
    for (const externalRecord of externalData) {
      try {
        const orderDetails = orderDetailsMap.get(externalRecord.pedido) || null;
        const orderRecord = await transformToOrderRecord(knex, externalRecord, orderDetails);
        
        // Check if this order already exists (but wasn't skipped)
        const alreadyExists = existingOrdersMap.get(externalRecord.pedido);
        if (alreadyExists) {
          // Order exists but wasn't skipped, so we need to update it
          ordersToUpdate.push(orderRecord);
        } else {
          // New order, insert it
          ordersToInsert.push(orderRecord);
        }
      } catch (error) {
        console.error(`❌ Error transforming order ${externalRecord.pedido}:`, error);
        // Create a basic record without GraphQL details
        const basicOrder = await createBasicOrderRecord(knex, externalRecord);
        
        // Check if this order already exists
        const alreadyExists = existingOrdersMap.get(externalRecord.pedido);
        if (alreadyExists) {
          ordersToUpdate.push(basicOrder);
        } else {
          ordersToInsert.push(basicOrder);
        }
      }
    }

    // Step 4: Insert new orders and update existing orders in batches
    const insertBatchSize = parseInt(process.env.INSERT_BATCH_SIZE || '1000');
    const updateBatchSize = parseInt(process.env.UPDATE_BATCH_SIZE || '1000');
    let totalInserted = 0;
    let totalUpdated = 0;
    
    // Insert new orders
    if (ordersToInsert.length > 0) {
      console.log(`💾 Inserting ${ordersToInsert.length} new orders in batches of ${insertBatchSize}...`);
      
      for (let i = 0; i < ordersToInsert.length; i += insertBatchSize) {
        const batch = ordersToInsert.slice(i, i + insertBatchSize);
        const batchNumber = Math.floor(i / insertBatchSize) + 1;
        const totalBatches = Math.ceil(ordersToInsert.length / insertBatchSize);
        
        console.log(`💾 Inserting batch ${batchNumber}/${totalBatches} (${batch.length} orders)...`);
        
        await knex('orders').insert(batch);
        totalInserted += batch.length;
        
        console.log(`✅ Insert batch ${batchNumber}/${totalBatches} completed! Total inserted: ${totalInserted}`);
      }
    }
    
    // Update existing orders
    if (ordersToUpdate.length > 0) {
      console.log(`🔄 Updating ${ordersToUpdate.length} existing orders in batches of ${updateBatchSize}...`);
      
      for (let i = 0; i < ordersToUpdate.length; i += updateBatchSize) {
        const batch = ordersToUpdate.slice(i, i + updateBatchSize);
        const batchNumber = Math.floor(i / updateBatchSize) + 1;
        const totalBatches = Math.ceil(ordersToUpdate.length / updateBatchSize);
        
        console.log(`🔄 Updating batch ${batchNumber}/${totalBatches} (${batch.length} orders)...`);
        
        // Update each order individually since we need to match by orderId
        for (const order of batch) {
          await knex('orders')
            .where('orderId', order.orderId)
            .update({
              orderStatus: order.orderStatus,
              orderDetails: order.orderDetails,
              originOrdered: order.originOrdered,
              segment: order.segment,
              grossValue: order.grossValue,
              netValue: order.netValue,
              billedValue: order.billedValue,
              totalValue: order.totalValue,
              historyId: order.historyId,
              dateOrder: order.dateOrder,
              updatedAt: order.updatedAt
            });
        }
        
        totalUpdated += batch.length;
        console.log(`✅ Update batch ${batchNumber}/${totalBatches} completed! Total updated: ${totalUpdated}`);
      }
    }
    
    const endTime = Date.now();
    const totalTime = (endTime - startTime) / 1000; // in seconds
    
    console.log('✅ Orders seeded successfully!');
    console.log(`📊 Total orders processed: ${externalData.length}`);
    console.log(`📊 New orders inserted: ${totalInserted}`);
    console.log(`📊 Existing orders updated: ${totalUpdated}`);
    console.log(`📊 Orders fetched from GraphQL: ${externalData.length}`);
    console.log(`📊 GraphQL batches processed: ${Math.ceil(externalData.length / graphqlBatchSize)}`);
    console.log(`📊 Insert batches processed: ${ordersToInsert.length > 0 ? Math.ceil(ordersToInsert.length / insertBatchSize) : 0}`);
    console.log(`📊 Update batches processed: ${ordersToUpdate.length > 0 ? Math.ceil(ordersToUpdate.length / updateBatchSize) : 0}`);
    console.log(`⏱️  Total processing time: ${totalTime.toFixed(2)} seconds`);
    console.log(`📈 Average time per order: ${(totalTime / externalData.length).toFixed(3)} seconds`);
    console.log(`📈 Orders per second: ${(externalData.length / totalTime).toFixed(2)}`);
    console.log(`📈 Orders updated: ${totalUpdated > 0 ? `${((totalUpdated / externalData.length) * 100).toFixed(1)}%` : '0%'}`);
    console.log(`📈 Orders inserted: ${totalInserted > 0 ? `${((totalInserted / externalData.length) * 100).toFixed(1)}%` : '0%'}`);

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
 * Tries to fetch data from a specific GraphQL endpoint with comprehensive debugging
 */
async function tryGraphQLEndpoint(orderId: number, endpoint: string, login: string, password: string, endpointType: string): Promise<GraphQLOrderDetails | null> {
  const startTime = Date.now();
  
  try {
    // Enforce 100 requests per minute rate limit
    await enforceRateLimit();
    
    // Check for server-side rate limiting before making request
    await checkRateLimit();
    
    if (!login || !password) {
      console.log(`⚠️  ${endpointType} GraphQL credentials not configured.`);
      return null;
    }

    console.log(`🔍 [DEBUG] Starting GraphQL request for order ${orderId} on ${endpointType} endpoint`);
    console.log(`🔍 [DEBUG] Endpoint: ${endpoint}`);
    console.log(`🔍 [DEBUG] Login: ${login}`);

    // First, get authentication token
    console.log(`🔍 [DEBUG] Getting authentication token...`);
    const token = await getGraphQLToken(endpoint, login, password);
    if (!token) {
      console.log(`❌ Failed to get token from ${endpointType} endpoint for order ${orderId}`);
      if (handleConsecutiveFailure()) return null;
      return null;
    }

    console.log(`🔍 [DEBUG] Token obtained successfully (length: ${token.length})`);

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
            order {
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
                billing {
                  type
                  term
                }
              }
            }
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
            billingCondition
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

    console.log(`🔍 [DEBUG] Making GraphQL request for order ${orderId}...`);
    console.log(`🔍 [DEBUG] Query length: ${query.length} characters`);

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

    const responseTime = Date.now() - startTime;
    console.log(`🔍 [DEBUG] GraphQL response received in ${responseTime}ms`);
    console.log(`🔍 [DEBUG] Response status: ${response.status}`);
    console.log(`🔍 [DEBUG] Response headers:`, JSON.stringify(response.headers, null, 2));

    // Log response data structure for debugging
    console.log(`🔍 [DEBUG] Response data type: ${typeof response.data}`);
    console.log(`🔍 [DEBUG] Response data keys:`, Object.keys(response.data || {}));
    
    if (response.data && typeof response.data === 'object') {
      console.log(`🔍 [DEBUG] Response data structure:`, JSON.stringify(response.data, null, 2));
    }

    const data = response.data as { data: { orderDetails: GraphQLOrderDetails } };

    // Check for GraphQL errors
    if (response.data.errors) {
      console.error(`❌ GraphQL errors for order ${orderId}:`, response.data.errors);
      return null;
    }

    // Check for rate limiting or other HTTP errors
    if (response.status !== 200) {
      console.error(`❌ HTTP error ${response.status} for order ${orderId}:`, response.statusText);
      return null;
    }

    if (data && data.data && data.data.orderDetails) {
      console.log(`✅ Successfully fetched data from ${endpointType} endpoint for order ${orderId}`);
      console.log(`🔍 [DEBUG] Order details ID: ${data.data.orderDetails.id}`);
      console.log(`🔍 [DEBUG] Order details code: ${data.data.orderDetails.code}`);
      console.log(`🔍 [DEBUG] Order details status: ${data.data.orderDetails.status}`);
      resetFailureCounter(); // Reset failure counter on success
      return data.data.orderDetails;
    }

    // Detailed debugging for no data case
    console.log(`⚠️  No data returned from ${endpointType} endpoint for order ${orderId}`);
    console.log(`🔍 [DEBUG] Data structure analysis:`);
    console.log(`🔍 [DEBUG] - data exists: ${!!data}`);
    console.log(`🔍 [DEBUG] - data.data exists: ${!!(data && data.data)}`);
    console.log(`🔍 [DEBUG] - data.data.orderDetails exists: ${!!(data && data.data && data.data.orderDetails)}`);
    
    if (data && data.data) {
      console.log(`🔍 [DEBUG] - data.data keys:`, Object.keys(data.data));
    }
    
    if (data && data.data && data.data.orderDetails === null) {
      console.log(`🔍 [DEBUG] - orderDetails is explicitly null (order may not exist in GraphQL system)`);
    }

    // This is not necessarily a failure - order might not exist in GraphQL system
    // Only count as failure if we get an error response
    return null;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Error fetching from ${endpointType} GraphQL endpoint for order ${orderId} (${responseTime}ms):`, error);
    
    // Detailed error analysis
    if (error.response) {
      console.error(`🔍 [DEBUG] Error response status: ${error.response.status}`);
      console.error(`🔍 [DEBUG] Error response headers:`, JSON.stringify(error.response.headers, null, 2));
      console.error(`🔍 [DEBUG] Error response data:`, JSON.stringify(error.response.data, null, 2));
      
      // Check for rate limiting
      if (error.response.status === 429) {
        console.error(`🚨 RATE LIMITING DETECTED for order ${orderId}!`);
        rateLimitDetected = true;
        
        // Try to extract retry-after header
        const retryAfter = error.response.headers['retry-after'] || error.response.headers['Retry-After'];
        if (retryAfter) {
          rateLimitResetTime = Date.now() + (parseInt(retryAfter) * 1000);
          console.error(`🚨 Rate limit will reset in ${retryAfter} seconds`);
        } else {
          // Default to 60 seconds if no retry-after header
          rateLimitResetTime = Date.now() + (60 * 1000);
          console.error(`🚨 Rate limit will reset in 60 seconds (default)`);
        }
      }
      
      // Check for authentication issues
      if (error.response.status === 401 || error.response.status === 403) {
        console.error(`🚨 AUTHENTICATION ISSUE for order ${orderId}!`);
      }
      
      // Handle consecutive failures for actual errors (not rate limiting)
      if (error.response.status !== 429) {
        if (handleConsecutiveFailure()) return null;
      }
    } else if (error.request) {
      console.error(`🔍 [DEBUG] No response received:`, error.request);
      if (handleConsecutiveFailure()) return null;
    } else {
      console.error(`🔍 [DEBUG] Request setup error:`, error.message);
      if (handleConsecutiveFailure()) return null;
    }
    
    return null;
  }
}

/**
 * Gets GraphQL authentication token with caching and debugging
 */
async function getGraphQLToken(endpoint: string, login: string, password: string): Promise<string | null> {
  const startTime = Date.now();
  
  try {
    // Create cache key
    const cacheKey = `${endpoint}:${login}`;
    
    // Check if we have a valid cached token
    const cached = tokenCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`🔍 [DEBUG] Using cached token for ${login} (expires in ${Math.round((cached.expiresAt - Date.now()) / 1000)}s)`);
      return cached.token;
    }
    
    console.log(`🔍 [DEBUG] Getting new authentication token for ${login}...`);
    
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

    const responseTime = Date.now() - startTime;
    console.log(`🔍 [DEBUG] Auth response received in ${responseTime}ms`);
    console.log(`🔍 [DEBUG] Auth response status: ${response.status}`);
    console.log(`🔍 [DEBUG] Auth response data:`, JSON.stringify(response.data, null, 2));

    const result = response.data as { data: { createToken: { token: string } } };

    if (result && result.data && result.data.createToken) {
      const token = result.data.createToken.token;
      
      // Cache the token for 50 minutes (assuming tokens last 1 hour)
      tokenCache.set(cacheKey, {
        token,
        expiresAt: Date.now() + (50 * 60 * 1000)
      });
      
      console.log(`🔍 [DEBUG] Token obtained and cached successfully (length: ${token.length})`);
      return token;
    }

    console.error(`🔍 [DEBUG] Invalid auth response structure:`, result);
    return null;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`🔍 [DEBUG] Error getting GraphQL token for ${login} (${responseTime}ms):`, error);
    
    if (error.response) {
      console.error(`🔍 [DEBUG] Auth error response status: ${error.response.status}`);
      console.error(`🔍 [DEBUG] Auth error response data:`, JSON.stringify(error.response.data, null, 2));
    }
    
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
