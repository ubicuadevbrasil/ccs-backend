import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnalyticalService } from './analytical.service';
import { ServicesChannelDto } from './dto/services-channel.dto';
import { ServicesChannelResponseDto } from './dto/services-channel-response.dto';
import { ServicesChannelPeriodDto } from './dto/services-channel-period.dto';
import { ServicesChannelPeriodResponseDto } from './dto/services-channel-period-response.dto';
import { BotJourneyStepsDto } from './dto/bot-journey-steps.dto';
import { BotJourneyStepsResponseDto } from './dto/bot-journey-steps-response.dto';
import { BotJourneyTransferDto } from './dto/bot-journey-transfer.dto';
import { BotJourneyTransferResponseDto } from './dto/bot-journey-transfer-response.dto';
import { ClosureHumanBotDto } from './dto/closure-human-bot.dto';
import { ClosureHumanBotResponseDto } from './dto/closure-human-bot-response.dto';
import { TotalOrderSalesDto } from './dto/total-order-sales.dto';
import { TotalOrderSalesResponseDto } from './dto/total-order-sales-response.dto';
import { BilledTotalSalesDto } from './dto/billed-total-sales.dto';
import { BilledTotalSalesResponseDto } from './dto/billed-total-sales-response.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

/**
 * Controller for handling analytical dashboard operations
 * 
 * This controller provides comprehensive analytics endpoints for dashboard visualization.
 * All endpoints are protected with JWT authentication and provide real-time analytics
 * data based on the history table records.
 * 
 * **Available Analytics:**
 * - Services Channel Analytics: Channel distribution with flexible date filtering
 * - Services Channel Period Analytics: Advanced analytics with month/30-day views
 * 
 * **Authentication:** All endpoints require valid JWT token in Authorization header
 * **Data Source:** History table with finishedAt timestamp filtering
 * **Response Format:** JSON with channel distribution and percentage calculations
 */
@ApiTags('Dashboard Analytics')
@Controller('dashboard/analytical')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticalController {
  constructor(private readonly analyticalService: AnalyticalService) {}

  /**
   * Get services channel analytics grouped by origin
   * 
   * This endpoint provides analytics data showing the distribution of finished interactions
   * across different service channels (WhatsApp, Chatweb, etc.) based on the origin field
   * in the history table. The data is filtered by the finishedAt timestamp.
   */
  @Get('services-channel')
  @ApiOperation({ 
    summary: 'Get services channel analytics',
    description: `
      Analyzes finished interactions grouped by origin channel (WhatsApp/Chatweb) with flexible date filtering.
      
      **Key Features:**
      - Groups interactions by origin field from history table
      - Only includes finished interactions (finishedAt is not null)
      - Supports flexible date filtering with predefined periods or custom date ranges
      - Calculates percentage distribution across channels
      - Returns real-time analytics data
      
      **Use Cases:**
      - Dashboard charts showing channel distribution
      - Performance analysis across different communication channels
      - Trend analysis for specific time periods
    `,
    operationId: 'getServicesChannelAnalytics'
  })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Predefined time period for analysis',
    enum: ['1d', '7d', '30d', '90d', '1y'],
    example: '7d',
    schema: {
      type: 'string',
      enum: ['1d', '7d', '30d', '90d', '1y'],
      default: '7d'
    }
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for custom date range (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for custom date range (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Services channel analytics retrieved successfully',
    type: ServicesChannelResponseDto,
    schema: {
      example: {
        channels: [
          {
            origin: 'whatsapp',
            count: 150,
            percentage: 75.0
          },
          {
            origin: 'chatweb',
            count: 50,
            percentage: 25.0
          }
        ],
        totalCount: 200,
        period: '7d'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query parameters',
    schema: {
      example: {
        statusCode: 400,
        message: ['startDate must be a valid ISO 8601 date string'],
        error: 'Bad Request'
      }
    }
  })
  async getServicesChannel(
    @Query() query: ServicesChannelDto,
  ): Promise<ServicesChannelResponseDto> {
    return this.analyticalService.getServicesChannel(query);
  }

  /**
   * Get services channel period analytics grouped by origin with different views
   * 
   * This endpoint provides analytics data with two distinct view modes:
   * - Month View: Flexible date filtering for custom periods or current month
   * - Last 30 Days View: Rolling 30-day period from current date
   * 
   * Both views analyze finished interactions grouped by origin channel and provide
   * percentage distribution across different service channels.
   */
  @Get('services-channel-period')
  @ApiOperation({ 
    summary: 'Get services channel period analytics',
    description: `
      Analyzes finished interactions grouped by origin channel with two distinct view modes.
      
      **View Modes:**
      
      **1. Month View (view=month):**
      - Uses flexible date filtering based on provided parameters
      - Defaults to current month if no dates specified
      - Supports custom date ranges via startDate/endDate
      - Ideal for monthly reporting and custom period analysis
      
      **2. Last 30 Days View (view=30days):**
      - Automatically calculates last 30 days from current date
      - Ignores startDate/endDate parameters
      - Provides consistent rolling 30-day analysis
      - Ideal for trend analysis and performance monitoring
      
      **Key Features:**
      - Groups interactions by origin field from history table
      - Only includes finished interactions (finishedAt is not null)
      - Calculates percentage distribution across channels
      - Returns real-time analytics data with view context
      
      **Use Cases:**
      - Monthly dashboard reports
      - Rolling 30-day performance tracking
      - Channel distribution analysis
      - Historical trend analysis
    `,
    operationId: 'getServicesChannelPeriodAnalytics'
  })
  @ApiQuery({
    name: 'view',
    required: false,
    description: 'Analysis view mode - determines how date filtering is applied',
    enum: ['month', '30days'],
    example: 'month',
    schema: {
      type: 'string',
      enum: ['month', '30days'],
      default: 'month'
    }
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for month view (ISO 8601 format). Ignored for 30days view.',
    example: '2024-01-01T00:00:00.000Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for month view (ISO 8601 format). Ignored for 30days view.',
    example: '2024-01-31T23:59:59.999Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Services channel period analytics retrieved successfully',
    type: ServicesChannelPeriodResponseDto,
    schema: {
      examples: {
        monthView: {
          summary: 'Month View Example',
          description: 'Example response showing monthly data with channel counts',
          value: {
            data: [
              {
                month: 'Janeiro',
                whatsapp: 200,
                chatweb: 50
              },
              {
                month: 'Fevereiro',
                whatsapp: 180,
                chatweb: 45
              },
              {
                month: 'Março',
                whatsapp: 220,
                chatweb: 60
              }
            ],
            totalCount: 755
          }
        },
        last30DaysView: {
          summary: 'Last 30 Days View Example',
          description: 'Example response for last 30 days view with daily dates in DD/MM/YYYY format',
          value: {
            data: [
              {
                date: '09/10/2025',
                whatsapp: 57,
                chatweb: 212,
                unknown: 1932
              },
              {
                date: '10/10/2025',
                whatsapp: 45,
                chatweb: 180,
                unknown: 1651
              }
            ],
            totalCount: 4097
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid query parameters',
    schema: {
      example: {
        statusCode: 400,
        message: ['view must be one of the following values: month, 30days'],
        error: 'Bad Request'
      }
    }
  })
  async getServicesChannelPeriod(
    @Query() query: ServicesChannelPeriodDto,
  ): Promise<ServicesChannelPeriodResponseDto> {
    return this.analyticalService.getServicesChannelPeriod(query);
  }

  /**
   * Get bot journey steps analytics grouped by origin
   * 
   * This endpoint analyzes bot journey steps from the transfer table, showing counts of
   * different transfer types (newOrder, checkOrder, budget, vaccine) grouped by the origin
   * of the history record (WhatsApp/Chatweb). The data is filtered by the finishedAt timestamp.
   */
  @Get('bot-journey-steps')
  @ApiOperation({ 
    summary: 'Get bot journey steps analytics',
    description: `
      Analyzes bot journey steps from transfer table, showing counts of different transfer types
      (newOrder, checkOrder, budget, vaccine) grouped by history origin (WhatsApp/Chatweb).
      
      **Key Features:**
      - Joins history and transfer tables to analyze bot journey steps
      - Groups data by origin field from history table
      - Only includes finished interactions (finishedAt is not null)
      - Supports flexible date filtering with startDate/endDate
      - Returns counts for each transfer type by origin
      
      **Transfer Types Analyzed:**
      - newOrder: Novo pedido (New order)
      - checkOrder: Consultar pedido (Check order)
      - budget: Orçamento (Budget)
      - vaccine: Vacina (Vaccine)
      - transferHuman: Transfer to human representative - Intent: 4.3.UsuarioDesejaFalarComRepresentante
      
      **Use Cases:**
      - Analyze bot journey performance across channels
      - Compare transfer types by origin
      - Monitor journey step usage
    `,
    operationId: 'getBotJourneyStepsAnalytics'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Bot journey steps analytics retrieved successfully',
    type: BotJourneyStepsResponseDto,
    schema: {
      example: {
        data: [
          {
            origin: 'whatsapp',
            newOrder: 150,
            checkOrder: 80,
            budget: 45,
            vaccine: 25,
            transferHuman: 30
          },
          {
            origin: 'chatweb',
            newOrder: 100,
            checkOrder: 60,
            budget: 30,
            vaccine: 15,
            transferHuman: 20
          }
        ],
        totalCount: 565
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async getBotJourneySteps(
    @Query() query: BotJourneyStepsDto,
  ): Promise<BotJourneyStepsResponseDto> {
    return this.analyticalService.getBotJourneySteps(query);
  }

  /**
   * Get bot journey transfer analytics grouped by intent
   */
  @Get('bot-journey-transfer')
  @ApiOperation({ 
    summary: 'Get bot journey transfer analytics by intent',
    description: `
      Analyzes bot journey transfers from transfer table, showing counts of different intents.
      Data is grouped by intent field and filtered by history finishedAt timestamp.
      
      **Key Features:**
      - Joins history and transfer tables to analyze intent usage
      - Groups data by intent field from transfer table
      - Only includes finished interactions (finishedAt is not null)
      - Only includes transfers with intent (filters out null intents)
      - Supports flexible date filtering with startDate/endDate
      - Results ordered by count descending (most common first)
      - Returns total count across all intents
      
      **Use Cases:**
      - Analyze most common bot intents
      - Monitor intent distribution
      - Identify popular user journeys
    `,
    operationId: 'getBotJourneyTransferAnalytics'
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering (ISO 8601 format)',
    example: '2024-01-01T00:00:00.000Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering (ISO 8601 format)',
    example: '2024-01-31T23:59:59.999Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Bot journey transfer analytics retrieved successfully',
    type: BotJourneyTransferResponseDto,
    schema: {
      example: {
        data: [
          {
            intent: '4.3.UsuarioDesejaFalarComRepresentante',
            count: 150
          },
          {
            intent: 'SomeOtherIntent',
            count: 80
          }
        ],
        totalCount: 230
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async getBotJourneyTransfer(
    @Query() query: BotJourneyTransferDto,
  ): Promise<BotJourneyTransferResponseDto> {
    return this.analyticalService.getBotJourneyTransfer(query);
  }

  /**
   * Get closure human bot analytics grouped by destiny
   * 
   * This endpoint analyzes history records grouped by destiny field (human vs bot)
   * with two view modes: month view and 30days view. Data is filtered by finishedAt
   * and optionally by origin (whatsapp or chatweb).
   */
  @Get('closure-human-bot')
  @ApiOperation({ 
    summary: 'Get closure human bot analytics',
    description: `
      Analyzes history records grouped by destiny (human vs bot) with two view modes
      and optional origin filtering.
      
      **View Modes:**
      
      **1. Month View (view=month):**
      - Groups data by month with Portuguese month names
      - Defaults to current month if no dates specified
      - Supports custom date ranges via startDate/endDate
      - Ideal for monthly reporting and trend analysis
      
      **2. Last 30 Days View (view=30days):**
      - Groups data by day with DD/MM/YYYY format
      - Automatically calculates last 30 days from current date
      - Always uses rolling 30-day window (ignores date parameters)
      - Provides daily breakdown for close analysis
      - Ideal for short-term trending and daily monitoring
      
      **Key Features:**
      - Groups interactions by destiny field (human/bot)
      - Only includes finished interactions (finishedAt is not null)
      - Supports origin filtering (whatsapp or chatweb)
      - Returns counts for human, bot, and total
      - Calculates percentage distribution
      
      **Use Cases:**
      - Monitor human vs bot closure rates
      - Analyze channel performance (by origin)
      - Monthly closure reporting
      - Daily closure tracking
      - Identify escalation patterns
    `,
    operationId: 'getClosureHumanBotAnalytics'
  })
  @ApiQuery({
    name: 'view',
    required: false,
    description: 'Analysis view mode - month or 30days',
    enum: ['month', '30days'],
    example: 'month',
    schema: {
      type: 'string',
      enum: ['month', '30days'],
      default: 'month'
    }
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for month view only (ISO 8601 format). Completely ignored for 30days view.',
    example: '2024-01-01T00:00:00.000Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for month view only (ISO 8601 format). Completely ignored for 30days view.',
    example: '2024-01-31T23:59:59.999Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiQuery({
    name: 'origin',
    required: false,
    description: 'Filter by origin (whatsapp or chatweb)',
    enum: ['whatsapp', 'chatweb'],
    example: 'whatsapp',
    schema: {
      type: 'string',
      enum: ['whatsapp', 'chatweb']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Closure human bot analytics retrieved successfully',
    type: ClosureHumanBotResponseDto,
    schema: {
      examples: {
        monthView: {
          summary: 'Month View Example',
          description: 'Example response for month view',
          value: {
            data: [
              {
                month: 'Janeiro',
                human: 150,
                bot: 100,
                total: 250
              },
              {
                month: 'Fevereiro',
                human: 180,
                bot: 120,
                total: 300
              }
            ],
            totalCount: 550,
            view: 'month',
            origin: 'whatsapp'
          }
        },
        last30DaysView: {
          summary: 'Last 30 Days View Example',
          description: 'Example response for last 30 days view',
          value: {
            data: [
              {
                date: '09/10/2025',
                human: 25,
                bot: 15,
                total: 40
              },
              {
                date: '10/10/2025',
                human: 30,
                bot: 20,
                total: 50
              }
            ],
            totalCount: 90,
            view: '30days',
            origin: 'chatweb'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async getClosureHumanBot(
    @Query() query: ClosureHumanBotDto,
  ): Promise<ClosureHumanBotResponseDto> {
    return this.analyticalService.getClosureHumanBot(query);
  }

  @Get('total-order-sales')
  @ApiOperation({
    summary: 'Get total order sales analytics',
    description: `
      Calculates total order sales metrics including quantity count and total value sum,
      with flexible view modes and origin filtering.

      **View Modes:**

      **1. Month View (view=month):**
      - Groups data by month with Portuguese month names
      - Defaults to current month if no dates specified
      - Supports custom date ranges via startDate/endDate
      - Ideal for monthly revenue reporting and trend analysis

      **2. Last 30 Days View (view=30days):**
      - Groups data by day with DD/MM/YYYY format
      - Always uses rolling 30-day window (ignores date parameters)
      - Provides daily breakdown for close analysis
      - Ideal for short-term tracking and daily monitoring

      **Key Features:**
      - Joins orders with history table for origin filtering
      - Filters by order date (dateOrder field)
      - Calculates quantity count (number of orders)
      - Calculates total value sum (sum of totalValue field)
      - Supports origin filtering (whatsapp or chatweb)
      - Returns aggregated totals across all periods

      **Use Cases:**
      - Monitor daily sales volume and revenue
      - Analyze revenue trends by origin
      - Monthly revenue reporting
      - Daily sales performance tracking
      - Channel-specific sales analysis
    `,
    operationId: 'getTotalOrderSalesAnalytics'
  })
  @ApiQuery({
    name: 'view',
    required: false,
    description: 'Analysis view mode - month or 30days',
    enum: ['month', '30days'],
    example: 'month',
    schema: {
      type: 'string',
      enum: ['month', '30days'],
      default: 'month'
    }
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for month view only (ISO 8601 format). Completely ignored for 30days view.',
    example: '2024-01-01T00:00:00.000Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for month view only (ISO 8601 format). Completely ignored for 30days view.',
    example: '2024-01-31T23:59:59.999Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiQuery({
    name: 'origin',
    required: false,
    description: 'Filter by origin (whatsapp or chatweb)',
    enum: ['whatsapp', 'chatweb'],
    example: 'whatsapp',
    schema: {
      type: 'string',
      enum: ['whatsapp', 'chatweb']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Total order sales analytics retrieved successfully',
    type: TotalOrderSalesResponseDto,
    schema: {
      examples: {
        monthView: {
          summary: 'Month View Example',
          description: 'Example response for month view',
          value: {
            data: [
              {
                month: 'Janeiro',
                quantity: 150,
                totalValue: 45000.50
              },
              {
                month: 'Fevereiro',
                quantity: 180,
                totalValue: 55000.75
              }
            ],
            totalQuantity: 330,
            totalValue: 100001.25,
            view: 'month',
            origin: 'whatsapp'
          }
        },
        last30DaysView: {
          summary: 'Last 30 Days View Example',
          description: 'Example response for last 30 days view',
          value: {
            data: [
              {
                date: '09/10/2025',
                quantity: 25,
                totalValue: 8500.00
              },
              {
                date: '10/10/2025',
                quantity: 30,
                totalValue: 10500.50
              }
            ],
            totalQuantity: 55,
            totalValue: 19000.50,
            view: '30days',
            origin: 'chatweb'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async getTotalOrderSales(
    @Query() query: TotalOrderSalesDto,
  ): Promise<TotalOrderSalesResponseDto> {
    return this.analyticalService.getTotalOrderSales(query);
  }

  @Get('billed-total-sales')
  @ApiOperation({
    summary: 'Get billed total sales analytics',
    description: `
      Calculates billed total sales metrics including sum of totalValue and billedValue
      with flexible view modes and origin filtering.

      **View Modes:**

      **1. Month View (view=month):**
      - Groups data by month with Portuguese month names
      - Defaults to current month if no dates specified
      - Supports custom date ranges via startDate/endDate
      - Ideal for monthly revenue and billing analysis

      **2. Last 30 Days View (view=30days):**
      - Groups data by day with DD/MM/YYYY format
      - Always uses rolling 30-day window (ignores date parameters)
      - Provides daily breakdown for close analysis
      - Ideal for short-term tracking and daily monitoring

      **Key Features:**
      - Joins orders with history table for origin filtering
      - Filters by order date (dateOrder field)
      - Calculates sum of totalValue field
      - Calculates sum of billedValue field
      - Supports origin filtering (whatsapp or chatweb)
      - Returns aggregated totals across all periods

      **Use Cases:**
      - Monitor billed vs total revenue
      - Analyze billing trends by origin
      - Monthly billing reporting
      - Daily billing performance tracking
      - Channel-specific billing analysis
    `,
    operationId: 'getBilledTotalSalesAnalytics'
  })
  @ApiQuery({
    name: 'view',
    required: false,
    description: 'Analysis view mode - month or 30days',
    enum: ['month', '30days'],
    example: 'month',
    schema: {
      type: 'string',
      enum: ['month', '30days'],
      default: 'month'
    }
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for month view only (ISO 8601 format). Completely ignored for 30days view.',
    example: '2024-01-01T00:00:00.000Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for month view only (ISO 8601 format). Completely ignored for 30days view.',
    example: '2024-01-31T23:59:59.999Z',
    schema: {
      type: 'string',
      format: 'date-time'
    }
  })
  @ApiQuery({
    name: 'origin',
    required: false,
    description: 'Filter by origin (whatsapp or chatweb)',
    enum: ['whatsapp', 'chatweb'],
    example: 'whatsapp',
    schema: {
      type: 'string',
      enum: ['whatsapp', 'chatweb']
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Billed total sales analytics retrieved successfully',
    type: BilledTotalSalesResponseDto,
    schema: {
      examples: {
        monthView: {
          summary: 'Month View Example',
          description: 'Example response for month view',
          value: {
            data: [
              {
                month: 'Janeiro',
                totalValue: 45000.50,
                billedValue: 42000.30
              },
              {
                month: 'Fevereiro',
                totalValue: 55000.75,
                billedValue: 52000.50
              }
            ],
            totalValue: 100001.25,
            billedValue: 94000.80,
            view: 'month',
            origin: 'whatsapp'
          }
        },
        last30DaysView: {
          summary: 'Last 30 Days View Example',
          description: 'Example response for last 30 days view',
          value: {
            data: [
              {
                date: '09/10/2025',
                totalValue: 8500.00,
                billedValue: 8000.00
              },
              {
                date: '10/10/2025',
                totalValue: 10500.50,
                billedValue: 10000.50
              }
            ],
            totalValue: 19000.50,
            billedValue: 18000.50,
            view: '30days',
            origin: 'chatweb'
          }
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
        error: 'Unauthorized'
      }
    }
  })
  async getBilledTotalSales(
    @Query() query: BilledTotalSalesDto,
  ): Promise<BilledTotalSalesResponseDto> {
    return this.analyticalService.getBilledTotalSales(query);
  }
}
