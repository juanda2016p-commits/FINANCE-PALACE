import { motion } from 'motion/react';
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface ScoreImpactCardProps {
  utilizationRate: number;
}

export default function ScoreImpactCard({ utilizationRate }: ScoreImpactCardProps) {
  const getImpactStatus = (rate: number) => {
    if (rate <= 10) return { label: 'Excelente', color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle, message: 'Impacto Positivo' };
    if (rate <= 30) return { label: 'Bueno', color: 'text-blue-600', bg: 'bg-blue-50', icon: CheckCircle, message: 'Impacto Neutro' };
    if (rate <= 50) return { label: 'Regular', color: 'text-orange-600', bg: 'bg-orange-50', icon: AlertTriangle, message: 'Impacto Leve' };
    return { label: 'Alto Riesgo', color: 'text-red-600', bg: 'bg-red-50', icon: XCircle, message: 'Impacto Negativo' };
  };

  const status = getImpactStatus(utilizationRate);
  const Icon = status.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-800">Impacto en Score</h3>
      </div>

      <div className={`rounded-xl p-4 border ${status.bg} border-opacity-50 flex items-center gap-4`}>
        <div className={`p-2 rounded-full bg-white shadow-sm ${status.color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <p className={`text-sm font-bold ${status.color}`}>{status.label}</p>
          <p className="text-xs text-slate-600">{status.message}</p>
        </div>
        <div className="ml-auto text-right">
           <span className="text-2xl font-mono font-bold text-slate-900">{utilizationRate.toFixed(1)}%</span>
           <p className="text-[10px] text-slate-500 uppercase">Utilización</p>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-slate-500 text-center">
        Mantén tu utilización bajo el 30% para mejorar tu puntaje crediticio.
      </div>
    </motion.div>
  );
}
