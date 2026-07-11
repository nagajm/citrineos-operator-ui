export interface VsOperator {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  isActive: boolean;
  createdAt: string;
}

export interface VsStation {
  id: number;
  ocppConnectionName: string;
  isOnline: boolean;
  location?: { name: string; city?: string };
}

export interface VsCreateOperatorBody {
  name: string;
  email: string;
  password: string;
  phone?: string;
  company?: string;
  initialBillingRate?: number;
}

export type VsRfidCardType = 'owner' | 'customer' | 'super_admin';

export interface VsRfidTag {
  id: number;
  idToken: string;
  label?: string;
  operatorId?: number;
  linkedDriverId?: number;
  cardType: VsRfidCardType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

