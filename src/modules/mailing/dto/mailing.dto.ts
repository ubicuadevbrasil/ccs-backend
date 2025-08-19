import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMailingDto {
  @ApiProperty({ description: 'Name of the mailing campaign' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL to the uploaded file' })
  @IsString()
  @IsNotEmpty()
  url: string;

  @ApiProperty({ description: 'Message to send to contacts' })
  @IsString()
  @IsNotEmpty()
  message: string;
}

export class UpdateMailingDto {
  @ApiProperty({ description: 'Name of the mailing campaign', required: false })
  @IsString()
  name?: string;

  @ApiProperty({ description: 'URL to the uploaded file', required: false })
  @IsString()
  url?: string;

  @ApiProperty({ description: 'Message to send to contacts', required: false })
  @IsString()
  message?: string;
}
