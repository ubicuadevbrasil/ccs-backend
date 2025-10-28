/**
 * DTO for bot journey steps analytics response
 */
export class BotJourneyStepsResponseDto {
  /**
   * Array of journey steps grouped by origin
   */
  data: {
    origin: string;
    newOrder: number;
    checkOrder: number;
    budget: number;
    vaccine: number;
    transferHuman: number;
  }[];

  /**
   * Total count across all origins
   */
  totalCount: number;
}

