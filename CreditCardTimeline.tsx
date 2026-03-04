import { motion } from 'motion/react';
import { Transaction, TransactionType } from '../../types';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Repeat, 
  Clock, 
  MoreHorizontal 
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  // Sort by date desc
  const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

  // Group by date
  const grouped: Record<string, Transaction[]> = {};
  sorted.forEach(t => {
    const dateStr = new Date(t.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
    if (!grouped[dateStr]) grouped[dateStr] = [];
    grouped[dateStr].push(t);
  });

  const getIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.EXPENSE: return <ArrowUpRight className="w-4 h-4 text-red-500" />;
      case TransactionType.INCOME: return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
      case TransactionType.CREDIT_CHARGE: return <CreditCard className="w-4 h-4 text-indigo-500" />;
      case TransactionType.CREDIT_PAYMENT: return <Repeat className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getBadgeColor = (type: TransactionType) => {
    switch (type) {
      case TransactionType.EXPENSE: return 'bg-red-50 text-red-700 border-red-100';
      case TransactionType.INCOME: return 'bg-green-50 text-green-700 border-green-100';
      case TransactionType.CREDIT_CHARGE: return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      case TransactionType.CREDIT_PAYMENT: return 'bg-blue-50 text-blue-700 border-blue-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-slate-800">Últimos Movimientos</h3>
        <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors">
          <MoreHorizontal className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([date, txs]) => (
          <div key={date}>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 sticky top-0 bg-white z-10 py-1">
              {date}
            </h4>
            <div className="space-y-3">
              {txs.map((tx, idx) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center justify-between group py-2 hover:bg-slate-50 rounded-lg px-2 -mx-2 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full border ${getBadgeColor(tx.type)} bg-opacity-50`}>
                      {getIcon(tx.type)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800 text-sm line-clamp-1">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                          {tx.category}
                        </span>
                        {tx.isCreditCardExpense && (
                          <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-wide">
                            TC
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-mono font-bold text-sm ${
                      tx.type === TransactionType.INCOME || tx.type === TransactionType.LOAN_RECEIVED 
                        ? 'text-green-600' 
                        : 'text-slate-800'
                    }`}>
                      {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ))}

        {sorted.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No hay movimientos recientes</p>
          </div>
        )}
      </div>
    </div>
  );
}
