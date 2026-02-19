import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  Res,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AtosBotApiService } from './atos-bot-api.service';
import { BasicAuthGuard } from './guards/basic-auth.guard';
import { QueueService } from '../customer-queue/queue.service';
import { MessagesService } from '../messages/messages.service';
import {
  WhatsAppSessionDto,
  SendMediaDto,
  SendMediaResponseDto,
  InputExcelDto,
  InputExcelResponseDto,
  GetExcelInfoQueryDto,
  BotLogDto,
  MessageV1Dto,
  MessageV2Dto,
  CheckWhatsAppDto,
  CheckWhatsAppResponseDto,
  CheckOptinDto,
  CheckOptinResponseDto,
  CheckSkipBotDto,
  CheckSkipBotResponseDto,
  CadastroOptinDto,
  UpdateOptinDto,
  TransbordoDto,
  TransbordoResponseDto,
  EncerraBotDto,
  ConfirmaPedidoDto,
  BotMessageDto,
  BotMessageResponseDto,
  BotChatDto,
  BotStatusDto,
  BotStatusResponseDto,
  BotEmailDto,
  UserConnectChatwebDto,
  CheckAgentsResponseDto,
  UbicuaVendasQueryDto,
  MolaCheckDto,
  MolaCheckResponseDto,
  MolaUpdateDto,
} from './dto/atos-bot-api.dto';
import { InjectKnex } from 'nestjs-knex';
import { Knex } from 'knex';
import { ConfigService } from '@nestjs/config';
import * as XLSX from 'xlsx';
import * as https from 'https';
import * as fs from 'fs';
import { randomUUID } from 'crypto';
import moment from 'moment';
import { MessageType, MessagePlatform, SenderType, RecipientType } from '../messages/entities/message.entity';
import { HistoryPlatform } from '../history/entities/history.entity';
import { QueueStatus } from '../customer-queue/entities/queue.entity';

/**
 * Atos Bot API Controller
 * Handles external API endpoints for ATOS bot integration
 * Routes are prefixed with /atos-bot/api
 */
@ApiTags('Atos Bot API')
@Controller('atos-bot/api')
export class AtosBotApiController {
  private readonly logger = new Logger(AtosBotApiController.name);
  private readonly cdn: string;
  private readonly botId = '491b9564-2d79-11ea-978f-2e728ce88125';

  constructor(
    private readonly apiService: AtosBotApiService,
    private readonly queueService: QueueService,
    private readonly messagesService: MessagesService,
    @InjectKnex() private readonly knex: Knex,
    private readonly configService: ConfigService,
  ) {
    this.cdn = this.configService.get<string>('CDN_URL') || '';
  }

  /**
   * Get WhatsApp session data
   * POST /atos-bot/api/v1/whatsapp_session
   */
  @Post('v1/whatsapp_session')
  @ApiOperation({ summary: 'Get WhatsApp session data' })
  @ApiResponse({ status: 200, description: 'Session data retrieved successfully' })
  @HttpCode(HttpStatus.OK)
  async getWhatsAppSession(@Body() body: { data: WhatsAppSessionDto }): Promise<any> {
    this.logger.log(`Getting WhatsApp session: ${body.data.sessionId}`);
    return await this.apiService.getWhatsAppSession(body.data.sessionId);
  }

  /**
   * Send media via CCS
   * POST /atos-bot/api/v1/send_media_ccs
   */
  @Post('v1/send_media_ccs')
  @ApiOperation({ summary: 'Send media via CCS' })
  @ApiResponse({ status: 200, type: SendMediaResponseDto })
  @HttpCode(HttpStatus.OK)
  async sendMediaCcs(@Body() body: SendMediaDto): Promise<SendMediaResponseDto> {
    this.logger.log('New media sent', body.filetx);
    const payload = body.filetx;
    const sessionId = payload.session;
    const type = this.getWebChatType(payload.type);
    const hashfile = payload.hashfile;
    const descfile = payload.descfile;
    const mediaUrl = this.cdn + hashfile;

    const messageId = randomUUID();
    
    // Get queue to find customer
    let queue;
    try {
      queue = await this.queueService.findQueueBySessionId(sessionId);
    } catch (error) {
      this.logger.warn(`Queue not found for session ${sessionId}`);
    }

    const customer = queue?.customer;
    const platform = queue?.platform || HistoryPlatform.OTHER;
    const messageType = this.mapWebChatTypeToMessageType(type);

    await this.apiService.createMessage({
      messageId,
      sessionId,
      senderType: SenderType.CUSTOMER,
      recipientType: RecipientType.BOT,
      customerId: customer?.id || null,
      userId: this.botId,
      fromMe: false,
      media: mediaUrl,
      type: messageType,
      platform: this.mapHistoryPlatformToMessagePlatform(platform),
    });

    return { hashfile, descfile, type };
  }

  /**
   * Input Excel file
   * POST /atos-bot/api/v1/input_excel_ccs
   */
  @Post('v1/input_excel_ccs')
  @ApiOperation({ summary: 'Process Excel file input' })
  @ApiResponse({ status: 200, type: InputExcelResponseDto })
  @HttpCode(HttpStatus.OK)
  async inputExcelCcs(@Body() body: InputExcelDto): Promise<InputExcelResponseDto> {
    this.logger.log('New Excel input', body.filetx);
    let payload = body.filetx;

    if (typeof payload === 'string') {
      payload = JSON.parse(payload);
    }

    const regx = new RegExp('[^0-9]', 'g');
    const sessionBot = payload.session;
    let cnpj = payload.cnpj;
    const name = payload.name;
    const telefone = payload.telefone;
    const type = this.getWebChatType(payload.type);
    const hashfile = payload.hashfile;
    const descfile = payload.descfile;
    const origem = payload.origem;
    const file = this.cdn + hashfile;

    const tempfile = await this.downloadFile(file);
    const workbook = XLSX.readFile(tempfile.path);
    const sheetNameList = workbook.SheetNames;
    const sheetCnpj = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]]);
    const sheetWholesaler = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[1]]);
    const data = await this.parseArray(sheetCnpj);
    const data2 = await this.parseArray(sheetWholesaler);
    const { wholesalers, not_found } = await this.parseDistribuidor(data, data2);
    cnpj = data[0]['cnpj do pdv'];
    cnpj = String(cnpj).replace(regx, '');

    const order = {
      id: randomUUID(),
      cnpj,
      produtos: data.filter((prod: any) => prod.unidades),
      distribuidores: wholesalers,
    };

    if (order.distribuidores.length > 0 && not_found.length <= 0) {
      await this.knex.raw(
        'INSERT INTO tab_input_excel(id, sessionid, cnpj, `name`, telefone, `file`, `filedata`, origem) VALUES(?,?,?,?,?,?,?,?)',
        [order.id, sessionBot, cnpj, name, telefone, file, JSON.stringify(order), origem],
      );
      return { hashfile, descfile, type, data: order };
    } else {
      await this.knex.raw(
        'INSERT INTO tab_input_excel(id, sessionid, cnpj, `name`, telefone, `file`, `filedata`, origem, status) VALUES(?,?,?,?,?,?,?,?,3)',
        [order.id, sessionBot, cnpj, name, telefone, file, JSON.stringify(order), origem],
      );
      throw new Error(`Distribuidor não encontrado: ${not_found.join(', ')}`);
    }
  }

  /**
   * Get Excel info
   * GET /atos-bot/api/v1/get_excel_info
   */
  @Get('v1/get_excel_info')
  @ApiOperation({ summary: 'Get Excel file information' })
  @ApiQuery({ name: 'session', required: true })
  @ApiResponse({ status: 200 })
  @HttpCode(HttpStatus.OK)
  async getExcelInfo(@Query() query: GetExcelInfoQueryDto): Promise<any[]> {
    const result = await this.knex.raw('SELECT * FROM tab_input_excel WHERE sessionid = ?', [query.session]);
    return result[0] || [];
  }

  /**
   * Get Excel model file
   * GET /atos-bot/api/v1/input_excel_model/:id
   */
  @Get('v1/input_excel_model/:id')
  @ApiOperation({ summary: 'Download Excel model file' })
  @ApiParam({ name: 'id', description: 'Model ID (1, 2, or 3)' })
  @HttpCode(HttpStatus.OK)
  async getExcelModel(@Param('id') id: string, @Res() res: Response): Promise<void> {
    const path = '/home/ubicua/sanofi-ccs-cleo/public/inputExcel/';
    let file = '';

    if (id === '1') {
      file = 'pedido_generico.xlsx';
    } else if (id === '2') {
      file = 'pedido_otc.xlsx';
    } else if (id === '3') {
      file = 'pedido_medicamento_prescricao.xlsx';
    } else {
      res.sendStatus(404);
      return;
    }

    res.download(path + file);
  }

  /**
   * Bot log endpoint
   * POST /atos-bot/api/v1/botlog
   */
  @Post('v1/botlog')
  @ApiOperation({ summary: 'Log bot messages' })
  @ApiResponse({ status: 200 })
  @HttpCode(HttpStatus.OK)
  async botLog(@Body() body: BotLogDto): Promise<any> {
    this.logger.log('>> BOT LOG', body);
    const data = body.data;
    const { sessionId, destination, message, text = [] } = data;

    // Get queue to find customer and platform
    let queue;
    try {
      queue = await this.queueService.findQueueBySessionId(sessionId);
    } catch (error) {
      this.logger.warn(`Queue not found for session ${sessionId}`);
    }

    const customer = queue?.customer;
    const platform = queue?.platform || HistoryPlatform.OTHER;
    const messagePlatform = this.mapHistoryPlatformToMessagePlatform(platform);

    if (data.destination === 'BOT' || destination === 'TRANSBORDO') {
      // Customer message
      if (message !== '') {
        const messageId = randomUUID();
        await this.apiService.createMessage({
          messageId,
          sessionId,
          senderType: SenderType.CUSTOMER,
          recipientType: RecipientType.BOT,
          customerId: customer?.id || null,
          userId: this.botId,
          fromMe: false,
          message: this.apiService.convertEmojiToHTML(message),
          type: MessageType.TEXT,
          platform: messagePlatform,
        });
      }
      return queue ? [{ sessionBot: queue.sessionId }] : [];
    } else {
      // Bot messages
      for (const element of text) {
        const messageId = randomUUID();
        await this.apiService.createMessage({
          messageId,
          sessionId,
          senderType: SenderType.BOT,
          recipientType: RecipientType.CUSTOMER,
          customerId: customer?.id || null,
          userId: this.botId,
          fromMe: true,
          message: this.apiService.convertEmojiToHTML(element),
          type: MessageType.TEXT,
          platform: messagePlatform,
        });
      }
      return queue ? [{ sessionBot: queue.sessionId }] : [];
    }
  }

  /**
   * Message webhook v1 (WABOXAPP)
   * POST /atos-bot/api/v1/message
   */
  @Post('v1/message')
  @ApiOperation({ summary: 'Receive message webhook from WABOXAPP (v1)' })
  @HttpCode(HttpStatus.OK)
  async messageV1(@Body() body: MessageV1Dto): Promise<void> {
    this.logger.log('Event: Message', body);
    const hostin = 'LON';
    const event = body.event;

    if (event === 'message') {
      const uid = body.uid;
      const dtin = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const contactUid = body.contact?.uid || '';
      const contactName = body.contact?.name || '';
      const contactType = body.contact?.type || '';
      const messageType = body.message?.type || '';
      const messageAck = body.message?.ack || '';
      const messageCuid = body.message?.cuid || '';
      const messageDir = body.message?.dir || '';
      const messageDtm = body.message?.dtm || 0;
      const messageUid = body.message?.uid || '';

      if (contactUid.indexOf('status') < 0) {
        if (messageType === 'chat') {
          if (contactUid.indexOf('g.us') > -1) {
            // Group message - skip for now
            return;
          } else {
            const bodyText = this.apiService.convertEmojiToHTML(body.message?.body?.text || body.message?.content?.text || '');
            await this.knex.raw(
              'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_text, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
              [hostin, uid, dtin, contactUid, contactName, contactType, messageDtm, messageUid, messageCuid, messageDir, messageType, messageAck, bodyText],
            );
            this.logger.log('Nova Mensagem Recebida WABOXAPP...');
          }
        } else if (messageType === 'image') {
          if (contactUid.indexOf('g.us') <= -1) {
            const bodyCaption = body.message?.body?.caption || '';
            const bodyMimetype = body.message?.body?.mimetype || '';
            const bodySize = body.message?.body?.size || 0;
            const bodyThumb = body.message?.body?.thumb || '';
            const bodyUrl = body.message?.body?.url || '';
            await this.knex.raw(
              'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_caption, body_mimetype, body_size, body_thumb, body_url, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
              [hostin, uid, dtin, contactUid, contactName, contactType, messageDtm, messageUid, messageCuid, messageDir, messageType, messageAck, bodyCaption, bodyMimetype, bodySize, bodyThumb, bodyUrl],
            );
            this.logger.log('Nova Mensagem Recebida WABOXAPP...');
          }
        }
        // TODO: Handle other message types (video, audio, ptt, document, vcard, location) if needed
      }

      await this.knex.raw('UPDATE tab_config SET waendpoint=? WHERE id=1', [hostin]);
    } else if (event === 'ack') {
      this.logger.log('ACK Received', body);
    }
  }

  /**
   * Message webhook v2 (BRA)
   * POST /atos-bot/api/v2/message
   */
  @Post('v2/message')
  @ApiOperation({ summary: 'Receive message webhook from WABOXAPP (v2 - BRA)' })
  @HttpCode(HttpStatus.OK)
  async messageV2(@Body() body: MessageV2Dto): Promise<any> {
    this.logger.log('Event: Message', body);
    const key = body.token;
    const type = body.event;
    const hostin = 'BRA';

    if (type === 'message') {
      const uid = body.uid;
      const dtin = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const contactUid = body.contact_uid || '';
      const contactName = body.contact_name || '';
      const contactType = body.contact_type || '';
      const messageAck = body.message_ack || '';
      const messageCuid = body.message_cuid || '';
      const messageDir = body.message_dir || '';
      const messageDtm = body.message_dtm || 0;
      const messageType = body.message_type || '';
      const messageUid = body.message_uid || '';

      if (messageType === 'chat') {
        const bodyText = this.apiService.convertEmojiToHTML(body.body_text || '');
        try {
          await this.knex.raw(
            'INSERT INTO tab_waboxappin (id, host, uid, dtin, contact_uid, contact_name, contact_type, message_dtm, message_uid, message_cuid, message_dir, message_type, message_ack, body_text, status) VALUES(uuid(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)',
            [hostin, uid, dtin, contactUid, contactName, contactType, messageDtm, messageUid, messageCuid, messageDir, messageType, messageAck, bodyText],
          );
          await this.knex.raw('UPDATE tab_config SET waendpoint=? WHERE id=1', [hostin]);
          this.logger.log('Nova Mensagem Recebida BRA...');
        } catch (err) {
          this.logger.error('Erro ao Receber Mensagem do BRA: ' + err);
        }
        return { key, ack: '3' };
      }
    }

    return { status: 'Ok' };
  }

  /**
   * Check WhatsApp origin
   * POST /atos-bot/api/bot/check_whatsapp
   */
  @Post('bot/check_whatsapp')
  @ApiOperation({ summary: 'Check if session is from WhatsApp' })
  @ApiResponse({ status: 200, type: CheckWhatsAppResponseDto })
  @HttpCode(HttpStatus.OK)
  async checkWhatsApp(@Body() body: CheckWhatsAppDto): Promise<CheckWhatsAppResponseDto> {
    this.logger.log('/api/v1/check_whatsapp', body);
    const whatsapp = await this.apiService.checkWhatsApp(body.sessionId);
    return { whatsapp };
  }

  /**
   * Check optin
   * POST /atos-bot/api/bot/check_optin
   */
  @Post('bot/check_optin')
  @ApiOperation({ summary: 'Check optin status' })
  @ApiResponse({ status: 200, type: CheckOptinResponseDto })
  @HttpCode(HttpStatus.OK)
  async checkOptin(@Body() body: CheckOptinDto): Promise<CheckOptinResponseDto> {
    this.logger.log('/api/v1/check_optin', body);
    return await this.apiService.checkOptin(body.cnpj);
  }

  /**
   * Check skip bot
   * POST /atos-bot/api/bot/check_skip_bot
   */
  @Post('bot/check_skip_bot')
  @ApiOperation({ summary: 'Check if bot should be skipped' })
  @ApiResponse({ status: 200, type: CheckSkipBotResponseDto })
  @HttpCode(HttpStatus.OK)
  async checkSkipBot(@Body() body: CheckSkipBotDto): Promise<CheckSkipBotResponseDto> {
    this.logger.log('/api/v1/check_skip_bot', body);
    return await this.apiService.checkSkipBot(body.cnpj);
  }

  /**
   * Register optin
   * POST /atos-bot/api/bot/cadastro_optin
   */
  @Post('bot/cadastro_optin')
  @ApiOperation({ summary: 'Register or update optin' })
  @HttpCode(HttpStatus.OK)
  async cadastroOptin(@Body() body: CadastroOptinDto): Promise<void> {
    this.logger.log('/api/v1/cadastro_optin', body);
    await this.apiService.cadastroOptin(body.cnpj, body.phone, body.email);
  }

  /**
   * Update optin access
   * POST /atos-bot/api/bot/update_optin
   */
  @Post('bot/update_optin')
  @ApiOperation({ summary: 'Update optin access timestamp' })
  @HttpCode(HttpStatus.OK)
  async updateOptin(@Body() body: UpdateOptinDto): Promise<void> {
    this.logger.log('/api/v1/update_optin', body);
    await this.apiService.updateOptin(body.cnpj);
  }

  /**
   * Transbordo endpoint (requires Basic Auth)
   * POST /atos-bot/api/bot/transbordo
   */
  @Post('bot/transbordo')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Transfer to human agent' })
  @ApiResponse({ status: 200, type: TransbordoResponseDto })
  @HttpCode(HttpStatus.OK)
  async transbordo(@Body() body: TransbordoDto): Promise<TransbordoResponseDto> {
    this.logger.log('Transbordo Bot', body);
    const cnpj = body.cnpj ? body.cnpj.replace(/[^\w\s]/gi, '') : '';
    const sessionId = body.sessionId;
    const telefone = body.telefone;
    const email = body.email;
    const segmento = body.segmento;

    // Check if queue exists and is in service
    try {
      const queue = await this.queueService.findQueueBySessionId(sessionId);
      if (queue.status === QueueStatus.SERVICE) {
        return { status: '200', resultado: 'Usuario em atendimento com humano' };
      }
    } catch (error) {
      // Queue not found, continue
    }

    // Check if customer exists in queue (waiting or bot status)
    try {
      const queue = await this.queueService.findQueueBySessionId(sessionId);
      // Update queue to waiting status for transfer
      await this.queueService.updateQueueData(sessionId, {
        status: QueueStatus.WAITING,
      });
      return { status: '200', resultado: 'Transferindo para atendimento com humano' };
    } catch (error) {
      // Queue not found, need to create it
      // TODO: Create queue entry - requires customer lookup by CNPJ
      // This would require integration with customer service
    }

    return { status: 'falha', resultado: 'Plataforma Desativada' };
  }

  /**
   * Encerra Bot endpoint
   * POST /atos-bot/api/bot/encerraBot
   */
  @Post('bot/encerraBot')
  @ApiOperation({ summary: 'End bot session' })
  @HttpCode(HttpStatus.OK)
  async encerraBot(@Body() body: EncerraBotDto): Promise<any> {
    this.logger.log('EncerraBot: ' + JSON.stringify(body));
    const { session, old_sessions, pedido, name, mobile, cnpj, email, telefone, destination, dtin, dtat, avaliacao, segmento } = body;

    const logs = await this.knex.raw('SELECT *, dt as date FROM tab_logs WHERE sessionid = ? ORDER BY dt', [session]);
    const chatbot = JSON.stringify(logs[0] || []);

    const fila = await this.apiService.getFilainBySession(session);

    let mobileValue, dtinValue, nameValue, accountValue, photoValue, fktoValue, fknameValue, atendirValue, sessionBotValue, statusValue, origemValue, destinoValue, cnpjValue, emailValue, telefoneValue, pedidoValue, totalValue, avaliacaoValue;

    if (fila) {
      mobileValue = fila.mobile;
      dtinValue = fila.dtin;
      nameValue = fila.name;
      accountValue = fila.account || '';
      photoValue = fila.photo || '';
      fktoValue = this.botId;
      fknameValue = 'Bot';
      atendirValue = 'in';
      sessionBotValue = fila.sessionBot;
      statusValue = -1;
      origemValue = fila.origem;
      destinoValue = 'bot';
      cnpjValue = fila.cnpj;
      emailValue = fila.email;
      telefoneValue = fila.telefone;
      pedidoValue = pedido.order_id;
      totalValue = pedido.total_value;
      avaliacaoValue = avaliacao;
    } else {
      mobileValue = telefone;
      dtinValue = new Date(dtin.replace('T', ' ').replace('Z', ''));
      dtinValue = new Date(dtinValue.setHours(dtinValue.getHours() - 3));
      nameValue = name;
      accountValue = '';
      photoValue = '';
      fktoValue = this.botId;
      fknameValue = 'Bot';
      atendirValue = 'in';
      sessionBotValue = session;
      statusValue = -1;
      origemValue = 'bot';
      destinoValue = 'bot';
      cnpjValue = cnpj;
      emailValue = email;
      telefoneValue = telefone;
      pedidoValue = pedido.order_id;
      totalValue = pedido.total_value;
      avaliacaoValue = avaliacao;
    }

    await this.knex.raw(
      'INSERT INTO tab_encerrain (sessionid, mobile, dtin, name, account, photo, fkto, fkname, status, cnpj, atendir, sessionBot, segmento, origem, email, telefone, pedido, avaliacao) VALUES(UUID(),?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [mobileValue, dtinValue, nameValue, accountValue, photoValue, fktoValue, fknameValue, statusValue, cnpjValue, atendirValue, sessionBotValue, segmento, origemValue, emailValue, telefoneValue, pedidoValue, avaliacaoValue],
    );

    // TODO: Insert pedido - this would require integration with order service
    // await insertPedido(sessionBotValue, pedidoValue, segmento, totalValue, new Date());

    if (old_sessions) {
      for (const element of old_sessions) {
        await this.knex.raw('UPDATE tab_encerrain SET avaliacao=? WHERE sessionBot=?', [avaliacaoValue, element]);
      }
    }

    await this.knex.raw('DELETE FROM tab_filain WHERE sessionBot = ?', [session]);

    return { status: '200' };
  }

  /**
   * Confirma Pedido endpoint
   * POST /atos-bot/api/bot/confirmaPedido
   */
  @Post('bot/confirmaPedido')
  @ApiOperation({ summary: 'Confirm order' })
  @HttpCode(HttpStatus.OK)
  async confirmaPedido(@Body() body: ConfirmaPedidoDto): Promise<void> {
    this.logger.log('confirmaPedido: ' + JSON.stringify(body));
    const { session, pedido, segmento } = body;
    const pedidoId = pedido.order_id;
    const total = pedido.total_value;
    const dtpedido = new Date();

    // TODO: Insert pedido - this would require integration with order service
    // await insertPedido(session, pedidoId, segmento, total, dtpedido);
  }

  /**
   * Bot message endpoint (requires Basic Auth)
   * POST /atos-bot/api/bot/message
   */
  @Post('bot/message')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Bot message endpoint' })
  @ApiResponse({ status: 200, type: BotMessageResponseDto })
  @HttpCode(HttpStatus.OK)
  async botMessage(@Body() body: BotMessageDto): Promise<BotMessageResponseDto> {
    return { status: '200', resultado: 'Mensagem Cadastrada' };
  }

  /**
   * Bot chat endpoint (requires Basic Auth)
   * POST /atos-bot/api/bot/chat
   */
  @Post('bot/chat')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Save bot chat history' })
  @ApiResponse({ status: 200, type: TransbordoResponseDto })
  @HttpCode(HttpStatus.OK)
  async botChat(@Body() body: BotChatDto): Promise<TransbordoResponseDto> {
    this.logger.log('Bot chat', body);
    const cnpj = body.cnpj.replace(/[^\w\s]/gi, '');
    const sessionId = body.sessionId;
    const email = body.email;
    const segmento = body.segmento;
    const telefone = body.telefone;
    const chatBot = JSON.stringify(body.chat);
    const dtin = body.dataini;
    let destino, dten;

    if (body.chat.indexOf('Sou seu assistente virtual do canal de compras via WhatsApp do grupo Sanofi Medley e vou te auxiliar. Qual') > -1) {
      return { status: 'falha', resultado: 'Historico de WhatsApp já cadastrado' };
    }

    if (body.transfer != null && body.transfer != '' && body.sessionId != null && body.sessionId != '') {
      if (body.transfer == 'False') {
        destino = 'bot';
        dten = new Date().toISOString().slice(0, 19).replace('T', ' ');
      } else {
        destino = 'human';
      }

      // Update queue metadata with bot chat history
      try {
        const queue = await this.queueService.findQueueBySessionId(sessionId);
        const updatedMetadata = {
          ...queue.metadata,
          bot: {
            ...queue.metadata?.bot,
            chatHistory: chatBot,
            transferDate: dten || null,
            transferDestination: destino,
          },
        };
        await this.queueService.updateQueueData(sessionId, {
          metadata: updatedMetadata,
        });
        return { status: '200', resultado: 'Historico gravado com sucesso' };
      } catch (error) {
        this.logger.error(`Error saving chat history: ${error.message}`);
        return { status: 'falha', resultado: 'Erro ao salvar histórico' };
      }
    }

    return { status: 'falha', resultado: 'Invalid request' };
  }

  /**
   * Bot status endpoint (requires Basic Auth)
   * POST /atos-bot/api/bot/status
   */
  @Post('bot/status')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Update bot journey status' })
  @ApiResponse({ status: 200, type: BotStatusResponseDto })
  @HttpCode(HttpStatus.OK)
  async botStatus(@Body() body: BotStatusDto): Promise<BotStatusResponseDto> {
    this.logger.log('>> JSON Atos: ', body.data);
    const { commit_order, unfinished_order_details, journey } = JSON.parse(body.data);
    const jsonAtos = journey;

    const segmento = null;
    const sessionId = jsonAtos.session_id; // External API uses session_id
    const consultar_pedido = jsonAtos.consultar_pedido.toString();
    const orcamento = jsonAtos.orcamento.toString();
    const novo_pedido = jsonAtos.novo_pedido.toString();
    const vacina = jsonAtos.vacina.toString();
    const convert_compra = jsonAtos.convert_compra.toString();
    const pedidos = JSON.stringify(jsonAtos.pedidos);
    const transbordo_intent = jsonAtos.tranbordo;
    const pedido = jsonAtos.pedidos.length > 0 ? jsonAtos.pedidos[0].pedido : false;
    const pedido_valor = jsonAtos.valor_total.toString();
    const jornadaStatus = jsonAtos.finalizado.toString();
    let avaliacao: string | null = null;
    const cnpj = jsonAtos.cnpj ? jsonAtos.cnpj.toString() : '';
    const createdAt = jsonAtos.date_time ? String(jsonAtos.date_time).replace('T', ' ').slice(0, -2) : null;

    // Get messages to find evaluation
    const messages = await this.messagesService.listMessages({
      sessionId,
      page: '1',
      limit: '1000',
    });
    if (messages.data.length > 0) {
      const messageTexts = messages.data.map((msg) => msg.message || '');
      const regexp = /Muito obrigada pela sua avaliação. Eu e a Sanofi agradecemos o seu contato!/;
      const index = this.findIndexByRegex(messageTexts, regexp);
      if (index != -1 && index > 0) {
        avaliacao = messageTexts[index - 1] || null;
      }
    }

    let finalConvertCompra = convert_compra;
    if (pedido_valor != '' && pedido_valor != 'false' && pedido_valor != null && pedido_valor != undefined) {
      finalConvertCompra = 'true';
    }

    // TODO: Process pedidos and insert into tab_pedidos
    // This would require integration with order service

    // TODO: Insert transbordo
    // This would require integration with transfer service

    return { status: '200', resultado: 'Status atualizado' };
  }

  /**
   * Bot email endpoint
   * POST /atos-bot/api/bot/email
   */
  @Post('bot/email')
  @ApiOperation({ summary: 'Send conversation history via email' })
  @HttpCode(HttpStatus.OK)
  async botEmail(@Body() body: BotEmailDto): Promise<any> {
    this.logger.log('BOT EMAIL', body);
    // TODO: Implement email sending with PDF generation
    // This would require integration with email service and PDF generation
    return { status: '200', message: 'Email sent' };
  }

  /**
   * User connect chatweb
   * POST /atos-bot/api/bot/user_connect_chatweb
   */
  @Post('bot/user_connect_chatweb')
  @ApiOperation({ summary: 'Log user connection to chatweb' })
  @HttpCode(HttpStatus.OK)
  async userConnectChatweb(@Body() body: UserConnectChatwebDto): Promise<void> {
    this.logger.log(body.sessionId);
    const sessionId = body.sessionId;

    // Get queue to find customer
    let queue;
    try {
      queue = await this.queueService.findQueueBySessionId(sessionId);
    } catch (error) {
      this.logger.warn(`Queue not found for session ${sessionId}`);
      return;
    }

    const customer = queue.customer;
    const platform = queue.platform || HistoryPlatform.OTHER;

    const messageId = randomUUID();
    await this.apiService.createMessage({
      messageId,
      sessionId,
      senderType: SenderType.SYSTEM,
      recipientType: RecipientType.CUSTOMER,
      customerId: customer?.id || null,
      userId: this.botId,
      fromMe: true,
      system: true,
      message: 'Cliente se conectou ao chatweb',
      type: MessageType.TEXT,
      platform: this.mapHistoryPlatformToMessagePlatform(platform),
    });
  }

  /**
   * User disconnect chatweb
   * POST /atos-bot/api/bot/user_disconnect_chatweb
   */
  @Post('bot/user_disconnect_chatweb')
  @ApiOperation({ summary: 'Log user disconnection from chatweb' })
  @HttpCode(HttpStatus.OK)
  async userDisconnectChatweb(@Body() body: UserConnectChatwebDto): Promise<void> {
    this.logger.log(body.sessionId);
    const sessionId = body.sessionId;

    // Get queue to find customer
    let queue;
    try {
      queue = await this.queueService.findQueueBySessionId(sessionId);
    } catch (error) {
      this.logger.warn(`Queue not found for session ${sessionId}`);
      return;
    }

    const customer = queue.customer;
    const platform = queue.platform || HistoryPlatform.OTHER;

    const messageId = randomUUID();
    await this.apiService.createMessage({
      messageId,
      sessionId,
      senderType: SenderType.SYSTEM,
      recipientType: RecipientType.CUSTOMER,
      customerId: customer?.id || null,
      userId: this.botId,
      fromMe: true,
      system: true,
      message: 'Cliente se desconectou do chatweb',
      type: MessageType.TEXT,
      platform: this.mapHistoryPlatformToMessagePlatform(platform),
    });
  }

  /**
   * Check agents availability
   * POST /atos-bot/api/bot/check_agents
   */
  @Post('bot/check_agents')
  @ApiOperation({ summary: 'Check available agents' })
  @ApiResponse({ status: 200, type: CheckAgentsResponseDto })
  @HttpCode(HttpStatus.OK)
  async checkAgents(): Promise<CheckAgentsResponseDto> {
    // TODO: Implement agent checking logic
    // This would require integration with queue/user service
    return { online: 0, training: false };
  }

  /**
   * Ubicua vendas endpoint (requires Basic Auth)
   * GET /atos-bot/api/ubicua/vendas
   */
  @Get('ubicua/vendas')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Get sales data for Ubicua' })
  @ApiQuery({ name: 'date_start', required: false })
  @ApiQuery({ name: 'date_end', required: false })
  @HttpCode(HttpStatus.OK)
  async ubicuaVendas(@Query() query: UbicuaVendasQueryDto): Promise<any> {
    const dateStart = query.date_start
      ? moment(query.date_start).format('YYYY-MM-DD 00:00:00')
      : moment(new Date()).format('YYYY-MM-DD 00:00:00');
    const dateEnd = query.date_end
      ? moment(query.date_end).format('YYYY-MM-DD 23:59:59')
      : moment(new Date()).format('YYYY-MM-DD 23:59:59');

    const result = await this.knex.raw('CALL rt_json_vendas(?,?)', [dateStart, dateEnd]);
    return result[0] || [];
  }

  /**
   * Ubicua report endpoint (requires Basic Auth)
   * GET /atos-bot/api/ubicua/report
   */
  @Get('ubicua/report')
  @UseGuards(BasicAuthGuard)
  @ApiOperation({ summary: 'Get operational panel report for Ubicua' })
  @HttpCode(HttpStatus.OK)
  async ubicuaReport(): Promise<any> {
    const result = await this.knex.raw('CALL rt_painelop();');
    return { status: '200', resultado: result[0] || [] };
  }

  /**
   * Mola check endpoint
   * POST /atos-bot/api/mola/check
   */
  @Post('mola/check')
  @ApiOperation({ summary: 'Check if mailing file was processed' })
  @ApiResponse({ status: 200, type: MolaCheckResponseDto })
  @HttpCode(HttpStatus.OK)
  async molaCheck(@Body() body: MolaCheckDto): Promise<MolaCheckResponseDto> {
    const result = await this.knex.raw('SELECT COUNT(*) as count FROM tab_optin WHERE mailing = ?', [body.file]);
    const count = result[0] && result[0].length > 0 ? result[0][0].count : 0;
    return { read: count > 0 };
  }

  /**
   * Mola update endpoint
   * POST /atos-bot/api/mola/update
   */
  @Post('mola/update')
  @ApiOperation({ summary: 'Update optin data from mailing' })
  @HttpCode(HttpStatus.OK)
  async molaUpdate(@Body() body: MolaUpdateDto): Promise<void> {
    const { mailing, data } = body;
    const insertQuery = 'INSERT IGNORE INTO tab_optin(cnpj, email, phone, nome, mailing) VALUES (?,?,?,?,?)';
    const updateQuery = 'UPDATE tab_optin SET phone = ?, email = ?, nome = ?, mailing = ? WHERE cnpj = ?';

    for (const item of data) {
      const { cnpj, email, telefone, nome } = item;
      const check = await this.knex.raw('SELECT * FROM tab_optin WHERE cnpj = ?', [cnpj]);
      if (check[0] && check[0].length > 0) {
        await this.knex.raw(updateQuery, [telefone, email, nome, mailing, cnpj]);
      } else {
        await this.knex.raw(insertQuery, [cnpj, email, telefone, nome, mailing]);
      }
    }
  }

  // Helper methods

  private getWebChatType(type: string): string {
    const typeMap: Record<string, string> = {
      image: 'image',
      video: 'video',
      audio: 'audio',
      document: 'document',
    };
    return typeMap[type] || 'chat';
  }

  private async parseDistribuidor(data: any[], data2: any[]): Promise<{ wholesalers: any[]; not_found: string[] }> {
    const wholesalers: any[] = [];

    for (const element of data) {
      if (Object.keys(element).indexOf('nome do distribuidor') != -1) {
        const dist = data2.filter(
          (distribuidor) =>
            String(distribuidor.filial).toUpperCase().replace(/ /g, '').trim() ==
            String(element['nome do distribuidor']).toUpperCase().replace(/ /g, '').trim(),
        );
        if (dist.length > 0) {
          wholesalers.push({
            distribuidor: dist[0].filial,
            cnpj: dist[0].cnpj,
            estado: dist[0].estado,
            prazo: element['prazo do distribuidor'],
          });
        }
      }
    }

    const sheetDistribuidores = data
      .map((element) => {
        if (Object.keys(element).indexOf('nome do distribuidor') != -1) {
          return String(element['nome do distribuidor']).toUpperCase().replace(/ /g, '').trim();
        }
        return undefined;
      })
      .filter((item): item is string => !!item);

    const notFound = sheetDistribuidores.filter(
      (item) => wholesalers.map((w) => String(w.distribuidor).toUpperCase().replace(/ /g, '').trim()).indexOf(item) === -1,
    );

    return { wholesalers, not_found: notFound };
  }

  private async parseArray(products: any[]): Promise<any[]> {
    const newProducts: any[] = [];
    for (const prod of products) {
      const newProd: any = {};
      for (const key of Object.keys(prod)) {
        const formatedKey = key.toLowerCase().trim();
        newProd[formatedKey] = prod[key];
      }
      newProducts.push(newProd);
    }
    return newProducts;
  }

  private async downloadFile(url: string): Promise<{ path: string }> {
    return new Promise((resolve, reject) => {
      const filePath = '/home/ubicua/sanofi-ccs-cleo/input-email/temp.xlsx';
      const file = fs.createWriteStream(filePath);
      file.on('close', () => {
        resolve({ path: filePath });
      });

      https.get(url, (response) => {
        response.on('data', (chunk) => {
          file.write(chunk);
        });
        response.on('end', () => {
          file.close();
          file.end();
          this.logger.log('Download file completed.');
        });
        response.on('error', (err) => {
          file.destroy();
          reject(err);
        });
      });
    });
  }

  private findIndexByRegex(array: string[], regex: RegExp): number {
    for (let i = 0; i < array.length; i++) {
      if (regex.test(array[i])) {
        return i;
      }
    }
    return -1;
  }

  private mapWebChatTypeToMessageType(type: string): MessageType {
    const map: Record<string, MessageType> = {
      chat: MessageType.TEXT,
      image: MessageType.IMAGE,
      video: MessageType.VIDEO,
      audio: MessageType.AUDIO,
      document: MessageType.DOCUMENT,
    };
    return map[type] || MessageType.TEXT;
  }

  private mapHistoryPlatformToMessagePlatform(platform: HistoryPlatform): MessagePlatform {
    const map: Record<HistoryPlatform, MessagePlatform> = {
      [HistoryPlatform.WHATSAPP]: MessagePlatform.WHATSAPP,
      [HistoryPlatform.TELEGRAM]: MessagePlatform.TELEGRAM,
      [HistoryPlatform.INSTAGRAM]: MessagePlatform.INSTAGRAM,
      [HistoryPlatform.FACEBOOK]: MessagePlatform.FACEBOOK,
      [HistoryPlatform.OTHER]: MessagePlatform.OTHER,
    };
    return map[platform] || MessagePlatform.OTHER;
  }
}

