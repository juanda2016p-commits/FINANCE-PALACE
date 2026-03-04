export type AccountType = 'debit' | 'credit';

export interface Account {
  id: string;
  bankName: string;
  accountType: AccountType;
  currentBalance: number; // For debit: actual money. For credit: ignored or used as limit reference? Spec says "currentBalance" for both, but credit has specific fields.
  creditLimit?: number;
  availableCredit?: number;
  cutoffDay?: number;
  paymentDueDay?: number;
  securityDeposit?: number;
  isActive: boolean;
  createdAt: Date;
}

export enum TransactionType {
  EXPENSE = 'EXPENSE',
  INCOME = 'INCOME',
  LOAN_GIVEN = 'LOAN_GIVEN',
  LOAN_RECEIVED = 'LOAN_RECEIVED',
  CREDIT_PAYMENT = 'CREDIT_PAYMENT',
  CREDIT_CHARGE = 'CREDIT_CHARGE',
}

export enum Category {
  FOOD_UNIVERSITY = 'Comida universidad',
  DINING_OUT = 'Salidas a comer',
  PARTNER = 'Novia',
  ENTERTAINMENT = 'Entretenimiento',
  GAS = 'Gasolina',
  SUBSCRIPTIONS = 'Suscripciones',
  GIFTS = 'Regalos',
  CLOTHING = 'Ropa',
  WELLNESS = 'Salud/Bienestar', // Mapped from "WELLNESS" in spec, assuming "Salud" or similar
  ALCOHOL = 'Licor',
  UNEXPECTED = 'Inesperados',
  OTHER = 'Otros',
  INCOME = 'Ingreso',
  LOAN_PAYMENT = 'Pago Préstamo',
  WEED = 'Weed'
}

export interface Transaction {
  id: string;
  date: Date;
  accountId: string;
  type: TransactionType;
  amount: number;
  description: string;
  category: Category;
  isCreditCardExpense: boolean;
  targetAccountId?: string;
  billingCycleId?: string;
  isExcludedFromDailyAvg: boolean;
  createdAt: Date;
}

export interface BillingCycle {
  id: string;
  accountId: string;
  startDate: Date;
  cutoffDate: Date;
  paymentDueDate: Date;
  openingBalance: number;
  closingBalance?: number;
  targetUtilization: number;
  totalCharges: number;
  totalPayments: number;
  status: 'open' | 'closed' | 'paid';
}

export enum CyclePhase {
  PAY = 'PAY',
  SPEND = 'SPEND',
  ADJUST = 'ADJUST',
  CUTOFF = 'CUTOFF',
  CONTROLLED = 'CONTROLLED',
}

export enum AlertLevel {
  INFO = 'INFO',
  WARNING = 'WARNING',
  DANGER = 'DANGER',
  SUCCESS = 'SUCCESS',
}

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  message: string;
  action?: {
    label: string;
    type: 'PAY' | 'ADJUST' | 'DETAILS' | 'DISMISS';
    payload?: any;
  };
}

export interface CycleStatus {
  phase: CyclePhase;
  message: string;
  color: string;
  action: string;
  daysRemaining: number;
}

export interface FinancialSummary {
  totalBalance: number;
  totalDebt: number;
  netWorth: number;
  monthlySpending: number;
  dailyAverage: number;
  savingsRate: number;
}

export interface FinanceState {
  accounts: Account[];
  transactions: Transaction[];
  cycles: BillingCycle[];
}

export interface FinancialContext {
  userName: string;
  currentDebt: number;
  utilizationRate: number;
  creditLimit: number;
  cyclePhase: string;
  cycleMessage: string;
  nextEventName: string;
  daysToEvent: number;
  dailyAverage: number;
  totalLiquidity: number;
}
