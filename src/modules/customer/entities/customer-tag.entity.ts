import { Expose } from 'class-transformer';

export interface CustomerTagEntity {
  id: string;
  customerId: string;
  tag: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CustomerTag implements CustomerTagEntity {
  id: string;
  customerId: string;
  tag: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<CustomerTag>) {
    Object.assign(this, partial);
  }

  @Expose()
  get normalizedTag(): string {
    return this.tag.toLowerCase().trim();
  }

  @Expose()
  get isSystemTag(): boolean {
    return this.tag.startsWith('system:');
  }

  @Expose()
  get isUserTag(): boolean {
    return !this.isSystemTag;
  }
}
