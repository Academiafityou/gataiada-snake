export type UserRole = "admin" | "vendedor" | "gerente";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
}

export type NegotiationStatus =
  | "novo_lead"
  | "primeiro_contato"
  | "em_negociacao"
  | "proposta_enviada"
  | "follow_up"
  | "fechado_ganho"
  | "perdido";

export type Temperature = "quente" | "morno" | "frio" | "perdido";

export type LeadSource =
  | "indicacao"
  | "site"
  | "instagram"
  | "linkedin"
  | "google_ads"
  | "evento"
  | "ligacao_fria"
  | "outro";

export interface Client {
  id: string;
  name: string;
  company: string;
  position: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  state: string;
  leadSource: LeadSource;
  productOfInterest: string;
  estimatedValue: number;
  status: NegotiationStatus;
  temperature: Temperature;
  score: number;
  probability: number;
  lastContactDate: string;
  nextContactDate: string;
  manualNextContact: boolean;
  responsibleId: string;
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ContactChannel =
  | "whatsapp"
  | "ligacao"
  | "email"
  | "reuniao"
  | "presencial";

export interface Conversation {
  id: string;
  clientId: string;
  date: string;
  time: string;
  channel: ContactChannel;
  summary: string;
  objections: string;
  needs: string;
  nextSteps: string;
  responsible: string;
  attachments: string[];
  aiAnalysis?: AIAnalysis;
  createdAt: string;
}

export type TaskPriority = "baixa" | "media" | "alta" | "urgente";

export type TaskStatus = "pendente" | "em_andamento" | "concluida" | "cancelada";

export interface Task {
  id: string;
  clientId: string;
  title: string;
  priority: TaskPriority;
  dueDate: string;
  status: TaskStatus;
  description: string;
}

export type NotificationType =
  | "followup_vencido"
  | "contato_hoje"
  | "cliente_parado"
  | "proposta_sem_retorno"
  | "lead_esfriando";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  clientId: string;
  read: boolean;
  createdAt: string;
}

export type EventType = "followup" | "reuniao" | "ligacao" | "compromisso";

export interface CalendarEvent {
  id: string;
  clientId: string;
  title: string;
  type: EventType;
  date: string;
  startTime: string;
  endTime: string;
  description: string;
  status: "agendado" | "concluido" | "cancelado";
}

export interface AIAnalysis {
  summary: string;
  nextAction: string;
  suggestedDate: string;
  mentalTriggers: string[];
  salesTechniques: string[];
  probableObjections: string[];
  suggestedMessages: string[];
  sentiment: "positivo" | "neutro" | "negativo";
  purchaseIntent: "alto" | "medio" | "baixo";
  closingChance: number;
  upsellOpportunities: string[];
}

export type PipelineStage = NegotiationStatus;

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
}
