/**
 * DTO for service statistics response
 */
export class ServiceStatsDto {
  totalServices: number;
  activeServices: number;
  inactiveServices: number;
  totalUsage: number;
  averageResponseTime: number;
}
