export interface Group {
  id: string;
  evolutionGroupId: string;
  instance: string;
  subject: string;
  description?: string;
  descId?: string;
  pictureUrl?: string;
  owner: string;
  subjectOwner?: string;
  subjectTime?: number;
  creation: number;
  restrict: boolean;
  announce: boolean;
  isCommunity: boolean;
  isCommunityAnnounce: boolean;
  size: number;
  evolutionData: Record<string, any>;
  metadata: Record<string, any>;
  status: 'active' | 'inactive' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupParticipant {
  id: string;
  groupId: string;
  participantId: string;
  jid: string;
  lid?: string;
  admin?: 'superadmin' | 'admin' | null;
  role: 'owner' | 'admin' | 'member';
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
  evolutionData: Record<string, any>;
  metadata: Record<string, any>;
  status: 'active' | 'inactive' | 'removed';
  joinedAt: Date;
  updatedAt: Date;
}

export interface GroupWithParticipants extends Group {
  participants: GroupParticipant[];
}

export interface CreateGroupData {
  evolutionGroupId: string;
  instance: string;
  subject: string;
  description?: string;
  descId?: string;
  pictureUrl?: string;
  owner: string;
  subjectOwner?: string;
  subjectTime?: number;
  creation: number;
  restrict?: boolean;
  announce?: boolean;
  isCommunity?: boolean;
  isCommunityAnnounce?: boolean;
  size?: number;
  evolutionData?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: 'active' | 'inactive' | 'archived';
}

export interface CreateParticipantData {
  groupId: string;
  participantId: string;
  jid: string;
  lid?: string;
  admin?: 'superadmin' | 'admin' | null;
  role?: 'owner' | 'admin' | 'member';
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
  evolutionData?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: 'active' | 'inactive' | 'removed';
}

export interface UpdateGroupData {
  subject?: string;
  description?: string;
  descId?: string;
  pictureUrl?: string;
  subjectOwner?: string;
  subjectTime?: number;
  restrict?: boolean;
  announce?: boolean;
  isCommunity?: boolean;
  isCommunityAnnounce?: boolean;
  size?: number;
  evolutionData?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: 'active' | 'inactive' | 'archived';
}

export interface UpdateParticipantData {
  admin?: 'superadmin' | 'admin' | null;
  role?: 'owner' | 'admin' | 'member';
  name?: string;
  phoneNumber?: string;
  profilePicture?: string;
  evolutionData?: Record<string, any>;
  metadata?: Record<string, any>;
  status?: 'active' | 'inactive' | 'removed';
}

export interface GroupFilters {
  instance?: string;
  owner?: string;
  subject?: string;
  status?: 'active' | 'inactive' | 'archived';
  isCommunity?: boolean;
  announce?: boolean;
  restrict?: boolean;
  limit?: number;
  offset?: number;
}

export interface ParticipantFilters {
  groupId?: string;
  role?: 'owner' | 'admin' | 'member';
  status?: 'active' | 'inactive' | 'removed';
  limit?: number;
  offset?: number;
} 