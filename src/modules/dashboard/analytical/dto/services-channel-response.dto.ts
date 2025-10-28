/**
 * DTO for servicesChannel analytics response
 */
export class ServicesChannelResponseDto {
  /**
   * Data grouped by origin channel
   */
  channels: {
    origin: string;
    count: number;
    percentage: number;
  }[];

  /**
   * Total count of finished interactions
   */
  totalCount: number;

  /**
   * Period used for the analysis
   */
  period: string;
}
