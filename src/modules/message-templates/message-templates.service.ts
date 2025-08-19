import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import type { Knex } from 'nestjs-knex';
import { InjectKnex } from 'nestjs-knex';
import type {
  MessageTemplate,
  MessageTemplateFilters
} from './interfaces/message-template.interface';
import type { CreateMessageTemplateDto } from './dto/create-message-template.dto';
import type { UpdateMessageTemplateDto } from './dto/update-message-template.dto';

@Injectable()
export class MessageTemplatesService {
  private readonly logger = new Logger(MessageTemplatesService.name);

  constructor(@InjectKnex() private readonly knex: Knex) {}

  async createMessageTemplate(createMessageTemplateDto: CreateMessageTemplateDto): Promise<MessageTemplate> {
    this.logger.log(`Creating message template of type: ${createMessageTemplateDto.type}`);

    const [template] = await this.knex('messageTemplates')
      .insert({
        message: createMessageTemplateDto.message,
        type: createMessageTemplateDto.type,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning('*');

    return template;
  }

  async findAllMessageTemplates(filters: MessageTemplateFilters = {}): Promise<{
    templates: MessageTemplate[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const { type, search, limit = 20, offset = 0 } = filters;

    let query = this.knex('messageTemplates').select('*');
    let countQuery = this.knex('messageTemplates').count('* as total');

    // Apply filters
    if (type) {
      query = query.where('type', type);
      countQuery = countQuery.where('type', type);
    }

    if (search) {
      const searchCondition = this.knex.raw('LOWER(message) LIKE ?', [`%${search.toLowerCase()}%`]);
      query = query.where(searchCondition);
      countQuery = countQuery.where(searchCondition);
    }

    // Get total count
    const [{ total }] = await countQuery;
    const totalCount = typeof total === 'string' ? parseInt(total, 10) : total;

    // Apply pagination and get results
    const templates = await query
      .orderBy('createdAt', 'asc')
      .limit(limit)
      .offset(offset);

    return {
      templates,
      total: totalCount,
      limit,
      offset
    };
  }

  async findMessageTemplateById(id: string): Promise<MessageTemplate> {
    const template = await this.knex('messageTemplates')
      .where('id', id)
      .first();

    if (!template) {
      throw new NotFoundException(`Message template with ID ${id} not found`);
    }

    return template;
  }

  async findMessageTemplatesByType(type: string): Promise<MessageTemplate[]> {
    return this.knex('messageTemplates')
      .where('type', type)
      .orderBy('createdAt', 'desc');
  }

  async updateMessageTemplate(id: string, updateMessageTemplateDto: UpdateMessageTemplateDto): Promise<MessageTemplate> {
    this.logger.log(`Updating message template with ID: ${id}`);

    // Check if template exists
    await this.findMessageTemplateById(id);

    const updateData: any = {
      updatedAt: new Date()
    };

    if (updateMessageTemplateDto.message !== undefined) {
      updateData.message = updateMessageTemplateDto.message;
    }

    if (updateMessageTemplateDto.type !== undefined) {
      updateData.type = updateMessageTemplateDto.type;
    }

    const [updatedTemplate] = await this.knex('messageTemplates')
      .where('id', id)
      .update(updateData)
      .returning('*');

    return updatedTemplate;
  }

  async deleteMessageTemplate(id: string): Promise<void> {
    this.logger.log(`Deleting message template with ID: ${id}`);

    // Check if template exists
    await this.findMessageTemplateById(id);

    const deletedCount = await this.knex('messageTemplates')
      .where('id', id)
      .del();

    if (deletedCount === 0) {
      throw new BadRequestException(`Failed to delete message template with ID ${id}`);
    }
  }

  async getRandomTemplateByType(type: string): Promise<MessageTemplate | null> {
    const templates = await this.knex('messageTemplates')
      .where('type', type)
      .orderByRaw('RANDOM()')
      .limit(1);

    return templates.length > 0 ? templates[0] : null;
  }

  async getTemplateStats(): Promise<{
    total: number;
    byType: Record<string, number>;
  }> {
    const total = await this.knex('messageTemplates').count('* as count').first();
    const byType = await this.knex('messageTemplates')
      .select('type')
      .count('* as count')
      .groupBy('type');

    const typeStats: Record<string, number> = {};
    byType.forEach(({ type, count }) => {
      typeStats[type] = typeof count === 'string' ? parseInt(count, 10) : count;
    });

    return {
      total: typeof total?.count === 'string' ? parseInt(total.count, 10) : total?.count || 0,
      byType: typeStats
    };
  }
}
