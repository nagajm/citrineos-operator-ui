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

export type VsRfidCardType = 'owner' | 'customer' | 'super_admin';

export interface VsRfidTag {
  id: string;
  idToken: string;
  label?: string;
  operatorId?: string;
  linkedDriverId?: string;
  cardType: VsRfidCardType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VsPricingMode = 'standard' | 'discounted';
export type VsDiscountType = 'percent' | 'flat';

export interface VsPricingOverride {
  id: string;
  driverId: string;
  operatorId: string;
  pricingMode: VsPricingMode;
  discountType?: VsDiscountType;
  discountValue?: number;
  createdAt: string;
  updatedAt: string;
}
