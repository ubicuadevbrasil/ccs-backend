export interface TabulationStatusSub {
  id: string;
  tabulationStatusId: string;
  description: string;
  active: boolean;
}

export interface CreateTabulationStatusSubDto {
  tabulationStatusId: string;
  description: string;
  active?: boolean;
}

export interface UpdateTabulationStatusSubDto {
  tabulationStatusId?: string;
  description?: string;
  active?: boolean;
}
