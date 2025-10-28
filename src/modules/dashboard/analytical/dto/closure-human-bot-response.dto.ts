/**
 * DTO for closure human bot analytics response
 */
export class ClosureHumanBotResponseDto {
  /**
   * Array of period data with destiny counts
   * For month view: uses Portuguese month names
   * For 30days view: uses daily dates (DD/MM/YYYY format)
   */
  data: {
    date?: string;  // For 30days view: date in DD/MM/YYYY format
    month?: string;  // For month view: Portuguese month name
    human: number;
    bot: number;
    total: number;
    [key: string]: string | number | undefined; // Dynamic properties
  }[];

  /**
   * Total count of finished interactions across all periods
   */
  totalCount: number;

  /**
   * View type used for the analysis
   */
  view: 'month' | '30days';

  /**
   * Origin filter applied (if any)
   */
  origin?: 'whatsapp' | 'chatweb';
}

