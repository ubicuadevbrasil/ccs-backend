import { Exclude, Expose } from 'class-transformer';
import { HistoryPlatform } from '../../history/entities/history.entity';

export enum QueueStatus {
  BOT = 'bot',
  WAITING = 'waiting',
  SERVICE = 'service',
}

export interface QueueEntity {
  sessionId: string;
  customerId: string;
  userId: string;
  platform: HistoryPlatform;
  status: QueueStatus;
  createdAt: Date;
  attendedAt?: Date;
}

export class Queue implements QueueEntity {
  sessionId: string;
  customerId: string;
  userId: string;
  platform: HistoryPlatform;
  status: QueueStatus;
  createdAt: Date;
  attendedAt?: Date;

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
