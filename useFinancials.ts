import React from 'react';
import { CreditCard, Wallet, TrendingUp, AlertCircle } from 'lucide-react';
import { Account, BillingCycle, CyclePhase } from '../types';

interface AccountSummaryProps {
  creditAccount: Account;
  debitAccount: Account;
  creditMetrics: {
    currentDebt: number;
    availableCredit: number;
    utilizationRate: number;
    utilizationZone: string;
    targetDebtAtCutoff: number;
    adjustmentPayment: number;
  };
  cyclePhase: CyclePhase;
}

export function AccountSummary({ creditAccount, debitAccount, creditMetrics, cyclePhase }: AccountSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      {/* Credit Card Card */}
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-800 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        
        <div className="flex items-center justify-between mb-6 opacity-90">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            <span className="text-sm font-medium tracking-wider uppercase">{creditAccount.bankName}</span>
          </div>
          <span className="px-2 py-1 bg-white/10 rounded text-xs font-mono">{cyclePhase}</span>
        </div>

        <div className="space-y-6 relative z-10">
          <div>
            <p className="text-indigo-200 text-xs uppercase tracking-wider mb-1">Deuda Actual</p>
            <p className="text-4xl font-mono font-bold tracking-tight">
              ${creditMetrics.currentDebt.toLocaleString()}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-indigo-200 text-xs uppercase tracking-wider mb-1">Disponible</p>
              <p className="text-lg font-mono font-medium text-emerald-300">
                ${creditMetrics.availableCredit.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-indigo-200 text-xs uppercase tracking-wider mb-1">Utilización</p>
              <div className="flex items-center gap-2">
                <p className={`text-lg font-mono font-medium ${
                  creditMetrics.utilizationZone === 'red' ? 'text-red-300' : 
                  creditMetrics.utilizationZone === 'orange' ? 'text-orange-300' : 'text-white'
                }`}>
                  {creditMetrics.utilizationRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-indigo-300 mb-1">
            <span>Límite ${creditAccount.creditLimit?.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-indigo-950/50 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                creditMetrics.utilizationZone === 'red' ? 'bg-red-500' : 
                creditMetrics.utilizationZone === 'orange' ? 'bg-orange-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(creditMetrics.utilizationRate, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Debit/Cash Card */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-6 text-gray-700">
            <Wallet className="w-5 h-5" />
            <h3 className="font-semibold">{debitAccount.bankName} (Débito)</h3>
          </div>
          
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Saldo Disponible</p>
            <p className="text-3xl font-bold text-gray-900">
              ${debitAccount.currentBalance.toLocaleString()}
            </p>
          </div>
        </div>

        {creditMetrics.adjustmentPayment > 0 && (
          <div className="mt-6 bg-orange-50 border border-orange-100 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-orange-800">Ajuste Sugerido</p>
                <p className="text-xs text-orange-700 mt-1">
                  Paga <strong>${creditMetrics.adjustmentPayment.toLocaleString()}</strong> antes del día 18 para cumplir la meta del 15%.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
