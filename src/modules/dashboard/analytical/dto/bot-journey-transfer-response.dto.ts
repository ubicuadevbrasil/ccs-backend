/**
 * DTO for bot journey transfer analytics response
 */
export class BotJourneyTransferResponseDto {
  /**
   * Array of transfer counts grouped by intent
   */
  data: {
    intent: string;
    count: number;
  }[];

  /**
   * Total count across all intents
   */
  totalCount: number;
}

