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
  createdAt: Date;
  updatedAt: Date;
}

export interface TabulationSubEntity {
  id: string;
  tabulationId: string;
  name: string;
  description?: string;
  status: TabulationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class TabulationSub implements TabulationSubEntity {
  id: string;
  tabulationId: string;
  name: string;
  description?: string;
  status: TabulationStatus;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<TabulationSub>) {
    Object.assign(this, partial);
  }

  @Expose()
  get isActive(): boolean {
    return this.status === TabulationStatus.ACTIVE;
  }
}

export class Tabulation implements TabulationEntity {
  id: string;
  name: string;
  description?: string;
  status: TabulationStatus;
  createdAt: Date;
  updatedAt: Date;
  tabulationSubs?: TabulationSub[];

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
  get hasSubs(): boolean {
    return this.tabulationSubs && this.tabulationSubs.length > 0;
  }

  @Expose()
  get activeSubsCount(): number {
    return this.tabulationSubs ? this.tabulationSubs.filter(sub => sub.isActive).length : 0;
  }
}
