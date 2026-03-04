import React from 'react';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertLevel } from '../types';

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        <span className="text-xl">🚨</span> Alertas Inteligentes
      </h3>
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div 
            key={alert.id}
            className={`p-3 rounded-xl border flex items-start gap-3 ${
              alert.level === AlertLevel.DANGER ? 'bg-red-50 border-red-100 text-red-800' :
              alert.level === AlertLevel.WARNING ? 'bg-amber-50 border-amber-100 text-amber-800' :
              alert.level === AlertLevel.SUCCESS ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
              'bg-blue-50 border-blue-100 text-blue-800'
            }`}
          >
            {alert.level === AlertLevel.DANGER && <AlertTriangle className="w-5 h-5 shrink-0 text-red-600" />}
            {alert.level === AlertLevel.WARNING && <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />}
            {alert.level === AlertLevel.SUCCESS && <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />}
            <p className="text-sm font-medium">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
