import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsBoolean, IsNumber, IsEnum } from 'class-validator';

// Create Group DTO
export class CreateGroupDto {
  @ApiProperty({ description: 'Group subject/title', example: 'My WhatsApp Group' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ description: 'Group description', example: 'A group for team communication', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Array of participant phone numbers', example: ['5511999999999', '5511888888888'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  participants: string[];

  @ApiProperty({ description: 'Group picture (base64 or URL)', example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', required: false })
  @IsString()
  @IsOptional()
  picture?: string;

  @ApiProperty({ description: 'Initial group subject (if different from main subject)', example: 'Initial Group Name', required: false })
  @IsString()
  @IsOptional()
  initialSubject?: string;

  @ApiProperty({ description: 'Initial group description (if different from main description)', example: 'Initial group description', required: false })
  @IsString()
  @IsOptional()
  initialDescription?: string;
}

// Update Group Picture DTO
export class UpdateGroupPictureDto {
  @ApiProperty({ description: 'Base64 encoded image or image URL', example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...' })
  @IsString()
  @IsNotEmpty()
  image: string;
}

// Update Group Subject DTO
export class UpdateGroupSubjectDto {
  @ApiProperty({ description: 'New group subject/title', example: 'Updated Group Name' })
  @IsString()
  @IsNotEmpty()
  subject: string;
}

// Update Group Description DTO
export class UpdateGroupDescriptionDto {
  @ApiProperty({ description: 'New group description', example: 'Updated group description' })
  @IsString()
  @IsNotEmpty()
  description: string;
}

// Unified Update Group DTO
export class UpdateGroupDto {
  @ApiProperty({ 
    description: 'Base64 encoded image or image URL', 
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...', 
    required: false 
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiProperty({ 
    description: 'New group subject/title', 
    example: 'Updated Group Name', 
    required: false 
  })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ 
    description: 'New group description', 
    example: 'Updated group description', 
    required: false 
  })
  @IsString()
  @IsOptional()
  description?: string;
}

// Send Invite DTO
export class SendInviteDto {
  @ApiProperty({ description: 'Group JID', example: '120363025808502329@g.us' })
  @IsString()
  @IsNotEmpty()
  groupJid: string;

  @ApiProperty({ description: 'Invite description', example: 'Join our group!' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ description: 'Array of phone numbers to invite', example: ['5511999999999', '5511888888888'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  numbers: string[];
}

// Update Participant DTO
export class UpdateParticipantDto {
  @ApiProperty({ description: 'Action to perform on participants', enum: ['add', 'remove', 'promote', 'demote'] })
  @IsEnum(['add', 'remove', 'promote', 'demote'])
  @IsNotEmpty()
  action: 'add' | 'remove' | 'promote' | 'demote';

  @ApiProperty({ description: 'Array of participant phone numbers', example: ['5511999999999', '5511888888888'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  participants: string[];
}

// Update Setting DTO
export class UpdateSettingDto {
  @ApiProperty({ description: 'Setting action to perform', enum: ['announcement', 'not_announcement', 'locked', 'unlocked'] })
  @IsEnum(['announcement', 'not_announcement', 'locked', 'unlocked'])
  @IsNotEmpty()
  action: 'announcement' | 'not_announcement' | 'locked' | 'unlocked';
}

// Toggle Ephemeral DTO
export class ToggleEphemeralDto {
  @ApiProperty({ description: 'Ephemeral message expiration time in seconds', enum: [0, 86400, 604800, 7776000] })
  @IsNumber()
  @IsEnum([0, 86400, 604800, 7776000])
  @IsNotEmpty()
  expiration: 0 | 86400 | 604800 | 7776000;
}

// Database Group Filters DTO
export class GroupFiltersDto {
  @ApiProperty({ description: 'Evolution API instance name', required: false })
  @IsString()
  @IsOptional()
  instance?: string;

  @ApiProperty({ description: 'Group owner phone number', required: false })
  @IsString()
  @IsOptional()
  owner?: string;

  @ApiProperty({ description: 'Group subject/title (partial match)', required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ description: 'Group status', enum: ['active', 'inactive', 'archived'], required: false })
  @IsEnum(['active', 'inactive', 'archived'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'archived';

  @ApiProperty({ description: 'Is community group', required: false })
  @IsBoolean()
  @IsOptional()
  isCommunity?: boolean;

  @ApiProperty({ description: 'Is announcement group', required: false })
  @IsBoolean()
  @IsOptional()
  announce?: boolean;

  @ApiProperty({ description: 'Is restricted group', required: false })
  @IsBoolean()
  @IsOptional()
  restrict?: boolean;

  @ApiProperty({ description: 'Limit number of results', required: false })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: 'Offset for pagination', required: false })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

// Database Participant Filters DTO
export class ParticipantFiltersDto {
  @ApiProperty({ description: 'Participant role', enum: ['owner', 'admin', 'member'], required: false })
  @IsEnum(['owner', 'admin', 'member'])
  @IsOptional()
  role?: 'owner' | 'admin' | 'member';

  @ApiProperty({ description: 'Participant status', enum: ['active', 'inactive', 'removed'], required: false })
  @IsEnum(['active', 'inactive', 'removed'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'removed';

  @ApiProperty({ description: 'Limit number of results', required: false })
  @IsNumber()
  @IsOptional()
  limit?: number;

  @ApiProperty({ description: 'Offset for pagination', required: false })
  @IsNumber()
  @IsOptional()
  offset?: number;
}

// Update Group Database DTO
export class UpdateGroupDatabaseDto {
  @ApiProperty({ description: 'Group subject/title', required: false })
  @IsString()
  @IsOptional()
  subject?: string;

  @ApiProperty({ description: 'Group description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Group picture URL', required: false })
  @IsString()
  @IsOptional()
  pictureUrl?: string;

  @ApiProperty({ description: 'Group status', enum: ['active', 'inactive', 'archived'], required: false })
  @IsEnum(['active', 'inactive', 'archived'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'archived';

  @ApiProperty({ description: 'Is restricted group', required: false })
  @IsBoolean()
  @IsOptional()
  restrict?: boolean;

  @ApiProperty({ description: 'Is announcement group', required: false })
  @IsBoolean()
  @IsOptional()
  announce?: boolean;

  @ApiProperty({ description: 'Is community group', required: false })
  @IsBoolean()
  @IsOptional()
  isCommunity?: boolean;

  @ApiProperty({ description: 'Is community announcement group', required: false })
  @IsBoolean()
  @IsOptional()
  isCommunityAnnounce?: boolean;
}

// Response DTOs
export class GroupResponseDto {
  @ApiProperty({ description: 'Success status' })
  status: string;

  @ApiProperty({ description: 'Response message' })
  message?: string;

  @ApiProperty({ description: 'Response data' })
  data?: any;
}

export class GroupInfoResponseDto {
  @ApiProperty({ description: 'Group JID' })
  id: string;

  @ApiProperty({ description: 'Group subject' })
  subject: string;

  @ApiProperty({ description: 'Group description' })
  description?: string;

  @ApiProperty({ description: 'Group creation timestamp' })
  creation: number;

  @ApiProperty({ description: 'Group owner' })
  owner: string;

  @ApiProperty({ description: 'Group participants' })
  participants: any[];

  @ApiProperty({ description: 'Group admins' })
  admins: string[];

  @ApiProperty({ description: 'Group invite code' })
  inviteCode?: string;
}

export class ParticipantResponseDto {
  @ApiProperty({ description: 'Participant phone number' })
  id: string;

  @ApiProperty({ description: 'Participant role', enum: ['owner', 'admin', 'member'] })
  role: 'owner' | 'admin' | 'member';

  @ApiProperty({ description: 'Participant name' })
  name?: string;

  @ApiProperty({ description: 'Participant profile picture URL' })
  profilePicture?: string;
} 