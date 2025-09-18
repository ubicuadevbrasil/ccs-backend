import { Exclude, Expose } from 'class-transformer';

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BLOCKED = 'blocked',
}

export enum CustomerType {
  CONTACT = 'contact',
}

export enum CustomerPlatform {
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  OTHER = 'other',
}

export interface CustomerEntity {
  id: string;
  platformId: string;
  pushName?: string;
  name?: string;
  profilePicUrl?: string;
  contact?: string;
  email?: string;
  cpf?: string;
  cnpj?: string;
  priority: number;
  isGroup: boolean;
  type: CustomerType;
  status: CustomerStatus;
  platform: CustomerPlatform;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Customer implements CustomerEntity {
  id: string;
  platformId: string;
  pushName?: string;
  name?: string;
  profilePicUrl?: string;
  contact?: string;
  email?: string;
  cpf?: string;
  cnpj?: string;
  priority: number;
  isGroup: boolean;
  type: CustomerType;
  status: CustomerStatus;
  platform: CustomerPlatform;
  observations?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Customer>) {
    Object.assign(this, partial);
  }

  @Expose()
  get isActive(): boolean {
    return this.status === CustomerStatus.ACTIVE;
  }

  @Expose()
  get isBlocked(): boolean {
    return this.status === CustomerStatus.BLOCKED;
  }

  @Expose()
  get isHighPriority(): boolean {
    return this.priority > 5;
  }

  @Expose()
  get isGroupContact(): boolean {
    return this.isGroup;
  }

  @Expose()
  get hasProfilePicture(): boolean {
    return !!this.profilePicUrl;
  }

  @Expose()
  get displayName(): string {
    return this.name || this.pushName || this.contact || 'Unknown';
  }
}
