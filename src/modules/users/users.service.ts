import { Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nestjs-knex';
import { User, CreateUserDto, UpdateUserDto, UserResponse } from './interfaces/user.interface';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(@InjectConnection() private readonly knex: Knex) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponse> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const [user] = await this.knex('users')
      .insert({
        ...createUserDto,
        password: hashedPassword,
        status: createUserDto.status || 'Active',
        active: createUserDto.active !== undefined ? createUserDto.active : true,
        list: createUserDto.list !== undefined ? createUserDto.list : true,
      })
      .returning('*');

    return this.mapToUserResponse(user);
  }

  async findAll(): Promise<UserResponse[]> {
    const users = await this.knex('users')
      .where('active', true)
      .select('*')
      .orderBy('createdAt', 'desc');

    return users.map(user => this.mapToUserResponse(user));
  }

  async findOne(id: string): Promise<UserResponse | null> {
    const user = await this.knex('users')
      .where('id', id)
      .where('active', true)
      .first();

    return user ? this.mapToUserResponse(user) : null;
  }

  async findByLogin(login: string): Promise<User | null> {
    const user = await this.knex('users')
      .where('login', login)
      .where('active', true)
      .first();

    return user || null;
  }

  async findByEmail(email: string): Promise<UserResponse | null> {
    const user = await this.knex('users')
      .where('email', email)
      .where('active', true)
      .first();

    return user ? this.mapToUserResponse(user) : null;
  }

  async findByContact(contact: string): Promise<UserResponse | null> {
    const user = await this.knex('users')
      .where('contact', contact)
      .where('active', true)
      .first();

    return user ? this.mapToUserResponse(user) : null;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserResponse | null> {
    const updateData: any = { ...updateUserDto };
    
    // Hash password if it's being updated
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    updateData.updatedAt = new Date();

    const [user] = await this.knex('users')
      .where('id', id)
      .update(updateData)
      .returning('*');

    return user ? this.mapToUserResponse(user) : null;
  }

  async remove(id: string): Promise<boolean> {
    const deletedCount = await this.knex('users')
      .where('id', id)
      .update({ active: false });

    return deletedCount > 0;
  }

  async findByDepartment(department: string): Promise<UserResponse[]> {
    const users = await this.knex('users')
      .where('department', department)
      .orderBy('name');

    return users.map(user => this.mapToUserResponse(user));
  }

  async findByProfile(profile: string): Promise<UserResponse[]> {
    const users = await this.knex('users')
      .where('profile', profile)
      .orderBy('name');

    return users.map(user => this.mapToUserResponse(user));
  }

  async findByStatus(status: string): Promise<UserResponse[]> {
    const users = await this.knex('users')
      .where('status', status)
      .orderBy('name');

    return users.map(user => this.mapToUserResponse(user));
  }

  async findByActive(active: boolean): Promise<UserResponse[]> {
    const users = await this.knex('users')
      .where('active', active)
      .orderBy('name');

    return users.map(user => this.mapToUserResponse(user));
  }

  private mapToUserResponse(user: User): UserResponse {
    const { password, ...userResponse } = user;
    return userResponse as UserResponse;
  }
} 