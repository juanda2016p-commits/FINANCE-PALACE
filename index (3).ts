import React from 'react';
import { Transaction, TransactionType } from '../types';
import { ArrowDownRight, ArrowUpRight, Tag, CreditCard } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, onDelete }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 border-dashed">
        <p className="text-gray-400">No hay movimientos registrados aún.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
        <h3 className="font-bold text-gray-700">Historial Reciente</h3>
        <span className="text-xs text-gray-500">{transactions.length} movimientos</span>
      </div>
      <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
        {transactions.slice().reverse().map((t) => {
          const isExpense = t.type === TransactionType.EXPENSE || t.type === TransactionType.CREDIT_CHARGE;
          const isCredit = t.type === TransactionType.CREDIT_CHARGE || t.type === TransactionType.CREDIT_PAYMENT;
          
          return (
            <div key={t.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isExpense ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                }`}>
                  {isExpense ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{t.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{t.date.toLocaleDateString()}</span>
                    {t.category && (
                      <span className="text-[10px] px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full flex items-center gap-1">
                        <Tag className="w-3 h-3" /> {t.category}
                      </span>
                    )}
                    {isCredit && (
                      <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-600 rounded-full flex items-center gap-1">
                        <CreditCard className="w-3 h-3" /> Crédito
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-mono font-bold ${isExpense ? 'text-gray-900' : 'text-green-600'}`}>
                  {isExpense ? '-' : '+'}${t.amount.toLocaleString()}
                </p>
                <button 
                  onClick={() => onDelete(t.id)}
                  className="text-xs text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all"
                >
                  Eliminar
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
