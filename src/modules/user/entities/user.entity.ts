import { Exclude, Expose } from 'class-transformer';

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

export enum UserProfile {
  ADMIN = 'admin',
  SUPERVISOR = 'supervisor',
  OPERATOR = 'operator',
}

export interface UserEntity {
  id: string;
  login: string;
  password: string;
  name: string;
  email: string;
  contact: string;
  profilePicture?: string;
  status: UserStatus;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export class User implements UserEntity {
  id: string;
  login: string;
  
  @Exclude()
  password: string;
  
  name: string;
  email: string;
  contact: string;
  profilePicture?: string;
  status: UserStatus;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  @Expose()
  get isActive(): boolean {
    return this.status === UserStatus.ACTIVE;
  }

  @Expose()
  get isAdmin(): boolean {
    return this.profile === UserProfile.ADMIN;
  }

  @Expose()
  get isSupervisor(): boolean {
    return this.profile === UserProfile.SUPERVISOR;
  }

  @Expose()
  get isOperator(): boolean {
    return this.profile === UserProfile.OPERATOR;
  }
}
