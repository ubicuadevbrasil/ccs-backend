import { IsOptional, IsEnum, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiQuery } from '@nestjs/swagger';
import { MessageTemplateType } from '../interfaces/message-template.interface';

export class QueryMessageTemplateDto {
  @ApiProperty({
    description: 'Filter templates by type',
    enum: MessageTemplateType,
    example: MessageTemplateType.GREETING,
    required: false
  })
  @IsOptional()
  @IsEnum(MessageTemplateType)
  type?: MessageTemplateType;

  @ApiProperty({
    description: 'Search templates by message content',
    example: 'hello',
    required: false
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Number of templates to return per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiProperty({
    description: 'Number of templates to skip for pagination',
    example: 0,
    minimum: 0,
    default: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
