import { motion } from 'motion/react';
import { getCycleStatus, getCyclePhase } from '../../utils/financeEngine';
import { BillingCycle, CyclePhase } from '../../types';
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface CycleBannerProps {
  activeCycle?: BillingCycle;
}

export default function CycleBanner({ activeCycle }: CycleBannerProps) {
  if (!activeCycle) return null;

  // Calculate phase and status
  const today = new Date();
  // Assuming activeCycle has cutoffDate and paymentDueDate
  // We need cutoffDay (number) and paymentDueDay (number) for getCyclePhase
  // Let's extract them from the dates
  const cutoffDay = new Date(activeCycle.cutoffDate).getDate();
  const paymentDueDay = new Date(activeCycle.paymentDueDate).getDate();
  
  const phase = getCyclePhase(today, cutoffDay, paymentDueDay);
  
  // Calculate days remaining based on phase
  let targetDate = new Date();
  if (phase === CyclePhase.PAY) targetDate = new Date(activeCycle.paymentDueDate);
  else if (phase === CyclePhase.SPEND || phase === CyclePhase.ADJUST) targetDate = new Date(activeCycle.cutoffDate);
  else targetDate = new Date(activeCycle.cutoffDate); // Default fallback
  
  // Adjust target date year/month if needed (simple logic for now, assuming current cycle dates are correct)
  const daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  const status = getCycleStatus(phase, daysRemaining);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`${status.color} rounded-2xl p-6 mb-6 shadow-sm border border-current/10 relative overflow-hidden`}
    >
      <div className="flex justify-between items-start relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold uppercase tracking-wider text-xs bg-white/50 px-2 py-1 rounded-md backdrop-blur-sm">
              Fase: {status.phase}
            </span>
            <span className="flex items-center gap-1 text-xs font-medium opacity-80">
              <Clock className="w-3 h-3" />
              {status.daysRemaining} días restantes
            </span>
          </div>
          <h2 className="text-xl font-bold mb-1">{status.message}</h2>
          <p className="text-sm opacity-90 mb-4 max-w-md">
            {phase === CyclePhase.PAY ? `Fecha límite de pago: ${activeCycle.paymentDueDate.toLocaleDateString()}` : 
             phase === CyclePhase.CUTOFF ? `Corte hoy: ${activeCycle.cutoffDate.toLocaleDateString()}` :
             `Próximo corte: ${activeCycle.cutoffDate.toLocaleDateString()}`}
          </p>
          
          <button className="bg-white/90 hover:bg-white text-current px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors flex items-center gap-2">
            {status.action}
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
          {phase === CyclePhase.PAY ? <AlertCircle className="w-8 h-8" /> :
           phase === CyclePhase.SPEND ? <CheckCircle className="w-8 h-8" /> :
           <Calendar className="w-8 h-8" />}
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-current opacity-5 rounded-full blur-3xl" />
    </motion.div>
  );
}
