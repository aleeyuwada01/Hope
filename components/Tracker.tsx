
import React, { useState, useEffect } from 'react';
import { TrackerState, DailyTradeData, CheckpointRow, PlanProgress, PlanStepResult, CurrencyCode } from '../types';
import { saveTrackerData, getTrackerData, clearTrackerData } from '../services/storageService';
import { ChevronLeft, ChevronRight, X, Trash2, ArrowLeft, PieChart, Target, ShieldAlert, DollarSign, List } from 'lucide-react';
import { formatCurrency, convertInputToUSD, convertUSDToInput } from '../services/calculationService';

interface TrackerProps {
  onBack: () => void;
  onViewStats: () => void;
  planData?: CheckpointRow[];
  planProgress?: PlanProgress;
  isInteractive?: boolean;
  onRegisterResult?: (stepId: number, result: 'WIN' | 'LOSS', amount: number, date: string) => void;
  onReset?: () => void;
  currency: CurrencyCode;
}

// Helper to get days in month
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

const Tracker: React.FC<TrackerProps> = ({ onBack, onViewStats, planData, planProgress, isInteractive, onRegisterResult, onReset, currency }) => {
  const [data, setData] = useState<TrackerState>({});
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ profit: '', trades: '', wins: '' });

  useEffect(() => {
    // Set selected date to today on mount
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(dateKey);

    const loaded = getTrackerData();
    setData(loaded);
  }, [planProgress]); // Reload if progress changes

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDayClick = (day: number) => {
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateKey);
    const existing = data[dateKey];
    
    // Convert stored USD Profit to Display Currency for edit form
    const displayProfit = existing ? convertUSDToInput(existing.profit, currency) : '';

    setEditForm({
      profit: existing ? displayProfit.toString() : '',
      trades: existing ? existing.trades.toString() : '',
      wins: existing ? existing.wins.toString() : ''
    });
    
    if (!isInteractive) {
        setIsModalOpen(true);
    }
  };

  const handleSave = () => {
    if (!selectedDate) return;
    
    const profitInput = parseFloat(editForm.profit);
    const trades = parseInt(editForm.trades) || 0;
    const wins = parseInt(editForm.wins) || 0;

    if (isNaN(profitInput) && editForm.profit !== '') return; // Basic validation

    // Convert Input (Display Currency) back to USD for storage
    const profitUSD = convertInputToUSD(profitInput, currency);

    const newData = { ...data };

    if (editForm.profit === '' && editForm.trades === '') {
        delete newData[selectedDate];
    } else {
        newData[selectedDate] = {
            date: selectedDate,
            profit: isNaN(profitUSD) ? 0 : profitUSD,
            trades: trades,
            wins: wins
        };
    }

    setData(newData);
    saveTrackerData(newData);
    setIsModalOpen(false);
  };

  const handleClearAll = () => {
    // If Interactive Mode is on and reset handler is provided, use the Global Reset
    if (isInteractive && onReset) {
        if (confirm("FULL RESET: This will clear your Plan Progress AND Calendar Data. Are you sure?")) {
            onReset(); // Calls App.performFullReset which clears storage
            setData({}); // Immediately clear local view
        }
        return;
    } 
    
    // Fallback for manual mode
    if (confirm('Are you sure you want to clear all tracker history? This cannot be undone.')) {
        clearTrackerData();
        setData({});
    }
  };

  // Calculate Monthly Stats
  const monthlyProfit = Object.keys(data)
    .filter(k => k.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
    .reduce((sum, key) => sum + data[key].profit, 0);

  // --- Active Challenge Logic ---
  const currentStepId = planProgress?.currentStep || 1;
  const currentStepRow = planData?.find(row => row.id === currentStepId);
  
  const handleInteractiveAction = (type: 'WIN' | 'LOSS') => {
      if (onRegisterResult && currentStepRow && selectedDate) {
          const amount = type === 'WIN' ? currentStepRow.profit : -currentStepRow.riskAmount;
          onRegisterResult(currentStepRow.id, type, amount, selectedDate);
          // Optimistically update UI
          const newData = { ...data };
          const existing = newData[selectedDate] || { date: selectedDate, profit: 0, trades: 0, wins: 0 };
          newData[selectedDate] = {
              ...existing,
              profit: existing.profit + amount,
              trades: existing.trades + 1,
              wins: existing.wins + (type === 'WIN' ? 1 : 0)
          };
          setData(newData);
      }
  };

  // Render Calendar Grid
  const renderCalendar = () => {
    const grid = [];
    const totalSlots = Math.ceil((daysInMonth + firstDay) / 7) * 7;
    
    let weekData: { profit: number, days: number } = { profit: 0, days: 0 };
    let currentWeekRow = [];
    
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const headerRow = (
        <div key="header" className="grid grid-cols-8 gap-2 lg:gap-4 mb-4">
            {weekDays.map(d => (
                <div key={d} className="text-center font-bold text-slate-500 dark:text-slate-400 uppercase text-xs lg:text-sm py-2 bg-slate-900/5 dark:bg-slate-800/50 rounded-lg">
                    {d}
                </div>
            ))}
            <div className="text-center font-bold text-slate-500 dark:text-slate-400 uppercase text-xs lg:text-sm py-2 bg-slate-900/5 dark:bg-slate-800/50 rounded-lg">
                Week
            </div>
        </div>
    );

    for (let i = 0; i < totalSlots; i++) {
      const dayNum = i - firstDay + 1;
      const isCurrentMonth = dayNum > 0 && dayNum <= daysInMonth;
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
      const entry = isCurrentMonth ? data[dateKey] : null;
      
      const stepEntry = isCurrentMonth && planProgress?.history 
        ? Object.entries(planProgress.history).find((entry) => (entry[1] as PlanStepResult).date === dateKey) as [string, PlanStepResult] | undefined
        : null;
      const stepId = stepEntry ? stepEntry[0] : null;
      const stepStatus = stepEntry ? stepEntry[1].status : null;

      const isSelected = dateKey === selectedDate;

      if (entry) {
          weekData.profit += entry.profit; // Keep profit in USD for summation
          weekData.days += 1;
      }

      let cardClass = "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 border-dashed"; 
      let profitClass = "text-slate-900 dark:text-white";

      if (entry) {
        if (entry.profit > 0) {
            cardClass = "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-600/50 border-solid shadow-lg";
            profitClass = "text-emerald-700 dark:text-emerald-400";
        } else if (entry.profit < 0) {
            cardClass = "bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-600/50 border-solid shadow-lg";
            profitClass = "text-red-600 dark:text-red-400";
        } else {
            cardClass = "bg-blue-100 dark:bg-blue-950/50 border-blue-300 dark:border-blue-600/50 border-solid shadow-lg";
            profitClass = "text-blue-600 dark:text-blue-300";
        }
      } else if (isCurrentMonth) {
          cardClass = "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 border-solid hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-md cursor-pointer"; 
      } else {
          cardClass = "bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800/50 border-dashed opacity-60"; 
      }

      if (isSelected) {
          cardClass += " ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900";
      }

      // Formatting for display
      const displayProfit = entry ? formatCurrency(Math.abs(entry.profit), currency).replace(/[$₦]/, '') : '';

      currentWeekRow.push(
        <div 
            key={i} 
            onClick={() => isCurrentMonth && handleDayClick(dayNum)}
            className={`relative p-2 lg:p-3 h-28 lg:h-32 rounded-xl border-2 transition-all flex flex-col justify-between group ${cardClass}`}
        >
          {isCurrentMonth && (
              <>
                <div className="flex justify-between items-start">
                    <span className={`text-sm font-bold ${entry ? 'text-inherit' : 'text-slate-400'}`}>{dayNum}</span>
                    {stepId && (
                        <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded ${stepStatus === 'WIN' ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-100' : 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-100'}`}>
                            S{stepId}
                        </span>
                    )}
                </div>
                {entry && (
                    <div className="flex flex-col items-end text-right">
                        <span className={`text-lg font-black tracking-tight leading-none ${profitClass}`}>
                            {entry.profit >= 0 ? (currency === 'USD' ? '$' : '₦') : '-'}{displayProfit}
                        </span>
                        <span className="text-[10px] font-bold opacity-70 mt-1">{entry.trades} trd</span>
                    </div>
                )}
              </>
          )}
        </div>
      );

      if ((i + 1) % 7 === 0) {
         const isPositiveWeek = weekData.profit >= 0;
         const weekNum = Math.ceil((i+1)/7);
         const hasActivity = weekData.days > 0;

         // Format Weekly Profit
         const displayWeekProfit = formatCurrency(Math.abs(weekData.profit), currency).replace(/[$₦]/, '');

         grid.push(
            <div key={`row-${i}`} className="grid grid-cols-8 gap-2 lg:gap-4 mb-4">
                {currentWeekRow}
                <div className={`h-28 lg:h-32 rounded-xl border-2 flex flex-col justify-center items-center gap-1 transition-colors ${hasActivity 
                    ? 'bg-slate-800 border-slate-600 shadow-xl' 
                    : 'bg-slate-100 dark:bg-slate-900 border-dashed border-slate-200 dark:border-slate-800 opacity-50'}`}>
                    <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Week {weekNum}</span>
                    {hasActivity ? (
                        <>
                            <span className={`text-xl lg:text-2xl font-black ${isPositiveWeek ? 'text-emerald-400' : 'text-red-400'}`}>
                                {weekData.profit >= 0 ? (currency === 'USD' ? '$' : '₦') : '-'}{displayWeekProfit}
                            </span>
                        </>
                    ) : (
                        <span className="text-xs font-bold text-slate-400">-</span>
                    )}
                </div>
            </div>
         );
         currentWeekRow = [];
         weekData = { profit: 0, days: 0 };
      }
    }
    
    return (
        <div>
            {headerRow}
            {grid}
        </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-right duration-500">
        
        {/* Interactive Challenge Panel */}
        {isInteractive && currentStepRow && (
             <div className="mb-6 bg-gradient-to-r from-slate-900 to-indigo-950 dark:from-slate-800 dark:to-indigo-900 p-6 rounded-2xl shadow-2xl border border-indigo-500/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 text-white">
                    <Target size={120} />
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-full animate-pulse">
                                Active Challenge
                            </span>
                            <button onClick={() => setIsPlanModalOpen(true)} className="text-indigo-300 hover:text-white text-xs font-bold uppercase flex items-center gap-1 transition-colors">
                                <List size={14} /> View Full Plan
                            </button>
                        </div>
                        <div className="flex items-baseline gap-4">
                            <h2 className="text-4xl font-black text-white tracking-tight">
                                Step {currentStepRow.id}
                            </h2>
                            <span className="text-indigo-300 font-mono text-lg font-bold">
                                Lot: {currentStepRow.lotSize}
                            </span>
                        </div>
                        <div className="flex items-center gap-6 mt-4 text-sm font-bold text-slate-300">
                             <div className="flex items-center gap-2">
                                <Target size={16} className="text-emerald-400" />
                                Target: <span className="text-emerald-400 text-lg">{formatCurrency(currentStepRow.profit, currency)}</span>
                             </div>
                             <div className="flex items-center gap-2">
                                <ShieldAlert size={16} className="text-red-400" />
                                Risk: <span className="text-red-400 text-lg">-{formatCurrency(currentStepRow.riskAmount, currency)}</span>
                             </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                         <div className="text-right mr-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Log Result For</p>
                            <p className="text-white font-bold">
                                {selectedDate ? new Date(selectedDate).toLocaleDateString(undefined, {month:'short', day:'numeric'}) : 'Select Date'}
                            </p>
                         </div>
                         <button 
                            onClick={() => handleInteractiveAction('WIN')}
                            className="px-6 py-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all w-24"
                         >
                            WIN
                         </button>
                         <button 
                            onClick={() => handleInteractiveAction('LOSS')}
                            className="px-6 py-4 bg-red-500 hover:bg-red-400 text-white rounded-xl font-black uppercase shadow-lg shadow-red-500/20 active:scale-95 transition-all w-24"
                         >
                            LOSS
                         </button>
                    </div>
                </div>
             </div>
        )}

        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-8 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="flex items-center gap-4 mb-4 xl:mb-0">
                <button onClick={onBack} className="p-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl transition-colors" title="Back to Calculator">
                    <ArrowLeft size={20} strokeWidth={3} />
                </button>
                
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <h2 className="text-xl font-black text-slate-800 dark:text-white w-40 text-center uppercase tracking-wide">{monthName} {year}</h2>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
                
                <button onClick={() => {
                    const now = new Date();
                    setCurrentDate(now);
                    setSelectedDate(`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`);
                }} className="hidden md:block px-4 py-2 bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 uppercase rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors">
                    Today
                </button>
            </div>

            <div className="flex flex-wrap items-center gap-4 xl:gap-6">
                <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400 text-xs font-black uppercase ml-2">Mo. P/L:</span>
                    <span className={`text-xl font-black px-3 py-1 rounded-lg ${monthlyProfit >= 0 ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'}`}>
                        {formatCurrency(monthlyProfit, currency).split('.')[0]}
                    </span>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={onViewStats}
                        className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase text-xs tracking-wider shadow-lg shadow-indigo-500/20 transition-all"
                    >
                        <PieChart size={18} />
                        Stats
                    </button>
                    <button 
                        onClick={handleClearAll} 
                        title={isInteractive ? "Reset Challenge & Data" : "Clear Calendar Data"}
                        className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </div>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto pb-8">
            <div className="min-w-[800px] lg:min-w-[1100px]">
                {renderCalendar()}
            </div>
        </div>

        {/* Manual Edit Modal */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-md rounded-2xl shadow-2xl transform scale-100 transition-all">
                    <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wide">
                            Edit {new Date(selectedDate || '').toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </h3>
                        <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Net Profit/Loss ({currency})</label>
                            <input 
                                type="number" 
                                value={editForm.profit}
                                onChange={(e) => setEditForm({...editForm, profit: e.target.value})}
                                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-2xl font-black text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-0 outline-none transition-all"
                                placeholder="0"
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Total Trades</label>
                                <input 
                                    type="number" 
                                    value={editForm.trades}
                                    onChange={(e) => setEditForm({...editForm, trades: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xl font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-0 outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2">Wins</label>
                                <input 
                                    type="number" 
                                    value={editForm.wins}
                                    onChange={(e) => setEditForm({...editForm, wins: e.target.value})}
                                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl p-4 text-xl font-bold text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-0 outline-none transition-all"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        
                        <div className="pt-4 flex gap-3">
                             <button 
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-4 rounded-xl font-bold uppercase text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleSave}
                                className="flex-1 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold uppercase tracking-wide shadow-lg shadow-indigo-500/20 transition-all"
                            >
                                Save Entry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Plan List Modal */}
        {isPlanModalOpen && planData && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                 <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800">
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wide">
                            Compounding Plan Steps
                        </h3>
                        <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                    <div className="overflow-y-auto p-6">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                                    <th className="pb-2 uppercase font-bold">Step</th>
                                    <th className="pb-2 uppercase font-bold">Target</th>
                                    <th className="pb-2 uppercase font-bold">Risk</th>
                                    <th className="pb-2 uppercase font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {planData.map(row => {
                                    const history = planProgress?.history[row.id];
                                    const isCurrent = row.id === planProgress?.currentStep;
                                    return (
                                        <tr key={row.id} className={`border-b border-slate-100 dark:border-slate-800 ${isCurrent ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}>
                                            <td className="py-3 font-bold text-slate-700 dark:text-slate-300">#{row.id}</td>
                                            <td className="py-3 font-mono text-emerald-600 font-bold">{formatCurrency(row.profit, currency)}</td>
                                            <td className="py-3 font-mono text-red-500 font-bold">-{formatCurrency(row.riskAmount, currency)}</td>
                                            <td className="py-3">
                                                {history ? (
                                                    <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${history.status === 'WIN' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                                        {history.status}
                                                    </span>
                                                ) : isCurrent ? (
                                                    <span className="text-xs font-bold px-2 py-1 rounded uppercase bg-indigo-100 text-indigo-700 animate-pulse">
                                                        Current
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                 </div>
            </div>
        )}
    </div>
  );
};

export default Tracker;
