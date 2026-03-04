import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, Check, CreditCard, Wallet, AlertCircle } from 'lucide-react';
import { Account, AccountType } from '../../types';

interface OnboardingFlowProps {
  onComplete: (accounts: Account[]) => void;
}

type Step = 'welcome' | 'count' | 'details' | 'confirmation';

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState<Step>('welcome');
  const [accountCount, setAccountCount] = useState(1);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const [accounts, setAccounts] = useState<Partial<Account>[]>([]);
  
  // Form state for current account
  const [formData, setFormData] = useState<Partial<Account>>({
    accountType: 'debit',
    currentBalance: 0,
    isActive: true
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleStart = () => setStep('count');

  const handleCountSelect = (count: number) => {
    setAccountCount(count);
    setStep('details');
    setCurrentAccountIndex(0);
    setAccounts([]);
    setFormData({
      accountType: 'debit',
      currentBalance: 0,
      isActive: true
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.bankName?.trim()) newErrors.bankName = 'El nombre del banco es requerido';
    if (formData.currentBalance === undefined || formData.currentBalance < 0) newErrors.currentBalance = 'El saldo debe ser mayor o igual a 0';

    if (formData.accountType === 'credit') {
      if (!formData.creditLimit || formData.creditLimit <= 0) newErrors.creditLimit = 'El cupo total es requerido';
      
      if (!formData.cutoffDay || formData.cutoffDay < 1 || formData.cutoffDay > 28) {
        newErrors.cutoffDay = 'Día de corte inválido (1-28)';
      }
      
      if (!formData.paymentDueDay || formData.paymentDueDay < 1 || formData.paymentDueDay > 28) {
        newErrors.paymentDueDay = 'Día de pago inválido (1-28)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextAccount = () => {
    if (!validateForm()) return;

    const newAccount = { ...formData, id: crypto.randomUUID(), createdAt: new Date() } as Account;
    const updatedAccounts = [...accounts, newAccount];
    setAccounts(updatedAccounts);

    if (currentAccountIndex + 1 < accountCount) {
      setCurrentAccountIndex(prev => prev + 1);
      setFormData({
        accountType: 'debit',
        currentBalance: 0,
        isActive: true
      });
    } else {
      setStep('confirmation');
    }
  };

  const handleFinish = () => {
    onComplete(accounts as Account[]);
  };

  const updateFormData = (field: keyof Account, value: any) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Auto-fill credit limit if security deposit is set
      if (field === 'securityDeposit' && prev.accountType === 'credit' && value > 0) {
        newData.creditLimit = value;
      }
      
      return newData;
    });
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Progress Bar */}
        {step !== 'welcome' && (
          <div className="bg-slate-100 h-2 w-full">
            <motion.div 
              className="h-full bg-indigo-600"
              initial={{ width: 0 }}
              animate={{ 
                width: step === 'count' ? '25%' 
                  : step === 'details' ? `${25 + ((currentAccountIndex + 1) / accountCount) * 50}%` 
                  : '100%' 
              }}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 'welcome' && (
            <motion.div 
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-12 text-center bg-gradient-to-br from-indigo-900 to-indigo-700 text-white"
            >
              <div className="mb-6 inline-flex p-4 bg-white/10 rounded-full backdrop-blur-sm">
                <Wallet className="w-16 h-16 text-indigo-200" />
              </div>
              <h1 className="text-5xl font-bold mb-4 tracking-tight">NOVA</h1>
              <p className="text-xl text-indigo-100 mb-8 max-w-md mx-auto">
                Tu asistente financiero inteligente para optimizar tu crédito y controlar tus gastos.
              </p>
              <button 
                onClick={handleStart}
                className="bg-white text-indigo-900 px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-50 transition-colors flex items-center gap-2 mx-auto"
              >
                Empezar mi historial crediticio
                <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {step === 'count' && (
            <motion.div 
              key="count"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                ¿Cuántas cuentas manejas?
              </h2>
              <div className="grid grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => handleCountSelect(num)}
                    className="aspect-square rounded-xl border-2 border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-2xl font-bold text-slate-600 hover:text-indigo-700 transition-all"
                  >
                    {num}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div 
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">
                  Configurar Cuenta {currentAccountIndex + 1} de {accountCount}
                </h2>
                <span className="text-sm font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                  Paso 2
                </span>
              </div>

              <div className="space-y-6">
                {/* Bank Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Banco</label>
                  <input
                    type="text"
                    value={formData.bankName || ''}
                    onChange={(e) => updateFormData('bankName', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                    placeholder="Ej: Nu Bank, Bancolombia..."
                  />
                  {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
                </div>

                {/* Account Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Cuenta</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => updateFormData('accountType', 'debit')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        formData.accountType === 'debit' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <Wallet className="w-6 h-6" />
                      <span className="font-medium">Débito / Ahorros</span>
                    </button>
                    <button
                      onClick={() => updateFormData('accountType', 'credit')}
                      className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                        formData.accountType === 'credit' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <CreditCard className="w-6 h-6" />
                      <span className="font-medium">Crédito</span>
                    </button>
                  </div>
                </div>

                {/* Balance */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    {formData.accountType === 'credit' ? 'Saldo Actual (Deuda)' : 'Saldo Disponible'}
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                    <input
                      type="number"
                      value={formData.currentBalance}
                      onChange={(e) => updateFormData('currentBalance', parseFloat(e.target.value))}
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  {errors.currentBalance && <p className="text-red-500 text-sm mt-1">{errors.currentBalance}</p>}
                </div>

                {/* Credit Specific Fields */}
                {formData.accountType === 'credit' && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-6 pt-4 border-t border-slate-100"
                  >
                    {/* Security Deposit (Cajita) */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Depósito de Garantía (Opcional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                          type="number"
                          value={formData.securityDeposit || ''}
                          onChange={(e) => updateFormData('securityDeposit', parseFloat(e.target.value))}
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                          placeholder="0.00"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Si usas modalidad garantizada (ej. Nu Bank Cajita)</p>
                    </div>

                    {/* Credit Limit */}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Cupo Total</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                        <input
                          type="number"
                          value={formData.creditLimit || ''}
                          onChange={(e) => updateFormData('creditLimit', parseFloat(e.target.value))}
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                          placeholder="0.00"
                        />
                      </div>
                      {formData.securityDeposit && formData.securityDeposit > 0 && formData.creditLimit === formData.securityDeposit && (
                        <div className="flex items-center gap-2 mt-2 text-indigo-600 text-sm bg-indigo-50 p-2 rounded-lg">
                          <AlertCircle className="w-4 h-4" />
                          <span>Autocompletado basado en tu depósito</span>
                        </div>
                      )}
                      {errors.creditLimit && <p className="text-red-500 text-sm mt-1">{errors.creditLimit}</p>}
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Día de Corte</label>
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={formData.cutoffDay || ''}
                          onChange={(e) => updateFormData('cutoffDay', parseInt(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                          placeholder="Ej: 18"
                        />
                        {errors.cutoffDay && <p className="text-red-500 text-sm mt-1">{errors.cutoffDay}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Día de Pago</label>
                        <input
                          type="number"
                          min="1"
                          max="28"
                          value={formData.paymentDueDay || ''}
                          onChange={(e) => updateFormData('paymentDueDay', parseInt(e.target.value))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
                          placeholder="Ej: 10"
                        />
                        {errors.paymentDueDay && <p className="text-red-500 text-sm mt-1">{errors.paymentDueDay}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleNextAccount}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                >
                  {currentAccountIndex + 1 === accountCount ? 'Finalizar Revisión' : 'Siguiente Cuenta'}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'confirmation' && (
            <motion.div 
              key="confirmation"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8"
            >
              <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">
                Confirma tus Cuentas
              </h2>
              
              <div className="grid gap-4 mb-8 max-h-[60vh] overflow-y-auto">
                {accounts.map((acc, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg">{acc.bankName}</h3>
                        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          acc.accountType === 'credit' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {acc.accountType === 'credit' ? 'Crédito' : 'Débito'}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Saldo</p>
                        <p className="font-mono font-bold text-slate-800">
                          ${acc.currentBalance?.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {acc.accountType === 'credit' && (
                      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-slate-500">Cupo Total</p>
                          <p className="font-medium">${acc.creditLimit?.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-slate-500">Utilización Inicial</p>
                          <p className={`font-medium ${
                            ((acc.currentBalance || 0) / (acc.creditLimit || 1)) > 0.3 ? 'text-orange-600' : 'text-green-600'
                          }`}>
                            {(((acc.currentBalance || 0) / (acc.creditLimit || 1)) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleFinish}
                className="w-full bg-indigo-600 text-white px-6 py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-6 h-6" />
                Confirmar y Entrar
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
