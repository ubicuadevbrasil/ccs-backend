import { Exclude, Expose } from 'class-transformer';
import { HistoryPlatform } from '../../history/entities/history.entity';
import { Customer } from '../../customer/entities/customer.entity';
import { User } from '../../user/entities/user.entity';
import { Message } from '../../messages/entities/message.entity';

export enum QueueStatus {
  BOT = 'bot',
  WAITING = 'waiting',
  SERVICE = 'service',
}

export interface QueueEntity {
  sessionId: string;
  customerId: string;
  customer?: Customer;
  userId: string;
  user?: User;
  platform: HistoryPlatform;
  status: QueueStatus;
  createdAt: Date;
  attendedAt?: Date;
  lastMessage?: Message;
  metadata?: Record<string, any>;
}

export class Queue implements QueueEntity {
  sessionId: string;
  customerId: string;
  customer?: Customer;
  userId: string;
  user?: User;
  platform: HistoryPlatform;
  status: QueueStatus;
  createdAt: Date;
  attendedAt?: Date;
  lastMessage?: Message;
  metadata?: Record<string, any>;

  constructor(partial: Partial<Queue>) {
    Object.assign(this, partial);
  }

  @Expose()
  get isBot(): boolean {
    return this.status === QueueStatus.BOT;
  }

  @Expose()
  get isWaiting(): boolean {
    return this.status === QueueStatus.WAITING;
  }

  @Expose()
  get isInService(): boolean {
    return this.status === QueueStatus.SERVICE;
  }

  @Expose()
  get isAttended(): boolean {
    return !!this.attendedAt;
  }

  @Expose()
  get waitingTime(): number | null {
    if (!this.attendedAt) return null;
    return this.attendedAt.getTime() - this.createdAt.getTime();
  }

  @Expose()
  get isWhatsApp(): boolean {
    return this.platform === HistoryPlatform.WHATSAPP;
  }

  @Expose()
  get isTelegram(): boolean {
    return this.platform === HistoryPlatform.TELEGRAM;
  }

  @Expose()
  get isInstagram(): boolean {
    return this.platform === HistoryPlatform.INSTAGRAM;
  }

  @Expose()
  get isFacebook(): boolean {
    return this.platform === HistoryPlatform.FACEBOOK;
  }
}
