import { Exclude, Expose } from 'class-transformer';

export enum HistoryPlatform {
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  INSTAGRAM = 'instagram',
  FACEBOOK = 'facebook',
  OTHER = 'other',
}

export interface HistoryEntity {
  id: string;
  sessionId: string;
  userId?: string;
  customerId?: string;
  tabulationId?: string;
  observations?: string;
  platform: HistoryPlatform;
  startedAt: Date;
  attendedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class History implements HistoryEntity {
  id: string;
  sessionId: string;
  userId?: string;
  customerId?: string;
  tabulationId?: string;
  observations?: string;
  platform: HistoryPlatform;
  startedAt: Date;
  attendedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<History>) {
    Object.assign(this, partial);
  }

  @Expose()
  get isActive(): boolean {
    return !this.finishedAt;
  }

  @Expose()
  get isAttended(): boolean {
    return !!this.attendedAt;
  }

  @Expose()
  get isFinished(): boolean {
    return !!this.finishedAt;
  }

  @Expose()
  get duration(): number | null {
    if (!this.finishedAt) return null;
    return this.finishedAt.getTime() - this.startedAt.getTime();
  }

  @Expose()
  get attendanceTime(): number | null {
    if (!this.attendedAt) return null;
    return this.attendedAt.getTime() - this.startedAt.getTime();
  }

  @Expose()
  get hasObservations(): boolean {
    return !!this.observations;
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
