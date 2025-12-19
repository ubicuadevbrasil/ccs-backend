import { Exclude, Expose } from 'class-transformer';

export enum TabulationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export interface TabulationEntity {
  id: string;
  name: string;
  description?: string;
  status: TabulationStatus;
  effective: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Tabulation implements TabulationEntity {
  id: string;
  name: string;
  description?: string;
  status: TabulationStatus;
  effective: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Tabulation>) {
    Object.assign(this, partial);
  }

  @Expose()
  get isActive(): boolean {
    return this.status === TabulationStatus.ACTIVE;
  }

  @Expose()
  get hasDescription(): boolean {
    return !!this.description;
  }

  @Expose()
  get hasEffective(): boolean {
    return this.effective;
  }
}
