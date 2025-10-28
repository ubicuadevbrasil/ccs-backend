/**
 * DTO for total order sales analytics response
 */
export class TotalOrderSalesResponseDto {
  /**
   * Array of period data with sales metrics
   * For month view: uses Portuguese month names
   * For 30days view: uses daily dates (DD/MM/YYYY format)
   */
  data: {
    date?: string;  // For 30days view: date in DD/MM/YYYY format
    month?: string;  // For month view: Portuguese month name
    quantity: number;
    totalValue: number;
    [key: string]: string | number | undefined; // Dynamic properties
  }[];

  /**
   * Total quantity across all periods
   */
  totalQuantity: number;

  /**
   * Total value across all periods
   */
  totalValue: number;

  /**
   * View type used for the analysis
   */
  view: 'month' | '30days';

  /**
   * Origin filter applied (if any)
   */
  origin?: 'whatsapp' | 'chatweb';
}

