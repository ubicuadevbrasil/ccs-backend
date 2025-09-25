import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { User, UserEntity, UserStatus, UserProfile } from './entities/user.entity';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from './dto/user.dto';
import * as bcrypt from 'bcryptjs';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class UserService {
  constructor(@InjectKnex() private readonly knex: Knex) {}

  /**
   * Create a new user
   */
  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const { password, ...userData } = createUserDto;
    
    // Check if login already exists
    const existingLogin = await this.knex('user')
      .where('login', userData.login)
      .first();
    
    if (existingLogin) {
      throw new ConflictException('Login already exists');
    }

    // Check if email already exists
    const existingEmail = await this.knex('user')
      .where('email', userData.email)
      .first();
    
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    // Check if contact already exists
    const existingContact = await this.knex('user')
      .where('contact', userData.contact)
      .first();
    
    if (existingContact) {
      throw new ConflictException('Contact already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    const [newUser] = await this.knex('user')
      .insert({
        ...userData,
        password: hashedPassword,
        status: userData.status || UserStatus.ACTIVE,
        createdAt: this.knex.fn.now(),
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return new User(newUser);
  }

  /**
   * Find all users with pagination and filtering
   */
  async findAllUsers(query: UserQueryDto): Promise<PaginatedResult<User>> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    let queryBuilder = this.knex('user');

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .whereILike('name', `%${query.search}%`)
          .orWhereILike('email', `%${query.search}%`)
          .orWhereILike('login', `%${query.search}%`);
      });
    }

    // Apply status filter
    if (query.status) {
      queryBuilder = queryBuilder.where('status', query.status);
    }

    // Apply profile filter
    if (query.profile) {
      queryBuilder = queryBuilder.where('profile', query.profile);
    }

    // Get total count
    const totalQuery = queryBuilder.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    // Get paginated results
    const users = await queryBuilder
      .select('*')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const userEntities = users.map(user => new User(user));

    return {
      data: userEntities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find user by ID
   */
  async findUserById(id: string): Promise<User> {
    const user = await this.knex('user')
      .where('id', id)
      .first();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return new User(user);
  }


  /**
   * Find user by login
   */
  async findUserByLogin(login: string): Promise<User | null> {
    const user = await this.knex('user')
      .where('login', login)
      .first();

    return user ? new User(user) : null;
  }

  /**
   * Update user by ID
   */
  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    // Check if user exists
    const existingUser = await this.knex('user')
      .where('id', id)
      .first();

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    const updateData: Partial<UserEntity> = { ...updateUserDto };

    // Handle password update
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Check for unique constraints if updating login, email, or contact
    if (updateUserDto.login && updateUserDto.login !== existingUser.login) {
      const existingLogin = await this.knex('user')
        .where('login', updateUserDto.login)
        .whereNot('id', id)
        .first();
      
      if (existingLogin) {
        throw new ConflictException('Login already exists');
      }
    }

    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const existingEmail = await this.knex('user')
        .where('email', updateUserDto.email)
        .whereNot('id', id)
        .first();
      
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    if (updateUserDto.contact && updateUserDto.contact !== existingUser.contact) {
      const existingContact = await this.knex('user')
        .where('contact', updateUserDto.contact)
        .whereNot('id', id)
        .first();
      
      if (existingContact) {
        throw new ConflictException('Contact already exists');
      }
    }

    // Update user
    const [updatedUser] = await this.knex('user')
      .where('id', id)
      .update({
        ...updateData,
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return new User(updatedUser);
  }

  /**
   * Delete user by ID
   */
  async deleteUser(id: string): Promise<void> {
    const deletedRows = await this.knex('user')
      .where('id', id)
      .del();

    if (deletedRows === 0) {
      throw new NotFoundException('User not found');
    }
  }

}
