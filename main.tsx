import { useState, useEffect } from 'react';
import { OnboardingFlow } from './components/onboarding';
import { 
  CreditStatusCard,
  AccountsSummary,
  TransactionForm,
  TransactionList,
  AnalyticsPanel,
  ProjectionsPanel,
  AlertsPanel,
  CalendarCard,
  NovaChatPanel,
  UnifiedCreditPanel
} from './components/dashboard';
import { useFinancials } from './hooks/useFinancials';
import { getCyclePhase, getCycleStatus } from './utils/financeEngine';
import { Account, Transaction, BillingCycle, FinanceState, FinancialContext, Alert } from './types';
import { supabase } from './services/supabaseClient';

function App() {
  // Global State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [cycles, setCycles] = useState<BillingCycle[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Derived State via Hook
  const financeState: FinanceState = { accounts, transactions, cycles };
  const { summary, alerts } = useFinancials(financeState);

  // Initial Data Fetch
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const { data: accountsData, error: accountsError } = await supabase.from('accounts').select('*');
      if (accountsError) throw accountsError;
      
      const { data: transactionsData, error: transactionsError } = await supabase.from('transactions').select('*');
      if (transactionsError) throw transactionsError;
      
      const { data: cyclesData, error: cyclesError } = await supabase.from('billing_cycles').select('*');
      if (cyclesError) throw cyclesError;

      if (accountsData) {
        setAccounts(accountsData.map((a: any) => ({
          ...a,
          createdAt: new Date(a.createdAt)
        })));
      }

      if (transactionsData) {
        setTransactions(transactionsData.map((t: any) => ({
          ...t,
          date: new Date(t.date),
          createdAt: new Date(t.createdAt)
        })));
      }

      if (cyclesData) {
        setCycles(cyclesData.map((c: any) => ({
          ...c,
          startDate: new Date(c.startDate),
          cutoffDate: new Date(c.cutoffDate),
          paymentDueDate: new Date(c.paymentDueDate)
        })));
      }
    } catch (error) {
      console.error('Error fetching data from Supabase:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissAlert = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
  };

  const handleAlertAction = (alertItem: Alert) => {
    console.log('Action triggered:', alertItem.action);
    // Implement specific actions here based on alert.action.type
    if (alertItem.action?.type === 'PAY') {
      // Navigate to payment form or pre-fill transaction
      console.log('Redirigiendo a pago...');
    }
  };

  // Helper to generate initial cycles (returns them instead of setting state)
  const generateInitialCycles = (newAccounts: Account[]): BillingCycle[] => {
    const newCycles: BillingCycle[] = [];
    const today = new Date();

    newAccounts.forEach(acc => {
      if (acc.accountType === 'credit') {
        const cutoffDay = acc.cutoffDay || 18;
        const paymentDueDay = acc.paymentDueDay || 10;
        
        let startDate = new Date(today.getFullYear(), today.getMonth(), cutoffDay - 30); // Approx
        let cutoffDate = new Date(today.getFullYear(), today.getMonth(), cutoffDay);
        
        if (today.getDate() > cutoffDay) {
          // We are in a new cycle
          startDate = cutoffDate;
          cutoffDate = new Date(today.getFullYear(), today.getMonth() + 1, cutoffDay);
        }

        // Payment due date is usually next month after cutoff
        const paymentDueDate = new Date(cutoffDate.getFullYear(), cutoffDate.getMonth(), paymentDueDay);
        if (paymentDueDay < cutoffDay) {
           paymentDueDate.setMonth(paymentDueDate.getMonth() + 1);
        }

        newCycles.push({
          id: crypto.randomUUID(),
          accountId: acc.id,
          startDate,
          cutoffDate,
          paymentDueDate,
          openingBalance: 0,
          targetUtilization: 0.3, // Default 30%
          totalCharges: 0,
          totalPayments: 0,
          status: 'open'
        });
      }
    });
    
    return newCycles;
  };

  const handleOnboardingComplete = async (newAccounts: Account[]) => {
    try {
      // 1. Insert Accounts
      const { error: accountsError } = await supabase.from('accounts').insert(newAccounts);
      if (accountsError) throw accountsError;

      // 2. Generate and Insert Cycles
      const newCycles = generateInitialCycles(newAccounts);
      if (newCycles.length > 0) {
        const { error: cyclesError } = await supabase.from('billing_cycles').insert(newCycles);
        if (cyclesError) throw cyclesError;
      }

      // 3. Update Local State
      setAccounts(newAccounts);
      setCycles(prev => [...prev, ...newCycles]);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
    }
  };

  const handleAddTransaction = async (tx: Transaction) => {
    try {
      // 1. Insert Transaction
      const { error: txError } = await supabase.from('transactions').insert(tx);
      if (txError) throw txError;

      // 2. Update Local State (Optimistic for UI responsiveness)
      setTransactions(prev => [tx, ...prev]);
      
      // 3. Calculate and Update Account Balances
      // We need to update the account balance in Supabase.
      // We'll iterate through accounts to find the one to update and calculate the new balance.
      
      const accountToUpdate = accounts.find(a => a.id === tx.accountId);
      let targetAccountToUpdate = tx.targetAccountId ? accounts.find(a => a.id === tx.targetAccountId) : null;
      
      const updates: PromiseLike<any>[] = [];

      if (accountToUpdate) {
        let newBalance = accountToUpdate.currentBalance;
        
        if (accountToUpdate.accountType === 'debit') {
          if (tx.type === 'EXPENSE' || tx.type === 'LOAN_GIVEN' || tx.type === 'CREDIT_PAYMENT') {
            newBalance -= tx.amount;
          } else if (tx.type === 'INCOME' || tx.type === 'LOAN_RECEIVED') {
            newBalance += tx.amount;
          }
        } else if (accountToUpdate.accountType === 'credit') {
          if (tx.type === 'CREDIT_CHARGE') {
            newBalance += tx.amount; // Debt increases
          } else if (tx.type === 'CREDIT_PAYMENT') {
             newBalance -= tx.amount;
          }
        }

        updates.push(supabase.from('accounts').update({ currentBalance: newBalance }).eq('id', accountToUpdate.id).then());
        
        // Update local state for this account
        setAccounts(prev => prev.map(a => a.id === accountToUpdate.id ? { ...a, currentBalance: newBalance } : a));
      }

      if (targetAccountToUpdate) {
        const newTargetBalance = targetAccountToUpdate.currentBalance - tx.amount;
        updates.push(supabase.from('accounts').update({ currentBalance: newTargetBalance }).eq('id', targetAccountToUpdate.id).then());

        // Update local state for target account
        setAccounts(prev => prev.map(a => a.id === targetAccountToUpdate!.id ? { ...a, currentBalance: newTargetBalance } : a));
      }

      await Promise.all(updates);

    } catch (error) {
      console.error('Error adding transaction:', error);
      // Rollback local state if needed (omitted for brevity, but recommended in prod)
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">Cargando datos...</div>;
  }

  // If no accounts, show onboarding
  if (accounts.length === 0) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Identify active cycle (first credit account's open cycle for now, or aggregate?)
  // The UI shows "CycleBanner" which implies a single main cycle or we show one per card?
  // "CycleBanner (fase actual del ciclo)" implies a global context or the primary card.
  // Let's pick the first active credit cycle.
  const activeCycle = cycles.find(c => c.status === 'open');

  // Calculate dynamic phase info for Context
  let cyclePhaseStr = "Sin ciclo";
  let cycleMessageStr = "No hay tarjeta activa";
  
  if (activeCycle) {
      const today = new Date();
      const account = accounts.find(a => a.id === activeCycle.accountId);
      if (account) {
          const phase = getCyclePhase(today, account.cutoffDay, account.paymentDueDay);
          const daysRemaining = Math.max(0, Math.ceil((new Date(activeCycle.cutoffDate).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
          const status = getCycleStatus(phase, daysRemaining);
          
          cyclePhaseStr = status.phase;
          cycleMessageStr = status.message;
      }
  }

  const totalCreditLimit = accounts.filter(a => a.accountType === 'credit').reduce((sum, a) => sum + (a.creditLimit || 0), 0);
  const utilizationRate = totalCreditLimit > 0 ? (summary.totalDebt / totalCreditLimit) * 100 : 0;

  const userName = "Usuario";

  const financialContext: FinancialContext = {
    userName: userName,
    currentDebt: summary.totalDebt,
    utilizationRate,
    creditLimit: totalCreditLimit,
    cyclePhase: cyclePhaseStr,
    cycleMessage: cycleMessageStr,
    nextEventName: "Corte",
    daysToEvent: activeCycle ? Math.ceil((new Date(activeCycle.cutoffDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0,
    dailyAverage: summary.dailyAverage,
    totalLiquidity: summary.totalBalance
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-4 lg:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="space-y-6">
          <AccountsSummary accounts={accounts} activeCycles={cycles} />
          <TransactionForm 
            accounts={accounts} 
            activeCycles={cycles} 
            onAdd={handleAddTransaction} 
          />
        </div>

        {/* Center Column */}
        <div className="space-y-6">
          {activeCycle && accounts.find(a => a.id === activeCycle.accountId) ? (
            <UnifiedCreditPanel 
              account={accounts.find(a => a.id === activeCycle.accountId)!} 
              cycle={activeCycle}
              currentDebt={summary.totalDebt}
              creditLimit={totalCreditLimit}
              utilizationRate={utilizationRate}
            />
          ) : (
            <CreditStatusCard 
              currentDebt={summary.totalDebt}
              availableCredit={totalCreditLimit - summary.totalDebt}
              utilizationRate={utilizationRate}
            />
          )}
          
          <AnalyticsPanel transactions={transactions} accounts={accounts} />
          <ProjectionsPanel 
            transactions={transactions} 
            activeCycle={activeCycle} 
            currentDebt={summary.totalDebt} 
          />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <AlertsPanel 
            alerts={alerts.filter(a => !dismissedAlerts.includes(a.id))}
            onDismiss={handleDismissAlert}
            onAction={handleAlertAction}
          />
          <TransactionList transactions={transactions} />
          <CalendarCard />
        </div>
      </div>
      
      <NovaChatPanel financialContext={financialContext} />
    </div>
  );
}

export default App;
