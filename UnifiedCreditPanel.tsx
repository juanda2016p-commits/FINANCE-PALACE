import { motion } from 'motion/react';
import { Account, BillingCycle } from '../../types';
import { Wallet, CreditCard, ChevronRight } from 'lucide-react';

interface AccountsSummaryProps {
  accounts: Account[];
  activeCycles: BillingCycle[];
}

export default function AccountsSummary({ accounts, activeCycles }: AccountsSummaryProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Mis Cuentas</h3>
      {accounts.map((account) => {
        const isCredit = account.accountType === 'credit';
        const cycle = isCredit ? activeCycles.find(c => c.accountId === account.id) : null;
        
        // For credit accounts, currentBalance is debt. For debit, it's available funds.
        const balanceLabel = isCredit ? 'Deuda Actual' : 'Saldo Disponible';
        const balanceColor = isCredit ? 'text-slate-800' : 'text-emerald-600';
        
        // Utilization for credit
        const utilization = isCredit && account.creditLimit 
          ? (account.currentBalance / account.creditLimit) * 100 
          : 0;

        return (
          <motion.div
            key={account.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md transition-all group cursor-pointer"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isCredit ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'}`}>
                  {isCredit ? <CreditCard className="w-5 h-5" /> : <Wallet className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">
                    {account.bankName}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    {isCredit ? `Corte día ${account.cutoffDay}` : 'Cuenta Ahorros'}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors" />
            </div>

            <div className="mt-3 pt-3 border-t border-slate-50 flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-400 mb-0.5">{balanceLabel}</p>
                <p className={`font-mono font-bold text-lg ${balanceColor}`}>
                  ${account.currentBalance.toLocaleString()}
                </p>
              </div>
              
              {isCredit && (
                <div className="text-right">
                  <p className="text-xs text-slate-400 mb-0.5">Utilización</p>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${utilization > 30 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${utilization > 30 ? 'text-orange-600' : 'text-emerald-600'}`}>
                      {utilization.toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
