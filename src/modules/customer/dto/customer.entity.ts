import { ApiProperty } from '@nestjs/swagger';

export class CustomerEntity {
  @ApiProperty({ description: 'Unique customer ID' })
  id: string;

  @ApiProperty({ description: 'WhatsApp remote JID (phone number)' })
  remoteJid: string;

  @ApiProperty({ description: 'Customer display name', required: false })
  pushName?: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  profilePicUrl?: string;

  @ApiProperty({ description: 'Customer email address', required: false })
  email?: string;

  @ApiProperty({ description: 'Customer CPF (Brazilian individual tax ID)', required: false })
  cpf?: string;

  @ApiProperty({ description: 'Customer CNPJ (Brazilian company tax ID)', required: false })
  cnpj?: string;

  @ApiProperty({ description: 'Customer priority level (0-10)', default: 0 })
  priority: number;

  @ApiProperty({ description: 'Whether this is a group contact', default: false })
  isGroup: boolean;

  @ApiProperty({ description: 'Whether this contact is saved', default: false })
  isSaved: boolean;

  @ApiProperty({ description: 'Contact type', enum: ['contact'], default: 'contact' })
  type: 'contact';

  @ApiProperty({ description: 'Customer status', enum: ['active', 'inactive', 'blocked'], default: 'active' })
  status: 'active' | 'inactive' | 'blocked';

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
} 