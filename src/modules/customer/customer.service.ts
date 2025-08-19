import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Knex } from 'knex';
import { InjectConnection } from 'nestjs-knex';
import { Customer, CreateCustomerData, UpdateCustomerData } from './interfaces/customer.interface';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { EvolutionService } from '../evolution/evolution.service';

@Injectable()
export class CustomerService {
  constructor(
    @InjectConnection() private readonly knex: Knex,
    private readonly evolutionService: EvolutionService
  ) {}

  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const [customer] = await this.knex('customers')
      .insert({
        ...createCustomerDto,
        priority: createCustomerDto.priority || 0,
        isGroup: createCustomerDto.isGroup || false,
        isSaved: createCustomerDto.isSaved || false,
        type: createCustomerDto.type || 'contact',
        status: createCustomerDto.status || 'active',
      })
      .returning('*');

    return customer;
  }

  async createFromWhatsAppContact(contactData: any): Promise<Customer> {
    // Skip groups and group members as requested
    if (contactData.isGroup || contactData.type === 'group' || contactData.type === 'group_member') {
      throw new Error('Groups and group members are not allowed in customer creation');
    }

    // Extract all available data from WhatsApp contact
    const customerData = this.extractCustomerDataFromWhatsApp(contactData);

    return this.create(customerData as CreateCustomerDto);
  }

  /**
   * Create or update customer with all available WhatsApp data
   * This is the centralized method for customer creation from any WhatsApp source
   */
  async createOrUpdateFromWhatsAppData(contactData: any): Promise<Customer> {
    // Skip groups and group members as requested
    if (contactData.isGroup || contactData.type === 'group' || contactData.type === 'group_member') {
      throw new Error('Groups and group members are not allowed in customer creation');
    }

    // Extract all available data
    const customerData = this.extractCustomerDataFromWhatsApp(contactData);
    
    // Try to fetch profile picture if we have instance and remoteJid
    if (contactData.instance && customerData.remoteJid) {
      try {
        const profilePictureResponse = await this.evolutionService.fetchProfilePicture(
          contactData.instance,
          { number: customerData.remoteJid }
        );

        if (profilePictureResponse?.profilePictureUrl) {
          customerData.profilePicUrl = profilePictureResponse.profilePictureUrl;
        }
      } catch (error) {
        // Log error but don't fail customer creation
        console.error(`Failed to fetch profile picture for ${customerData.remoteJid}:`, error.message);
      }
    }
    
    // Check if customer already exists
    const existingCustomer = await this.findByRemoteJid(customerData.remoteJid);
    
    if (existingCustomer) {
      // Update existing customer with new data (only if new data is provided)
      const updateData: UpdateCustomerData = {};
      
      if (customerData.pushName && customerData.pushName !== existingCustomer.pushName) {
        updateData.pushName = customerData.pushName;
      }
      
      if (customerData.profilePicUrl && customerData.profilePicUrl !== existingCustomer.profilePicUrl) {
        updateData.profilePicUrl = customerData.profilePicUrl;
      }
      
      if (customerData.email && customerData.email !== existingCustomer.email) {
        updateData.email = customerData.email;
      }
      
      if (customerData.cpf && customerData.cpf !== existingCustomer.cpf) {
        updateData.cpf = customerData.cpf;
      }
      
      if (customerData.cnpj && customerData.cnpj !== existingCustomer.cnpj) {
        updateData.cnpj = customerData.cnpj;
      }
      
      if (customerData.priority !== existingCustomer.priority) {
        updateData.priority = customerData.priority;
      }
      
      // Only update if there are changes
      if (Object.keys(updateData).length > 0) {
        return this.update(existingCustomer.id, updateData);
      }
      
      return existingCustomer;
    } else {
      // Create new customer
      return this.create(customerData as CreateCustomerDto);
    }
  }

  /**
   * Centralized function to extract all available customer data from WhatsApp contact
   * Handles different data sources: messages, webhooks, contact lists, etc.
   */
  private extractCustomerDataFromWhatsApp(contactData: any): CreateCustomerData {
    // Standardize remoteJid (remove @s.whatsapp.net if present)
    const remoteJid = contactData.remoteJid?.replace('@s.whatsapp.net', '') || 
                      contactData.key?.remoteJid?.replace('@s.whatsapp.net', '') || '';

    // Extract pushName from various possible sources
    const pushName = contactData.pushName || 
                    contactData.key?.pushName || 
                    contactData.name || 
                    null;

    // Extract profilePicUrl from various possible sources
    const profilePicUrl = contactData.profilePicUrl || 
                         contactData.profilePictureUrl || 
                         contactData.pictureUrl || 
                         null;

    // Extract all available fields with proper fallbacks
    const customerData: CreateCustomerData = {
      remoteJid,
      pushName,
      profilePicUrl,
      email: contactData.email || null,
      cpf: contactData.cpf || null,
      cnpj: contactData.cnpj || null,
      priority: contactData.priority || 0,
      isGroup: false, // Always false for customers
      isSaved: contactData.isSaved || contactData.saved || false,
      type: 'contact', // Always contact for customers
      status: 'active', // Default to active
    };

    return customerData;
  }

  async findAll(query?: {
    type?: string;
    status?: string;
    isGroup?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Customer[]> {
    let queryBuilder = this.knex('customers').select('*');

    // Always filter out groups by default
    queryBuilder = queryBuilder.where('isGroup', false);

    if (query?.type) {
      queryBuilder = queryBuilder.where('type', query.type);
    }

    if (query?.status) {
      queryBuilder = queryBuilder.where('status', query.status);
    }

    if (query?.isGroup !== undefined) {
      queryBuilder = queryBuilder.where('isGroup', query.isGroup);
    }

    if (query?.limit) {
      queryBuilder = queryBuilder.limit(query.limit);
    }

    if (query?.offset) {
      queryBuilder = queryBuilder.offset(query.offset);
    }

    return queryBuilder.orderBy('createdAt', 'desc');
  }

  async findOne(id: string): Promise<Customer> {
    const customer = await this.knex('customers')
      .where('id', id)
      .first();

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async findByRemoteJid(remoteJid: string): Promise<Customer | null> {
    return this.knex('customers')
      .where('remoteJid', remoteJid)
      .first();
  }

  async searchCustomers(searchTerm: string, instanceId?: string): Promise<Customer[]> {
    let query = this.knex('customers')
      .where(function() {
        this.where('pushName', 'ilike', `%${searchTerm}%`)
          .orWhere('remoteJid', 'ilike', `%${searchTerm}%`)
          .orWhere('email', 'ilike', `%${searchTerm}%`)
          .orWhere('cpf', 'ilike', `%${searchTerm}%`)
          .orWhere('cnpj', 'ilike', `%${searchTerm}%`);
      });

    return query.orderBy('priority', 'desc').orderBy('createdAt', 'desc');
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto): Promise<Customer> {
    const [customer] = await this.knex('customers')
      .where('id', id)
      .update({
        ...updateCustomerDto,
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async updateByRemoteJid(remoteJid: string, updateData: UpdateCustomerData): Promise<Customer> {
    const [customer] = await this.knex('customers')
      .where('remoteJid', remoteJid)
      .update({
        ...updateData,
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    if (!customer) {
      throw new NotFoundException(`Customer with remoteJid ${remoteJid} not found`);
    }

    return customer;
  }

  async remove(id: string): Promise<void> {
    const deletedCount = await this.knex('customers')
      .where('id', id)
      .del();

    if (deletedCount === 0) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
  }

  async bulkUpsert(customersData: CreateCustomerData[]): Promise<Customer[]> {
    const customers: Customer[] = [];

    for (const data of customersData) {
      try {
        // Try to find existing customer by remoteJid
        const existing = await this.findByRemoteJid(data.remoteJid);
        
        if (existing) {
          // Update existing customer
          const updated = await this.update(existing.id, data);
          customers.push(updated);
        } else {
          // Create new customer
          const created = await this.create(data as CreateCustomerDto);
          customers.push(created);
        }
      } catch (error) {
        console.error(`Error upserting customer ${data.remoteJid}:`, error);
        // Continue with other customers even if one fails
      }
    }

    return customers;
  }

  async getCustomersByPriority(remoteJid: string): Promise<Customer[]> {
    let query = this.knex('customers')
      .where('priority', '>', 0)
      .orderBy('priority', 'desc');

    if (remoteJid) {
      query = query.where('remoteJid', remoteJid);
    }

    return query;
  }

  async getActiveCustomers(remoteJid?: string): Promise<Customer[]> {
    let query = this.knex('customers')
      .where('status', 'active')
      .where('isGroup', false)
      .orderBy('priority', 'desc')
      .orderBy('createdAt', 'desc');

    if (remoteJid) {
      query = query.where('remoteJid', remoteJid);
    }

    return query;
  }

  async countByRemoteJid(remoteJid: string): Promise<number> {
    const result = await this.knex('customers')
      .where('remoteJid', remoteJid)
      .count('* as count')
      .first();

    if (!result) {
      return 0;
    }

    return parseInt(result.count as string);
  }
} 