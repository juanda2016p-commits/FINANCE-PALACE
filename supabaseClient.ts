import { motion } from 'motion/react';

export default function CalendarCard() {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex items-center justify-center text-slate-400"
    >
      <p>Calendario (Próximamente)</p>
    </motion.div>
  );
}
