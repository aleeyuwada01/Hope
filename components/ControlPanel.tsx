
import React from 'react';
import { CalculationSettings, CurrencyCode } from '../types';
import { Settings2, TrendingUp, DollarSign, Percent, Hash, Zap, ToggleLeft, ToggleRight, RotateCcw, RefreshCw } from 'lucide-react';
import { convertUSDToInput, convertInputToUSD } from '../services/calculationService';

interface ControlPanelProps {
  settings: CalculationSettings;
  onUpdate: (newSettings: CalculationSettings) => void;
  onConnect: () => void;
  isInteractive: boolean;
  onToggleInteractive: () => void;
  onResetProgress: () => void;
  currency: CurrencyCode;
  onToggleCurrency: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
    settings, 
    onUpdate, 
    onConnect, 
    isInteractive, 
    onToggleInteractive, 
    onResetProgress, 
    currency,
    onToggleCurrency
}) => {
  
  const handleChange = (key: keyof CalculationSettings, value: string) => {
    const numVal = parseFloat(value);
    if (!isNaN(numVal)) {
      if (key === 'startAmount') {
          onUpdate({ ...settings, [key]: convertInputToUSD(numVal, currency) });
      } else {
          onUpdate({ ...settings, [key]: numVal });
      }
    }
  };

  // Display value for Start Amount based on currency
  const displayStartAmount = convertUSDToInput(settings.startAmount, currency);

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 h-full transition-colors flex flex-col">
      
      <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Settings2 size={24} strokeWidth={2.5} />
            <h3 className="font-black text-xl uppercase tracking-wide text-slate-800 dark:text-white">Parameters</h3>
          </div>
          
          {/* Currency Toggle inside Control Panel */}
          <button 
            onClick={onToggleCurrency}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-black uppercase border transition-all
                ${currency === 'NGN' 
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400' 
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
            title="Switch Currency"
          >
            <RefreshCw size={14} className={currency === 'NGN' ? 'animate-spin-slow' : ''} />
            {currency}
          </button>
      </div>

      <div className="space-y-6 flex-grow">
        {/* Start Balance */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <DollarSign size={14} strokeWidth={3} /> Start Balance ({currency})
          </label>
          <div className="relative">
              <span className="absolute left-3 top-3.5 text-slate-400 font-bold">{currency === 'USD' ? '$' : '₦'}</span>
              <input
                type="number"
                value={displayStartAmount}
                onChange={(e) => handleChange('startAmount', e.target.value)}
                className="w-full pl-8 p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-white font-mono font-bold text-lg"
              />
          </div>
        </div>

        {/* Risk Percentage */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Percent size={14} strokeWidth={3} /> Risk Per Trade (%)
          </label>
          <input
            type="number"
            value={settings.riskPercentage}
            onChange={(e) => handleChange('riskPercentage', e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-white font-mono font-bold text-lg"
          />
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Percentage of current balance risked.</p>
        </div>

        {/* Reward Ratio */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <TrendingUp size={14} strokeWidth={3} /> Reward Ratio (1:R)
          </label>
          <input
            type="number"
            value={settings.rewardRatio}
            onChange={(e) => handleChange('rewardRatio', e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-white font-mono font-bold text-lg"
          />
          <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
            Growth per trade: {(settings.riskPercentage * settings.rewardRatio).toFixed(2)}%
          </p>
        </div>

        {/* Lot Divisor */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Hash size={14} strokeWidth={3} /> Lot Divisor
          </label>
          <input
            type="number"
            value={settings.lotDivisor}
            onChange={(e) => handleChange('lotDivisor', e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-white font-mono font-bold text-lg"
          />
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500">Formula: Balance / Divisor = Lot Size</p>
        </div>

        {/* Steps */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Hash size={14} strokeWidth={3} /> Checkpoints
          </label>
          <input
            type="number"
            value={settings.steps}
            onChange={(e) => handleChange('steps', e.target.value)}
            className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-900 dark:text-white font-mono font-bold text-lg"
          />
        </div>
      </div>
      
      {/* Interactive Mode Toggle */}
      <div className="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
          <div className="flex items-center justify-between mb-2">
             <span className="text-sm font-black uppercase text-indigo-900 dark:text-indigo-200">Interactive Mode</span>
             <button onClick={onToggleInteractive} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors">
                {isInteractive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
             </button>
          </div>
          <p className="text-[10px] leading-tight font-semibold text-indigo-700/70 dark:text-indigo-300/70">
            Enable buttons on the plan to log wins/losses directly to the tracker.
          </p>
          
          {isInteractive && (
             <button 
                type="button"
                onClick={() => {
                   if(confirm("FULL RESET: This will clear all your Progress and Calendar Data. This cannot be undone. Are you sure?")) {
                       onResetProgress();
                   }
                }}
                className="mt-3 w-full flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
             >
                <RotateCcw size={12} /> Full Reset
             </button>
          )}
      </div>

      {/* Connect Button */}
      <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
         <button 
            onClick={onConnect}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/10 transition-all flex items-center justify-center gap-2 group"
         >
            <Zap className="text-yellow-400" size={20} fill="currentColor" />
            Open Calendar
         </button>
      </div>
    </div>
  );
};

export default ControlPanel;
