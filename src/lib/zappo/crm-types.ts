export type LeadStage = 'new' | 'contacted' | 'demo' | 'proposal' | 'onboarding' | 'won' | 'lost';

export interface CrmLead {
  id: number;
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
  stationLocation?: string;
  convertedOperatorId?: string;
  pendingTasks?: number;
  assigneeId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuotationItem {
  id?: string;
  description: string;
  hsnCode?: string;
  unit: string;
  qty: number;
  unitCost?: number | null;
  unitPrice: number;
  gstPercent: number;
  showInPdf: boolean;
  order?: number;
}

export interface Quotation {
  id: number;
  leadId: number;
  quotationNumber?: string;
  title: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil?: string | null;
  notes?: string | null;
  termsAndConditions?: string | null;
  discountPercent: number;
  items: QuotationItem[];
  pdfPath?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmTask {
  id: number;
  title: string;
  description?: string;
  type: string;
  leadId?: number;
  operatorId?: string;
  dueAt?: string;
  completedAt?: string;
  createdAt: string;
}

export interface CrmComment {
  id: number;
  content: string;
  authorName?: string;
  leadId?: number;
  operatorId?: string;
  vendorId?: number;
  meetingId?: number;
  createdAt: string;
}

export interface CrmDocument {
  id: number;
  type: 'file' | 'url' | 'text';
  name: string;
  description?: string;
  filename?: string;
  mimeType?: string;
  size?: number;
  url?: string;
  content?: string;
  leadId?: number;
  operatorId?: string;
  vendorId?: number;
  createdAt: string;
}

export interface KnowledgeFile {
  id: number;
  knowledgeId: number;
  name: string;
  filename: string;
  mimeType?: string;
  size?: number;
  createdAt: string;
}

export interface KnowledgeEntry {
  id: number;
  title: string;
  content?: string;
  links: Array<{ label?: string; url: string }>;
  files: KnowledgeFile[];
  createdAt: string;
  updatedAt: string;
}

export interface Vendor {
  id: number;
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
  id: number;
  title: string;
  content?: string;
  attendees?: string;
  leadId?: number;
  operatorId?: string;
  vendorId?: number;
  meetingAt?: string;
  assigneeId?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmTag {
  id: number;
  name: string;
  color: string;
  createdAt: string;
}

export interface CrmPlan {
  id: number;
  title: string;
  description?: string;
  status: 'open' | 'in_progress' | 'done';
  dueAt?: string;
  assigneeId?: number | null;
  tags?: CrmTag[];
  createdAt: string;
  updatedAt: string;
}

export interface CrmProductSection {
  id?: number;
  productId?: number;
  title: string;
  body?: string;
  order: number;
  createdAt?: string;
}

export interface CrmProductBomItem {
  id?: number;
  productId?: number;
  description: string;
  hsnCode?: string;
  unit: string;
  qty: number;
  unitCost?: number | null;
  unitPrice: number;
  gstPercent: number;
  order: number;
  createdAt?: string;
}

export interface CrmProduct {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  imageFilePath?: string;
  bomVisibility: 'private' | 'public';
  isActive: boolean;
  itemCount?: number;
  totalPrice?: number;
  totalCost?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductWithDetails extends CrmProduct {
  sections: CrmProductSection[];
  bomItems: CrmProductBomItem[];
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
