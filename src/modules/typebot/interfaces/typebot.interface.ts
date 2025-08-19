export interface TypebotOperator {
  id: string;
  name: string;
  login: string;
  email: string;
  contact: string;
  profilePicture?: string;
  status: string;
  profile: string;
  department: string;
  isOnline: boolean;
}

export interface TypebotOperatorStatus {
  operatorId: string;
  isOnline: boolean;
  lastSeen?: Date;
}

export interface TypebotSessionStatus {
  sessionId: string;
  queueId: string;
  status: 'active' | 'service' | 'waiting' | 'completed' | 'cancelled';
  operatorId?: string;
  department: string;
}

export interface GetOperatorsDto {
  department: string;
  remoteJid?: string;
}

export interface CheckOperatorStatusDto {
  operatorId: string;
}

export interface UpdateSessionStatusDto {
  sessionId?: string;
  remoteJid?: string;
  status: 'active' | 'service' | 'waiting' | 'completed' | 'cancelled';
  operatorId?: string;
  department?: string;
}

export interface ProcessChosenOperatorDto {
  sessionId?: string;
  remoteJid?: string;
  operatorPosition: number;
}

export interface CheckActiveQueueDto {
  remoteJid: string;
}

export interface TypebotAuthPayload {
  typebotId: string;
  sessionId: string;
  timestamp: number;
} 