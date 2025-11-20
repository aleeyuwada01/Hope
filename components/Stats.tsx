import * as React from 'react';
import { useMemo } from 'react';
import { getTrackerData } from '../services/storageService';
import { ArrowLeft, TrendingUp, TrendingDown, Activity, Target, BarChart2 } from 'lucide-react';

interface StatsProps {
  onBack: () => void;
  startBalance: number;
}

const Stats: React.FC<StatsProps> = ({ onBack, startBalance }) => {
  const data = getTrackerData();
  
  const stats = useMemo(() => {
    const entries = Object.values(data);
    const totalTrades = entries.reduce((acc, curr) => acc + curr.trades, 0);
    const totalWins = entries.reduce((acc, curr) => acc + curr.wins, 0);
    const totalLosses = totalTrades - totalWins;
    const netPL = entries.reduce((acc, curr) => acc + curr.profit, 0);
    
    // Calculate Profit Factor
    const grossProfit = entries.reduce((acc, curr) => acc + (curr.profit > 0 ? curr.profit : 0), 0);
    const grossLoss = Math.abs(entries.reduce((acc, curr) => acc + (curr.profit < 0 ? curr.profit : 0), 0));
    const profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;

    // Averages
    const winningDays = entries.filter(e => e.profit > 0);
    const losingDays = entries.filter(e => e.profit < 0);
    
    const avgWinDay = winningDays.length > 0 
        ? winningDays.reduce((acc, curr) => acc + curr.profit, 0) / winningDays.length 
        : 0;
        
    const avgLossDay = losingDays.length > 0 
        ? losingDays.reduce((acc, curr) => acc + curr.profit, 0) / losingDays.length 
        : 0;

    const bestDay = entries.length > 0 ? Math.max(...entries.map(e => e.profit)) : 0;
    const worstDay = entries.length > 0 ? Math.min(...entries.map(e => e.profit)) : 0;

    // Equity Curve Data
    // Sort dates chronologically
    const sortedDates = Object.keys(data).sort();
    let currentBalance = startBalance;
    const curve = sortedDates.map(date => {
        currentBalance += data[date].profit;
        return { date, balance: currentBalance };
    });

    // Add start point
    const chartData = [{ date: 'Start', balance: startBalance }, ...curve];

    return {
      totalTrades,
      totalWins,
      totalLosses,
      netPL,
      profitFactor,
      winRate: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
      avgWinDay,
      avgLossDay,
      bestDay,
      worstDay,
      chartData
    };
  }, [data, startBalance]);

  // Simple SVG Chart Logic
  const renderChart = () => {
    if (stats.chartData.length < 2) return <div className="h-64 flex items-center justify-center text-slate-400 font-bold">Not enough data for chart</div>;

    const balances = stats.chartData.map(d => d.balance);
    const min = Math.min(...balances, startBalance) * 0.95;
    const max = Math.max(...balances, startBalance) * 1.05;
    const range = max - min;
    
    const width = 1000;
    const height = 300;
    
    const points = stats.chartData.map((d, i) => {
        const x = (i / (stats.chartData.length - 1)) * width;
        const y = height - ((d.balance - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="w-full h-64 md:h-96 relative bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-4 overflow-hidden">
             <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                </defs>
                
                {/* Grid Lines (Horizontal) */}
                {[0, 0.25, 0.5, 0.75, 1].map(t => (
                    <line 
                        key={t} 
                        x1="0" y1={height * t} x2={width} y2={height * t} 
                        stroke="currentColor" 
                        className="text-slate-200 dark:text-slate-700" 
                        strokeWidth="1" 
                        strokeDasharray="5,5" 
                    />
                ))}

                {/* Area Fill */}
                <path d={`M0,${height} L${points} L${width},${height} Z`} fill="url(#chartGradient)" />
                
                {/* Main Line */}
                <polyline 
                    fill="none" 
                    stroke="#6366f1" 
                    strokeWidth="4" 
                    points={points} 
                    strokeLinejoin="round" 
                    strokeLinecap="round"
                    className="drop-shadow-md"
                />
                
                {/* Data Points */}
                {stats.chartData.map((d, i) => {
                    const x = (i / (stats.chartData.length - 1)) * width;
                    const y = height - ((d.balance - min) / range) * height;
                    return (
                        <circle key={i} cx={x} cy={y} r="4" className="fill-indigo-600 stroke-white dark:stroke-slate-900 stroke-2" />
                    );
                })}
            </svg>
            
            {/* Labels */}
            <div className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded">
                Max: ${max.toFixed(2)}
            </div>
            <div className="absolute bottom-2 left-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded">
                Min: ${min.toFixed(2)}
            </div>
        </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
             <button onClick={onBack} className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-white rounded-xl transition-colors shadow-sm border border-slate-200 dark:border-slate-700">
                <ArrowLeft size={20} strokeWidth={3} />
            </button>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-wide">Performance Stats</h2>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Net P/L */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2 text-slate-400 text-xs font-black uppercase tracking-widest">
                    <Activity size={16} /> Net P/L
                </div>
                <div className={`text-4xl font-black ${stats.netPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    {stats.netPL >= 0 ? '+' : ''}{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.netPL)}
                </div>
            </div>

            {/* Win Rate */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2 text-slate-400 text-xs font-black uppercase tracking-widest">
                    <Target size={16} /> Win Rate
                </div>
                <div className="text-4xl font-black text-indigo-500">
                    {stats.winRate.toFixed(1)}%
                </div>
                <div className="text-xs font-bold text-slate-400 mt-1">
                    {stats.totalWins} Wins / {stats.totalLosses} Losses
                </div>
            </div>

             {/* Profit Factor */}
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2 text-slate-400 text-xs font-black uppercase tracking-widest">
                    <BarChart2 size={16} /> Profit Factor
                </div>
                <div className="text-4xl font-black text-blue-500">
                    {stats.profitFactor.toFixed(2)}
                </div>
            </div>

            {/* Avg Day */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-3 mb-2 text-slate-400 text-xs font-black uppercase tracking-widest">
                    <TrendingUp size={16} /> Avg Win Day
                </div>
                <div className="text-4xl font-black text-emerald-500">
                    ${stats.avgWinDay.toFixed(0)}
                </div>
                <div className="text-xs font-bold text-red-400 mt-1">
                    Avg Loss: ${Math.abs(stats.avgLossDay).toFixed(0)}
                </div>
            </div>
        </div>

        {/* Equity Curve */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700">
            <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-wide mb-6">Equity Curve</h3>
            {renderChart()}
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase">Best Day</p>
                    <p className="text-2xl font-black text-emerald-500">+${stats.bestDay.toFixed(2)}</p>
                </div>
                <TrendingUp className="text-emerald-500 opacity-20" size={48} />
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-lg border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div>
                    <p className="text-xs font-black text-slate-400 uppercase">Worst Day</p>
                    <p className="text-2xl font-black text-red-500">${stats.worstDay.toFixed(2)}</p>
                </div>
                <TrendingDown className="text-red-500 opacity-20" size={48} />
            </div>
        </div>
    </div>
  );
};

export default Stats;