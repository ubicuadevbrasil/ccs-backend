import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { Customer, CustomerEntity, CustomerStatus, CustomerType, CustomerPlatform } from './entities/customer.entity';
import { CustomerTag } from './entities/customer-tag.entity';
import { CreateCustomerDto, UpdateCustomerDto, CustomerQueryDto } from './dto/customer.dto';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class CustomerService {
  constructor(@InjectKnex() private readonly knex: Knex) {}

  /**
   * Create a new customer with tags
   */
  async createCustomer(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const { tags, ...customerData } = createCustomerDto;
    
    // Check if platformId already exists for this platform
    const existingCustomer = await this.knex('customer')
      .where('platformId', customerData.platformId)
      .where('platform', customerData.platform || CustomerPlatform.WHATSAPP)
      .first();
    
    if (existingCustomer) {
      throw new ConflictException('Customer with this platformId already exists for this platform');
    }

    // Validate email uniqueness if provided
    if (customerData.email) {
      const existingEmail = await this.knex('customer')
        .where('email', customerData.email)
        .first();
      
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Validate CPF uniqueness if provided
    if (customerData.cpf) {
      const existingCpf = await this.knex('customer')
        .where('cpf', customerData.cpf)
        .first();
      
      if (existingCpf) {
        throw new ConflictException('CPF already exists');
      }
    }

    // Validate CNPJ uniqueness if provided
    if (customerData.cnpj) {
      const existingCnpj = await this.knex('customer')
        .where('cnpj', customerData.cnpj)
        .first();
      
      if (existingCnpj) {
        throw new ConflictException('CNPJ already exists');
      }
    }

    // Start transaction
    const trx = await this.knex.transaction();

    try {
      // Insert customer
      const [newCustomer] = await trx('customer')
        .insert({
          ...customerData,
          priority: customerData.priority || 0,
          isGroup: customerData.isGroup || false,
          type: customerData.type || CustomerType.CONTACT,
          status: customerData.status || CustomerStatus.ACTIVE,
          platform: customerData.platform || CustomerPlatform.WHATSAPP,
          createdAt: this.knex.fn.now(),
          updatedAt: this.knex.fn.now(),
        })
        .returning('*');

      // Insert tags if provided
      if (tags && tags.length > 0) {
        const tagInserts = tags.map(tag => ({
          customerId: newCustomer.id,
          tag: tag.trim(),
          createdAt: this.knex.fn.now(),
          updatedAt: this.knex.fn.now(),
        }));

        await trx('customerTags').insert(tagInserts);
      }

      await trx.commit();

      // Fetch customer with tags
      const customerWithTags = await this.findCustomerByIdWithTags(newCustomer.id);
      return customerWithTags;

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Find all customers with pagination and filtering
   */
  async findAllCustomers(query: CustomerQueryDto): Promise<PaginatedResult<Customer>> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    let queryBuilder = this.knex('customer');

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .whereILike('name', `%${query.search}%`)
          .orWhereILike('email', `%${query.search}%`)
          .orWhereILike('contact', `%${query.search}%`)
          .orWhereILike('platformId', `%${query.search}%`)
          .orWhereILike('pushName', `%${query.search}%`);
      });
    }

    // Apply status filter
    if (query.status) {
      queryBuilder = queryBuilder.where('status', query.status);
    }

    // Apply type filter
    if (query.type) {
      queryBuilder = queryBuilder.where('type', query.type);
    }

    // Apply platform filter
    if (query.platform) {
      queryBuilder = queryBuilder.where('platform', query.platform);
    }

    // Apply priority filter
    if (query.priority !== undefined) {
      queryBuilder = queryBuilder.where('priority', query.priority);
    }

    // Apply isGroup filter
    if (query.isGroup !== undefined) {
      queryBuilder = queryBuilder.where('isGroup', query.isGroup);
    }

    // Apply tags filter
    if (query.tags) {
      const tagList = query.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
      if (tagList.length > 0) {
        queryBuilder = queryBuilder.whereExists((builder) => {
          builder
            .select('*')
            .from('customerTags')
            .whereRaw('customerTags.customerId = customer.id')
            .whereIn('customerTags.tag', tagList);
        });
      }
    }

    // Get total count
    const totalQuery = queryBuilder.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    // Get paginated results
    const customers = await queryBuilder
      .select('*')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    // Fetch tags for each customer
    const customersWithTags = await Promise.all(
      customers.map(async (customer) => {
        const tags = await this.knex('customerTags')
          .where('customerId', customer.id)
          .select('tag');
        
        return {
          ...customer,
          tags: tags.map(t => t.tag),
        };
      })
    );

    const customerEntities = customersWithTags.map(customer => new Customer(customer));

    return {
      data: customerEntities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find customer by ID with tags
   */
  async findCustomerById(id: string): Promise<Customer> {
    const customer = await this.knex('customer')
      .where('id', id)
      .first();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return new Customer(customer);
  }

  /**
   * Find customer by ID with tags
   */
  async findCustomerByIdWithTags(id: string): Promise<Customer> {
    const customer = await this.knex('customer')
      .where('id', id)
      .first();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const tags = await this.knex('customerTags')
      .where('customerId', id)
      .select('tag');

    return new Customer({
      ...customer,
      tags: tags.map(t => t.tag),
    });
  }

  /**
   * Find customer by platformId and platform
   */
  async findCustomerByPlatformId(platformId: string, platform: CustomerPlatform): Promise<Customer | null> {
    const customer = await this.knex('customer')
      .where('platformId', platformId)
      .where('platform', platform)
      .first();

    return customer ? new Customer(customer) : null;
  }

  /**
   * Update customer by ID with tags
   */
  async updateCustomer(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    // Check if customer exists
    const existingCustomer = await this.knex('customer')
      .where('id', id)
      .first();

    if (!existingCustomer) {
      throw new NotFoundException('Customer not found');
    }

    const { tags, ...customerData } = updateCustomerDto;

    // Check for unique constraints if updating platformId
    if (customerData.platformId && customerData.platformId !== existingCustomer.platformId) {
      const existingPlatformId = await this.knex('customer')
        .where('platformId', customerData.platformId)
        .where('platform', customerData.platform || existingCustomer.platform)
        .whereNot('id', id)
        .first();
      
      if (existingPlatformId) {
        throw new ConflictException('Customer with this platformId already exists for this platform');
      }
    }

    // Check for unique constraints if updating email
    if (customerData.email && customerData.email !== existingCustomer.email) {
      const existingEmail = await this.knex('customer')
        .where('email', customerData.email)
        .whereNot('id', id)
        .first();
      
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    // Check for unique constraints if updating CPF
    if (customerData.cpf && customerData.cpf !== existingCustomer.cpf) {
      const existingCpf = await this.knex('customer')
        .where('cpf', customerData.cpf)
        .whereNot('id', id)
        .first();
      
      if (existingCpf) {
        throw new ConflictException('CPF already exists');
      }
    }

    // Check for unique constraints if updating CNPJ
    if (customerData.cnpj && customerData.cnpj !== existingCustomer.cnpj) {
      const existingCnpj = await this.knex('customer')
        .where('cnpj', customerData.cnpj)
        .whereNot('id', id)
        .first();
      
      if (existingCnpj) {
        throw new ConflictException('CNPJ already exists');
      }
    }

    // Start transaction
    const trx = await this.knex.transaction();

    try {
      // Update customer
      const [updatedCustomer] = await trx('customer')
        .where('id', id)
        .update({
          ...customerData,
          updatedAt: this.knex.fn.now(),
        })
        .returning('*');

      // Handle tags update if provided
      if (tags !== undefined) {
        // Get current tags
        const currentTags = await trx('customerTags')
          .where('customerId', id)
          .select('tag');
        
        const currentTagList = currentTags.map(t => t.tag);
        const newTagList = tags.map(tag => tag.trim()).filter(tag => tag);

        // Find tags to add and remove
        const tagsToAdd = newTagList.filter(tag => !currentTagList.includes(tag));
        const tagsToRemove = currentTagList.filter(tag => !newTagList.includes(tag));

        // Remove tags that are no longer needed
        if (tagsToRemove.length > 0) {
          await trx('customerTags')
            .where('customerId', id)
            .whereIn('tag', tagsToRemove)
            .del();
        }

        // Add new tags
        if (tagsToAdd.length > 0) {
          const tagInserts = tagsToAdd.map(tag => ({
            customerId: id,
            tag: tag,
            createdAt: this.knex.fn.now(),
            updatedAt: this.knex.fn.now(),
          }));

          await trx('customerTags').insert(tagInserts);
        }
      }

      await trx.commit();

      // Fetch customer with tags
      const customerWithTags = await this.findCustomerByIdWithTags(id);
      return customerWithTags;

    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  /**
   * Delete customer by ID
   */
  async deleteCustomer(id: string): Promise<void> {
    const deletedRows = await this.knex('customer')
      .where('id', id)
      .del();

    if (deletedRows === 0) {
      throw new NotFoundException('Customer not found');
    }
  }

  /**
   * Add tag to customer
   */
  async addTagToCustomer(customerId: string, tag: string): Promise<CustomerTag> {
    // Check if customer exists
    const customer = await this.knex('customer')
      .where('id', customerId)
      .first();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Check if tag already exists
    const existingTag = await this.knex('customerTags')
      .where('customerId', customerId)
      .where('tag', tag.trim())
      .first();

    if (existingTag) {
      throw new ConflictException('Tag already exists for this customer');
    }

    const [newTag] = await this.knex('customerTags')
      .insert({
        customerId,
        tag: tag.trim(),
        createdAt: this.knex.fn.now(),
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return new CustomerTag(newTag);
  }

  /**
   * Remove tag from customer
   */
  async removeTagFromCustomer(customerId: string, tag: string): Promise<void> {
    const deletedRows = await this.knex('customerTags')
      .where('customerId', customerId)
      .where('tag', tag.trim())
      .del();

    if (deletedRows === 0) {
      throw new NotFoundException('Tag not found for this customer');
    }
  }

  /**
   * Get customer tags
   */
  async getCustomerTags(customerId: string): Promise<CustomerTag[]> {
    const tags = await this.knex('customerTags')
      .where('customerId', customerId)
      .select('*');

    return tags.map(tag => new CustomerTag(tag));
  }

  /**
   * Get customer tags as simple string array
   */
  async getCustomerTagsAsArray(customerId: string): Promise<string[]> {
    const tags = await this.knex('customerTags')
      .where('customerId', customerId)
      .select('tag');

    return tags.map(t => t.tag);
  }

  /**
   * Add multiple tags to customer
   */
  async addTagsToCustomer(customerId: string, tags: string[]): Promise<void> {
    // Check if customer exists
    const customer = await this.knex('customer')
      .where('id', customerId)
      .first();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    // Filter out existing tags
    const existingTags = await this.knex('customerTags')
      .where('customerId', customerId)
      .whereIn('tag', tags)
      .select('tag');

    const existingTagList = existingTags.map(t => t.tag);
    const newTags = tags.filter(tag => !existingTagList.includes(tag.trim()));

    if (newTags.length > 0) {
      const tagInserts = newTags.map(tag => ({
        customerId,
        tag: tag.trim(),
        createdAt: this.knex.fn.now(),
        updatedAt: this.knex.fn.now(),
      }));

      await this.knex('customerTags').insert(tagInserts);
    }
  }

  /**
   * Remove multiple tags from customer
   */
  async removeTagsFromCustomer(customerId: string, tags: string[]): Promise<void> {
    const deletedRows = await this.knex('customerTags')
      .where('customerId', customerId)
      .whereIn('tag', tags.map(tag => tag.trim()))
      .del();

    if (deletedRows === 0) {
      throw new NotFoundException('No tags found for this customer');
    }
  }
}
