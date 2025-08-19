import { Injectable, Logger } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import type { Knex } from 'nestjs-knex';
import { CustomerService } from '../customer/customer.service';
import { EvolutionService } from '../evolution/evolution.service';
import { MailingContact } from './interfaces/mailing.interface';
import { ConfigService } from '@nestjs/config';
import * as XLSX from 'xlsx';
import { randomUUID } from 'crypto';
import axios from 'axios';

@Injectable()
export class MailingQueueService {
  private readonly logger = new Logger(MailingQueueService.name);

  // Column mapping constants for flexible XLSX parsing
  private readonly COLUMN_MAPPINGS = {
    phone: ['phone', 'Phone', 'PHONE', 'telefone', 'Telefone', 'TELEFONE'],
    name: ['nome', 'Nome', 'NOME', 'name', 'Name', 'NAME'],
    cpf: ['cpf', 'CPF'],
    cnpj: ['cnpj', 'CNPJ'],
    email: ['email', 'Email', 'EMAIL'],
    profilePicUrl: ['profilePicUrl', 'ProfilePicUrl', 'PROFILEPICURL', 'profile_pic_url', 'profilePic'],
  } as const;

  // HTTP request configuration
  private readonly HTTP_CONFIG = {
    timeout: 30000, // 30 seconds
    responseType: 'arraybuffer' as const,
  } as const;

  constructor(
    @InjectKnex() private readonly knex: Knex,
    private readonly customerService: CustomerService,
    private readonly evolutionService: EvolutionService,
    private readonly configService: ConfigService,
  ) {}

  async processMailingFile(mailingId: string, fileUrl: string, message: string): Promise<void> {
    try {
      this.logger.log(`Processing mailing file for mailing ID: ${mailingId}`);
      
      // Download and parse the XLSX file
      const contacts = await this.parseXlsxFile(fileUrl);
      
      this.logger.log(`Found ${contacts.length} contacts in the file`);
      
      // Process each contact
      for (const contact of contacts) {
        try {
          await this.processContact(contact, message, mailingId);
        } catch (error) {
          this.logger.error(`Error processing contact ${contact.phone}: ${error.message}`);
          // Continue with next contact
        }
      }
      
      this.logger.log(`Completed processing mailing file for mailing ID: ${mailingId}`);
    } catch (error) {
      this.logger.error(`Error processing mailing file: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async parseXlsxFile(fileUrl: string): Promise<MailingContact[]> {
    try {
      this.logger.log(`Fetching XLSX file from URL: ${fileUrl}`);
      const response = await axios.get(fileUrl, this.HTTP_CONFIG);
      
      const workbook = XLSX.read(response.data, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      const contacts: MailingContact[] = [];
      
      for (const row of data) {
        const rowData = row as Record<string, any>;
        const contact = this.extractContactFromRow(rowData);
        
        if (contact.phone && this.isValidPhoneNumber(contact.phone)) {
          contacts.push(contact);
        }
      }
      
      this.logger.log(`Parsed ${contacts.length} valid contacts from XLSX file`);
      return contacts;
    } catch (error) {
      this.logger.error(`Error parsing XLSX file from URL: ${error.message}`);
      throw new Error(`Failed to parse XLSX file from URL: ${error.message}`);
    }
  }

  private extractContactFromRow(rowData: Record<string, any>): MailingContact {
    const phoneValue = this.extractColumnValue(rowData, 'phone');
    return {
      phone: phoneValue ? this.normalizePhoneNumber(phoneValue) : '',
      name: this.extractColumnValue(rowData, 'name'),
      cpf: this.extractColumnValue(rowData, 'cpf'),
      cnpj: this.extractColumnValue(rowData, 'cnpj'),
      email: this.extractColumnValue(rowData, 'email'),
      profilePicUrl: this.extractColumnValue(rowData, 'profilePicUrl'),
    };
  }

  private extractColumnValue(rowData: Record<string, any>, columnKey: keyof typeof this.COLUMN_MAPPINGS): string | undefined {
    const possibleNames = this.COLUMN_MAPPINGS[columnKey];
    for (const name of possibleNames) {
      if (rowData[name]) {
        return rowData[name];
      }
    }
    return undefined;
  }

  private normalizePhoneNumber(phone: string): string {
    if (!phone) return '';
    
    // Remove all non-digit characters
    const cleaned = phone.toString().replace(/\D/g, '');
    
    // Ensure it starts with 55 (Brazil country code) if it's a valid length
    if (cleaned.length === 11 && !cleaned.startsWith('55')) {
      return `55${cleaned}`;
    } else if (cleaned.length === 13 && cleaned.startsWith('55')) {
      return cleaned;
    } else if (cleaned.length === 10) {
      return `55${cleaned}`;
    }
    
    return cleaned;
  }

  private isValidPhoneNumber(phone: string): boolean {
    // Brazilian phone number validation (10 or 11 digits, optionally with 55 prefix)
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10 && cleaned.length <= 13;
  }

  private async processContact(contact: MailingContact, message: string, mailingId: string): Promise<void> {
    try {
      // 1. Search for customer info in WhatsApp
      const customerInfo = await this.searchCustomerInWhatsapp(contact.phone);
      
      // 2. Insert/update customer table records
      const customer = await this.upsertCustomer(contact, customerInfo);
      
      // 3. Create a queue for this contact
      // await this.createQueueForContact(customer, mailingId);
      
      // 4. Send message to the contact
      await this.sendMessageToContact(contact.phone, message);
      
      this.logger.log(`Successfully processed contact: ${contact.phone}`);
    } catch (error) {
      this.logger.error(`Error processing contact ${contact.phone}: ${error.message}`);
      throw error;
    }
  }

  private async searchCustomerInWhatsapp(phone: string): Promise<any> {
    try {
      // Use Evolution API to search for customer info
      // This is a placeholder - implement based on your Evolution API
      // For now, return null as the method doesn't exist yet
      // const customerInfo = await this.evolutionService.getContactInfo(phone);
      return null;
    } catch (error) {
      this.logger.warn(`Could not fetch WhatsApp info for ${phone}: ${error.message}`);
      return null;
    }
  }

  private async upsertCustomer(contact: MailingContact, whatsappInfo: any): Promise<any> {
    try {
      // Check if customer already exists
      let customer = await this.knex('customers')
        .where({ remoteJid: contact.phone })
        .first();

      if (customer) {
        // Update existing customer with new info
        const [updatedCustomer] = await this.knex('customers')
          .where({ id: customer.id })
          .update({
            email: contact.email || customer.email,
            cpf: contact.cpf || customer.cpf,
            cnpj: contact.cnpj || customer.cnpj,
            profilePicUrl: whatsappInfo?.profilePicUrl || customer.profilePicUrl,
            pushName: contact?.name || customer.pushName,
            updatedAt: new Date(),
          })
          .returning('*');
        
        return updatedCustomer;
      } else {
        // Create new customer
        const customerData = {
          remoteJid: contact.phone,
          pushName: whatsappInfo?.pushName || 'Unknown',
          email: contact.email,
          cpf: contact.cpf,
          cnpj: contact.cnpj,
          isGroup: false,
          isSaved: false,
          type: 'contact' as const,
          status: 'active' as const,
        };

        const [newCustomer] = await this.knex('customers')
          .insert(customerData)
          .returning('*');
        
        return newCustomer;
      }
    } catch (error) {
      this.logger.error(`Error upserting customer ${contact.phone}: ${error.message}`);
      throw error;
    }
  }

  private async createQueueForContact(customer: any, mailingId: string): Promise<void> {
    try {
      const sessionId = randomUUID();
      
      await this.knex('queues').insert({
        sessionId,
        customerId: customer.id,
        status: 'typebot',
        department: 'Personal', // Default department
        direction: 'outbound',
        metadata: {
          mailingId,
          source: 'mailing_campaign',
        },
        createdAt: new Date(),
      });
      
      this.logger.log(`Created queue for customer ${customer.remoteJid} with session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error creating queue for customer ${customer.remoteJid}: ${error.message}`);
      throw error;
    }
  }

  private async sendMessageToContact(phone: string, message: string): Promise<void> {
    try {
      // Use Evolution API to send message
      // This is a placeholder - implement based on your Evolution API
      // For now, just log the message as the method signature doesn't match
      const instance = this.configService.get('EVOLUTION_API_INSTANCE');
      this.logger.log(`Would send message to ${phone}: ${message}`);
      await this.evolutionService.sendText(instance, {
        number: phone,
        text: message,
      });
      
      this.logger.log(`Message logged for ${phone}`);
    } catch (error) {
      this.logger.error(`Error sending message to ${phone}: ${error.message}`);
      throw error;
    }
  }
}
