import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GroupService } from './group.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  CreateGroupDto,
  UpdateGroupDto,
  SendInviteDto,
  UpdateParticipantDto,
  UpdateSettingDto,
  ToggleEphemeralDto,
  GroupResponseDto,
  GroupInfoResponseDto,
  ParticipantResponseDto,
  GroupFiltersDto,
  ParticipantFiltersDto,
  UpdateGroupDatabaseDto,
} from './dto/group.dto';

@ApiTags('Groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  @Post(':instance/create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Create a new WhatsApp group',
    description: 'Create a WhatsApp group with optional picture, subject, and description updates. The group will be created first, then the optional updates will be applied if provided.'
  })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiResponse({ status: 201, description: 'Group created successfully', type: GroupResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async createGroup(
    @Param('instance') instance: string,
    @Body() createGroupDto: CreateGroupDto,
    @CurrentUser() user: any,
  ): Promise<GroupResponseDto> {
    const operatorInfo = { id: user.id, name: user.name };
    return this.groupService.createGroup(instance, createGroupDto, operatorInfo);
  }

  @Put(':instance/:groupJid/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Update group information',
    description: 'Update group picture, subject, and/or description. All fields are optional - only provided fields will be updated.'
  })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Group updated successfully', type: GroupResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateGroup(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
    @Body() updateGroupDto: UpdateGroupDto,
    @CurrentUser() user: any,
  ): Promise<GroupResponseDto> {
    const operatorInfo = { id: user.id, name: user.name };
    return this.groupService.updateGroup(instance, groupJid, updateGroupDto, operatorInfo);
  }



  @Get(':instance/:groupJid/invite-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get group invite code' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Invite code retrieved successfully', type: GroupResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getInviteCode(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
  ): Promise<GroupResponseDto> {
    return this.groupService.getInviteCode(instance, groupJid);
  }

  @Post(':instance/:groupJid/revoke-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke group invite code' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Invite code revoked successfully', type: GroupResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async revokeInviteCode(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
    @CurrentUser() user: any,
  ): Promise<GroupResponseDto> {
    const operatorInfo = { id: user.id, name: user.name };
    return this.groupService.revokeInviteCode(instance, groupJid, operatorInfo);
  }

  @Post(':instance/send-invite')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send group invite to participants' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiResponse({ status: 200, description: 'Group invite sent successfully', type: GroupResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async sendInvite(
    @Param('instance') instance: string,
    @Body() sendInviteDto: SendInviteDto,
    @CurrentUser() user: any,
  ): Promise<GroupResponseDto> {
    const operatorInfo = { id: user.id, name: user.name };
    return this.groupService.sendInvite(instance, sendInviteDto, operatorInfo);
  }

  @Get(':instance/invite-info/:inviteCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get invite information' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'inviteCode', description: 'Group invite code' })
  @ApiResponse({ status: 200, description: 'Invite info retrieved successfully', type: GroupResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getInviteInfo(
    @Param('instance') instance: string,
    @Param('inviteCode') inviteCode: string,
  ): Promise<GroupResponseDto> {
    return this.groupService.getInviteInfo(instance, inviteCode);
  }

  @Get(':instance/:groupJid/info')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get group information' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Group info retrieved successfully', type: GroupInfoResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async findGroupInfos(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
  ): Promise<GroupInfoResponseDto> {
    return this.groupService.findGroupInfos(instance, groupJid);
  }

  @Get(':instance/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch all groups' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiQuery({ name: 'getParticipants', required: false, description: 'Include participants in response', type: Boolean })
  @ApiResponse({ status: 200, description: 'All groups fetched successfully', type: GroupResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async fetchAllGroups(
    @Param('instance') instance: string,
    @Query('getParticipants') getParticipants: boolean = false,
  ): Promise<GroupResponseDto> {
    return this.groupService.fetchAllGroups(instance, getParticipants);
  }

  @Get(':instance/:groupJid/participants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get group participants' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Participants retrieved successfully', type: [ParticipantResponseDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getParticipants(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
  ): Promise<ParticipantResponseDto[]> {
    return this.groupService.getParticipants(instance, groupJid);
  }

  @Put(':instance/:groupJid/participants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update group participants (add/remove/promote/demote)' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Participant updated successfully', type: GroupResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateParticipant(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
    @Body() updateParticipantDto: UpdateParticipantDto,
    @CurrentUser() user: any,
  ): Promise<GroupResponseDto> {
    const operatorInfo = { id: user.id, name: user.name };
    return this.groupService.updateParticipant(instance, groupJid, updateParticipantDto, operatorInfo);
  }

  @Put(':instance/:groupJid/settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update group settings (announcement/locked)' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Setting updated successfully', type: GroupResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateSetting(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
    @Body() updateSettingDto: UpdateSettingDto,
    @CurrentUser() user: any,
  ): Promise<GroupResponseDto> {
    const operatorInfo = { id: user.id, name: user.name };
    return this.groupService.updateSetting(instance, groupJid, updateSettingDto, operatorInfo);
  }

  @Put(':instance/:groupJid/ephemeral')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle ephemeral messages' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Ephemeral toggled successfully', type: GroupResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async toggleEphemeral(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
    @Body() toggleEphemeralDto: ToggleEphemeralDto,
    @CurrentUser() user: any,
  ): Promise<GroupResponseDto> {
    const operatorInfo = { id: user.id, name: user.name };
    return this.groupService.toggleEphemeral(instance, groupJid, toggleEphemeralDto, operatorInfo);
  }

  @Delete(':instance/:groupJid/leave')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Leave a group' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Left group successfully', type: GroupResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async leaveGroup(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
    @CurrentUser() user: any,
  ): Promise<GroupResponseDto> {
    const operatorInfo = { id: user.id, name: user.name };
    return this.groupService.leaveGroup(instance, groupJid, operatorInfo);
  }

  @Post(':instance/:groupJid/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync a specific group to database' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Group synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async syncGroup(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
  ): Promise<any> {
    return this.groupService.syncSpecificGroup(instance, groupJid);
  }

  @Post(':instance/:groupJid/sync/participants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync only participants for a specific group' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Participants synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async syncGroupParticipants(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
  ): Promise<any> {
    return this.groupService.syncGroupParticipants(instance, groupJid);
  }

  @Post(':instance/:groupJid/sync/metadata')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync group metadata and settings' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Metadata synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async syncGroupMetadata(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
  ): Promise<any> {
    return this.groupService.syncGroupMetadata(instance, groupJid);
  }

  @Post(':instance/:groupJid/sync/comprehensive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Comprehensive sync for a specific group' })
  @ApiParam({ name: 'instance', description: 'WhatsApp instance name' })
  @ApiParam({ name: 'groupJid', description: 'Group JID' })
  @ApiResponse({ status: 200, description: 'Comprehensive sync completed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async syncGroupComprehensive(
    @Param('instance') instance: string,
    @Param('groupJid') groupJid: string,
  ): Promise<any> {
    return this.groupService.syncGroupComprehensive(instance, groupJid);
  }

  // Database endpoints

  @Get('database')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch groups from database with filters' })
  @ApiQuery({ name: 'instance', required: false, description: 'Evolution API instance name' })
  @ApiQuery({ name: 'owner', required: false, description: 'Group owner phone number' })
  @ApiQuery({ name: 'subject', required: false, description: 'Group subject/title (partial match)' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'archived'], description: 'Group status' })
  @ApiQuery({ name: 'isCommunity', required: false, description: 'Is community group' })
  @ApiQuery({ name: 'announce', required: false, description: 'Is announcement group' })
  @ApiQuery({ name: 'restrict', required: false, description: 'Is restricted group' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({ status: 200, description: 'Groups retrieved successfully', type: GroupResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async fetchGroupsFromDatabase(@Query() filters: GroupFiltersDto): Promise<GroupResponseDto> {
    return this.groupService.fetchGroupsFromDatabase(filters);
  }

  @Get('database/:groupId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get group by ID with participants' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Group retrieved successfully', type: GroupResponseDto })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getGroupById(@Param('groupId') groupId: string): Promise<GroupResponseDto> {
    return this.groupService.getGroupById(groupId);
  }

  @Post('database/:instance/sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync groups from Evolution API to database' })
  @ApiParam({ name: 'instance', description: 'Evolution API instance name' })
  @ApiResponse({ status: 200, description: 'Groups synced successfully', type: GroupResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async syncGroupsFromEvolution(@Param('instance') instance: string): Promise<GroupResponseDto> {
    return this.groupService.syncGroupsFromEvolution(instance);
  }

  @Get('database/:groupId/participants')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get group participants from database' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiQuery({ name: 'role', required: false, enum: ['owner', 'admin', 'member'], description: 'Participant role' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'inactive', 'removed'], description: 'Participant status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limit number of results' })
  @ApiQuery({ name: 'offset', required: false, description: 'Offset for pagination' })
  @ApiResponse({ status: 200, description: 'Participants retrieved successfully', type: GroupResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getGroupParticipantsFromDatabase(
    @Param('groupId') groupId: string,
    @Query() filters: ParticipantFiltersDto,
  ): Promise<GroupResponseDto> {
    return this.groupService.getGroupParticipantsFromDatabase(groupId, filters);
  }

  @Put('database/:groupId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update group in database' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Group updated successfully', type: GroupResponseDto })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async updateGroupInDatabase(
    @Param('groupId') groupId: string,
    @Body() updateData: UpdateGroupDatabaseDto,
  ): Promise<GroupResponseDto> {
    return this.groupService.updateGroupInDatabase(groupId, updateData);
  }

  @Get('database/statistics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get group statistics' })
  @ApiQuery({ name: 'instance', required: false, description: 'Evolution API instance name' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully', type: GroupResponseDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getGroupStatistics(@Query('instance') instance?: string): Promise<GroupResponseDto> {
    return this.groupService.getGroupStatistics(instance);
  }

  @Delete('database/:groupId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete group from database (soft delete)' })
  @ApiParam({ name: 'groupId', description: 'Group ID' })
  @ApiResponse({ status: 200, description: 'Group deleted successfully', type: GroupResponseDto })
  @ApiResponse({ status: 404, description: 'Group not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async deleteGroupFromDatabase(@Param('groupId') groupId: string): Promise<GroupResponseDto> {
    return this.groupService.deleteGroupFromDatabase(groupId);
  }
} 