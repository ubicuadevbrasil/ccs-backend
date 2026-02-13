import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { randomUUID } from 'crypto';
import {
  Template,
  TemplateEntity,
  TemplateStatus,
  TemplateCategory,
  TemplateButton,
} from './entities/template.entity';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  TemplateQueryDto,
} from './dto/template.dto';
import { OtimaService } from '../whatsapp/otima/otima.service';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    @InjectKnex() private readonly knex: Knex,
    private readonly otimaService: OtimaService,
  ) {}

  /**
   * Create a new template
   */
  async createTemplate(createTemplateDto: CreateTemplateDto): Promise<Template> {
    // Check if templateCode already exists
    const existingTemplate = await this.knex('templates')
      .where('templateCode', createTemplateDto.template_code)
      .first();

    if (existingTemplate) {
      throw new ConflictException(
        'Template with this template_code already exists',
      );
    }

    // Insert template
    const [newTemplate] = await this.knex('templates')
      .insert({
        id: randomUUID(),
        templateCode: createTemplateDto.template_code,
        accounts: JSON.stringify(createTemplateDto.accounts),
        buttonSample: JSON.stringify(
          createTemplateDto.button_sample || [],
        ),
        category: createTemplateDto.category,
        content: createTemplateDto.content,
        status: createTemplateDto.status,
        statusDescription: createTemplateDto.status_description,
        variableSample: JSON.stringify(
          createTemplateDto.variable_sample || {},
        ),
        createdAt: this.knex.fn.now(),
        updatedAt: this.knex.fn.now(),
      })
      .returning('*');

    return this.mapDbRowToTemplate(newTemplate);
  }

  /**
   * Find all templates with pagination and filtering
   */
  async findAllTemplates(
    query: TemplateQueryDto,
  ): Promise<PaginatedResult<Template>> {
    const page = parseInt(query.page || '1');
    const limit = parseInt(query.limit || '10');
    const offset = (page - 1) * limit;

    let queryBuilder = this.knex('templates');

    // Apply search filter
    if (query.search) {
      queryBuilder = queryBuilder.where((builder) => {
        builder
          .whereILike('templateCode', `%${query.search}%`)
          .orWhereILike('content', `%${query.search}%`);
      });
    }

    // Apply status filter
    if (query.status) {
      queryBuilder = queryBuilder.where('status', query.status);
    }

    // Apply category filter
    if (query.category) {
      queryBuilder = queryBuilder.where('category', query.category);
    }

    // Apply template_code filter
    if (query.template_code) {
      queryBuilder = queryBuilder.where('templateCode', query.template_code);
    }

    // Get total count
    const totalQuery = queryBuilder.clone();
    const [{ count }] = await totalQuery.count('* as count');
    const total = parseInt(count as string);

    // Get paginated results
    const templates = await queryBuilder
      .select('*')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .offset(offset);

    const templateEntities = templates.map((template) =>
      this.mapDbRowToTemplate(template),
    );

    return {
      data: templateEntities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find template by ID
   */
  async findTemplateById(id: string): Promise<Template> {
    const template = await this.knex('templates').where('id', id).first();

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    return this.mapDbRowToTemplate(template);
  }

  /**
   * Find template by templateCode
   */
  async findTemplateByCode(
    templateCode: string,
  ): Promise<Template | null> {
    const template = await this.knex('templates')
      .where('templateCode', templateCode)
      .first();

    return template ? this.mapDbRowToTemplate(template) : null;
  }

  /**
   * Update template by ID
   */
  async updateTemplate(
    id: string,
    updateTemplateDto: UpdateTemplateDto,
  ): Promise<Template> {
    // Check if template exists
    const existingTemplate = await this.knex('templates')
      .where('id', id)
      .first();

    if (!existingTemplate) {
      throw new NotFoundException('Template not found');
    }

    // Build update object
    const updateData: any = {
      updatedAt: this.knex.fn.now(),
    };

    if (updateTemplateDto.accounts !== undefined) {
      updateData.accounts = JSON.stringify(updateTemplateDto.accounts);
    }

    if (updateTemplateDto.button_sample !== undefined) {
      updateData.buttonSample = JSON.stringify(updateTemplateDto.button_sample);
    }

    if (updateTemplateDto.category !== undefined) {
      updateData.category = updateTemplateDto.category;
    }

    if (updateTemplateDto.content !== undefined) {
      updateData.content = updateTemplateDto.content;
    }

    if (updateTemplateDto.status !== undefined) {
      updateData.status = updateTemplateDto.status;
    }

    if (updateTemplateDto.status_description !== undefined) {
      updateData.statusDescription = updateTemplateDto.status_description;
    }

    if (updateTemplateDto.variable_sample !== undefined) {
      updateData.variableSample = JSON.stringify(
        updateTemplateDto.variable_sample,
      );
    }

    // Update template
    const [updatedTemplate] = await this.knex('templates')
      .where('id', id)
      .update(updateData)
      .returning('*');

    return this.mapDbRowToTemplate(updatedTemplate);
  }

  /**
   * Delete template by ID
   */
  async deleteTemplate(id: string): Promise<void> {
    const deletedRows = await this.knex('templates').where('id', id).del();

    if (deletedRows === 0) {
      throw new NotFoundException('Template not found');
    }
  }

  /**
   * Sync templates from Otima API
   */
  async syncTemplatesFromOtima(
    customerCode?: string,
  ): Promise<{ created: number; updated: number }> {
    try {
      this.logger.log(
        `Starting template sync from Otima${customerCode ? ` for customer ${customerCode}` : ''}`,
      );

      // Fetch templates from Otima
      const otimaTemplates = await this.otimaService.listHsmTemplates(
        customerCode,
      );

      if (!Array.isArray(otimaTemplates)) {
        throw new BadRequestException(
          'Invalid response format from Otima API',
        );
      }

      let created = 0;
      let updated = 0;

      // Use transaction for data consistency
      const trx = await this.knex.transaction();

      try {
        for (const otimaTemplate of otimaTemplates) {
          // Map Otima template to our structure
          const templateData = this.mapOtimaTemplateToDto(otimaTemplate);

          // Check if template exists by templateCode
          const existingTemplate = await trx('templates')
            .where('templateCode', templateData.template_code)
            .first();

          if (existingTemplate) {
            // Update existing template
            await trx('templates')
              .where('templateCode', templateData.template_code)
              .update({
                accounts: JSON.stringify(templateData.accounts),
                buttonSample: JSON.stringify(templateData.button_sample || []),
                category: templateData.category,
                content: templateData.content,
                status: templateData.status,
                statusDescription: templateData.status_description,
                variableSample: JSON.stringify(
                  templateData.variable_sample || {},
                ),
                updatedAt: this.knex.fn.now(),
              });
            updated++;
          } else {
            // Create new template
            await trx('templates').insert({
              id: randomUUID(),
              templateCode: templateData.template_code,
              accounts: JSON.stringify(templateData.accounts),
              buttonSample: JSON.stringify(
                templateData.button_sample || [],
              ),
              category: templateData.category,
              content: templateData.content,
              status: templateData.status,
              statusDescription: templateData.status_description,
              variableSample: JSON.stringify(
                templateData.variable_sample || {},
              ),
              createdAt: this.knex.fn.now(),
              updatedAt: this.knex.fn.now(),
            });
            created++;
          }
        }

        await trx.commit();

        this.logger.log(
          `Template sync completed: ${created} created, ${updated} updated`,
        );

        return { created, updated };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      this.logger.error('Error syncing templates from Otima', error as Error);
      throw error;
    }
  }

  /**
   * Map Otima API response to CreateTemplateDto
   */
  private mapOtimaTemplateToDto(otimaTemplate: any): CreateTemplateDto {
    // Determine status
    let status: TemplateStatus = TemplateStatus.PENDING;
    if (otimaTemplate.status === 'A') {
      status = TemplateStatus.ACTIVE;
    } else if (otimaTemplate.status === 'R') {
      status = TemplateStatus.REJECTED;
    } else if (otimaTemplate.status === 'P') {
      status = TemplateStatus.PENDING;
    }

    // Determine category
    let category: TemplateCategory = TemplateCategory.MARKETING;
    if (otimaTemplate.category) {
      const categoryUpper = otimaTemplate.category.toUpperCase();
      if (categoryUpper === 'UTILITY') {
        category = TemplateCategory.UTILITY;
      } else if (categoryUpper === 'AUTHENTICATION') {
        category = TemplateCategory.AUTHENTICATION;
      } else {
        category = TemplateCategory.MARKETING;
      }
    }

    return {
      template_code: otimaTemplate.template_code || '',
      accounts: otimaTemplate.accounts || [],
      button_sample: otimaTemplate.button_sample || [],
      category,
      content: otimaTemplate.content || '',
      status,
      status_description: otimaTemplate.status_description || '',
      variable_sample: otimaTemplate.variable_sample || {},
      created_date: otimaTemplate.created_date,
      updated_date: otimaTemplate.updated_date,
    };
  }

  /**
   * Map database row to Template entity
   */
  private mapDbRowToTemplate(dbRow: any): Template {
    return new Template({
      id: dbRow.id,
      templateCode: dbRow.templateCode,
      accounts: typeof dbRow.accounts === 'string' ? JSON.parse(dbRow.accounts) : dbRow.accounts,
      buttonSample:
        typeof dbRow.buttonSample === 'string'
          ? JSON.parse(dbRow.buttonSample)
          : dbRow.buttonSample,
      category: dbRow.category,
      content: dbRow.content,
      status: dbRow.status as TemplateStatus,
      statusDescription: dbRow.statusDescription,
      variableSample:
        typeof dbRow.variableSample === 'string'
          ? JSON.parse(dbRow.variableSample)
          : dbRow.variableSample,
      createdAt: dbRow.createdAt,
      updatedAt: dbRow.updatedAt,
    });
  }

  /**
   * Map Template entity to response DTO format (snake_case for API compatibility)
   */
  mapTemplateToResponseDto(template: Template): any {
    return {
      id: template.id,
      template_code: template.templateCode,
      accounts: template.accounts,
      button_sample: template.buttonSample,
      category: template.category,
      content: template.content,
      status: template.status,
      status_description: template.statusDescription,
      variable_sample: template.variableSample,
      created_date: null,
      updated_date: null,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
      isActive: template.isActive,
      hasButtons: template.hasButtons,
      hasVariables: template.hasVariables,
      variableCount: template.variableCount,
      buttonCount: template.buttonCount,
    };
  }
}

