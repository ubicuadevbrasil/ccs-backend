import { Expose } from 'class-transformer';

export enum TemplateStatus {
  ACTIVE = 'A',
  REJECTED = 'R',
  PENDING = 'P',
}

export enum TemplateCategory {
  MARKETING = 'MARKETING',
  UTILITY = 'UTILITY',
  AUTHENTICATION = 'AUTHENTICATION',
}

export interface TemplateButton {
  texto_botao: string;
  tipo_botao: string;
}

export interface TemplateEntity {
  id: string;
  templateCode: string;
  accounts: string[];
  buttonSample: TemplateButton[];
  category: string;
  content: string;
  status: TemplateStatus;
  statusDescription: string;
  variableSample: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export class Template implements TemplateEntity {
  id: string;
  templateCode: string;
  accounts: string[];
  buttonSample: TemplateButton[];
  category: string;
  content: string;
  status: TemplateStatus;
  statusDescription: string;
  variableSample: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<Template>) {
    Object.assign(this, partial);
  }

  @Expose()
  get isActive(): boolean {
    return this.status === TemplateStatus.ACTIVE;
  }

  @Expose()
  get isRejected(): boolean {
    return this.status === TemplateStatus.REJECTED;
  }

  @Expose()
  get isPending(): boolean {
    return this.status === TemplateStatus.PENDING;
  }

  @Expose()
  get hasButtons(): boolean {
    return this.buttonSample && this.buttonSample.length > 0;
  }

  @Expose()
  get hasVariables(): boolean {
    return this.variableSample && Object.keys(this.variableSample).length > 0;
  }

  @Expose()
  get variableCount(): number {
    return this.variableSample ? Object.keys(this.variableSample).length : 0;
  }

  @Expose()
  get buttonCount(): number {
    return this.buttonSample ? this.buttonSample.length : 0;
  }
}

