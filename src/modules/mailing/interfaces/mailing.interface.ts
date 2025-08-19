export interface Mailing {
  id: string;
  name: string;
  url: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MailingWithQueues extends Mailing {
  bullQueue: BullQueueData;
}

export interface BullQueueData {
  totalJobs: number;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  jobs: BullQueueJob[];
  queueStats: BullQueueStats;
}

export interface BullQueueJob {
  id: string | number;
  status: string;
  progress: number;
  data: MailingJobData;
  createdAt: number;
  processedAt?: number;
  finishedAt?: number;
  failedReason?: string;
  attemptsMade: number;
  delay?: number;
}

export interface BullQueueStats {
  total: number;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export interface CreateMailingData {
  name: string;
  url: string;
  message: string;
}

export interface UpdateMailingData {
  name?: string;
  url?: string;
  message?: string;
}

export interface MailingContact {
  phone: string;
  cpf?: string;
  cnpj?: string;
  email?: string;
  name?: string;
  profilePicUrl?: string;
}

export interface MailingJobData {
  mailingId: string;
  fileUrl: string;
  message: string;
}
