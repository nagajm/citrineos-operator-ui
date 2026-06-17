export interface VsOperator {
  id: string;
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
