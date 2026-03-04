import { motion } from 'motion/react';
import { TrendingUp, AlertTriangle, CheckCircle, AlertOctagon } from 'lucide-react';

interface CreditStatusCardProps {
  currentDebt: number;
  availableCredit: number;
  utilizationRate: number;
}

export default function CreditStatusCard({ currentDebt, availableCredit, utilizationRate }: CreditStatusCardProps) {
  // Determine zone and color
  let zone = 'ÓPTIMO';
  let colorClass = 'text-emerald-400';
  let bgClass = 'bg-emerald-400/20';
  let progressColor = 'bg-emerald-400';
  let Icon = CheckCircle;

  if (utilizationRate > 50) {
    zone = 'PELIGRO';
    colorClass = 'text-red-400';
    bgClass = 'bg-red-400/20';
    progressColor = 'bg-red-500';
    Icon = AlertOctagon;
  } else if (utilizationRate > 30) {
    zone = 'RIESGO';
    colorClass = 'text-orange-400';
    bgClass = 'bg-orange-400/20';
    progressColor = 'bg-orange-500';
    Icon = AlertTriangle;
  } else if (utilizationRate > 20) {
    zone = 'PRECAUCIÓN';
    colorClass = 'text-yellow-400';
    bgClass = 'bg-yellow-400/20';
    progressColor = 'bg-yellow-500';
    Icon = TrendingUp;
  }

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden mb-6">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/20 rounded-full -ml-12 -mb-12 blur-xl" />

      <div className="relative z-10">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-indigo-200 text-sm font-medium uppercase tracking-wider mb-1">Deuda Total</h3>
            <motion.div 
              key={currentDebt}
              initial={{ opacity: 0.5, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold tracking-tight"
            >
              ${currentDebt.toLocaleString()}
            </motion.div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide ${bgClass} ${colorClass} border border-white/10`}>
            <Icon className="w-3.5 h-3.5" />
            {zone}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-indigo-200">Utilización de Crédito</span>
              <span className={`font-bold ${colorClass}`}>{utilizationRate.toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-indigo-950/50 rounded-full overflow-hidden border border-white/5">
              <motion.div 
                className={`h-full ${progressColor} shadow-[0_0_10px_rgba(255,255,255,0.3)]`}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(utilizationRate, 100)}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-white/10 flex justify-between items-center">
            <span className="text-indigo-200 text-sm">Cupo Disponible</span>
            <span className="font-mono font-medium text-lg">${availableCredit.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
