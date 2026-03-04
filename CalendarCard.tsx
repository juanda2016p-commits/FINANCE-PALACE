import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ArrowRight, 
  CreditCard, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Repeat, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { 
  Account, 
  BillingCycle, 
  Transaction, 
  TransactionType, 
  Category 
} from '../../types';
import { categorizeExpense } from '../../services/novaService';
import { calculateCreditMetrics } from '../../utils/financeEngine';

interface TransactionFormProps {
  accounts: Account[];
  activeCycles: BillingCycle[];
  onAdd: (tx: Transaction) => void;
}

const TRANSACTION_TYPES = [
  { type: TransactionType.EXPENSE, label: 'Gasto', color: 'bg-red-100 text-red-700 border-red-200', icon: ArrowUpRight },
  { type: TransactionType.INCOME, label: 'Ingreso', color: 'bg-green-100 text-green-700 border-green-200', icon: ArrowDownLeft },
  { type: TransactionType.CREDIT_CHARGE, label: 'Cargo TC', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: CreditCard },
  { type: TransactionType.CREDIT_PAYMENT, label: 'Pago TC', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Repeat },
  { type: TransactionType.LOAN_GIVEN, label: 'Prestar', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ArrowUpRight },
  { type: TransactionType.LOAN_RECEIVED, label: 'Recibir Préstamo', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: ArrowDownLeft },
];

export default function TransactionForm({ accounts, activeCycles, onAdd }: TransactionFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>(Category.OTHER);
  const [accountId, setAccountId] = useState<string>('');
  const [targetAccountId, setTargetAccountId] = useState<string>('');
  const [isCategorizing, setIsCategorizing] = useState(false);

  // Filter accounts by type
  const debitAccounts = accounts.filter(a => a.accountType === 'debit');
  const creditAccounts = accounts.filter(a => a.accountType === 'credit');

  // Auto-select first account
  useEffect(() => {
    if (type === TransactionType.CREDIT_CHARGE) {
      if (creditAccounts.length > 0 && !accountId) setAccountId(creditAccounts[0].id);
    } else {
      if (debitAccounts.length > 0 && !accountId) setAccountId(debitAccounts[0].id);
    }
  }, [type, accounts]);

  // Auto-categorization effect
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (
        (type === TransactionType.EXPENSE || type === TransactionType.CREDIT_CHARGE) &&
        description.length >= 3
      ) {
        setIsCategorizing(true);
        try {
          const suggestedCategory = await categorizeExpense(description);
          setCategory(suggestedCategory);
        } catch (error) {
          console.error("Categorization failed", error);
        } finally {
          setIsCategorizing(false);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [description, type]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) return;
    if ((type === TransactionType.EXPENSE || type === TransactionType.CREDIT_CHARGE) && !description) return;
    if (!accountId) return;
    if (type === TransactionType.CREDIT_PAYMENT && !targetAccountId) return;

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      date: new Date(),
      type,
      amount: parseFloat(amount),
      description: description || type,
      category: (type === TransactionType.EXPENSE || type === TransactionType.CREDIT_CHARGE) ? category : Category.OTHER,
      accountId,
      targetAccountId: type === TransactionType.CREDIT_PAYMENT ? targetAccountId : undefined,
      isCreditCardExpense: type === TransactionType.CREDIT_CHARGE,
      isExcludedFromDailyAvg: false, // Default logic could be refined
      createdAt: new Date(),
      // For credit charges, we might want to link the cycle ID if we had it handy in the form context
      billingCycleId: type === TransactionType.CREDIT_CHARGE 
        ? activeCycles.find(c => c.accountId === accountId)?.id 
        : undefined
    };

    onAdd(newTx);
    
    // Reset form
    setAmount('');
    setDescription('');
    setCategory(Category.OTHER);
    setIsOpen(false);
  };

  const getCreditMetrics = () => {
    if (type !== TransactionType.CREDIT_CHARGE || !accountId) return null;
    const account = accounts.find(a => a.id === accountId);
    const cycle = activeCycles.find(c => c.accountId === accountId);
    
    if (!account || !cycle) return null;
    
    // We need to pass dummy transactions or fetch real ones to calculate accurately.
    // For this UI component, we might just want to show the static account/cycle info 
    // or rely on the hook passed down. 
    // Since we don't have the full transaction history here, we'll use the cycle's stored values if available,
    // or just show the credit limit.
    // Let's assume we want to show "Available Credit" roughly.
    
    // Simplified view:
    return {
      limit: account.creditLimit || 0,
      // This is an approximation since we don't have the live calculation here without the full hook context
      // In a real app, we'd probably pass `accountMetrics` as a prop.
    };
  };

  return (
    <div className="mb-8">
      {!isOpen ? (
        <motion.button
          layoutId="transaction-form"
          onClick={() => setIsOpen(true)}
          className="w-full bg-white rounded-xl p-4 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3 text-slate-500 group-hover:text-indigo-600 transition-colors">
            <div className="bg-indigo-50 p-2 rounded-lg group-hover:bg-indigo-100">
              <Plus className="w-6 h-6 text-indigo-600" />
            </div>
            <span className="font-medium">Registrar nuevo movimiento...</span>
          </div>
        </motion.button>
      ) : (
        <motion.div
          layoutId="transaction-form"
          className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
        >
          <form onSubmit={handleSubmit} className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-slate-800">Nuevo Movimiento</h3>
              <button 
                type="button" 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Cancelar
              </button>
            </div>

            {/* Type Selector */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {TRANSACTION_TYPES.map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setType(t.type)}
                  className={`p-2 rounded-lg border text-xs font-medium flex flex-col items-center gap-1 transition-all ${
                    type === t.type ? t.color : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Monto
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">$</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-lg font-bold text-slate-800"
                    placeholder="0.00"
                    autoFocus
                  />
                </div>
              </div>

              {/* Account Selectors */}
              <div className="grid grid-cols-1 gap-4">
                {/* Source Account */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {type === TransactionType.CREDIT_PAYMENT ? 'Desde Cuenta (Débito)' : 'Cuenta'}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                  >
                    <option value="">Seleccionar cuenta...</option>
                    {(type === TransactionType.CREDIT_CHARGE ? creditAccounts : debitAccounts).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} - ${acc.currentBalance.toLocaleString()}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Account (Only for Credit Payment) */}
                {type === TransactionType.CREDIT_PAYMENT && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Hacia Tarjeta
                    </label>
                    <select
                      value={targetAccountId}
                      onChange={(e) => setTargetAccountId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                    >
                      <option value="">Seleccionar tarjeta...</option>
                      {creditAccounts.map(acc => (
                        <option key={acc.id} value={acc.id}>
                          {acc.bankName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

                {/* Credit Metrics Display */}
                {type === TransactionType.CREDIT_CHARGE && accountId && (
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-semibold text-indigo-800 uppercase">Estado Tarjeta</span>
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                    </div>
                    {(() => {
                      const account = accounts.find(a => a.id === accountId);
                      const cycle = activeCycles.find(c => c.accountId === accountId);
                      if (account && cycle) {
                        const metrics = calculateCreditMetrics(account, [], cycle); // Pass empty transactions if we don't have them here, or rely on cycle.
                        // Ideally we need the transactions to calculate accurately. 
                        // But since we don't have them in props, we might rely on what's passed or just show static info.
                        // Wait, calculateCreditMetrics NEEDS transactions. 
                        // Let's just show the static info from the account/cycle if possible, or skip detailed metrics if we can't compute them.
                        // Actually, cycle.totalCharges/totalPayments might be enough if updated?
                        // Let's assume for now we just show the limit and balance from account object if available.
                        
                        // Better approach: Just show what we know from the Account object directly
                        // The prompt says "mostrar deuda actual y % utilización en tiempo real".
                        // We'll use account.currentBalance (which should be the debt for credit accounts) and creditLimit.
                        
                        const debt = account.currentBalance;
                        const limit = account.creditLimit || 1;
                        const utilization = (debt / limit) * 100;
                        
                        return (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-indigo-600 mb-1">Deuda Actual</p>
                              <p className="font-bold text-indigo-900">${debt.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-indigo-600 mb-1">Utilización</p>
                              <p className={`font-bold ${utilization > 30 ? 'text-orange-600' : 'text-emerald-600'}`}>
                                {utilization.toFixed(1)}%
                              </p>
                            </div>
                            <div className="col-span-2 w-full bg-indigo-200 h-1.5 rounded-full mt-1 overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${utilization > 30 ? 'bg-orange-500' : 'bg-emerald-500'}`}
                                style={{ width: `${Math.min(utilization, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      }
                      return <p className="text-xs text-indigo-500">Selecciona una tarjeta para ver detalles.</p>;
                    })()}
                  </div>
                )}

                {/* Description & Category (For Expenses/Charges) */}
              {(type === TransactionType.EXPENSE || type === TransactionType.CREDIT_CHARGE) && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Descripción
                    </label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none"
                      placeholder="Ej: Almuerzo en..."
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Categoría
                      </label>
                      {isCategorizing ? (
                        <span className="flex items-center gap-1 text-xs text-indigo-600 animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Analizando...
                        </span>
                      ) : description.length >= 3 ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <Sparkles className="w-3 h-3" />
                          Sugerencia IA
                        </span>
                      ) : null}
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as Category)}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none bg-white"
                    >
                      {Object.values(Category).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-colors mt-4 flex justify-center items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Registrar Movimiento
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
