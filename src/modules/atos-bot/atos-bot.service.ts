import { Injectable, Logger } from '@nestjs/common';
import { InjectKnex } from 'nestjs-knex';
import { ConfigService } from '@nestjs/config';
import { Knex } from 'knex';
import axios, { AxiosInstance } from 'axios';
import { VonageService } from '../whatsapp/vonage/vonage.service';
import { MessagesService } from '../messages/messages.service';
import { QueueService } from '../customer-queue/queue.service';
import { CreateMessageDto } from '../messages/dto/message.dto';
import { VonageSendMessageDto } from '../whatsapp/vonage/dto/vonage.dto';
import { MessagePlatform, MessageType, MessageStatus, SenderType, RecipientType } from '../messages/entities/message.entity';
import { QueueStatus } from '../customer-queue/entities/queue.entity';
import {
  AtosApiConfigMap,
  AtosIntentResponse,
  AtosDetectIntentPayload,
  AtosDetectIntentResponse,
  AtosClientAvailableResponse,
  AtosSessionInfo,
  AtosQueueEntry,
  AtosLogEntry,
} from './dto/atos-bot.dto';
import { AtosBotContext, AtosSessionParameters } from './dto/atos-bot-queue.dto';
import { AtosSegmento } from './interfaces/atos-bot.interface';

/**
 * Atos Bot Service
 * Handles intent detection and bot logic for WhatsApp conversations
 * Migrated from legacy atosBot.js
 */
@Injectable()
export class AtosBotService {
  private readonly logger = new Logger(AtosBotService.name);
  private readonly apiConfig: AtosApiConfigMap;
  private readonly chatwebUrlGem: string;
  private readonly chatwebUrlChc: string;
  private readonly axiosInstance: AxiosInstance;

  private readonly TRANSBORDO_MESSAGE_1 =
    'Por favor, aguarde um momento enquanto eu transfiro o atendimento para nossa equipe de consultores. Você também pode fazer seu pedido e/ou consulta 24 horas no link {portal}';

  private readonly TRANSBORDO_MESSAGE_2 =
    'O horário de atendimento dos nossos consultores é de segunda à sexta das 10h às 20h. Por favor, descreva o seu problema, que retornaremos o contato assim que possível. Você também pode fazer seu pedido/consulta 24 horas no link {portal}';

  constructor(
    @InjectKnex() private readonly knex: Knex,
    private readonly configService: ConfigService,
    private readonly vonageService: VonageService,
    private readonly messagesService: MessagesService,
    private readonly queueService: QueueService,
  ) {
    const isProd = this.configService.get<string>('PROD') === 'true';

    this.chatwebUrlGem = isProd
      ? this.configService.get<string>('CHATWEB_URL_GEM') || ''
      : this.configService.get<string>('CHATWEB_URL_GEM_HML') || '';

    this.chatwebUrlChc = isProd
      ? this.configService.get<string>('CHATWEB_URL_CHC') || ''
      : this.configService.get<string>('CHATWEB_URL_CHC_HML') || '';

    this.apiConfig = isProd
      ? {
          GEM: {
            apiUrl:
              this.configService.get<string>('ATOS_GEM_API_URL') ||
              'https://webb.fidelize.com.br/index.php?r=api/graphql/index',
            apiUsr:
              this.configService.get<string>('ATOS_GEM_API_USR') || 'chat.bot',
            apiPwd:
              this.configService.get<string>('ATOS_GEM_API_PWD') ||
              'Chat.bot2020',
            apiPortal:
              this.configService.get<string>('ATOS_GEM_API_PORTAL') ||
              'https://conectapdv.sanofi-mobile.com.br',
          },
          CHC: {
            apiUrl:
              this.configService.get<string>('ATOS_CHC_API_URL') ||
              'https://trade.fidelize.com.br/esanofi/index.php?r=api/graphql/index',
            apiUsr:
              this.configService.get<string>('ATOS_CHC_API_USR') || 'chat.bot',
            apiPwd:
              this.configService.get<string>('ATOS_CHC_API_PWD') ||
              'Mudar@2023',
            apiPortal:
              this.configService.get<string>('ATOS_CHC_API_PORTAL') ||
              'https://conectachc.sanofi-mobile.com.br',
          },
        }
      : {
          GEM: {
            apiUrl:
              this.configService.get<string>('ATOS_GEM_API_URL_HML') ||
              'https://ttstaging.fidelize.com.br/t4t/index.php?r=api/graphql/index',
            apiUsr:
              this.configService.get<string>('ATOS_GEM_API_USR_HML') || 'atos',
            apiPwd:
              this.configService.get<string>('ATOS_GEM_API_PWD_HML') ||
              's3nh4$00',
            apiPortal:
              this.configService.get<string>('ATOS_GEM_API_PORTAL_HML') ||
              'https://ubicuacloud-dev.rj.r.appspot.com',
          },
          CHC: {
            apiUrl:
              this.configService.get<string>('ATOS_CHC_API_URL_HML') ||
              'https://trade.fidelize.com.br/fabricante/index.php?r=api/graphql/index',
            apiUsr:
              this.configService.get<string>('ATOS_CHC_API_USR_HML') ||
              'chat.bot-teste2',
            apiPwd:
              this.configService.get<string>('ATOS_CHC_API_PWD_HML') ||
              'Mudar@2023',
            apiPortal:
              this.configService.get<string>('ATOS_CHC_API_PORTAL_HML') ||
              'https://ubicuacloud-dev2.rj.r.appspot.com',
          },
        };

    this.axiosInstance = axios.create();
  }

  /**
   * Send a text message via Vonage and store in MessagesService
   */
  async sendMessage(
    sessionId: string,
    customerId: string,
    mobile: string,
    message: string,
  ): Promise<void> {
    try {
      // Send via Vonage
      const sendMessageDto: VonageSendMessageDto = {
        type: 'text',
        toNumber: mobile,
        txtMessage: message,
      };

      await new Promise((resolve) => setTimeout(resolve, 500));
      const vonageResponse = await this.vonageService.sendMessage(sendMessageDto);

      // Store message in database
      const createMessageDto: CreateMessageDto = {
        messageId: vonageResponse.message_uuid,
        sessionId,
        senderType: SenderType.BOT,
        recipientType: RecipientType.CUSTOMER,
        customerId,
        userId: null, // Bot messages don't have a user
        fromMe: true,
        system: false,
        isGroup: false,
        message,
        type: MessageType.TEXT,
        platform: MessagePlatform.WHATSAPP,
        status: MessageStatus.SENT,
      };

      await this.messagesService.createMessage(createMessageDto);
      this.logger.debug(`Message sent and stored for ${mobile}`);
    } catch (error) {
      this.logger.error(`Error sending message to ${mobile}:`, error);
      throw error;
    }
  }

  /**
   * Send a template message via Vonage and store in MessagesService
   */
  async sendTemplateMessage(
    sessionId: string,
    customerId: string,
    mobile: string,
    templateName: string,
    components: any[],
  ): Promise<void> {
    try {
      const sendMessageDto: VonageSendMessageDto = {
        type: 'template_custom',
        toNumber: mobile,
        template_name: templateName,
        template_namespace: 'f8ad1a58_f790_49a8_b757_04a56bfd7bc3',
        components,
      };

      this.logger.log(`>> template ${templateName} to ${mobile}`);
      const vonageResponse = await this.vonageService.sendMessage(sendMessageDto);

      // Store template message in database
      const createMessageDto: CreateMessageDto = {
        messageId: vonageResponse.message_uuid,
        sessionId,
        senderType: SenderType.BOT,
        recipientType: RecipientType.CUSTOMER,
        customerId,
        userId: null, // Bot messages don't have a user
        fromMe: true,
        system: false,
        isGroup: false,
        message: `Template: ${templateName}`,
        type: MessageType.TEXT, // Template messages are stored as text with metadata
        platform: MessagePlatform.WHATSAPP,
        status: MessageStatus.SENT,
        metadata: {
          template: templateName,
          components,
        },
      };

      await this.messagesService.createMessage(createMessageDto);
    } catch (error) {
      this.logger.error(`Error sending template message to ${mobile}:`, error);
      throw error;
    }
  }

  /**
   * Send Cleo logo image via Vonage and store in MessagesService
   */
  async sendCleoLogo(
    sessionId: string,
    customerId: string,
    mobile: string,
    cleoUrl: string,
  ): Promise<void> {
    try {
      const sendMessageDto: VonageSendMessageDto = {
        type: 'image',
        toNumber: mobile,
        mediaUrl: cleoUrl,
        mediaCaption: '',
      };

      const vonageResponse = await this.vonageService.sendMessage(sendMessageDto);

      // Store image message in database
      const createMessageDto: CreateMessageDto = {
        messageId: vonageResponse.message_uuid,
        sessionId,
        senderType: SenderType.BOT,
        recipientType: RecipientType.CUSTOMER,
        customerId,
        userId: null, // Bot messages don't have a user
        fromMe: true,
        system: false,
        isGroup: false,
        message: '',
        type: MessageType.IMAGE,
        platform: MessagePlatform.WHATSAPP,
        status: MessageStatus.SENT,
        media: JSON.stringify({
          url: cleoUrl,
          caption: '',
        }),
      };

      await this.messagesService.createMessage(createMessageDto);
    } catch (error) {
      this.logger.error(`Error sending Cleo logo to ${mobile}:`, error);
      throw error;
    }
  }

  /**
   * Login to Atos chatweb API
   */
  async atosLogin(chatwebUrl: string): Promise<string> {
    try {
      const url = `${chatwebUrl}/api/login/`;
      const payload = { user_name: 'ubicua', password: 'senha$00' };

      const result = await this.axiosInstance.post(url, payload);
      return result.data.token;
    } catch (error) {
      this.logger.error(`Error logging in to Atos chatweb:`, error);
      throw error;
    }
  }

  /**
   * Get authentication token from Atos GraphQL API
   */
  async atosToken(segmento: AtosSegmento): Promise<string> {
    try {
      const apiUrl = this.apiConfig[segmento].apiUrl;
      const login = this.apiConfig[segmento].apiUsr;
      const password = this.apiConfig[segmento].apiPwd;

      const result = await this.axiosInstance.post(apiUrl, {
        query: `
          mutation{
            createToken(login: "${login}", password:"${password}"){
              token
              industryName
            }
          }
        `,
      });

      return result.data.data.createToken.token;
    } catch (error) {
      this.logger.error(`Error getting Atos token for ${segmento}:`, error);
      throw error;
    }
  }

  /**
   * Check if CNPJ is available in the portal
   */
  async atosCheckCnpj(
    sessionBot: string,
    cnpj: string,
    segmento: AtosSegmento,
  ): Promise<string> {
    try {
      const apiUrl = this.apiConfig[segmento].apiUrl;
      const token = await this.atosToken(segmento);

      const result = await this.axiosInstance.post(
        apiUrl,
        {
          query: `
            query{
              clientAvailable(customerCode: "${cnpj}") {
                available,
                companyName,
                email,
                phoneNumber
              }
            }
          `,
        },
        {
          headers: { Authorization: token },
        },
      );

      const available = result.data.data.clientAvailable.available;
      
      // Convert '1'/'0' to boolean
      const isAvailable = available === '1' || available === true;
      
      // Update portal availability in queue metadata
      const portalUpdate: Partial<AtosBotContext> = {};
      if (segmento === 'GEM') {
        portalUpdate.portalGem = isAvailable;
      } else if (segmento === 'CHC') {
        portalUpdate.portalChc = isAvailable;
      }
      
      await this.updateBotContextInQueue(sessionBot, portalUpdate);
      
      this.logger.log(`>> Check cnpj ${segmento} - ${cnpj} - ${isAvailable}`);

      return available;
    } catch (error) {
      this.logger.error(`Error checking CNPJ for ${segmento}:`, error);
      throw error;
    }
  }

  /**
   * Main method to process incoming messages with bot logic
   * Flow: User sends message -> check status -> detect intent if bot -> give proper response
   */
  async processMessage(
    sessionId: string,
    customerId: string,
    message: string,
  ): Promise<void> {
    try {
      this.logger.log(`Processing message with bot for session ${sessionId}: ${message.substring(0, 50)}...`);
      
      // Get queue to check status
      let queue;
      try {
        queue = await this.queueService.findQueueBySessionId(sessionId);
      } catch (error) {
        this.logger.warn(`Queue not found for session ${sessionId}:`, error);
        return;
      }

      // Only process if status is BOT
      if (queue.status !== QueueStatus.BOT) {
        this.logger.debug(`Queue status is ${queue.status}, skipping bot processing`);
        return;
      }

      this.logger.log(`Queue status is BOT, processing message with Atos Bot`);

      // Get bot context from queue metadata
      const botContext = this.getBotContextFromQueue(queue);
      const segment: AtosSegmento = botContext.segment || 'GEM';
      const mobile = queue.customer?.contact || queue.customer?.platformId || '';

      if (!mobile) {
        this.logger.warn(`No mobile number found for customer ${customerId}`);
        return;
      }

      // Check if this is the first message (no context exists)
      const sessionContext = await this.getSessionContext(sessionId);
      const isFirstMessage = !sessionContext || sessionContext === '';
      
      // On first interaction, send "oi" to the API, but the actual user message is already stored
      const messageToSend = isFirstMessage ? 'oi' : message;
      
      if (isFirstMessage) {
        this.logger.log(`First message detected - sending "oi" to API instead of user message: ${message.substring(0, 50)}...`);
      } else {
        this.logger.log(`Detecting intent for message: ${message.substring(0, 50)}... (segment: ${segment})`);
      }

      // Detect intent and get responses
      const intentResponses = await this.atosDetectIntent(
        sessionId,
        messageToSend,
        mobile,
        segment,
        false, // cleoLogo is no longer in bot context, can be added if needed
        customerId,
      );

      this.logger.log(`Intent detection returned ${intentResponses.length} response(s)`);

      // Process and send responses
      for (const response of intentResponses) {
        if (response.text && response.text !== 'null') {
          if (response.transbordoWeb) {
            // Handle chatweb transbordo - log but don't send via WhatsApp
            this.logger.log(`Chatweb transbordo response: ${response.text}`);
          } else if (response.template && process.env.PROD === 'true') {
            // Send template message
            await this.sendTemplateMessage(
              sessionId,
              customerId,
              mobile,
              response.template,
              response.components || [],
            );
          } else {
            // Send regular text message
            await this.sendMessage(sessionId, customerId, mobile, response.text);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Error processing message with bot:`, error);
      this.logger.error(`Error details:`, {
        errorMessage: error.message,
        stack: error.stack,
        sessionId,
        customerId,
        userMessage: message,
      });
      // Don't throw - allow message to be stored even if bot processing fails
    }
  }

  /**
   * Get bot context from queue metadata
   */
  private getBotContextFromQueue(queue: any): Partial<AtosBotContext> {
    if (!queue.metadata || !queue.metadata.bot) {
      return {};
    }
    return queue.metadata.bot as Partial<AtosBotContext>;
  }

  /**
   * Update bot context in queue metadata
   */
  private async updateBotContextInQueue(
    sessionId: string,
    botContextUpdate: Partial<AtosBotContext>,
  ): Promise<void> {
    try {
      const queue = await this.queueService.findQueueBySessionId(sessionId);
      if (!queue) {
        return;
      }

      const currentBotContext = this.getBotContextFromQueue(queue);
      // Merge updates, ensuring required fields are preserved
      const updatedBotContext: Partial<AtosBotContext> = {
        ...currentBotContext,
        ...botContextUpdate,
      };

      const updatedMetadata = {
        ...(queue.metadata || {}),
        bot: updatedBotContext,
      };

      // Update queue metadata directly in Redis
      const queueKey = `queue:${sessionId}`;
      const currentData = await (this.queueService as any).redis.hgetall(queueKey);
      if (Object.keys(currentData).length > 0) {
        const currentMetadata = currentData.metadata ? JSON.parse(currentData.metadata) : {};
        const mergedMetadata = {
          ...currentMetadata,
          ...updatedMetadata,
        };
        await (this.queueService as any).redis.hset(queueKey, 'metadata', JSON.stringify(mergedMetadata));
      }
    } catch (error) {
      this.logger.error(`Error updating bot context in queue:`, error);
    }
  }

  /**
   * Main function to detect intent from user message
   * This is the core function that processes messages and returns bot responses
   */
  async atosDetectIntent(
    session: string,
    message: string,
    mobile: string,
    segmento: AtosSegmento,
    cleoLogo: boolean = false,
    customerId?: string,
  ): Promise<AtosIntentResponse[]> {
    try {
      const chatwebUrl =
        segmento === 'GEM' ? this.chatwebUrlGem : this.chatwebUrlChc;
      const token = await this.atosLogin(chatwebUrl);
      const url = `${chatwebUrl}/api/intent/detect/${session}/`;

      const headers = { Authorization: `Bearer ${token}` };
      const context = await this.getSessionContext(session);
      
      // API expects snake_case, not camelCase
      const payload = {
        query_input: { text: message },
        context,
      };

      this.logger.log('> Payload a ser enviado ATOS: ', payload);
      this.logger.log('> Url para enviar o payload: ', url);

      const response = await this.axiosInstance.post(url, payload, { headers });
      this.logger.log('Resposta payload atos: ', response.data);

      const responseData = response.data;
      const contexts = responseData.contexts || [];
      const intent_name = responseData.intent_name || responseData.intentName || '';
      const response_messages = responseData.response_messages || responseData.responseMessages || [];
      const fallback_counters = responseData.fallback_counters || responseData.fallbackCounters || 0;

      let intentResponse: AtosIntentResponse[] = response_messages.map((el) => ({
        text: el.text,
        template: false,
        transbordoWeb: false,
      }));

      let msgText: AtosIntentResponse = {
        text: '',
        template: false,
        transbordoWeb: false,
      };
      const msgEnd =
        'Por falta de continuidade em nossa comunicação, encerramos essa interação. Caso queira retomar o contato, por favor, nos envie Oi.';

      if (intentResponse.length > 0) {
        msgText = intentResponse[0];
      }

      if (fallback_counters >= 3) {
        await this.endBot(session, mobile);
      }

      if (intent_name === 'Default Welcome Intent' && cleoLogo && customerId) {
        await this.sendCleoLogo(
          session,
          customerId,
          mobile,
          'https://ccs.sanofi-mobile.com.br/atendente/assets/images/cleo_logo_wpp.png',
        );
      }

      // Handle different intents
      if (intent_name === '1.UsuarioInformaNome') {
        let name = '';
        for (let i = 0; i < contexts.length; i++) {
          const ctx = contexts[i];
          if (Object.keys(ctx.parameters).includes('given-name')) {
            name = ctx.parameters['given-name'];
          }
        }
        await this.updateParams(intent_name, [name, session]);
      }

      if (
        [
          '2.UsuarioInformaCnpj',
          '2.EventoValidCnpj',
          '2.UsuarioInformaInfs',
          '2.UsuarioInformaInfsFull',
        ].includes(intent_name)
      ) {
        intentResponse = await this.handleCnpjIntents(
          contexts,
          intentResponse,
          session,
          mobile,
          segmento,
          chatwebUrl,
        );
      }

      if (['2.1.CadastroUsuarioOptin'].includes(intent_name)) {
        intentResponse = await this.handleOptinCadastro(
          contexts,
          intentResponse,
        );
      }

      if (['2.1.2.UsuarioConfirmaCadOptin'].includes(intent_name)) {
        intentResponse = await this.handleOptinConfirmacao(
          contexts,
          intentResponse,
        );
      }

      if (['2.1.EventoListaOpcoes'].includes(intent_name)) {
        intentResponse = await this.handleListaOpcoes(intentResponse);
      }

      if (
        [
          '2.1.AtualizaUsuarioOptin',
          '2.1.2.UsuarioInformaInfsOptin',
          '2.1.2.UsuarioConfirmaInfs',
        ].includes(intent_name)
      ) {
        intentResponse = await this.handleOptinAtualizacao(
          contexts,
          intentResponse,
        );
      }

      if (
        [
          '3.UsuarioInformaOpcaoNovoPedido',
          '2.UsuarioInformaTipoPedido',
          '3.EventoListaCondicao',
        ].includes(intent_name)
      ) {
        intentResponse = await this.handleNovoPedido(
          intentResponse,
          session,
          mobile,
          segmento,
          chatwebUrl,
        );
      }

      if (
        ['4.EventoListOrders', '4.UsuarioInformaOpcaoConsultarPedido'].includes(
          intent_name,
        )
      ) {
        intentResponse = await this.handleConsultarPedido(
          intentResponse,
          session,
          mobile,
          segmento,
          chatwebUrl,
        );
      }

      if (['5.UsuarioInformaOpcaoOrcamento'].includes(intent_name)) {
        intentResponse = await this.handleOrcamento(
          intentResponse,
          session,
          mobile,
          segmento,
          chatwebUrl,
        );
      }

      if (['9.UsuarioFinalizaContato'].includes(intent_name)) {
        intentResponse = [
          {
            text: intentResponse[0].text,
            template: false,
            transbordoWeb: false,
          },
        ];
      }

      if (['9.1.FinalizaConversa'].includes(intent_name)) {
        await this.encerraBot(session, mobile, true);
      }

      if (msgText.text === msgEnd) {
        await this.encerraBot(session, mobile, true);
      }

      // Update bot context in queue metadata
      const detectIntentResponse: AtosDetectIntentResponse = {
        contexts,
        intentName: intent_name,
        responseMessages: response_messages,
        fallbackCounters: fallback_counters,
      };

      this.logger.log(`>> Storing context for session ${session}:`, JSON.stringify(detectIntentResponse, null, 2));
      this.logger.log(`>> Contexts array:`, JSON.stringify(contexts, null, 2));

      await this.updateBotContextInQueue(session, {
        context: detectIntentResponse,
        lastResponse: intentResponse,
        segment: segmento,
        fallback: fallback_counters,
      });
      
      this.logger.log(`>> Context stored successfully for session ${session}`);

      return intentResponse;
    } catch (error) {
      this.logger.error('Erro ao detectar intent: ', error);
      await this.endBot(session, mobile);
      return [{ text: 'null', template: false, transbordoWeb: false }];
    }
  }

  /**
   * Handle CNPJ-related intents
   */
  private async handleCnpjIntents(
    contexts: any[],
    intentResponse: AtosIntentResponse[],
    session: string,
    mobile: string,
    segmento: AtosSegmento,
    chatwebUrl: string,
  ): Promise<AtosIntentResponse[]> {
    let cnpj = '';
    let telefone = '';
    let email = '';
    let name = '';

    for (let i = 0; i < contexts.length; i++) {
      const ctx = contexts[i];
      if (Object.keys(ctx.parameters).includes('Cnpj')) {
        cnpj = ctx.parameters['Cnpj'];
      }
      if (Object.keys(ctx.parameters).includes('Telefone')) {
        telefone = ctx.parameters['Telefone'];
      }
      if (Object.keys(ctx.parameters).includes('Email')) {
        email = ctx.parameters['Email'];
      }
      if (Object.keys(ctx.parameters).includes('Name')) {
        name = ctx.parameters['Name'];
      }
    }

    cnpj = this.extractNumbersFromString(cnpj);

    // Check if cnpj is available to both portals
    if (cnpj) {
      await this.atosCheckCnpj(session, cnpj, 'GEM');
      await this.atosCheckCnpj(session, cnpj, 'CHC');
    }

    const intentName = '2.UsuarioInformaCnpj';
    await this.updateParams(intentName, [cnpj, email, telefone, name, session]);

    const contextsName = contexts.map((el) => el.name.split('/')[6]);
    const filterContext = contextsName.filter(
      (el) => el.indexOf('dialog_context') !== -1,
    );

    this.logger.log(
      ['2.UsuarioInformaCnpj', '2.EventoValidCnpj', '2.UsuarioInformaInfs', '2.UsuarioInformaInfsFull'].join(', '),
    );
    this.logger.log(contextsName);
    this.logger.log(filterContext);

    // Usuario ja possui optin cadastrado
    if (intentResponse[0].text.indexOf('Gostaria de atualizá-los?') !== -1) {
      const components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: telefone },
            { type: 'text', text: email },
          ],
        },
        {
          type: 'button',
          sub_type: 'quick_reply',
          index: '0',
          parameters: [],
        },
      ];
      return [
        {
          text: intentResponse[0].text,
          template: 'sanofi_bot_optin_registered',
          components,
          transbordoWeb: false,
        },
      ];
    }

    // Usuario não possui cadastro optin
    if (
      intentResponse[0].text.indexOf(
        'Gostaria de cadastrar os dados corporativos informados',
      ) !== -1
    ) {
      const components = [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: cnpj },
            { type: 'text', text: telefone },
            { type: 'text', text: email },
          ],
        },
        {
          type: 'button',
          sub_type: 'quick_reply',
          index: '0',
          parameters: [],
        },
      ];
      return [
        {
          text: intentResponse[0].text,
          template: 'sanofi_bot_optin',
          components,
          transbordoWeb: false,
        },
      ];
    }

    return intentResponse;
  }

  /**
   * Handle optin cadastro intent
   */
  private async handleOptinCadastro(
    contexts: any[],
    intentResponse: AtosIntentResponse[],
  ): Promise<AtosIntentResponse[]> {
    const contextsName = contexts.map((el) => el.name.split('/')[6]);
    const filterContext = contextsName.filter(
      (el) => el.indexOf('aguardando_infs_optin') !== -1,
    );

    this.logger.log('2.1.CadastroUsuarioOptin');
    this.logger.log(contextsName);
    this.logger.log(filterContext);

    if (filterContext.length <= 0) {
      const template = 'sanofi_cad_optin';
      const components = [
        {
          type: 'button',
          sub_type: 'quick_reply',
          index: '0',
          parameters: [],
        },
      ];
      return [
        {
          text: intentResponse[0].text,
          template,
          components,
          transbordoWeb: false,
        },
      ];
    }

    return intentResponse;
  }

  /**
   * Handle optin confirmacao intent
   */
  private async handleOptinConfirmacao(
    contexts: any[],
    intentResponse: AtosIntentResponse[],
  ): Promise<AtosIntentResponse[]> {
    const contextsName = contexts.map((el) => el.name.split('/')[6]);
    const filterContext = contextsName.filter(
      (el) => el.indexOf('dialog_context') !== -1,
    );

    this.logger.log('2.1.2.UsuarioConfirmaCadOptin');
    this.logger.log(contextsName);
    this.logger.log(filterContext);

    let template = 'sanofi_chatweb_menu';
    const components = [
      {
        type: 'button',
        sub_type: 'quick_reply',
        index: '0',
        parameters: [],
      },
    ];

    if (
      intentResponse[0].text.indexOf(
        'Você gostaria de informar um novo e-mail e telefone, agora da farmácia?',
      ) !== -1
    ) {
      template = 'sanofi_conf_cad_optin';
    }

    return [
      {
        text: intentResponse[0].text,
        template,
        components,
        transbordoWeb: false,
      },
    ];
  }

  /**
   * Handle lista opcoes intent
   */
  private async handleListaOpcoes(
    intentResponse: AtosIntentResponse[],
  ): Promise<AtosIntentResponse[]> {
    const template = 'sanofi_chatweb_menu_fallback';
    const components = [
      {
        type: 'button',
        sub_type: 'quick_reply',
        index: '0',
        parameters: [],
      },
    ];

    return [
      {
        text: intentResponse[0].text,
        template,
        components,
        transbordoWeb: false,
      },
    ];
  }

  /**
   * Handle optin atualizacao intent
   */
  private async handleOptinAtualizacao(
    contexts: any[],
    intentResponse: AtosIntentResponse[],
  ): Promise<AtosIntentResponse[]> {
    const contextsName = contexts.map((el) => el.name.split('/')[6]);
    const filterContext = contextsName.filter(
      (el) => el.indexOf('aguardando_infs_optin') !== -1,
    );

    this.logger.log([
      '2.1.AtualizaUsuarioOptin',
      '2.1.2.UsuarioInformaInfsOptin',
      '2.1.2.UsuarioConfirmaInfs',
    ].join(', '));
    this.logger.log(contextsName);
    this.logger.log(filterContext);

    if (filterContext.length <= 0) {
      const template = 'sanofi_chatweb_menu';
      const components = [
        {
          type: 'button',
          sub_type: 'quick_reply',
          index: '0',
          parameters: [],
        },
      ];
      return [
        {
          text: intentResponse[0].text,
          template,
          components,
          transbordoWeb: false,
        },
      ];
    }

    return intentResponse;
  }

  /**
   * Handle novo pedido intent
   */
  private async handleNovoPedido(
    intentResponse: AtosIntentResponse[],
    session: string,
    mobile: string,
    segmento: AtosSegmento,
    chatwebUrl: string,
  ): Promise<AtosIntentResponse[]> {
    const link = `${chatwebUrl}/chat?session=${session}&opt=1`;
    const chatwebText = `Muito legal saber que você quer fazer um pedido com a gente! Para continuarmos, vou pedir para que você clique no link abaixo, assim poderemos avançar com a sua solicitação.\n${link}`;

    await this.insertLog(session, mobile, chatwebText, 1);
    await this.updateParams('opt', ['1', session]);
    await this.updateStatus(session, QueueStatus.SERVICE);

    for (let i = 0; i < intentResponse.length; i++) {
      const msg = intentResponse[i];
      await this.insertLog(session, mobile, msg.text, 0, 0, 1);
    }

    const template =
      segmento === 'GEM'
        ? 'sanofi_chatweb_gem_opt1'
        : 'sanofi_chatweb_chc_opt1';
    const components = [
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          {
            type: 'text',
            text: `?session=${session}&opt=1`,
          },
        ],
      },
    ];

    return [
      {
        text: chatwebText,
        template,
        components,
        transbordoWeb: true,
      },
    ];
  }

  /**
   * Handle consultar pedido intent
   */
  private async handleConsultarPedido(
    intentResponse: AtosIntentResponse[],
    session: string,
    mobile: string,
    segmento: AtosSegmento,
    chatwebUrl: string,
  ): Promise<AtosIntentResponse[]> {
    const link = `${chatwebUrl}/chat?session=${session}&opt=2`;
    const chatwebText = `Vamos consultar o seu pedido agora! Mas para continuarmos, vou pedir para que você clique no link abaixo, assim poderemos avançar com a sua solicitação.\n${link}`;

    await this.insertLog(session, mobile, chatwebText, 1);
    await this.updateParams('opt', ['2', session]);
    await this.updateStatus(session, QueueStatus.SERVICE);

    for (let i = 0; i < intentResponse.length; i++) {
      const msg = intentResponse[i];
      await this.insertLog(session, mobile, msg.text, 0, 0, 1);
    }

    const template =
      segmento === 'GEM'
        ? 'sanofi_chatweb_gem_opt2'
        : 'sanofi_chatweb_chc_opt2';
    const components = [
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          {
            type: 'text',
            text: `?session=${session}&opt=2`,
          },
        ],
      },
    ];

    return [
      {
        text: chatwebText,
        template,
        components,
        transbordoWeb: true,
      },
    ];
  }

  /**
   * Handle orcamento intent
   */
  private async handleOrcamento(
    intentResponse: AtosIntentResponse[],
    session: string,
    mobile: string,
    segmento: AtosSegmento,
    chatwebUrl: string,
  ): Promise<AtosIntentResponse[]> {
    const link = `${chatwebUrl}/chat?session=${session}&opt=3`;
    const chatwebText = `Muito legal saber que você quer fazer um pedido com a gente! Para continuarmos, vou pedir para que você clique no link abaixo, assim poderemos avançar com a sua solicitação.\n${link}`;

    await this.insertLog(session, mobile, chatwebText, 1);
    await this.updateParams('opt', ['3', session]);
    await this.updateStatus(session, QueueStatus.SERVICE);

    for (let i = 0; i < intentResponse.length; i++) {
      const msg = intentResponse[i];
      await this.insertLog(session, mobile, msg.text, 0, 0, 1);
    }

    const template =
      segmento === 'GEM'
        ? 'sanofi_chatweb_gem_opt1'
        : 'sanofi_chatweb_chc_opt1';
    const components = [
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [
          {
            type: 'text',
            text: `?session=${session}&opt=3`,
          },
        ],
      },
    ];

    return [
      {
        text: chatwebText,
        template,
        components,
        transbordoWeb: true,
      },
    ];
  }

  /**
   * Extract numbers from string
   */
  private extractNumbersFromString(str: string): string {
    return str.replace(/\D/g, '');
  }

  /**
   * Get session information from queue metadata
   */
  async getInfs(sessionBot: string): Promise<AtosSessionInfo> {
    try {
      const queue = await this.queueService.findQueueBySessionId(sessionBot);
      const botContext = this.getBotContextFromQueue(queue);
      const customer = queue.customer;

      // Get values from sessionParameters or fallback to customer data
      const sessionParams = botContext.sessionParameters || {};
      const cnpj = sessionParams.cnpj || customer?.cnpj;
      const email = sessionParams.email || customer?.email;
      const telefone = sessionParams.telefone || customer?.contact;
      const name = sessionParams.name || customer?.name;

      // Convert portal flags to boolean
      const portalGem = botContext.portalGem === true;
      const portalChc = botContext.portalChc === true;

      // Legacy status mapping (deprecated, but kept for backward compatibility)
      let status: number;
      if (queue.status === QueueStatus.BOT) {
        status = 5;
      } else if (queue.status === QueueStatus.WAITING) {
        status = 4;
      } else {
        status = 1; // SERVICE
      }

      return {
        cnpj,
        email,
        telefone,
        portalGem: portalGem || false,
        portalChc: portalChc || false,
        name,
        context: botContext.context,
        lastResponse: botContext.lastResponse,
        status,
        segment: botContext.segment,
        fallback: botContext.fallback || 0,
        timeoutCount: botContext.timeoutCount || 0,
        opt: botContext.opt,
      };
    } catch (error) {
      this.logger.error(`Error getting session info for ${sessionBot}:`, error);
      return {};
    }
  }

  /**
   * Get last response from queue metadata
   */
  async getLastResponse(sessionBot: string): Promise<AtosIntentResponse[]> {
    try {
      const queue = await this.queueService.findQueueBySessionId(sessionBot);
      const botContext = this.getBotContextFromQueue(queue);
      
      if (botContext.lastResponse) {
        const lastResponse = typeof botContext.lastResponse === 'string' 
          ? JSON.parse(botContext.lastResponse) 
          : botContext.lastResponse;
        this.logger.log('>> last_response: ', lastResponse);
        return lastResponse;
      }

      return [];
    } catch (error) {
      this.logger.error(
        `Error getting last response for ${sessionBot}:`,
        error,
      );
      return [];
    }
  }

  /**
   * Get session context from queue metadata
   * Extracts the contexts array from metadata.bot.context and returns it as JSON string for the API
   */
  async getSessionContext(session: string): Promise<string> {
    try {
      const queue = await this.queueService.findQueueBySessionId(session);
      const botContext = this.getBotContextFromQueue(queue);
      
      this.logger.debug(`>> Bot context for session ${session}:`, JSON.stringify(botContext, null, 2));
      
      // Extract contexts from metadata.bot.context
      if (botContext.context) {
        let contexts: any[] = [];
        
        // If context is an AtosDetectIntentResponse object with contexts property
        if (typeof botContext.context === 'object' && botContext.context !== null) {
          if ('contexts' in botContext.context && Array.isArray(botContext.context.contexts)) {
            contexts = botContext.context.contexts;
          } else if (Array.isArray(botContext.context)) {
            // If context itself is an array
            contexts = botContext.context;
          }
        } else if (typeof botContext.context === 'string') {
          // If it's a string, try to parse it
          try {
            const parsed = JSON.parse(botContext.context);
            if (Array.isArray(parsed)) {
              contexts = parsed;
            } else if (parsed && typeof parsed === 'object' && 'contexts' in parsed && Array.isArray(parsed.contexts)) {
              contexts = parsed.contexts;
            }
          } catch (parseError) {
            this.logger.warn(`>> Failed to parse context string: ${botContext.context}`);
            return '';
          }
        }
        
        // Return contexts array as JSON string
        if (contexts.length > 0) {
          const contextString = JSON.stringify(contexts);
          this.logger.log(`>> session_context from queue: ${contextString}`);
          return contextString;
        } else {
          this.logger.log(`>> session_context from queue: (empty - contexts array is empty)`);
          return '';
        }
      }
      
      // No context found
      this.logger.log(`>> session_context from queue: (empty - no context found)`);
      return '';
    } catch (error) {
      this.logger.error(`Error getting session context for ${session}:`, error);
      return '';
    }
  }

  /**
   * Get chat history from MessagesService
   */
  async getChatHistory(sessionBot: string): Promise<string> {
    try {
      const messages = await this.messagesService.listMessages({
        sessionId: sessionBot,
        page: '1',
        limit: '1000', // Get all messages for the session
      });

      // Get queue to access customer info
      const queue = await this.queueService.findQueueBySessionId(sessionBot);
      const customer = queue.customer;

      // Format messages similar to old tab_logs format
      const history = messages.data.map((msg) => ({
        date: msg.sentAt.toISOString().replace('T', ' ').substring(0, 19),
        fromid: msg.fromMe ? '491b9564-2d79-11ea-978f-2e728ce88125' : msg.customerId || '',
        fromname: msg.fromMe ? 'Bot' : customer?.name || '',
        toid: msg.fromMe ? msg.customerId || '' : '491b9564-2d79-11ea-978f-2e728ce88125',
        toname: msg.fromMe ? customer?.name || '' : 'Bot',
        msgdir: msg.fromMe ? 'o' : 'i',
        msgtext: msg.message || '',
        sessionid: msg.sessionId,
      }));

      return JSON.stringify(history);
    } catch (error) {
      this.logger.error(`Error getting chat history for ${sessionBot}:`, error);
      return JSON.stringify([]);
    }
  }

  /**
   * Get transbordo message based on time
   */
  async getTransbordoMessage(apiPortal: string): Promise<string> {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      const lowerBound = new Date();
      lowerBound.setHours(10);
      lowerBound.setMinutes(0);

      const upperBound = new Date();
      upperBound.setHours(20);
      upperBound.setMinutes(0);

      if (now.getDay() >= 1 && now.getDay() <= 5) {
        if (
          currentHour > lowerBound.getHours() ||
          (currentHour === lowerBound.getHours() &&
            currentMinute >= lowerBound.getMinutes())
        ) {
          if (
            currentHour < upperBound.getHours() ||
            (currentHour === upperBound.getHours() &&
              currentMinute <= upperBound.getMinutes())
          ) {
            return this.TRANSBORDO_MESSAGE_1.replace('{portal}', apiPortal);
          }
        }
      }

      return this.TRANSBORDO_MESSAGE_2.replace('{portal}', apiPortal);
    } catch (error) {
      this.logger.error('Error getting transbordo message:', error);
      throw error;
    }
  }

  /**
   * Update parameters in queue metadata
   */
  async updateParams(intent: string, params: any[]): Promise<void> {
    try {
      this.logger.log(`>> Update params: ${intent} - ${params}`);
      
      const sessionBot = params[params.length - 1]; // Last param is always sessionBot
      const queue = await this.queueService.findQueueBySessionId(sessionBot);
      const botContext = this.getBotContextFromQueue(queue);
      
      const botContextUpdate: Partial<AtosBotContext> = {};
      const sessionParamsUpdate: Partial<AtosSessionParameters> = {};

      if (['1.UsuarioInformaNome'].includes(intent)) {
        sessionParamsUpdate.name = params[0];
      }

      if (
        [
          '2.EventoValidCnpj',
          '2.UsuarioInformaInfs',
          '2.UsuarioInformaInfsFull',
          '2.UsuarioInformaCnpj',
        ].includes(intent)
      ) {
        sessionParamsUpdate.cnpj = params[0];
        sessionParamsUpdate.email = params[1];
        sessionParamsUpdate.telefone = params[2];
        sessionParamsUpdate.name = params[3];
      }

      if (['opt'].includes(intent)) {
        // Convert opt to number (1 for new Order, 2 for checking order, etc.)
        const optValue = parseInt(params[0], 10);
        if (!isNaN(optValue)) {
          botContextUpdate.opt = optValue;
        }
      }

      // Update sessionParameters if any changes
      if (Object.keys(sessionParamsUpdate).length > 0) {
        botContextUpdate.sessionParameters = {
          ...(botContext.sessionParameters || {}),
          ...sessionParamsUpdate,
        };
      }

      if (Object.keys(botContextUpdate).length > 0) {
        await this.updateBotContextInQueue(sessionBot, botContextUpdate);
      }
    } catch (error) {
      this.logger.error(`Error updating params for ${intent}:`, error);
      // Don't throw - allow processing to continue
    }
  }

  /**
   * Update queue status
   * BOT: user is in bot context, process messages with atosBot
   * WAITING: user is waiting in queue for a human service
   * SERVICE: user is talking to human, process messages normally
   */
  async updateStatus(sessionBot: string, status: QueueStatus): Promise<void> {
    try {
      await this.queueService.updateQueue(sessionBot, {
        sessionId: sessionBot,
        status,
      });
      
      this.logger.log(`Updated queue status for ${sessionBot} to ${status}`);
    } catch (error) {
      this.logger.error(`Error updating status for ${sessionBot}:`, error);
      // Don't throw - allow processing to continue
    }
  }

  /**
   * Update last response in queue metadata
   * Accepts either string (legacy) or AtosIntentResponse[] (new format)
   */
  async updateLastResponse(
    sessionBot: string,
    lastResponse: string | AtosIntentResponse[],
  ): Promise<void> {
    try {
      // Convert string to array if needed (legacy support)
      const responseArray: AtosIntentResponse[] = typeof lastResponse === 'string'
        ? JSON.parse(lastResponse)
        : lastResponse;
      
      await this.updateBotContextInQueue(sessionBot, {
        lastResponse: responseArray,
      });
    } catch (error) {
      this.logger.error(
        `Error updating last response for ${sessionBot}:`,
        error,
      );
      // Don't throw - allow processing to continue
    }
  }

  /**
   * Update session context in queue metadata
   * Accepts either string (legacy) or AtosDetectIntentResponse (new format)
   */
  async updateSessionContext(
    sessionBot: string,
    context: string | AtosDetectIntentResponse,
  ): Promise<void> {
    try {
      // Convert string to object if needed (legacy support)
      let contextObj: AtosDetectIntentResponse;
      if (typeof context === 'string') {
        try {
          const contexts = JSON.parse(context);
          contextObj = {
            contexts: Array.isArray(contexts) ? contexts : [],
            intentName: '',
            responseMessages: [],
            fallbackCounters: 0,
          };
        } catch {
          // If parsing fails, create empty context
          contextObj = {
            contexts: [],
            intentName: '',
            responseMessages: [],
            fallbackCounters: 0,
          };
        }
      } else {
        contextObj = context;
      }
      
      await this.updateBotContextInQueue(sessionBot, {
        context: contextObj,
      });
    } catch (error) {
      this.logger.error(
        `Error updating session context for ${sessionBot}:`,
        error,
      );
      // Don't throw - allow processing to continue
    }
  }

  /**
   * Update timeout count in queue metadata
   */
  async updateTimeoutCount(sessionBot: string, count: number): Promise<void> {
    try {
      await this.updateBotContextInQueue(sessionBot, {
        timeoutCount: count,
      });
    } catch (error) {
      this.logger.error(
        `Error updating timeout count for ${sessionBot}:`,
        error,
      );
      // Don't throw - allow processing to continue
    }
  }

  /**
   * Insert log entry using MessagesService
   * Note: This creates a bot message in the messages table
   */
  async insertLog(
    sessionBot: string,
    mobile: string,
    message: string,
    status: number = 0,
    stread: number = 0,
    qr: number = 0,
  ): Promise<void> {
    try {
      // Get queue to find customerId
      const queue = await this.queueService.findQueueBySessionId(sessionBot);
      const customerId = queue.customerId;

      if (!customerId) {
        this.logger.warn(`No customerId found for session ${sessionBot}, skipping log insert`);
        return;
      }

      // Create message using MessagesService
      const createMessageDto: CreateMessageDto = {
        messageId: `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId: sessionBot,
        senderType: SenderType.BOT,
        recipientType: RecipientType.CUSTOMER,
        customerId,
        userId: null,
        fromMe: true,
        system: status === 1, // System message if status is 1
        isGroup: false,
        message,
        type: MessageType.TEXT,
        platform: MessagePlatform.WHATSAPP,
        status: MessageStatus.SENT,
        metadata: {
          stread,
          origem: 'wpp',
          qr,
        },
      };

      await this.messagesService.createMessage(createMessageDto);
    } catch (error) {
      this.logger.error(`Error inserting log for ${sessionBot}:`, error);
      // Don't throw - allow processing to continue
    }
  }

  /**
   * Initialize bot context with origin and destiny
   * Sets origin to 'whatsapp' and destiny to 'bot' if not already set
   */
  async insertTransbordo(sessionBot: string, mobile: string): Promise<void> {
    try {
      const queue = await this.queueService.findQueueBySessionId(sessionBot);
      const botContext = this.getBotContextFromQueue(queue);

      // Initialize bot context if not already set
      if (!botContext.origin || !botContext.destiny) {
        const sessionParams = botContext.sessionParameters || {};
        const cnpj = sessionParams.cnpj || queue.customer?.cnpj;
        
        await this.updateBotContextInQueue(sessionBot, {
          sessionBot,
          origin: botContext.origin || 'whatsapp',
          destiny: botContext.destiny || 'bot',
          sessionParameters: {
            ...sessionParams,
            telefone: sessionParams.telefone || mobile,
            cnpj: sessionParams.cnpj || cnpj,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Error initializing bot context for ${sessionBot}:`, error);
      // Don't throw - allow processing to continue
    }
  }

  /**
   * End bot (set status to WAITING to transfer to human)
   */
  async endBot(sessionBot: string, mobile: string): Promise<void> {
    try {
      // Update queue status to WAITING (equivalent to old status = 1)
      await this.queueService.updateQueue(sessionBot, {
        sessionId: sessionBot,
        status: QueueStatus.WAITING,
      });
      await this.endTransbordo(sessionBot);
    } catch (error) {
      this.logger.error(`Error ending bot for ${sessionBot}:`, error);
      // Don't throw - allow processing to continue
    }
  }

  /**
   * End transbordo (transfer to human)
   * Updates destiny to 'human' in queue metadata
   */
  async endTransbordo(sessionBot: string): Promise<void> {
    try {
      await this.updateBotContextInQueue(sessionBot, {
        destiny: 'human',
      });
    } catch (error) {
      this.logger.error(`Error ending transbordo for ${sessionBot}:`, error);
      // Don't throw - allow processing to continue
    }
  }

  /**
   * Encerra bot (remove from queue or update status)
   */
  async encerraBot(
    sessionBot: string,
    mobile: string,
    journey: boolean = false,
  ): Promise<void> {
    try {
      // Get queue to find customerId for sendTimeout
      let customerId: string | null = null;
      try {
        const queue = await this.queueService.findQueueBySessionId(sessionBot);
        customerId = queue.customerId;
        // Delete queue entry
        await this.queueService.deleteQueue(sessionBot);
      } catch (error) {
        this.logger.warn(`Queue not found for ${sessionBot}, may already be deleted`);
      }

      await this.encerraTransbordo(sessionBot);

      if (!journey && customerId) {
        await this.sendTimeout(sessionBot, customerId, mobile);
      }
    } catch (error) {
      this.logger.error(`Error encerrando bot for ${sessionBot}:`, error);
      // Don't throw - allow processing to continue
    }
  }

  /**
   * Encerra transbordo (return to bot)
   * Updates destiny to 'bot' in queue metadata
   */
  async encerraTransbordo(sessionBot: string): Promise<void> {
    try {
      await this.updateBotContextInQueue(sessionBot, {
        destiny: 'bot',
      });
    } catch (error) {
      this.logger.error(`Error encerrando transbordo for ${sessionBot}:`, error);
      // Don't throw - allow processing to continue
    }
  }

  /**
   * Send timeout message
   */
  async sendTimeout(sessionBot: string, customerId: string, mobile: string): Promise<void> {
    try {
      const message =
        'Encerrei o seu atendimento por inatividade. Mas fique tranquilo, você pode me chamar novamente digitando "Olá" no chat!';

      // Send message via Vonage and store in MessagesService
      await this.sendMessage(sessionBot, customerId, mobile, message);
    } catch (error) {
      this.logger.error(`Error sending timeout message to ${mobile}:`, error);
      // Don't throw - allow processing to continue
    }
  }
}


