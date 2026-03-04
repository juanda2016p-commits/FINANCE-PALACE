import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
  LineChart, Line, CartesianGrid
} from 'recharts';
import { 
  getDailyExpenses, 
  getExpensesByCategory, 
  getClosingData, 
  getMonthlyComparison 
} from '../../utils/financeEngine';
import { Transaction, Account } from '../../types';
import { TrendingUp, TrendingDown, DollarSign, Calendar, PieChart as PieChartIcon, Activity, ChevronLeft, ChevronRight } from 'lucide-react';

interface AnalyticsPanelProps {
  transactions: Transaction[];
  accounts: Account[];
}

type TabType = 'daily' | 'categories' | 'closing' | 'comparative';

export function AnalyticsPanel({ transactions, accounts }: AnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const handlePrevMonth = () => {
    setSelectedDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    const next = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    if (next <= new Date()) {
      setSelectedDate(next);
    }
  };

  const isCurrentMonth = selectedDate.getMonth() === new Date().getMonth() && selectedDate.getFullYear() === new Date().getFullYear();
  const monthLabel = selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  // --- Derived Data ---
  const dailyData = useMemo(() => getDailyExpenses(transactions, selectedDate.getMonth(), selectedDate.getFullYear()), [transactions, selectedDate]);
  const categoryData = useMemo(() => getExpensesByCategory(transactions, selectedDate.getMonth(), selectedDate.getFullYear()), [transactions, selectedDate]);
  const closingData = useMemo(() => getClosingData(accounts, transactions, selectedDate.getMonth(), selectedDate.getFullYear()), [accounts, transactions, selectedDate]);
  const comparisonData = useMemo(() => getMonthlyComparison(transactions), [transactions]); // Always historical

  // Transform category data for PieChart
  const pieData = useMemo(() => {
    return Object.entries(categoryData)
      .map(([name, data]) => ({
        name,
        value: Number(data.total) || 0,
        percentage: Number(data.percentage) || 0
      }))
      .filter(item => item.value > 0) // Filter out zero or negative values
      .sort((a, b) => b.value - a.value);
  }, [categoryData]);

  // Colors for Pie Chart
  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

  // Top 3 Categories for Table highlighting
  const top3Categories = pieData.slice(0, 3).map(c => c.name);
  const getCategoryColor = (index: number) => {
    if (index === 0) return 'bg-red-100 text-red-800';
    if (index === 1) return 'bg-orange-100 text-orange-800';
    if (index === 2) return 'bg-yellow-100 text-yellow-800';
    return 'bg-white text-slate-600';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
      {/* Tabs Header */}
      <div className="flex flex-col sm:flex-row justify-between border-b border-slate-100">
        <div className="flex overflow-x-auto">
          <button 
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'daily' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Calendar className="w-4 h-4" />
            Diario
          </button>
          <button 
            onClick={() => setActiveTab('categories')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'categories' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <PieChartIcon className="w-4 h-4" />
            Categorías
          </button>
          <button 
            onClick={() => setActiveTab('closing')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'closing' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <DollarSign className="w-4 h-4" />
            Cierre
          </button>
          <button 
            onClick={() => setActiveTab('comparative')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'comparative' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <Activity className="w-4 h-4" />
            Comparativo
          </button>
        </div>

        {/* Month Selector (Only for non-comparative tabs) */}
        {activeTab !== 'comparative' && (
          <div className="flex items-center justify-center gap-4 px-4 py-2 bg-slate-50/50 sm:bg-transparent">
            <button 
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-semibold text-slate-700 capitalize min-w-[120px] text-center">
              {monthLabel}
            </span>
            <button 
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              className={`p-1 rounded-full transition-colors ${isCurrentMonth ? 'text-slate-300 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-500'}`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="p-6 min-h-[400px]">
        <AnimatePresence mode="wait">
          
          {/* --- TAB: DIARIO --- */}
          {activeTab === 'daily' && (
            <motion.div 
              key="daily"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Gastos Diarios ({monthLabel})</h3>
                <div className="bg-slate-50 px-4 py-2 rounded-lg border border-slate-200 text-right">
                  <span className="text-xs text-slate-500 uppercase font-bold tracking-wider block">Promedio Diario</span>
                  <div className="text-xl font-mono font-medium text-slate-900">
                    ${dailyData.average.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">*Excluye fijos</span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData.dailyData}>
                    <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                    <YAxis hide />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Gasto']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {dailyData.dailyData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.amount > dailyData.average ? '#EF4444' : '#10B981'} 
                          fillOpacity={0.8}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              
              <div className="text-sm text-slate-500 text-center italic">
                * Los días con gasto mayor al promedio se muestran en rojo.
              </div>
            </motion.div>
          )}

          {/* --- TAB: CATEGORIAS --- */}
          {activeTab === 'categories' && (
            <motion.div 
              key="categories"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-8 items-center">
                {/* Chart */}
                <div className="h-64 w-full md:w-1/2">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Table */}
                <div className="w-full md:w-1/2 overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Categoría</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pieData.map((cat, index) => (
                        <tr key={cat.name} className={getCategoryColor(index)}>
                          <td className="px-4 py-3 font-medium flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                            {cat.name}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            ${cat.value.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono">
                            {cat.percentage.toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- TAB: CIERRE --- */}
          {activeTab === 'closing' && (
            <motion.div 
              key="closing"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Cierre: {closingData.targetLabel}
                </h3>
                {closingData.isHistorical && (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                    Histórico
                  </span>
                )}
              </div>

              {/* Account Balances (Always Current) */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Saldos Actuales</h4>
                  {closingData.isHistorical && (
                    <span className="text-[10px] text-slate-400 italic">No refleja histórico</span>
                  )}
                </div>
                <div className="space-y-2">
                  {closingData.accountBalances.map(acc => (
                    <div key={acc.name} className="flex justify-between items-center text-sm">
                      <span className="text-slate-700">{acc.name}</span>
                      <span className={`font-mono font-medium ${acc.type === 'credit' ? 'text-red-600' : 'text-slate-900'}`}>
                        {acc.type === 'credit' ? '-' : ''}${Math.abs(acc.balance).toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="border-t border-slate-200 pt-2 mt-2 flex justify-between items-center font-bold">
                    <span className="text-slate-900">Patrimonio Neto Actual</span>
                    <span className={closingData.totalConsolidated >= 0 ? 'text-emerald-600' : 'text-red-600'}>
                      ${closingData.totalConsolidated.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Monthly Stats */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm space-y-4">
                   <div>
                     <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Promedio Diario ({monthLabel})</h4>
                     <div className="text-2xl font-mono font-semibold text-slate-900">
                       ${closingData.dailyAverage.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                     </div>
                   </div>
                   <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Ingresos</span>
                        <div className="text-sm font-mono font-medium text-emerald-600">
                          +${closingData.monthlyIncome?.toLocaleString() || 0}
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Gastos</span>
                        <div className="text-sm font-mono font-medium text-red-600">
                          -${closingData.monthlySpending?.toLocaleString() || 0}
                        </div>
                      </div>
                   </div>
                </div>

                {/* Top Categories */}
                <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
                   <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Top 3 Categorías</h4>
                   <ul className="space-y-1">
                     {closingData.topCategories.map((cat, i) => (
                       <li key={cat.category} className="flex justify-between text-sm">
                         <span className="text-slate-600">{i+1}. {cat.category}</span>
                         <span className="font-mono text-slate-900">${cat.amount.toLocaleString()}</span>
                       </li>
                     ))}
                   </ul>
                </div>
              </div>
            </motion.div>
          )}

          {/* --- TAB: COMPARATIVO --- */}
          {activeTab === 'comparative' && (
            <motion.div 
              key="comparative"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-slate-800">Histórico Mensual</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#94A3B8" />
                    <YAxis hide />
                    <Tooltip 
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Total']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="amount" 
                      stroke="#6366F1" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#6366F1', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center text-sm text-slate-500">
                Comparativa de los últimos 3 meses
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
