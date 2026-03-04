import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { calculateProjections } from '../utils/financeEngine';

interface ProjectionsPanelProps {
  currentDebt: number;
  dailyAverage: number;
  cutoffDate: Date;
  creditLimit: number;
}

export function ProjectionsPanel({ currentDebt, dailyAverage, cutoffDate, creditLimit }: ProjectionsPanelProps) {
  const projections = calculateProjections(currentDebt, dailyAverage, cutoffDate, creditLimit);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-xl">🔮</span> Proyección Fin de Ciclo
      </h3>
      
      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">Si sigues gastando así...</p>
        <p className="text-2xl font-bold text-indigo-900">
          ${projections.current.available.toLocaleString()} <span className="text-sm font-normal text-gray-500">disponibles</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Basado en promedio diario de ${dailyAverage.toLocaleString()} (quedan {projections.daysRemaining} días)
        </p>
      </div>

      <div className="space-y-3">
        {/* Optimistic */}
        <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-emerald-600" />
            <div>
              <p className="text-xs font-bold text-emerald-700 uppercase">Optimista (-15%)</p>
              <p className="text-xs text-emerald-600/80">Ahorrando un poco más</p>
            </div>
          </div>
          <span className="font-mono font-bold text-emerald-700">
            ${projections.optimistic.available.toLocaleString()}
          </span>
        </div>

        {/* Conservative */}
        <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-orange-600" />
            <div>
              <p className="text-xs font-bold text-orange-700 uppercase">Conservador (+15%)</p>
              <p className="text-xs text-orange-600/80">Si te descontrolas</p>
            </div>
          </div>
          <span className="font-mono font-bold text-orange-700">
            ${projections.conservative.available.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}
