export enum UserStatus {
  ACTIVE = 'Active',
  INACTIVE = 'Inactive',
}

export enum UserProfile {
  ADMIN = 'Admin',
  SUPERVISOR = 'Supervisor',
  OPERATOR = 'Operator',
}

export enum UserDepartment {
  PERSONAL = 'Personal',
  FISCAL = 'Fiscal',
  ACCOUNTING = 'Accounting',
  FINANCIAL = 'Financial',
}

export interface User {
  id: string;
  login: string;
  password: string;
  name: string;
  email: string;
  contact: string;
  profilePicture?: string;
  status: UserStatus;
  profile: UserProfile;
  department: UserDepartment;
  active: boolean;
  list: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  login: string;
  password: string;
  name: string;
  email: string;
  contact: string;
  profilePicture?: string;
  status?: UserStatus;
  profile: UserProfile;
  department: UserDepartment;
  active?: boolean;
  list?: boolean;
}

export interface UpdateUserDto {
  login?: string;
  password?: string;
  name?: string;
  email?: string;
  contact?: string;
  profilePicture?: string;
  status?: UserStatus;
  profile?: UserProfile;
  department?: UserDepartment;
  active?: boolean;
  list?: boolean;
}

export interface UserResponse {
  id: string;
  login: string;
  name: string;
  email: string;
  contact: string;
  profilePicture?: string;
  status: UserStatus;
  profile: UserProfile;
  department: UserDepartment;
  active: boolean;
  list: boolean;
  createdAt: Date;
  updatedAt: Date;
} 