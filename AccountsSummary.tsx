import { useMemo } from 'react';
import { FinanceState } from '../types';
import { 
  calculateFinancialSummary 
} from '../utils/financeEngine';
import { generateAlerts } from '../utils/alertEngine';

export function useFinancials(state: FinanceState) {
  const summary = useMemo(() => {
    return calculateFinancialSummary(state.accounts, state.transactions, state.cycles);
  }, [state.accounts, state.transactions, state.cycles]);

  const alerts = useMemo(() => {
    const now = new Date();
    return generateAlerts(state.accounts, state.transactions, state.cycles, now);
  }, [state.accounts, state.transactions, state.cycles]);

  return {
    summary,
    alerts
  };
}
