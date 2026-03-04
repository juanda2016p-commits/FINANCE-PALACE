-- Create tables for the finance app

-- Accounts Table
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES auth.users(id) NOT NULL,
  "bankName" TEXT NOT NULL,
  "accountType" TEXT NOT NULL CHECK ("accountType" IN ('debit', 'credit')),
  "currentBalance" NUMERIC DEFAULT 0,
  "creditLimit" NUMERIC,
  "availableCredit" NUMERIC,
  "cutoffDay" INTEGER,
  "paymentDueDay" INTEGER,
  "securityDeposit" NUMERIC,
  "isActive" BOOLEAN DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Billing Cycles Table
CREATE TABLE IF NOT EXISTS billing_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES auth.users(id) NOT NULL,
  "accountId" UUID REFERENCES accounts(id) ON DELETE CASCADE,
  "startDate" TIMESTAMPTZ NOT NULL,
  "cutoffDate" TIMESTAMPTZ NOT NULL,
  "paymentDueDate" TIMESTAMPTZ NOT NULL,
  "openingBalance" NUMERIC DEFAULT 0,
  "closingBalance" NUMERIC,
  "targetUtilization" NUMERIC DEFAULT 0.3,
  "totalCharges" NUMERIC DEFAULT 0,
  "totalPayments" NUMERIC DEFAULT 0,
  "status" TEXT NOT NULL CHECK ("status" IN ('open', 'closed', 'paid'))
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" UUID REFERENCES auth.users(id) NOT NULL,
  "date" TIMESTAMPTZ NOT NULL,
  "accountId" UUID REFERENCES accounts(id) ON DELETE CASCADE,
  "type" TEXT NOT NULL,
  "amount" NUMERIC NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "isCreditCardExpense" BOOLEAN DEFAULT FALSE,
  "targetAccountId" UUID REFERENCES accounts(id) ON DELETE SET NULL,
  "billingCycleId" UUID REFERENCES billing_cycles(id) ON DELETE SET NULL,
  "isExcludedFromDailyAvg" BOOLEAN DEFAULT FALSE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create policies to restrict access to authenticated users
CREATE POLICY "Users can view their own accounts" ON accounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accounts" ON accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accounts" ON accounts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own billing cycles" ON billing_cycles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own billing cycles" ON billing_cycles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own billing cycles" ON billing_cycles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON transactions
  FOR UPDATE USING (auth.uid() = user_id);
