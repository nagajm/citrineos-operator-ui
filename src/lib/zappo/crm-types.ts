export type LeadStage = 'new' | 'contacted' | 'demo' | 'proposal' | 'onboarding' | 'won' | 'lost';

export interface CrmLead {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  city?: string;
  state?: string;
  stage: LeadStage;
  source?: string;
  expectedStations?: number;
  notes?: string;
  convertedOperatorId?: string;
  pendingTasks?: number;
  assigneeId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmTask {
  id: string;
  title: string;
  description?: string;
  type: string;
  leadId?: string;
  operatorId?: string;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CrmComment {
  id: string;
  content: string;
  authorName?: string;
  leadId?: string;
  operatorId?: string;
  vendorId?: string;
  meetingId?: string;
  createdAt: string;
}

export interface CrmDocument {
  id: string;
  name: string;
  filename: string;
  mimeType?: string;
  size?: number;
  leadId?: string;
  operatorId?: string;
  vendorId?: string;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  category?: string;
  address?: string;
  notes?: string;
  isActive: boolean;
  assigneeId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingNote {
  id: string;
  title: string;
  content?: string;
  attendees?: string;
  leadId?: string;
  operatorId?: string;
  vendorId?: string;
  meetingAt?: string;
  assigneeId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmPlan {
  id: string;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'done';
  dueAt?: string;
  assigneeId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmUser {
  id: number;
  name: string;
  email?: string;
  role: 'super_admin' | 'admin' | 'ops' | 'sales';
  avatarColor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}