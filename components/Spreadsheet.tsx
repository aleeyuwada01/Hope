import * as React from 'react';
import { forwardRef } from 'react';
import { CheckpointRow, PlanProgress } from '../types';
import { formatCurrency } from '../services/calculationService';
import { CheckCircle2, XCircle, Lock } from 'lucide-react';

interface SpreadsheetProps {
  data: CheckpointRow[];
  isInteractive: boolean;
  planProgress: PlanProgress;
  onRegisterResult: (stepId: number, result: 'WIN' | 'LOSS', amount: number) => void;
}

const Spreadsheet = forwardRef<HTMLDivElement, SpreadsheetProps>(({ data, isInteractive, planProgress, onRegisterResult }, ref) => {
  
  return (
    <div ref={ref} className="bg-white dark:bg-slate-800 p-3 md:p-6 rounded-lg shadow-sm border-2 border-slate-300 dark:border-slate-600 inline-block min-w-full transition-colors">
      {/* Header */}
      <div className="border-b-4 border-slate-400 dark:border-slate-500 pb-4 mb-4 flex flex-col md:flex-row justify-between md:items-end gap-2">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight uppercase">Compounding Plan</h2>
        {isInteractive && (
            <div className="text-xs font-bold uppercase bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full animate-pulse self-start md:self-auto">
                Interactive Mode Active
            </div>
        )}
      </div>
      
      <table className="w-full text-xs md:text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-slate-300 dark:border-slate-600">
            <th className="p-2 md:p-3 text-left font-bold text-xs md:text-base text-slate-800 dark:text-slate-200 border-r-2 border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 w-10 md:w-16 uppercase tracking-wide">#</th>
            <th className="p-2 md:p-3 text-left font-bold text-xs md:text-base text-slate-800 dark:text-slate-200 border-r-2 border-slate-200 dark:border-slate-600 bg-emerald-100 dark:bg-emerald-900/40 w-24 md:w-40 uppercase tracking-wide">Amount</th>
            <th className="p-2 md:p-3 text-right font-bold text-xs md:text-base text-slate-800 dark:text-slate-200 border-r-2 border-slate-200 dark:border-slate-600 w-20 md:w-32 uppercase tracking-wide dark:bg-slate-800">Lot</th>
            <th className="p-2 md:p-3 text-right font-bold text-xs md:text-base text-slate-800 dark:text-slate-200 w-20 md:w-32 uppercase tracking-wide dark:bg-slate-800 border-r-2 border-slate-200 dark:border-slate-600">Profit</th>
            {isInteractive && (
                <th className="p-2 md:p-3 text-center font-bold text-xs md:text-base text-slate-800 dark:text-slate-200 w-32 md:w-48 uppercase tracking-wide bg-indigo-50 dark:bg-indigo-900/20">Action</th>
            )}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => {
            const isCompleted = row.id < planProgress.currentStep;
            const isCurrent = row.id === planProgress.currentStep;
            const historyItem = planProgress.history[row.id];

            return (
                <tr key={row.id} className={`border-b border-slate-100 dark:border-slate-700/50 transition-colors 
                    ${isInteractive && isCurrent ? 'bg-indigo-50/50 dark:bg-indigo-900/20 ring-2 ring-indigo-500/50 z-10 relative' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}
                    ${isInteractive && isCompleted ? 'opacity-60 grayscale-[0.5]' : ''}
                `}>
                {/* Checkpoint Column */}
                <td className="p-2 md:p-3 border-r-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 font-bold text-center text-sm md:text-lg">
                    {row.id}
                </td>
                
                {/* Amount Column */}
                <td className="p-2 md:p-3 border-r-2 border-slate-200 dark:border-slate-600 bg-emerald-100/60 dark:bg-emerald-900/30 font-mono text-emerald-900 dark:text-emerald-300 font-bold text-sm md:text-lg">
                    {formatCurrency(row.amount)}
                </td>
                
                {/* Lot Size Column */}
                <td className="p-2 md:p-3 border-r-2 border-slate-200 dark:border-slate-600 text-right font-mono text-slate-700 dark:text-slate-300 font-bold text-sm md:text-lg">
                    {row.lotSize.toFixed(2)}
                </td>
                
                {/* Profit Column */}
                <td className={`p-2 md:p-3 text-right font-mono text-slate-900 dark:text-slate-100 font-black text-sm md:text-lg ${isInteractive ? 'border-r-2 border-slate-200 dark:border-slate-600' : ''}`}>
                    {formatCurrency(row.profit).replace('$', '')}
                </td>

                {/* Interactive Actions Column */}
                {isInteractive && (
                    <td className="p-2 text-center align-middle">
                        {isCompleted && historyItem ? (
                            <div className={`flex items-center justify-center gap-1 md:gap-2 font-bold uppercase text-[10px] md:text-sm ${historyItem.status === 'WIN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}`}>
                                {historyItem.status === 'WIN' ? <CheckCircle2 size={16} className="md:w-5 md:h-5" /> : <XCircle size={16} className="md:w-5 md:h-5" />}
                                <span className="hidden md:inline">{historyItem.status}</span>
                            </div>
                        ) : isCurrent ? (
                            <div className="flex gap-1 md:gap-2 justify-center">
                                <button 
                                    onClick={() => onRegisterResult(row.id, 'WIN', row.profit)}
                                    className="px-2 py-1 md:px-3 md:py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] md:text-xs font-black uppercase rounded shadow-md active:scale-95 transition-all w-10 md:w-20"
                                >
                                    Win
                                </button>
                                <button 
                                    onClick={() => onRegisterResult(row.id, 'LOSS', -row.riskAmount)}
                                    className="px-2 py-1 md:px-3 md:py-2 bg-red-500 hover:bg-red-600 text-white text-[10px] md:text-xs font-black uppercase rounded shadow-md active:scale-95 transition-all w-10 md:w-20"
                                >
                                    Loss
                                </button>
                            </div>
                        ) : (
                            <div className="flex justify-center text-slate-300 dark:text-slate-600">
                                <Lock size={14} className="md:w-[18px]" />
                            </div>
                        )}
                    </td>
                )}
                </tr>
            );
          })}
        </tbody>
      </table>
      
      <div className="mt-6 text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">
        Developed By Aliyu Wada (Deepmind)
      </div>
    </div>
  );
});

Spreadsheet.displayName = 'Spreadsheet';

export default Spreadsheet;