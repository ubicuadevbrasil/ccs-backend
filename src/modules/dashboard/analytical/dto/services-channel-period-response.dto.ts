/**
 * DTO for services channel period analytics response
 */
export class ServicesChannelPeriodResponseDto {
  /**
   * Array of period data with channel counts
   * For month view: uses Portuguese month names
   * For 30days view: uses daily dates (DD/MM/YYYY format)
   */
  data: {
    date?: string;  // For 30days view: date in DD/MM/YYYY format
    month?: string;  // For month view: Portuguese month name
    [key: string]: string | number | undefined; // Dynamic channel names as keys with count values
  }[];

  /**
   * Total count of finished interactions across all periods
   */
  totalCount: number;
}
