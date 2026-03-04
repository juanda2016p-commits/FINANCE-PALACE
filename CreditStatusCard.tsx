import { 
  Transaction, 
  Account, 
  BillingCycle, 
  TransactionType, 
  Category, 
  CyclePhase, 
  Alert, 
  AlertLevel,
  CycleStatus,
  FinancialSummary
} from '../types';

// --- Constants ---
export const NON_DAILY_CATEGORIES = [
  Category.SUBSCRIPTIONS,
  Category.GAS,
  Category.CLOTHING,
  Category.GIFTS,
  Category.UNEXPECTED,
  Category.OTHER,
  Category.LOAN_PAYMENT
];

// --- Pure Functions ---

/**
 * Calculates the current phase of the credit cycle based on Nu Bank logic.
 */
export function getCyclePhase(today: Date, cutoffDay: number = 18, paymentDueDay: number = 10): CyclePhase {
  const day = today.getDate();

  // PAY: Days (paymentDueDay - 2) to paymentDueDay (e.g., 8-10)
  if (day >= paymentDueDay - 2 && day <= paymentDueDay) {
    return CyclePhase.PAY;
  }

  // SPEND: Days (paymentDueDay + 1) to (cutoffDay - 1) (e.g., 11-17)
  // Wait, spec says ADJUST is cutoffDay - 1. So SPEND is 11 to 16.
  if (day > paymentDueDay && day < cutoffDay - 1) {
    return CyclePhase.SPEND;
  }

  // ADJUST: Day (cutoffDay - 1) (e.g., 17)
  if (day === cutoffDay - 1) {
    return CyclePhase.ADJUST;
  }

  // CUTOFF: Day cutoffDay (e.g., 18)
  if (day === cutoffDay) {
    return CyclePhase.CUTOFF;
  }

  // CONTROLLED: Rest of days (e.g., 19-7)
  return CyclePhase.CONTROLLED;
}

export function getCycleStatus(phase: CyclePhase, daysRemaining: number): CycleStatus {
  switch (phase) {
    case CyclePhase.PAY:
      return {
        phase,
        message: "¡Hora de pagar! Evita intereses.",
        color: "bg-red-100 text-red-700",
        action: "Pagar Tarjeta",
        daysRemaining
      };
    case CyclePhase.SPEND:
      return {
        phase,
        message: "Uso normal. Mantén el control.",
        color: "bg-green-100 text-green-700",
        action: "Ver Gastos",
        daysRemaining
      };
    case CyclePhase.ADJUST:
      return {
        phase,
        message: "Cierre inminente. Ajusta tus gastos.",
        color: "bg-yellow-100 text-yellow-700",
        action: "Revisar Presupuesto",
        daysRemaining
      };
    case CyclePhase.CUTOFF:
      return {
        phase,
        message: "Día de corte. No uses la tarjeta hoy si es posible.",
        color: "bg-orange-100 text-orange-700",
        action: "Ver Estado de Cuenta",
        daysRemaining
      };
    case CyclePhase.CONTROLLED:
    default:
      return {
        phase,
        message: "Gasto controlado.",
        color: "bg-blue-100 text-blue-700",
        action: "Ver Proyecciones",
        daysRemaining
      };
  }
}

/**
 * Calculates credit card metrics.
 */
export function calculateCreditMetrics(
  account: Account, 
  transactions: Transaction[], 
  cycle: BillingCycle
) {
  // Filter transactions for the current active cycle
  // In a real app, we'd match billingCycleId. For now, we'll assume transactions passed are relevant or filter by date.
  // Simplified: Sum charges and payments in the current "open" cycle window.
  
  const cycleCharges = transactions
    .filter(t => t.type === TransactionType.CREDIT_CHARGE && t.accountId === account.id) // Should filter by cycle date range in a real DB
    .reduce((sum, t) => sum + t.amount, 0);

  const cyclePayments = transactions
    .filter(t => t.type === TransactionType.CREDIT_PAYMENT && t.accountId === account.id)
    .reduce((sum, t) => sum + t.amount, 0);

  // Current Debt: Sum of charges - Sum of payments. Min 0.
  // Note: This logic assumes 'openingBalance' is already accounted for or included in charges/payments logic.
  // For simplicity in this state-less-ish demo, we'll assume currentDebt is calculated from all relevant history or just current cycle if we reset.
  // Let's stick to the spec formula: sum(CREDIT_CHARGE) - sum(CREDIT_PAYMENT) of active cycle.
  // We need to add openingBalance of the cycle to be accurate.
  
  const currentDebt = Math.max(0, cycle.openingBalance + cycleCharges - cyclePayments);
  const availableCredit = (account.creditLimit || 0) - currentDebt;
  const utilizationRate = account.creditLimit ? (currentDebt / account.creditLimit) * 100 : 0;

  // Utilization Zone
  let utilizationZone = 'green';
  if (utilizationRate > 50) utilizationZone = 'red';
  else if (utilizationRate >= 30) utilizationZone = 'orange';
  else if (utilizationRate >= 21) utilizationZone = 'yellow';

  // Target Debt
  const targetDebtAtCutoff = (account.creditLimit || 0) * cycle.targetUtilization;
  const adjustmentPayment = Math.max(0, currentDebt - targetDebtAtCutoff);

  return {
    currentDebt,
    availableCredit,
    utilizationRate,
    utilizationZone,
    targetDebtAtCutoff,
    adjustmentPayment
  };
}

/**
 * Calculates daily average spending.
 */
export function calculateDailyAverage(transactions: Transaction[]): number {
  const now = new Date();
  const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const dailyExpenses = transactions.filter(t =>
    (t.type === TransactionType.EXPENSE || t.type === TransactionType.CREDIT_CHARGE) && // Include credit charges in "spending"
    t.date >= startOfCurrentMonth &&
    !t.isExcludedFromDailyAvg
  );

  const total = dailyExpenses.reduce((sum, t) => sum + t.amount, 0);
  const daysElapsed = Math.max(1, now.getDate());

  return total / daysElapsed;
}

/**
 * Calculates projections.
 */
export function calculateProjections(
  currentDebt: number, 
  dailyAvgCredit: number, 
  cutoffDate: Date,
  creditLimit: number
) {
  const today = new Date();
  const daysRemaining = Math.max(0, Math.ceil((cutoffDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const projectedSpending = dailyAvgCredit * daysRemaining;

  return {
    daysRemaining,
    current: {
      debt: currentDebt + projectedSpending,
      available: creditLimit - (currentDebt + projectedSpending)
    },
    conservative: {
      debt: currentDebt + (projectedSpending * 1.15),
      available: creditLimit - (currentDebt + (projectedSpending * 1.15))
    },
    optimistic: {
      debt: currentDebt + (projectedSpending * 0.85),
      available: creditLimit - (currentDebt + (projectedSpending * 0.85))
    }
  };
}

/**
 * Generates alerts based on rules.
 */
export function generateAlerts(
  transactions: Transaction[], 
  dailyAverage: number, 
  income: number
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date();

  // 1. Category exceeds 15% of income
  const expensesByCategory: Record<string, number> = {};
  transactions.forEach(t => {
    if ((t.type === TransactionType.EXPENSE || t.type === TransactionType.CREDIT_CHARGE) && t.date.getMonth() === now.getMonth()) {
      expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + t.amount;
    }
  });

  Object.entries(expensesByCategory).forEach(([category, amount]) => {
    if (amount > (income * 0.15)) {
      alerts.push({
        id: `cat-limit-${category}`,
        level: AlertLevel.WARNING,
        title: 'Gasto Alto por Categoría',
        message: `⚠️ Gasto en ${category} supera el 15% de tu ingreso ($${amount.toLocaleString()}).`
      });
    }
  });

  // 2. Accelerated growth
  const riskyCategories = [Category.ENTERTAINMENT, Category.ALCOHOL, Category.WEED];
  riskyCategories.forEach(cat => {
    if (expensesByCategory[cat] > 100000) {
       alerts.push({
        id: `risk-cat-${cat}`,
        level: AlertLevel.DANGER,
        title: 'Crecimiento Acelerado',
        message: `🚨 Crecimiento acelerado detectado en ${cat}.`
      });
    }
  });

  // 3. Daily average check
  if (dailyAverage > 60000) { // Adjusted threshold
    alerts.push({
      id: 'daily-avg-high',
      level: AlertLevel.WARNING,
      title: 'Promedio Diario Alto',
      message: `📊 Tu promedio diario ($${dailyAverage.toLocaleString()}) está alto.`
    });
  }

  return alerts;
}

export function calculateFinancialSummary(
  accounts: Account[],
  transactions: Transaction[],
  cycles: BillingCycle[]
): FinancialSummary {
  const totalBalance = accounts
    .filter(a => a.accountType === 'debit')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  let totalDebt = 0;
  
  // Calculate debt for each credit account based on its active cycle
  // FIX: Use account.currentBalance as the source of truth for debt.
  // The previous logic tried to reconstruct it from transactions which caused sync issues.
  totalDebt = accounts
    .filter(a => a.accountType === 'credit')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  const netWorth = totalBalance - totalDebt;
  
  const now = new Date();
  const monthlySpending = transactions
    .filter(t => (t.type === TransactionType.EXPENSE || t.type === TransactionType.CREDIT_CHARGE) && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
    .reduce((sum, t) => sum + t.amount, 0);

  const dailyAverage = calculateDailyAverage(transactions);
  
  const monthlyIncome = transactions
    .filter(t => t.type === TransactionType.INCOME && new Date(t.date).getMonth() === now.getMonth() && new Date(t.date).getFullYear() === now.getFullYear())
    .reduce((sum, t) => sum + t.amount, 0);
    
  const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlySpending) / monthlyIncome) * 100 : 0;

  return {
    totalBalance,
    totalDebt,
    netWorth,
    monthlySpending,
    dailyAverage,
    savingsRate
  };
}

// --- Analytics Functions ---

export function getExpensesByCategory(
  transactions: Transaction[], 
  month?: number, 
  year?: number
): Record<string, { total: number, percentage: number, byMonth: Record<string, number> }> {
  const targetDate = new Date();
  const targetMonth = month !== undefined ? month : targetDate.getMonth();
  const targetYear = year !== undefined ? year : targetDate.getFullYear();

  // 1. Calculate totals for the target month
  const currentMonthExpenses: Record<string, number> = {};
  let totalMonthExpense = 0;

  // 2. Calculate history for all time (for byMonth)
  const historyByCategory: Record<string, Record<string, number>> = {};

  transactions.forEach(t => {
    if (t.type !== TransactionType.EXPENSE && t.type !== TransactionType.CREDIT_CHARGE) return;
    
    const tDate = new Date(t.date);
    const tMonth = tDate.getMonth();
    const tYear = tDate.getFullYear();
    const monthKey = `${tYear}-${String(tMonth + 1).padStart(2, '0')}`;

    // Add to history
    if (!historyByCategory[t.category]) historyByCategory[t.category] = {};
    const amount = Number(t.amount) || 0;
    historyByCategory[t.category][monthKey] = (historyByCategory[t.category][monthKey] || 0) + amount;

    // Add to current month total if matches
    if (tMonth === targetMonth && tYear === targetYear) {
      currentMonthExpenses[t.category] = (currentMonthExpenses[t.category] || 0) + amount;
      totalMonthExpense += amount;
    }
  });

  // 3. Format output
  const result: Record<string, { total: number, percentage: number, byMonth: Record<string, number> }> = {};
  
  Object.keys(currentMonthExpenses).forEach(category => {
    const total = currentMonthExpenses[category];
    result[category] = {
      total,
      percentage: totalMonthExpense > 0 ? (total / totalMonthExpense) * 100 : 0,
      byMonth: historyByCategory[category] || {}
    };
  });

  // Ensure all categories from history are present even if 0 this month? 
  // The prompt implies "Categorías del mes", so maybe only active ones. 
  // But "Tabla con columnas por mes" suggests we might want to see rows for categories that had spend before.
  // For now, let's stick to categories active in the target month to keep the Pie Chart clean.
  // If needed, we can iterate historyByCategory keys.

  return result;
}

export function getDailyExpenses(
  transactions: Transaction[], 
  month?: number, 
  year?: number
) {
  const targetDate = new Date();
  const targetMonth = month !== undefined ? month : targetDate.getMonth();
  const targetYear = year !== undefined ? year : targetDate.getFullYear();

  const dailyData: Record<number, number> = {};
  let totalForAvg = 0;
  let daysForAvg = 0; // Days passed in month or total days if past month

  // Initialize all days of month to 0
  const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
  for (let i = 1; i <= daysInMonth; i++) {
    dailyData[i] = 0;
  }

  transactions.forEach(t => {
    if (t.type !== TransactionType.EXPENSE && t.type !== TransactionType.CREDIT_CHARGE) return;
    
    const tDate = new Date(t.date);
    if (tDate.getMonth() === targetMonth && tDate.getFullYear() === targetYear) {
      const day = tDate.getDate();
      const amount = Number(t.amount) || 0;
      dailyData[day] = (dailyData[day] || 0) + amount;

      // For average calculation (exclude fixed categories)
      if (!NON_DAILY_CATEGORIES.includes(t.category as Category) && !t.isExcludedFromDailyAvg) {
        totalForAvg += amount;
      }
    }
  });

  // Calculate Average
  // If current month, divide by days elapsed. If past, divide by days in month.
  const now = new Date();
  const isCurrentMonth = now.getMonth() === targetMonth && now.getFullYear() === targetYear;
  daysForAvg = isCurrentMonth ? Math.max(1, now.getDate()) : daysInMonth;
  
  const average = totalForAvg / daysForAvg;

  // Format for Recharts
  const chartData = Object.entries(dailyData).map(([day, amount]) => ({
    day: parseInt(day),
    amount
  }));

  // Find top 3 days
  const topDays = [...chartData]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3)
    .map(d => d.day);

  return {
    dailyData: chartData,
    average,
    topDays
  };
}

export function getMonthlyComparison(transactions: Transaction[], monthsToLookBack: number = 3) {
  const history: Record<string, number> = {};
  const now = new Date();

  // Initialize last X months
  for (let i = 0; i < monthsToLookBack; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    history[key] = 0;
  }

  transactions.forEach(t => {
    if (t.type !== TransactionType.EXPENSE && t.type !== TransactionType.CREDIT_CHARGE) return;
    
    const tDate = new Date(t.date);
    const key = `${tDate.getFullYear()}-${String(tDate.getMonth() + 1).padStart(2, '0')}`;
    const amount = Number(t.amount) || 0;
    
    if (history[key] !== undefined) {
      history[key] += amount;
    }
  });

  return Object.entries(history)
    .map(([month, amount]) => ({ month, amount }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getClosingData(
  accounts: Account[], 
  transactions: Transaction[],
  month?: number,
  year?: number
) {
  const now = new Date();
  const targetMonth = month !== undefined ? month : now.getMonth();
  const targetYear = year !== undefined ? year : now.getFullYear();
  const isHistorical = targetMonth !== now.getMonth() || targetYear !== now.getFullYear();

  // For balances, we only have current state. 
  // Ideally we would replay transactions to get historical balance, but for now we return current.
  // We will flag this in the UI.
  
  // Calculate metrics for the specific target month
  const monthlyTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
  });

  const monthlySpending = monthlyTransactions
    .filter(t => t.type === TransactionType.EXPENSE || t.type === TransactionType.CREDIT_CHARGE)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Daily Average for the target month
  // 1. Filter valid daily expenses
  const dailyExpensesForAvg = monthlyTransactions.filter(t => 
    (t.type === TransactionType.EXPENSE || t.type === TransactionType.CREDIT_CHARGE) &&
    !NON_DAILY_CATEGORIES.includes(t.category as Category) &&
    !t.isExcludedFromDailyAvg
  );

  const totalDailyExpense = dailyExpensesForAvg.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // 2. Determine divisor
  let daysDivisor = 1;
  if (isHistorical) {
    // Days in that month
    daysDivisor = new Date(targetYear, targetMonth + 1, 0).getDate();
  } else {
    // Days elapsed in current month
    daysDivisor = Math.max(1, now.getDate());
  }

  const dailyAverage = totalDailyExpense / daysDivisor;

  // Top 3 Categories for target month
  const expensesByCat = getExpensesByCategory(transactions, targetMonth, targetYear);
  const topCategories = Object.entries(expensesByCat)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3)
    .map(([cat, data]) => ({ category: cat, amount: data.total }));

  // Net Worth (Consolidated) - Current Snapshot
  const totalBalance = accounts
    .filter(a => a.accountType === 'debit')
    .reduce((sum, a) => sum + a.currentBalance, 0);
    
  const totalDebt = accounts
    .filter(a => a.accountType === 'credit')
    .reduce((sum, a) => sum + a.currentBalance, 0);

  return {
    accountBalances: accounts.map(a => ({ 
      name: a.bankName, 
      balance: a.accountType === 'credit' ? -(a.currentBalance) : a.currentBalance,
      type: a.accountType
    })),
    dailyAverage,
    topCategories,
    totalConsolidated: totalBalance - totalDebt,
    monthlySpending,
    monthlyIncome,
    isHistorical,
    targetLabel: new Date(targetYear, targetMonth).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  };
}
