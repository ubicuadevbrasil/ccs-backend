import { Exclude, Expose } from 'class-transformer';
import { CustomerTag } from './customer-tag.entity';

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
  tags?: CustomerTag[];
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
  tags?: CustomerTag[];
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

  @Expose()
  get tagNames(): string[] {
    return this.tags?.map(tag => tag.tag) || [];
  }

  @Expose()
  get hasTags(): boolean {
    return !!(this.tags && this.tags.length > 0);
  }

  @Expose()
  get systemTags(): string[] {
    return this.tags?.filter(tag => tag.isSystemTag).map(tag => tag.tag) || [];
  }

  @Expose()
  get userTags(): string[] {
    return this.tags?.filter(tag => tag.isUserTag).map(tag => tag.tag) || [];
  }

  @Expose()
  get hasTag(): (tagName: string) => boolean {
    return (tagName: string) => {
      return this.tags?.some(tag => tag.normalizedTag === tagName.toLowerCase().trim()) || false;
    };
  }

  /**
   * Convert Customer to CustomerResponseDto format
   */
  toResponseDto(): any {
    return {
      id: this.id,
      platformId: this.platformId,
      pushName: this.pushName,
      name: this.name,
      profilePicUrl: this.profilePicUrl,
      contact: this.contact,
      email: this.email,
      cpf: this.cpf,
      cnpj: this.cnpj,
      priority: this.priority,
      isGroup: this.isGroup,
      type: this.type,
      status: this.status,
      platform: this.platform,
      observations: this.observations,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      displayName: this.displayName,
      tags: this.tagNames, // Use the computed property that returns string[]
    };
  }
}
