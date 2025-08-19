export interface Customer {
    id: string;
    remoteJid: string;
    pushName?: string;
    profilePicUrl?: string;
    email?: string;
    cpf?: string;
    cnpj?: string;
    priority: number;
    isGroup: boolean;
    isSaved: boolean;
    type: 'contact';
    status: 'active' | 'inactive' | 'blocked';
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface CreateCustomerData {
    remoteJid: string;
    pushName?: string;
    profilePicUrl?: string;
    email?: string;
    cpf?: string;
    cnpj?: string;
    priority?: number;
    isGroup?: boolean;
    isSaved?: boolean;
    type?: 'contact';
    status?: 'active' | 'inactive' | 'blocked';
  }
  
  export interface UpdateCustomerData {
    remoteJid?: string;
    pushName?: string;
    profilePicUrl?: string;
    email?: string;
    cpf?: string;
    cnpj?: string;
    priority?: number;
    isGroup?: boolean;
    isSaved?: boolean;
    type?: 'contact';
    status?: 'active' | 'inactive' | 'blocked';
  }