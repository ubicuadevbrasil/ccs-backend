import { MessagePlatform, MessageType } from '../../messages/entities/message.entity';
import { OtimaMessageMapperService } from './otima-mapper';

describe('OtimaMessageMapperService', () => {
  it('should map basic text webhook payload', () => {
    const mapper = new OtimaMessageMapperService();
    const payload = {
      message_id: 'msg-1',
      phone: '5511999999999',
      username: 'Test User',
      type: 'message',
      date: Date.now(),
      payload: {
        type: 'text',
        body: 'hello world',
      },
    };
    const result = mapper.mapToPlatformMessageData(
      {
        data: payload,
        customer: { id: 'cust-1', isGroup: false },
        sessionId: 'sess-1',
      },
      MessagePlatform.WHATSAPP,
    );
    expect(result.messageId).toBe('msg-1');
    expect(result.type).toBe(MessageType.TEXT);
    expect(result.message).toBe('hello world');
    expect(result.platform).toBe(MessagePlatform.WHATSAPP);
  });
});


