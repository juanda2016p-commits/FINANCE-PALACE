import React, { useState } from 'react';
import { Plus, Minus, Loader2, CreditCard, Wallet } from 'lucide-react';
import { categorizeExpense } from '../services/novaService';
import { Transaction, TransactionType, Category, Account } from '../types';

interface TransactionFormProps {
  accounts: Account[];
  onAddTransaction: (transaction: Omit<Transaction, 'id' | 'date' | 'createdAt'>) => void;
}

export function TransactionForm({ accounts, onAddTransaction }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>(TransactionType.CREDIT_CHARGE);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !selectedAccountId) return;

    setIsSubmitting(true);
    try {
      let category = Category.OTHER;
      
      // Auto-categorize only for expenses/charges
      if (type === TransactionType.EXPENSE || type === TransactionType.CREDIT_CHARGE) {
        category = await categorizeExpense(description || 'Gasto general');
      } else if (type === TransactionType.CREDIT_PAYMENT) {
        category = Category.LOAN_PAYMENT; // Or specific payment category
      } else if (type === TransactionType.INCOME) {
        category = Category.INCOME;
      }

      const isCreditCardExpense = type === TransactionType.CREDIT_CHARGE;
      
      // Determine exclusion from daily average
      const isExcluded = [
        Category.SUBSCRIPTIONS, 
        Category.GAS, 
        Category.CLOTHING, 
        Category.GIFTS, 
        Category.UNEXPECTED
      ].includes(category);

      onAddTransaction({
        accountId: selectedAccountId,
        type,
        amount: parseFloat(amount),
        description: description || 'Movimiento',
        category,
        isCreditCardExpense,
        isExcludedFromDailyAvg: isExcluded
      });

      // Reset form
      setAmount('');
      setDescription('');
      // Keep type and account same for convenience
    } catch (error) {
      console.error("Error adding transaction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Plus className="w-5 h-5 text-indigo-600" />
        Registrar Movimiento
      </h3>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setType(TransactionType.CREDIT_CHARGE)}
          className={`whitespace-nowrap py-2 px-4 rounded-lg text-xs font-medium transition-colors ${
            type === TransactionType.CREDIT_CHARGE
              ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500 ring-offset-1' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          Compra Crédito
        </button>
        <button
          type="button"
          onClick={() => setType(TransactionType.CREDIT_PAYMENT)}
          className={`whitespace-nowrap py-2 px-4 rounded-lg text-xs font-medium transition-colors ${
            type === TransactionType.CREDIT_PAYMENT
              ? 'bg-green-100 text-green-700 ring-2 ring-green-500 ring-offset-1' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          Pagar Tarjeta
        </button>
        <button
          type="button"
          onClick={() => setType(TransactionType.EXPENSE)}
          className={`whitespace-nowrap py-2 px-4 rounded-lg text-xs font-medium transition-colors ${
            type === TransactionType.EXPENSE
              ? 'bg-red-100 text-red-700 ring-2 ring-red-500 ring-offset-1' 
              : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
          }`}
        >
          Gasto Débito
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Account Selection */}
        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Cuenta</label>
          <select 
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.bankName} ({acc.accountType === 'credit' ? 'Crédito' : 'Débito'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Monto</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono text-lg"
              required
            />
          </div>
        </div>

        {(type === TransactionType.EXPENSE || type === TransactionType.CREDIT_CHARGE) && (
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Almuerzo, Uber, Netflix..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !amount}
          className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Procesando...
            </>
          ) : (
            'Registrar'
          )}
        </button>
      </form>
    </div>
  );
}
