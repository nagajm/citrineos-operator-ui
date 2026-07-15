export interface VsOperator {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  isActive: boolean;
  gstEnabled?: boolean;
  gstin?: string | null;
  commissionPercent?: number | null;
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

export interface VsPlatformSettings {
  gstRatePercent: number;
  platformCommissionPercent: number;
  sellerGstin: string | null;
  sellerLegalName: string | null;
  sellerAddress: string | null;
  updatedAt: string;
}

export interface VsOperatorEarnings {
  operatorId: number;
  operatorName: string;
  totalSessions: number;
  totalKwh: number;
  grossCollected: number;
  gstCollected: number;
  platformCommission: number;
  payoutOwed: number;
}

export interface VsAdminDriver {
  id: number;
  phone: string;
  name?: string | null;
  email?: string | null;
  isVerified: boolean;
  createdAt: string;
}

export interface VsAdminDriverListResponse {
  data: VsAdminDriver[];
  total: number;
  page: number;
  limit: number;
}

export interface VsWalletTransaction {
  id: number;
  walletId: number;
  amount: number | string;
  type: 'credit' | 'debit';
  description?: string;
  referenceId?: string;
  status: string;
  createdAt: string;
}

export interface VsAdminWallet {
  id: number;
  driverId: number;
  balance: number | string;
  currency: string;
  transactions: VsWalletTransaction[];
}

export interface VsAdminSession {
  id: number;
  transactionId?: string;
  stationId: number;
  ocppConnectionName?: string;
  isActive: boolean;
  chargingState?: string;
  totalKwh?: number | string;
  totalCost?: number | string;
  amount?: number | string;
  gstRatePercent?: number | string;
  gstAmount?: number | string;
  commissionRatePercent?: number | string;
  commissionAmount?: number | string;
  payoutAmount?: number | string;
  startTime?: string;
  endTime?: string;
}

export interface VsStatementLine {
  sessionId: number;
  stationId: number;
  startedAt: string;
  endedAt: string | null;
  totalKwh: number;
  ratePerKwh: number;
  amount: number;
  gstRatePercent: number;
  gstAmount: number;
  totalAmount: number;
  commissionRatePercent: number;
  commissionAmount: number;
  payoutAmount: number;
}

export interface VsStatementTotals {
  totalSessions: number;
  totalKwh: number;
  grossAmount: number;
  gstAmount: number;
  totalAmount: number;
  commissionAmount: number;
  payoutAmount: number;
}

export interface VsOperatorStatement {
  operatorId: number;
  startDate: string | null;
  endDate: string | null;
  transactions: VsStatementLine[];
  totals: VsStatementTotals;
}

export interface VsOperatorInvoice {
  id: number;
  invoiceNumber: string;
  operatorId: number;
  periodStart: string;
  periodEnd: string;
  totalKwh: number | string;
  grossAmount: number | string;
  gstAmount: number | string;
  commissionAmount: number | string;
  payoutAmount: number | string;
  generatedAt: string;
}

export type VsLedgerAccountType =
  | 'asset'
  | 'liability'
  | 'equity'
  | 'revenue'
  | 'expense';

export interface VsLedgerAccount {
  id: number;
  code: string;
  name: string;
  type: VsLedgerAccountType;
  isActive: boolean;
}

export interface VsJournalEntryLine {
  account: string;
  accountName: string;
  debit: number | string;
  credit: number | string;
}

export interface VsJournalEntry {
  id: number;
  date: string;
  description: string;
  source: string | null;
  sourceId: string | null;
  lines: VsJournalEntryLine[];
}

export interface VsTrialBalanceRow {
  code: string;
  name: string;
  type: VsLedgerAccountType;
  totalDebit: number;
  totalCredit: number;
  balance: number;
}

export interface VsProfitAndLoss {
  from: string;
  to: string;
  revenue: { code: string; name: string; amount: number }[];
  expenses: { code: string; name: string; amount: number }[];
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
}

export interface VsBalanceSheet {
  asOf: string;
  assets: VsTrialBalanceRow[];
  liabilities: VsTrialBalanceRow[];
  equity: VsTrialBalanceRow[];
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  balanced: boolean;
}
