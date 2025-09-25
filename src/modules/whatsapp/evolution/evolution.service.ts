import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  // Interfaces
  EvolutionApiResponse,
  CreateInstanceDto,
  InstanceResponse,
  InstanceInfo,
  SendTextDto,
  SendMediaDto,
  SendPtvDto,
  SendAudioDto,
  SendStatusDto,
  SendStickerDto,
  SendLocationDto,
  SendContactDto,
  SendReactionDto,
  SendPollDto,
  SendListDto,
  SendButtonDto,
  CheckWhatsAppNumbersDto,
  MarkMessagesAsReadDto,
  ArchiveChatDto,
  MarkChatUnreadDto,
  DeleteMessageDto,
  FetchProfilePictureDto,
  GetBase64FromMediaMessageDto,
  UpdateMessageDto,
  SendPresenceDto,
  UpdateBlockStatusDto,
  FindContactsDto,
  FindMessagesDto,
  FindStatusMessageDto,
  CreateGroupDto,
  UpdateGroupPictureDto,
  UpdateGroupSubjectDto,
  UpdateGroupDescriptionDto,
  SendInviteDto,
  UpdateParticipantDto,
  UpdateSettingDto,
  ToggleEphemeralDto,
  SetSettingsDto,
  SetPresenceDto,
  SetProxyDto,
  UpdateProfileNameDto,
  UpdateProfileStatusDto,
  UpdateProfilePictureDto,
  UpdatePrivacySettingsDto,
  HandleLabelDto,
  FakeCallDto,
  SendTemplateDto,
  CreateTemplateDto,
  SetWebhookDto,
  SetRabbitMQDto,
  SetSQSDto,
  SetChatwootDto,
  CreateTypebotDto,
  UpdateTypebotDto,
  ChangeSessionStatusDto,
  StartTypebotDto,
  CreateEvolutionBotDto,
  UpdateEvolutionBotDto,
  SetOpenaiCredsDto,
  CreateOpenaiBotDto,
  UpdateOpenaiBotDto,
  CreateDifyBotDto,
  UpdateDifyBotDto,
  CreateFlowiseBotDto,
  UpdateFlowiseBotDto,
  GetMediaDto,
  GetMediaUrlDto,
  SetDefaultSettingsDto,
  SendVideoDto,
} from './interfaces/evolution.interface';

@Injectable()
export class EvolutionService {
  private readonly logger = new Logger(EvolutionService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('EVOLUTION_API_BASE_URL') || '';
    this.apiKey = this.configService.get<string>('EVOLUTION_API_KEY') || '';

    if (!this.baseUrl) {
      throw new Error('EVOLUTION_API_BASE_URL is required');
    }

    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.apiKey,
      },
    });

    // Add request interceptor for logging
    this.axiosInstance.interceptors.request.use(
      (config) => {
        this.logger.debug(`Making request to: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.axiosInstance.interceptors.response.use(
      (response) => {
        this.logger.debug(`Response received: ${response.status} ${response.statusText}`);
        return response;
      },
      (error) => {
        this.logger.error('Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    data?: any,
    params?: any
  ): Promise<any> {
    try {
      const response: AxiosResponse<EvolutionApiResponse<T>> = await this.axiosInstance.request({
        method,
        url,
        data,
        params,
      });

      return response.data;
    } catch (error) {
      this.logger.error(`API request failed: ${method} ${url}`, error);
      
      if (error.response) {
        throw new HttpException(
          error.response.data?.message || 'Evolution API request failed',
          error.response.status || HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      
      throw new HttpException(
        'Evolution API connection failed',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Instance Management
  async createInstance(instanceName: string, data: CreateInstanceDto): Promise<InstanceResponse> {
    const response = await this.makeRequest<InstanceResponse>('POST', '/instance/create', data);
    return response;
  }

  async fetchInstances(instanceName?: string, instanceId?: string): Promise<InstanceInfo[]> {
    const params: any = {};
    if (instanceName) params.instanceName = instanceName;
    if (instanceId) params.instanceId = instanceId;

    const response = await this.makeRequest<InstanceInfo[]>('GET', '/instance/fetchInstances', undefined, params);
    return response;
  }

  async connectInstance(instance: string, number?: string): Promise<any> {
    const params: any = {};
    if (number) params.number = number;

    const response = await this.makeRequest<any>('GET', `/instance/connect/${instance}`, undefined, params);
    return response;
  }

  async restartInstance(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/instance/restart/${instance}`);
    return response;
  }

  async setPresence(instance: string, presence: 'available' | 'unavailable'): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/instance/setPresence/${instance}`, { presence });
    return response;
  }

  async getConnectionState(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/instance/connectionState/${instance}`);
    return response;
  }

  async logoutInstance(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('DELETE', `/instance/logout/${instance}`);
    return response;
  }

  async deleteInstance(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('DELETE', `/instance/delete/${instance}`);
    return response;
  }

  // Message Sending
  async sendText(instance: string, data: SendTextDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendText/${instance}`, data);
    return response;
  }

  async sendMedia(instance: string, data: SendMediaDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendMedia/${instance}`, data);
    return response;
  }

  async sendPtv(instance: string, data: SendPtvDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendPtv/${instance}`, data);
    return response;
  }

  async sendVideo(instance: string, data: SendVideoDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendVideo/${instance}`, data);
    return response;
  }

  async sendAudio(instance: string, data: SendAudioDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendWhatsAppAudio/${instance}`, data);
    return response;
  }

  async sendStatus(instance: string, data: SendStatusDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendStatus/${instance}`, data);
    return response;
  }

  async sendSticker(instance: string, data: SendStickerDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendSticker/${instance}`, data);
    return response;
  }

  async sendLocation(instance: string, data: SendLocationDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendLocation/${instance}`, data);
    return response;
  }

  async sendContact(instance: string, data: SendContactDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendContact/${instance}`, data);
    return response;
  }

  async sendReaction(instance: string, data: SendReactionDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendReaction/${instance}`, data);
    return response;
  }

  async sendPoll(instance: string, data: SendPollDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendPoll/${instance}`, data);
    return response;
  }

  async sendList(instance: string, data: SendListDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendList/${instance}`, data);
    return response;
  }

  async sendButtons(instance: string, data: SendButtonDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendButtons/${instance}`, data);
    return response;
  }

  async sendTemplate(instance: string, data: SendTemplateDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/sendTemplate/${instance}`, data);
    return response;
  }

  // Chat Management
  async checkWhatsAppNumbers(instance: string, data: CheckWhatsAppNumbersDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/whatsappNumbers/${instance}`, data);
    return response;
  }

  async markMessagesAsRead(instance: string, data: MarkMessagesAsReadDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/markMessageAsRead/${instance}`, data);
    return response;
  }

  async archiveChat(instance: string, data: ArchiveChatDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/archiveChat/${instance}`, data);
    return response;
  }

  async markChatUnread(instance: string, data: MarkChatUnreadDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/markChatUnread/${instance}`, data);
    return response;
  }

  async deleteMessage(instance: string, data: DeleteMessageDto): Promise<any> {
    const response = await this.makeRequest<any>('DELETE', `/chat/deleteMessageForEveryone/${instance}`, data);
    return response;
  }

  async fetchProfilePicture(instance: string, data: FetchProfilePictureDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/fetchProfilePictureUrl/${instance}`, data);
    return response;
  }

  async getBase64FromMediaMessage(instance: string, data: GetBase64FromMediaMessageDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/getBase64FromMediaMessage/${instance}`, data);
    return response;
  }

  async updateMessage(instance: string, data: UpdateMessageDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/updateMessage/${instance}`, data);
    return response;
  }

  async sendPresence(instance: string, data: SendPresenceDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/sendPresence/${instance}`, data);
    return response;
  }

  async updateBlockStatus(instance: string, data: UpdateBlockStatusDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/message/updateBlockStatus/${instance}`, data);
    return response;
  }

  async findContacts(instance: string, data: FindContactsDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/findContacts/${instance}`, data);
    return response;
  }

  async findMessages(instance: string, data: FindMessagesDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/findMessages/${instance}`, data);
    return response;
  }

  async findStatusMessage(instance: string, data: FindStatusMessageDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/findStatusMessage/${instance}`, data);
    return response;
  }

  async findChats(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/findChats/${instance}`);
    return response;
  }

  // Group Management
  async createGroup(instance: string, data: CreateGroupDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/group/create/${instance}`, data);
    return response;
  }

  async updateGroupPicture(instance: string, groupJid: string, data: UpdateGroupPictureDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/group/updateGroupPicture/${instance}`, data, { groupJid });
    return response;
  }

  async updateGroupSubject(instance: string, groupJid: string, data: UpdateGroupSubjectDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/group/updateGroupSubject/${instance}`, data, { groupJid });
    return response;
  }

  async updateGroupDescription(instance: string, groupJid: string, data: UpdateGroupDescriptionDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/group/updateGroupDescription/${instance}`, data, { groupJid });
    return response;
  }

  async getInviteCode(instance: string, groupJid: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/group/inviteCode/${instance}`, undefined, { groupJid });
    return response;
  }

  async revokeInviteCode(instance: string, groupJid: string): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/group/revokeInviteCode/${instance}`, undefined, { groupJid });
    return response;
  }

  async sendInvite(instance: string, data: SendInviteDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/group/sendInvite/${instance}`, data);
    return response;
  }

  async getInviteInfo(instance: string, inviteCode: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/group/inviteInfo/${instance}`, undefined, { inviteCode });
    return response;
  }

  async findGroupInfos(instance: string, groupJid: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/group/findGroupInfos/${instance}`, undefined, { groupJid });
    return response;
  }

  async fetchAllGroups(instance: string, getParticipants: boolean = false): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/group/fetchAllGroups/${instance}`, undefined, { getParticipants });
    return response;
  }

  async getParticipants(instance: string, groupJid: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/group/participants/${instance}`, undefined, { groupJid });
    return response;
  }

  async updateParticipant(instance: string, groupJid: string, data: UpdateParticipantDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/group/updateParticipant/${instance}`, data, { groupJid });
    return response;
  }

  async updateSetting(instance: string, groupJid: string, data: UpdateSettingDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/group/updateSetting/${instance}`, data, { groupJid });
    return response;
  }

  async toggleEphemeral(instance: string, groupJid: string, data: ToggleEphemeralDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/group/toggleEphemeral/${instance}`, data, { groupJid });
    return response;
  }

  async leaveGroup(instance: string, groupJid: string): Promise<any> {
    const response = await this.makeRequest<any>('DELETE', `/group/leaveGroup/${instance}`, undefined, { groupJid });
    return response;
  }

  // Settings Management
  async setSettings(instance: string, data: SetSettingsDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/settings/set/${instance}`, data);
    return response;
  }

  async findSettings(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/settings/find/${instance}`);
    return response;
  }

  // Proxy Management
  async setProxy(instance: string, data: SetProxyDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/proxy/set/${instance}`, data);
    return response;
  }

  async findProxy(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/proxy/find/${instance}`);
    return response;
  }

  // Profile Management
  async fetchBusinessProfile(instance: string, number: string): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/fetchBusinessProfile/${instance}`, { number });
    return response;
  }

  async fetchProfile(instance: string, number: string): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/fetchProfile/${instance}`, { number });
    return response;
  }

  async updateProfileName(instance: string, data: UpdateProfileNameDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/updateProfileName/${instance}`, data);
    return response;
  }

  async updateProfileStatus(instance: string, data: UpdateProfileStatusDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/updateProfileStatus/${instance}`, data);
    return response;
  }

  async updateProfilePicture(instance: string, data: UpdateProfilePictureDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/updateProfilePicture/${instance}`, data);
    return response;
  }

  async removeProfilePicture(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('DELETE', `/chat/removeProfilePicture/${instance}`);
    return response;
  }

  async fetchPrivacySettings(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/chat/fetchPrivacySettings/${instance}`);
    return response;
  }

  async updatePrivacySettings(instance: string, data: UpdatePrivacySettingsDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chat/updatePrivacySettings/${instance}`, data);
    return response;
  }

  // Label Management
  async findLabels(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/label/findLabels/${instance}`);
    return response;
  }

  async handleLabel(instance: string, data: HandleLabelDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/label/handleLabel/${instance}`, data);
    return response;
  }

  // Call Management
  async fakeCall(instance: string, data: FakeCallDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/call/offer/${instance}`, data);
    return response;
  }

  // Template Management
  async createTemplate(instance: string, data: CreateTemplateDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/template/create/${instance}`, data);
    return response;
  }

  async findTemplates(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/template/find/${instance}`);
    return response;
  }

  // Webhook Management
  async setWebhook(instance: string, data: SetWebhookDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/webhook/set/${instance}`, data);
    return response;
  }

  async findWebhook(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/webhook/find/${instance}`);
    return response;
  }

  // RabbitMQ Management
  async setRabbitMQ(instance: string, data: SetRabbitMQDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/rabbitmq/set/${instance}`, data);
    return response;
  }

  async findRabbitMQ(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/rabbitmq/find/${instance}`);
    return response;
  }

  // SQS Management
  async setSQS(instance: string, data: SetSQSDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/sqs/set/${instance}`, data);
    return response;
  }

  async findSQS(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/sqs/find/${instance}`);
    return response;
  }

  // Chatwoot Management
  async setChatwoot(instance: string, data: SetChatwootDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/chatwoot/set/${instance}`, data);
    return response;
  }

  async findChatwoot(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/chatwoot/find/${instance}`);
    return response;
  }

  // Typebot Management
  async createTypebot(instance: string, data: CreateTypebotDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/typebot/create/${instance}`, data);
    return response;
  }

  async findTypebots(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/typebot/find/${instance}`);
    return response;
  }

  async fetchTypebot(instance: string, typebotId: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/typebot/fetch/${typebotId}/${instance}`);
    return response;
  }

  async updateTypebot(instance: string, typebotId: string, data: UpdateTypebotDto): Promise<any> {
    const response = await this.makeRequest<any>('PUT', `/typebot/update/${typebotId}/${instance}`, data);
    return response;
  }

  async deleteTypebot(instance: string, typebotId: string): Promise<any> {
    const response = await this.makeRequest<any>('DELETE', `/typebot/delete/${typebotId}/${instance}`);
    return response;
  }

  async changeSessionStatus(instance: string, data: ChangeSessionStatusDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/typebot/changeStatus/${instance}`, data);
    return response;
  }

  async fetchSessions(instance: string, typebotId: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/typebot/fetchSessions/${typebotId}/${instance}`);
    return response;
  }

  async startTypebot(instance: string, data: StartTypebotDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/typebot/start/${instance}`, data);
    return response;
  }

  // Evolution Bot Management
  async createEvolutionBot(instance: string, data: CreateEvolutionBotDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/evolutionBot/create/${instance}`, data);
    return response;
  }

  async findEvolutionBots(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/evolutionBot/find/${instance}`);
    return response;
  }

  async fetchEvolutionBot(instance: string, evolutionBotId: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/evolutionBot/fetch/${evolutionBotId}/${instance}`);
    return response;
  }

  async updateEvolutionBot(instance: string, evolutionBotId: string, data: UpdateEvolutionBotDto): Promise<any> {
    const response = await this.makeRequest<any>('PUT', `/evolutionBot/update/${evolutionBotId}/${instance}`, data);
    return response;
  }

  async deleteEvolutionBot(instance: string, evolutionBotId: string): Promise<any> {
    const response = await this.makeRequest<any>('DELETE', `/evolutionBot/delete/${evolutionBotId}/${instance}`);
    return response;
  }

  async changeEvolutionBotSessionStatus(instance: string, data: ChangeSessionStatusDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/evolutionBot/changeStatus/${instance}`, data);
    return response;
  }

  async fetchEvolutionBotSessions(instance: string, evolutionBotId: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/evolutionBot/fetchSessions/${evolutionBotId}/${instance}`);
    return response;
  }

  // OpenAI Management
  async setOpenaiCreds(instance: string, data: SetOpenaiCredsDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/openai/creds/${instance}`, data);
    return response;
  }

  async getOpenaiCreds(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/openai/creds/${instance}`);
    return response;
  }

  async deleteOpenaiCreds(instance: string, openaiCredsId: string): Promise<any> {
    const response = await this.makeRequest<any>('DELETE', `/openai/creds/${openaiCredsId}/${instance}`);
    return response;
  }

  async createOpenaiBot(instance: string, data: CreateOpenaiBotDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/openai/create/${instance}`, data);
    return response;
  }

  async findOpenaiBots(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/openai/find/${instance}`);
    return response;
  }

  async fetchOpenaiBot(instance: string, openaiBotId: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/openai/fetch/${openaiBotId}/${instance}`);
    return response;
  }

  async updateOpenaiBot(instance: string, openaiBotId: string, data: UpdateOpenaiBotDto): Promise<any> {
    const response = await this.makeRequest<any>('PUT', `/openai/update/${openaiBotId}/${instance}`, data);
    return response;
  }

  async deleteOpenaiBot(instance: string, openaiBotId: string): Promise<any> {
    const response = await this.makeRequest<any>('DELETE', `/openai/delete/${openaiBotId}/${instance}`);
    return response;
  }

  async changeOpenaiSessionStatus(instance: string, data: ChangeSessionStatusDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/openai/changeStatus/${instance}`, data);
    return response;
  }

  async fetchOpenaiSessions(instance: string, openaiBotId: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/openai/fetchSessions/${openaiBotId}/${instance}`);
    return response;
  }

  // Dify Management
  async createDifyBot(instance: string, data: CreateDifyBotDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/dify/create/${instance}`, data);
    return response;
  }

  async findDifyBots(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/dify/find/${instance}`);
    return response;
  }

  async fetchDifyBot(instance: string, difyId: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/dify/fetch/${difyId}/${instance}`);
    return response;
  }

  async updateDifyBot(instance: string, difyId: string, data: UpdateDifyBotDto): Promise<any> {
    const response = await this.makeRequest<any>('PUT', `/dify/update/${difyId}/${instance}`, data);
    return response;
  }

  async deleteDifyBot(instance: string, difyId: string): Promise<any> {
    const response = await this.makeRequest<any>('DELETE', `/dify/delete/${difyId}/${instance}`);
    return response;
  }

  async changeDifySessionStatus(instance: string, data: ChangeSessionStatusDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/dify/changeStatus/${instance}`, data);
    return response;
  }

  async fetchDifySessions(instance: string, difyId: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/dify/fetchSessions/${difyId}/${instance}`);
    return response;
  }

  // Flowise Management
  async createFlowiseBot(instance: string, data: CreateFlowiseBotDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/flowise/create/${instance}`, data);
    return response;
  }

  async findFlowiseBots(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/flowise/find/${instance}`);
    return response;
  }

  async fetchFlowiseBot(instance: string, flowiseId: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/flowise/fetch/${flowiseId}/${instance}`);
    return response;
  }

  async updateFlowiseBot(instance: string, flowiseId: string, data: UpdateFlowiseBotDto): Promise<any> {
    const response = await this.makeRequest<any>('PUT', `/flowise/update/${flowiseId}/${instance}`, data);
    return response;
  }

  async deleteFlowiseBot(instance: string, flowiseId: string): Promise<any> {
    const response = await this.makeRequest<any>('DELETE', `/flowise/delete/${flowiseId}/${instance}`);
    return response;
  }

  async changeFlowiseSessionStatus(instance: string, data: ChangeSessionStatusDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/flowise/changeStatus/${instance}`, data);
    return response;
  }

  async fetchFlowiseSessions(instance: string, flowiseId: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/flowise/fetchSessions/${flowiseId}/${instance}`);
    return response;
  }

  // S3 Storage
  async getMedia(instance: string, data: GetMediaDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/s3/getMedia/${instance}`, data);
    return response;
  }

  async getMediaUrl(instance: string, data: GetMediaUrlDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/s3/getMediaUrl/${instance}`, data);
    return response;
  }

  // Default Settings
  async setDefaultSettings(instance: string, data: SetDefaultSettingsDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/typebot/settings/${instance}`, data);
    return response;
  }

  async fetchDefaultSettings(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/typebot/fetchSettings/${instance}`);
    return response;
  }

  async setEvolutionBotDefaultSettings(instance: string, data: SetDefaultSettingsDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/evolutionBot/settings/${instance}`, data);
    return response;
  }

  async fetchEvolutionBotDefaultSettings(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/evolutionBot/fetchSettings/${instance}`);
    return response;
  }

  async setOpenaiDefaultSettings(instance: string, data: SetDefaultSettingsDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/openai/settings/${instance}`, data);
    return response;
  }

  async fetchOpenaiDefaultSettings(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/openai/fetchSettings/${instance}`);
    return response;
  }

  async setDifyDefaultSettings(instance: string, data: SetDefaultSettingsDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/dify/settings/${instance}`, data);
    return response;
  }

  async fetchDifyDefaultSettings(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/dify/fetchSettings/${instance}`);
    return response;
  }

  async setFlowiseDefaultSettings(instance: string, data: SetDefaultSettingsDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/flowise/settings/${instance}`, data);
    return response;
  }

  async fetchFlowiseDefaultSettings(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/flowise/fetchSettings/${instance}`);
    return response;
  }

  // Websocket Management
  async setWebsocket(instance: string, data: SetWebhookDto): Promise<any> {
    const response = await this.makeRequest<any>('POST', `/websocket/set/${instance}`, data);
    return response;
  }

  async findWebsocket(instance: string): Promise<any> {
    const response = await this.makeRequest<any>('GET', `/websocket/find/${instance}`);
    return response;
  }

  // Get API Information
  async getApiInfo(): Promise<any> {
    const response = await this.makeRequest<any>('GET', '/');
    return response;
  }
} 