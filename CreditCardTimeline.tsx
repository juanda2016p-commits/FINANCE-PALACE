import { useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, Calendar, AlertTriangle } from 'lucide-react';
import { Transaction, BillingCycle } from '../../types';
import { getDailyExpenses } from '../../utils/financeEngine';

interface ProjectionsPanelProps {
  transactions: Transaction[];
  activeCycle?: BillingCycle;
  currentDebt: number;
}

export default function ProjectionsPanel({ transactions, activeCycle, currentDebt }: ProjectionsPanelProps) {
  const projection = useMemo(() => {
    if (!activeCycle) return null;

    const today = new Date();
    const cutoffDate = new Date(activeCycle.cutoffDate);
    const daysRemaining = Math.max(0, Math.ceil((cutoffDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Get daily average from last 30 days to be more accurate
    const { average } = getDailyExpenses(transactions);
    
    const projectedAdditional = average * daysRemaining;
    const projectedTotal = currentDebt + projectedAdditional;

    return {
      daysRemaining,
      average,
      projectedTotal,
      projectedAdditional
    };
  }, [transactions, activeCycle, currentDebt]);

  if (!activeCycle || !projection) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-center text-slate-400 h-48">
        <p>No hay ciclo activo para proyectar.</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
    >
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-indigo-600" />
          Proyección de Cierre
        </h3>
        <span className="text-xs font-medium bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
          {projection.daysRemaining} días restantes
        </span>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Current Pace */}
        <div className="space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Ritmo de Gasto Actual</p>
            <div className="text-2xl font-mono font-bold text-slate-900">
              ${projection.average.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              <span className="text-sm text-slate-400 font-normal ml-1">/ día</span>
            </div>
          </div>
          
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600">
            <p>
              Si continúas gastando a este ritmo, acumularás 
              <strong className="text-slate-900"> ${projection.projectedAdditional.toLocaleString()} </strong>
              más antes del corte.
            </p>
          </div>
        </div>

        {/* Projected Result */}
        <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-100 flex flex-col justify-center items-center text-center">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Deuda Proyectada al Corte</p>
          <div className="text-3xl font-mono font-bold text-indigo-900 mb-2">
            ${projection.projectedTotal.toLocaleString()}
          </div>
          
          {projection.projectedTotal > (activeCycle.targetUtilization || 0) * 1000000 ? ( // Assuming limit is roughly 1M for logic, or just generic warning
             <div className="flex items-center gap-1 text-xs text-orange-600 font-medium bg-orange-100 px-2 py-1 rounded-md">
               <AlertTriangle className="w-3 h-3" />
               Podría superar tu meta
             </div>
          ) : (
             <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium bg-emerald-100 px-2 py-1 rounded-md">
               <Calendar className="w-3 h-3" />
               Dentro de lo esperado
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
