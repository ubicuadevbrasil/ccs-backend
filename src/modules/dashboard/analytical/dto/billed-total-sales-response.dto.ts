/**
 * DTO for billed total sales analytics response
 */
export class BilledTotalSalesResponseDto {
  /**
   * Array of period data with sales metrics
   * For month view: uses Portuguese month names
   * For 30days view: uses daily dates (DD/MM/YYYY format)
   */
  data: {
    date?: string;  // For 30days view: date in DD/MM/YYYY format
    month?: string;  // For month view: Portuguese month name
    totalValue: number;
    billedValue: number;
    [key: string]: string | number | undefined; // Dynamic properties
  }[];

  /**
   * Total value across all periods
   */
  totalValue: number;

  /**
   * Total billed value across all periods
   */
  billedValue: number;

  /**
   * View type used for the analysis
   */
  view: 'month' | '30days';

  /**
   * Origin filter applied (if any)
   */
  origin?: 'whatsapp' | 'chatweb';
}

