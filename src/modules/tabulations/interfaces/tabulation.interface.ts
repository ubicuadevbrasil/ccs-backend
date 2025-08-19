export interface Tabulation {
  id: string;
  sessionId: string;
  tabulatedBy: string;
  tabulatedAt: Date;
  tabulationId: string;
}

export interface CreateTabulationDto {
  sessionId: string;
  tabulatedBy: string;
  tabulationId: string;
}

export interface UpdateTabulationDto {
  tabulationId?: string;
}
