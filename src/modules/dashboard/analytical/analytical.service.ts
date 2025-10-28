import { Injectable } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
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
import { formatDateToDDMMYYYY, getMonthNameFromNumber } from '../../../common/utils/date.utils';

/**
 * Service for handling analytical dashboard business logic
 */
@Injectable()
export class AnalyticalService {
  constructor(@InjectKnex() private readonly knex: Knex) {}

  /**
   * Get services channel analytics grouped by origin
   */
  async getServicesChannel(query: ServicesChannelDto): Promise<ServicesChannelResponseDto> {
    // Calculate date range based on period or provided dates
    const dateRange = this.calculateDateRange(query);
    
    // Build the query for history records grouped by origin
    let queryBuilder = this.knex('history')
      .select('origin')
      .count('* as count')
      .whereNotNull('finishedAt') // Only finished interactions
      .groupBy('origin');

    // Apply date filtering based on finishedAt field
    if (dateRange.startDate) {
      queryBuilder = queryBuilder.where('finishedAt', '>=', new Date(dateRange.startDate));
    }
    
    if (dateRange.endDate) {
      queryBuilder = queryBuilder.where('finishedAt', '<=', new Date(dateRange.endDate));
    }

    // Execute the query
    const results = await queryBuilder;
    
    // Calculate total count
    const totalCount = results.reduce((sum, row) => sum + parseInt(String(row.count)), 0);
    
    // Transform results to include percentages
    const channels = results.map(row => ({
      origin: String(row.origin || 'unknown'),
      count: parseInt(String(row.count)),
      percentage: totalCount > 0 ? Math.round((parseInt(String(row.count)) / totalCount) * 100 * 100) / 100 : 0,
    }));

    return {
      channels,
      totalCount,
      period: query.period || '7d',
    };
  }

  /**
   * Get services channel period analytics grouped by origin with different views
   */
  async getServicesChannelPeriod(query: ServicesChannelPeriodDto): Promise<ServicesChannelPeriodResponseDto> {
    // Calculate date range based on view type
    const dateRange = this.calculateServicesChannelPeriodDateRange(query);
    
    let queryBuilder;
    let isDailyView = query.view === '30days';
    
    if (isDailyView) {
      // For 30days view, group by day
      queryBuilder = this.knex('history')
        .select(
          this.knex.raw('DATE("finishedAt") as date'),
          this.knex.raw('origin'),
          this.knex.raw('COUNT(*) as count')
        )
        .whereNotNull('finishedAt')
        .groupBy('date', 'origin')
        .orderBy('date', 'asc');
    } else {
      // For month view, group by month
      queryBuilder = this.knex('history')
        .select(
          this.knex.raw('EXTRACT(YEAR FROM "finishedAt") as year'),
          this.knex.raw('EXTRACT(MONTH FROM "finishedAt") as month'),
          'origin',
          this.knex.raw('COUNT(*) as count')
        )
        .whereNotNull('finishedAt')
        .groupBy('year', 'month', 'origin')
        .orderBy('year', 'asc')
        .orderBy('month', 'asc');
    }

    // Apply date filtering based on finishedAt field
    if (dateRange.startDate) {
      queryBuilder = queryBuilder.where('finishedAt', '>=', new Date(dateRange.startDate));
    }
    
    if (dateRange.endDate) {
      queryBuilder = queryBuilder.where('finishedAt', '<=', new Date(dateRange.endDate));
    }

    // Execute the query
    const results = await queryBuilder;
    
    // Calculate total count
    const totalCount = results.reduce((sum, row) => sum + parseInt(String(row.count)), 0);
    
    // Group results by period and transform to the required format
    const periodGroups = new Map<string, Map<string, number>>();
    
    results.forEach(row => {
      const origin = String(row.origin || 'unknown');
      const count = parseInt(String(row.count));
      
      let periodKey: string;
      
      if (isDailyView) {
        // For 30days view, use date in DD/MM/YYYY format
        const dateValue = row.date;
        periodKey = formatDateToDDMMYYYY(dateValue);
      } else {
        // For month view, use Portuguese month names
        const month = parseInt(String(row.month));
        periodKey = getMonthNameFromNumber(month);
      }
      
      if (!periodGroups.has(periodKey)) {
        periodGroups.set(periodKey, new Map());
      }
      
      periodGroups.get(periodKey)!.set(origin, count);
    });
    
    // Transform to the required data format
    const data = Array.from(periodGroups.entries()).map(([period, channels]) => {
      const periodData: { date?: string; month?: string; [key: string]: string | number | undefined } = {};
      
      if (isDailyView) {
        periodData.date = period;
      } else {
        periodData.month = period;
      }
      
      // Add each channel as a property
      channels.forEach((count, channel) => {
        periodData[channel] = count;
      });
      
      return periodData;
    });

    return {
      data,
      totalCount,
    };
  }


  /**
   * Get bot journey steps analytics grouped by origin
   */
  async getBotJourneySteps(query: BotJourneyStepsDto): Promise<BotJourneyStepsResponseDto> {
    let queryBuilder: any;
    
    // Apply date filtering based on finishedAt field
    if (query.startDate && query.endDate) {
      queryBuilder = this.knex.raw(`
        SELECT 
          h."origin",
          COUNT(*) FILTER (WHERE t."newOrder" = true) as "newOrder",
          COUNT(*) FILTER (WHERE t."checkOrder" = true) as "checkOrder",
          COUNT(*) FILTER (WHERE t."budget" = true) as "budget",
          COUNT(*) FILTER (WHERE t."vaccine" = true) as "vaccine",
          COUNT(*) FILTER (WHERE t."intent" = '4.3.UsuarioDesejaFalarComRepresentante') as "representante"
        FROM "transfer" as t
        INNER JOIN "history" as h ON t."historyId" = h."id"
        WHERE h."finishedAt" IS NOT NULL
          AND h."finishedAt" >= ?
          AND h."finishedAt" <= ?
        GROUP BY h."origin"
      `, [query.startDate, query.endDate]);
    } else if (query.startDate) {
      queryBuilder = this.knex.raw(`
        SELECT 
          h."origin",
          COUNT(*) FILTER (WHERE t."newOrder" = true) as "newOrder",
          COUNT(*) FILTER (WHERE t."checkOrder" = true) as "checkOrder",
          COUNT(*) FILTER (WHERE t."budget" = true) as "budget",
          COUNT(*) FILTER (WHERE t."vaccine" = true) as "vaccine",
          COUNT(*) FILTER (WHERE t."intent" = '4.3.UsuarioDesejaFalarComRepresentante') as "representante"
        FROM "transfer" as t
        INNER JOIN "history" as h ON t."historyId" = h."id"
        WHERE h."finishedAt" IS NOT NULL
          AND h."finishedAt" >= ?
        GROUP BY h."origin"
      `, [query.startDate]);
    } else if (query.endDate) {
      queryBuilder = this.knex.raw(`
        SELECT 
          h."origin",
          COUNT(*) FILTER (WHERE t."newOrder" = true) as "newOrder",
          COUNT(*) FILTER (WHERE t."checkOrder" = true) as "checkOrder",
          COUNT(*) FILTER (WHERE t."budget" = true) as "budget",
          COUNT(*) FILTER (WHERE t."vaccine" = true) as "vaccine",
          COUNT(*) FILTER (WHERE t."intent" = '4.3.UsuarioDesejaFalarComRepresentante') as "representante"
        FROM "transfer" as t
        INNER JOIN "history" as h ON t."historyId" = h."id"
        WHERE h."finishedAt" IS NOT NULL
          AND h."finishedAt" <= ?
        GROUP BY h."origin"
      `, [query.endDate]);
    } else {
      queryBuilder = this.knex.raw(`
        SELECT 
          h."origin",
          COUNT(*) FILTER (WHERE t."newOrder" = true) as "newOrder",
          COUNT(*) FILTER (WHERE t."checkOrder" = true) as "checkOrder",
          COUNT(*) FILTER (WHERE t."budget" = true) as "budget",
          COUNT(*) FILTER (WHERE t."vaccine" = true) as "vaccine",
          COUNT(*) FILTER (WHERE t."intent" = '4.3.UsuarioDesejaFalarComRepresentante') as "representante"
        FROM "transfer" as t
        INNER JOIN "history" as h ON t."historyId" = h."id"
        WHERE h."finishedAt" IS NOT NULL
        GROUP BY h."origin"
      `);
    }

    // Execute the query
    const results = await queryBuilder;
    
    // Transform results
    const data = results.rows.map((row: any) => ({
      origin: String(row.origin || 'unknown'),
      newOrder: parseInt(String(row.newOrder)) || 0,
      checkOrder: parseInt(String(row.checkOrder)) || 0,
      budget: parseInt(String(row.budget)) || 0,
      vaccine: parseInt(String(row.vaccine)) || 0,
      transferHuman: parseInt(String(row.representante)) || 0,
    }));
    
    // Calculate total count
    const totalCount = data.reduce((sum, row) => 
      sum + row.newOrder + row.checkOrder + row.budget + row.vaccine + row.transferHuman, 0
    );

    return {
      data,
      totalCount,
    };
  }

  /**
   * Get bot journey transfer analytics grouped by intent
   */
  async getBotJourneyTransfer(query: BotJourneyTransferDto): Promise<BotJourneyTransferResponseDto> {
    let queryBuilder: any;
    
    // Apply date filtering based on finishedAt field
    if (query.startDate && query.endDate) {
      queryBuilder = this.knex.raw(`
        SELECT 
          t."intent",
          COUNT(*) as "count"
        FROM "transfer" as t
        INNER JOIN "history" as h ON t."historyId" = h."id"
        WHERE h."finishedAt" IS NOT NULL
          AND h."finishedAt" >= ?
          AND h."finishedAt" <= ?
          AND t."intent" IS NOT NULL
        GROUP BY t."intent"
        ORDER BY "count" DESC
      `, [query.startDate, query.endDate]);
    } else if (query.startDate) {
      queryBuilder = this.knex.raw(`
        SELECT 
          t."intent",
          COUNT(*) as "count"
        FROM "transfer" as t
        INNER JOIN "history" as h ON t."historyId" = h."id"
        WHERE h."finishedAt" IS NOT NULL
          AND h."finishedAt" >= ?
          AND t."intent" IS NOT NULL
        GROUP BY t."intent"
        ORDER BY "count" DESC
      `, [query.startDate]);
    } else if (query.endDate) {
      queryBuilder = this.knex.raw(`
        SELECT 
          t."intent",
          COUNT(*) as "count"
        FROM "transfer" as t
        INNER JOIN "history" as h ON t."historyId" = h."id"
        WHERE h."finishedAt" IS NOT NULL
          AND h."finishedAt" <= ?
          AND t."intent" IS NOT NULL
        GROUP BY t."intent"
        ORDER BY "count" DESC
      `, [query.endDate]);
    } else {
      queryBuilder = this.knex.raw(`
        SELECT 
          t."intent",
          COUNT(*) as "count"
        FROM "transfer" as t
        INNER JOIN "history" as h ON t."historyId" = h."id"
        WHERE h."finishedAt" IS NOT NULL
          AND t."intent" IS NOT NULL
        GROUP BY t."intent"
        ORDER BY "count" DESC
      `);
    }

    // Execute the query
    const results = await queryBuilder;
    
    // Transform results
    const data = results.rows.map((row: any) => ({
      intent: String(row.intent || 'unknown'),
      count: parseInt(String(row.count)) || 0,
    }));
    
    // Calculate total count
    const totalCount = data.reduce((sum, row) => sum + row.count, 0);

    return {
      data,
      totalCount,
    };
  }

  /**
   * Get closure human bot analytics grouped by destiny with different views
   */
  async getClosureHumanBot(query: ClosureHumanBotDto): Promise<ClosureHumanBotResponseDto> {
    const view = query.view || 'month';
    const isDailyView = view === '30days';
    
    // Calculate date range based on view type
    const dateRange = this.calculateClosureDateRange(query);
    
    let queryBuilder;
    
    if (isDailyView) {
      // For 30days view, group by day
      queryBuilder = this.knex('history')
        .select(
          this.knex.raw('DATE("finishedAt") as date'),
          this.knex.raw('COUNT(*) FILTER (WHERE "destiny" = \'human\') as human'),
          this.knex.raw('COUNT(*) FILTER (WHERE "destiny" = \'bot\') as bot'),
          this.knex.raw('COUNT(*) as total')
        )
        .whereNotNull('finishedAt')
        .groupBy('date')
        .orderBy('date', 'asc');
    } else {
      // For month view, group by month
      queryBuilder = this.knex('history')
        .select(
          this.knex.raw('EXTRACT(YEAR FROM "finishedAt") as year'),
          this.knex.raw('EXTRACT(MONTH FROM "finishedAt") as month'),
          this.knex.raw('COUNT(*) FILTER (WHERE "destiny" = \'human\') as human'),
          this.knex.raw('COUNT(*) FILTER (WHERE "destiny" = \'bot\') as bot'),
          this.knex.raw('COUNT(*) as total')
        )
        .whereNotNull('finishedAt')
        .groupBy('year', 'month')
        .orderBy('year', 'asc')
        .orderBy('month', 'asc');
    }

    // Apply origin filter
    if (query.origin) {
      queryBuilder = queryBuilder.where('origin', query.origin);
    }

    // Apply date filtering based on finishedAt field
    // For 30days view, always use the calculated range (ignore query dates)
    // For month view, use provided dates or default to current month
    if (dateRange.startDate) {
      queryBuilder = queryBuilder.where('finishedAt', '>=', new Date(dateRange.startDate));
    }
    
    if (dateRange.endDate) {
      queryBuilder = queryBuilder.where('finishedAt', '<=', new Date(dateRange.endDate));
    }

    // Execute the query
    const results = await queryBuilder;
    
    // Calculate total count
    const totalCount = results.reduce((sum, row) => sum + parseInt(String(row.total)), 0);
    
    // Group results by period and transform to the required format
    const periodGroups = new Map<string, { human: number; bot: number; total: number }>();
    
    results.forEach(row => {
      let periodKey: string;
      
      if (isDailyView) {
        const dateValue = row.date;
        periodKey = formatDateToDDMMYYYY(dateValue);
      } else {
        const month = parseInt(String(row.month));
        periodKey = getMonthNameFromNumber(month);
      }
      
      if (!periodGroups.has(periodKey)) {
        periodGroups.set(periodKey, { human: 0, bot: 0, total: 0 });
      }
      
      const group = periodGroups.get(periodKey)!;
      group.human += parseInt(String(row.human)) || 0;
      group.bot += parseInt(String(row.bot)) || 0;
      group.total += parseInt(String(row.total)) || 0;
    });
    
    // Transform to the required data format
    const data = Array.from(periodGroups.entries()).map(([period, counts]) => {
      const periodData: { date?: string; month?: string; human: number; bot: number; total: number; [key: string]: string | number | undefined } = {
        human: counts.human,
        bot: counts.bot,
        total: counts.total,
      };
      
      if (isDailyView) {
        periodData.date = period;
      } else {
        periodData.month = period;
      }
      
      return periodData;
    });

    return {
      data,
      totalCount,
      view,
      origin: query.origin,
    };
  }

  /**
   * Calculate date range for closure human bot based on view type
   */
  private calculateClosureDateRange(query: ClosureHumanBotDto): { startDate?: string; endDate?: string } {
    const now = new Date();
    const view = query.view || 'month';
    
    // For 30days view, always calculate last 30 days (ignore query dates)
    if (view === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }
    
    // For month view, use provided dates or default to current month
    if (query.startDate && query.endDate) {
      return {
        startDate: query.startDate,
        endDate: query.endDate,
      };
    }
    
    // Month view - default to current month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      startDate: firstDayOfMonth.toISOString(),
      endDate: lastDayOfMonth.toISOString(),
    };
  }

  /**
   * Calculate date range based on query parameters for services channel
   */
  private calculateDateRange(query: ServicesChannelDto): { startDate?: string; endDate?: string } {
    const now = new Date();
    
    // If specific dates are provided, use them
    if (query.startDate && query.endDate) {
      return {
        startDate: query.startDate,
        endDate: query.endDate,
      };
    }
    
    // If period is provided, calculate based on period
    if (query.period) {
      let startDate: Date;
      
      switch (query.period) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '1y':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // Default to 7 days
      }
      
      return {
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
      };
    }
    
    // Default to last 7 days if no parameters provided
    const defaultStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return {
      startDate: defaultStartDate.toISOString(),
      endDate: now.toISOString(),
    };
  }

  /**
   * Calculate date range based on view type for services channel period
   */
  private calculateServicesChannelPeriodDateRange(query: ServicesChannelPeriodDto): { startDate?: string; endDate?: string } {
    const now = new Date();
    const view = query.view || 'month';
    
    if (view === '30days') {
      // Last 30 days counting from current date
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }
    
    // Month view - use provided dates or default to current month
    if (query.startDate && query.endDate) {
      return {
        startDate: query.startDate,
        endDate: query.endDate,
      };
    }
    
    // Default to current month if no dates provided
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    return {
      startDate: firstDayOfMonth.toISOString(),
      endDate: lastDayOfMonth.toISOString(),
    };
  }

  /**
   * Get total order sales analytics
   */
  async getTotalOrderSales(query: TotalOrderSalesDto): Promise<TotalOrderSalesResponseDto> {
    const view = query.view || 'month';
    const isDailyView = view === '30days';

    // Calculate date range based on view type
    const dateRange = this.calculateTotalOrderSalesDateRange(query);

    let queryBuilder;

    if (isDailyView) {
      // For 30days view, group by day
      queryBuilder = this.knex('orders as o')
        .join('history as h', 'o.historyId', 'h.id')
        .select(
          this.knex.raw('DATE(o."dateOrder") as date'),
          this.knex.raw('COUNT(o."id") as quantity'),
          this.knex.raw('COALESCE(SUM(o."totalValue"), 0) as totalValue')
        )
        .groupBy('date')
        .orderBy('date', 'asc');
    } else {
      // For month view, group by month
      queryBuilder = this.knex('orders as o')
        .join('history as h', 'o.historyId', 'h.id')
        .select(
          this.knex.raw('EXTRACT(YEAR FROM o."dateOrder") as year'),
          this.knex.raw('EXTRACT(MONTH FROM o."dateOrder") as month'),
          this.knex.raw('COUNT(o."id") as quantity'),
          this.knex.raw('COALESCE(SUM(o."totalValue"), 0) as totalValue')
        )
        .groupBy('year', 'month')
        .orderBy('year', 'asc')
        .orderBy('month', 'asc');
    }

    // Apply origin filter from history table
    if (query.origin) {
      queryBuilder = queryBuilder.where('h.origin', query.origin);
    }

    // Apply date filtering based on dateOrder field
    if (dateRange.startDate) {
      queryBuilder = queryBuilder.where('o.dateOrder', '>=', new Date(dateRange.startDate));
    }

    if (dateRange.endDate) {
      queryBuilder = queryBuilder.where('o.dateOrder', '<=', new Date(dateRange.endDate));
    }

    // Execute the query
    const results = await queryBuilder;

    // Calculate totals
    let totalQuantity = 0;
    let totalValue = 0;

    // Transform results to the required format
    const data = results.map(row => {
      const quantity = parseInt(String(row.quantity)) || 0;
      const value = parseFloat(String(row.totalValue)) || 0;

      totalQuantity += quantity;
      totalValue += value;

      const rowData: { date?: string; month?: string; quantity: number; totalValue: number; [key: string]: string | number | undefined } = {
        quantity,
        totalValue,
      };

      if (isDailyView) {
        const dateValue = row.date;
        rowData.date = formatDateToDDMMYYYY(dateValue);
      } else {
        const month = parseInt(String(row.month));
        rowData.month = getMonthNameFromNumber(month);
      }

      return rowData;
    });

    return {
      data,
      totalQuantity,
      totalValue,
      view,
      origin: query.origin,
    };
  }

  /**
   * Calculate date range for total order sales based on view type
   */
  private calculateTotalOrderSalesDateRange(query: TotalOrderSalesDto): { startDate?: string; endDate?: string } {
    const now = new Date();
    const view = query.view || 'month';

    // For 30days view, always calculate last 30 days (ignore query dates)
    if (view === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }

    // For month view, use provided dates or default to current month
    if (query.startDate && query.endDate) {
      return {
        startDate: query.startDate,
        endDate: query.endDate,
      };
    }

    // Month view - default to current month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startDate: firstDayOfMonth.toISOString(),
      endDate: lastDayOfMonth.toISOString(),
    };
  }

  /**
   * Get billed total sales analytics
   */
  async getBilledTotalSales(query: BilledTotalSalesDto): Promise<BilledTotalSalesResponseDto> {
    const view = query.view || 'month';
    const isDailyView = view === '30days';

    // Calculate date range based on view type
    const dateRange = this.calculateBilledTotalSalesDateRange(query);

    let queryBuilder;

    if (isDailyView) {
      // For 30days view, group by day
      queryBuilder = this.knex('orders as o')
        .join('history as h', 'o.historyId', 'h.id')
        .select(
          this.knex.raw('DATE(o."dateOrder") as date'),
          this.knex.raw('COALESCE(SUM(o."totalValue"), 0) as totalValue'),
          this.knex.raw('COALESCE(SUM(o."billedValue"), 0) as billedValue')
        )
        .groupBy('date')
        .orderBy('date', 'asc');
    } else {
      // For month view, group by month
      queryBuilder = this.knex('orders as o')
        .join('history as h', 'o.historyId', 'h.id')
        .select(
          this.knex.raw('EXTRACT(YEAR FROM o."dateOrder") as year'),
          this.knex.raw('EXTRACT(MONTH FROM o."dateOrder") as month'),
          this.knex.raw('COALESCE(SUM(o."totalValue"), 0) as totalValue'),
          this.knex.raw('COALESCE(SUM(o."billedValue"), 0) as billedValue')
        )
        .groupBy('year', 'month')
        .orderBy('year', 'asc')
        .orderBy('month', 'asc');
    }

    // Apply origin filter from history table
    if (query.origin) {
      queryBuilder = queryBuilder.where('h.origin', query.origin);
    }

    // Apply date filtering based on dateOrder field
    if (dateRange.startDate) {
      queryBuilder = queryBuilder.where('o.dateOrder', '>=', new Date(dateRange.startDate));
    }

    if (dateRange.endDate) {
      queryBuilder = queryBuilder.where('o.dateOrder', '<=', new Date(dateRange.endDate));
    }

    // Execute the query
    const results = await queryBuilder;

    // Calculate totals
    let totalValue = 0;
    let billedValue = 0;

    // Transform results to the required format
    const data = results.map(row => {
      const totalVal = parseFloat(String(row.totalValue)) || 0;
      const billedVal = parseFloat(String(row.billedValue)) || 0;

      totalValue += totalVal;
      billedValue += billedVal;

      const rowData: { date?: string; month?: string; totalValue: number; billedValue: number; [key: string]: string | number | undefined } = {
        totalValue: totalVal,
        billedValue: billedVal,
      };

      if (isDailyView) {
        const dateValue = row.date;
        rowData.date = formatDateToDDMMYYYY(dateValue);
      } else {
        const month = parseInt(String(row.month));
        rowData.month = getMonthNameFromNumber(month);
      }

      return rowData;
    });

    return {
      data,
      totalValue,
      billedValue,
      view,
      origin: query.origin,
    };
  }

  /**
   * Calculate date range for billed total sales based on view type
   */
  private calculateBilledTotalSalesDateRange(query: BilledTotalSalesDto): { startDate?: string; endDate?: string } {
    const now = new Date();
    const view = query.view || 'month';

    // For 30days view, always calculate last 30 days (ignore query dates)
    if (view === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return {
        startDate: thirtyDaysAgo.toISOString(),
        endDate: now.toISOString(),
      };
    }

    // For month view, use provided dates or default to current month
    if (query.startDate && query.endDate) {
      return {
        startDate: query.startDate,
        endDate: query.endDate,
      };
    }

    // Month view - default to current month
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      startDate: firstDayOfMonth.toISOString(),
      endDate: lastDayOfMonth.toISOString(),
    };
  }
}
