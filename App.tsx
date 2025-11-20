import * as React from 'react';
import { useState, useMemo, useRef, useEffect } from 'react';
import { CheckpointRow, CalculationSettings, PlanProgress } from './types';
import { generateData } from './services/calculationService';
import { saveTrackerData, getTrackerData, savePlanProgress, getPlanProgress, clearPlanProgress, clearTrackerData } from './services/storageService';
import { analyzePlan } from './services/geminiService';
import Spreadsheet from './components/Spreadsheet';
import ControlPanel from './components/ControlPanel';
import Tracker from './components/Tracker';
import Stats from './components/Stats';
import { FileImage, FileText, Moon, Sun, ChevronUp, ChevronDown, Sparkles, Loader2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

type ViewState = 'calculator' | 'tracker' | 'stats';

export default function App() {
  // View State
  const [view, setView] = useState<ViewState>('calculator');

  // Default Settings updated per request: Risk 20%, RR 1:1
  const [settings, setSettings] = useState<CalculationSettings>({
    startAmount: 20.00,
    riskPercentage: 20,  
    rewardRatio: 1,     
    lotDivisor: 1000,   
    steps: 34
  });

  // Plan Interactive State
  const [isInteractive, setIsInteractive] = useState(false);
  const [planProgress, setPlanProgress] = useState<PlanProgress>({ currentStep: 1, history: {} });
  
  // Reset Key to force component remounts
  const [resetKey, setResetKey] = useState(0);

  // Load Plan Progress on Mount
  useEffect(() => {
    const progress = getPlanProgress();
    setPlanProgress(progress);
  }, []);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Header State
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);

  // AI Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);

  // Collapse header by default when on tracker view
  useEffect(() => {
    if (view === 'tracker') {
        setIsHeaderExpanded(false);
    } else {
        setIsHeaderExpanded(true);
    }
  }, [view]);

  // Toggle Dark Mode Class on HTML element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const tableRef = useRef<HTMLDivElement>(null);

  // Memoize calculations
  const data: CheckpointRow[] = useMemo(() => {
    return generateData(settings);
  }, [settings]);

  // Notification State
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error') => {
      setNotification({ message, type });
      setTimeout(() => setNotification(null), 3000);
  };

  // Interactive Logic
  const handleRegisterResult = (stepId: number, type: 'WIN' | 'LOSS', amount: number, dateOverride?: string) => {
    // Use override date if provided, else today
    let dateKey = dateOverride;
    
    if (!dateKey) {
        const today = new Date();
        dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    }

    // 1. Update Plan Progress
    const newProgress: PlanProgress = {
        currentStep: stepId + 1,
        history: {
            ...planProgress.history,
            [stepId]: {
                status: type,
                date: dateKey,
                amount: amount
            }
        }
    };
    setPlanProgress(newProgress);
    savePlanProgress(newProgress);

    // 2. Update Tracker Data (Calendar)
    const trackerData = getTrackerData();
    const existingEntry = trackerData[dateKey];

    const newEntry = {
        date: dateKey,
        profit: (existingEntry ? existingEntry.profit : 0) + amount,
        trades: (existingEntry ? existingEntry.trades : 0) + 1,
        wins: (existingEntry ? existingEntry.wins : 0) + (type === 'WIN' ? 1 : 0)
    };

    trackerData[dateKey] = newEntry;
    saveTrackerData(trackerData);

    showNotification(`Journal Updated: ${type === 'WIN' ? '+' : ''}$${amount.toFixed(2)}`, type === 'WIN' ? 'success' : 'error');
  };

  const performFullReset = () => {
      // 1. Clear Storage
      clearPlanProgress();
      clearTrackerData();
      
      // 2. Explicitly save default state to overwrite any lingering data
      const defaultProgress: PlanProgress = { currentStep: 1, history: {} };
      savePlanProgress(defaultProgress);
      saveTrackerData({});

      // 3. Reset State
      setPlanProgress(defaultProgress);
      setAiInsight(null); // Clear AI insight on reset
      
      // 4. Increment Reset Key to Force Tracker Remount
      setResetKey(prev => prev + 1);

      showNotification("All progress and data reset.", "success");
  };

  // AI Logic
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setAiInsight(null);
    try {
      const result = await analyzePlan(data, settings.riskPercentage, settings.rewardRatio);
      setAiInsight(result);
    } catch (e) {
      setAiInsight("Could not generate analysis. Please check your API Key.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Export Logic
  const handleExport = async (type: 'image' | 'pdf') => {
    if (!tableRef.current) return;
    
    const canvas = await html2canvas(tableRef.current, {
        scale: 2, // Higher quality
        backgroundColor: isDarkMode ? '#1e293b' : '#ffffff', // Match theme background
        useCORS: true
    });

    if (type === 'image') {
        const link = document.createElement('a');
        link.download = 'compounding-plan.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    } else {
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });
        
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        doc.save('compounding-plan.pdf');
    }
  };

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 p-2 md:p-4 lg:p-8 font-sans text-slate-900 dark:text-slate-100 transition-colors duration-200 relative">
      
      {/* Toast Notification */}
      {notification && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl border-l-4 animate-in slide-in-from-top-4 fade-in duration-300 font-bold flex items-center gap-3
            ${notification.type === 'success' ? 'bg-white dark:bg-slate-800 border-emerald-500 text-emerald-600' : 'bg-white dark:bg-slate-800 border-red-500 text-red-600'}
          `}>
             {notification.type === 'success' ? <span className="text-xl">🎉</span> : <span className="text-xl">📉</span>}
             {notification.message}
          </div>
      )}

      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        
        {/* Header Section */}
        <header className={`relative bg-white dark:bg-slate-900 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800 transition-all duration-300 ease-in-out overflow-hidden ${isHeaderExpanded ? 'p-4 md:p-6' : 'p-3'}`}>
          
          <button 
            onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors z-10"
            title={isHeaderExpanded ? "Collapse Header" : "Expand Header"}
          >
             {isHeaderExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>

          <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 transition-opacity duration-300 ${isHeaderExpanded ? 'opacity-100' : 'opacity-100'}`}>
            <div className="flex items-center gap-4">
                 <div className={`transition-all duration-300 ${!isHeaderExpanded ? 'scale-90 origin-left' : ''}`}>
                    <h1 className={`${isHeaderExpanded ? 'text-3xl md:text-4xl' : 'text-xl'} font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 uppercase tracking-tight transition-all`}>
                      Compound Growth
                    </h1>
                    {isHeaderExpanded && (
                        <p className="text-slate-600 dark:text-slate-400 mt-1 font-bold text-sm uppercase tracking-wide">
                          {view === 'calculator' ? 'Visual Trade Calculator' : view === 'tracker' ? 'Live Challenge Tracker' : 'Performance Statistics'}
                        </p>
                    )}
                 </div>
            </div>
            
            {/* Controls Section */}
            {isHeaderExpanded && (
                <div className="flex flex-wrap items-center gap-3">
                   <button 
                      onClick={toggleTheme}
                      className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-all mr-2"
                      title="Toggle Theme"
                   >
                      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                   </button>
    
                  {view === 'calculator' && (
                      <>
                       <button 
                          onClick={() => handleExport('image')}
                          className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-xs md:text-sm uppercase"
                       >
                          <FileImage size={18} />
                          <span className="hidden md:inline">Save IMG</span>
                          <span className="md:hidden">IMG</span>
                       </button>
                       <button 
                          onClick={() => handleExport('pdf')}
                          className="flex items-center gap-2 px-4 md:px-5 py-2.5 bg-slate-900 dark:bg-emerald-600 text-white rounded-lg hover:bg-slate-800 dark:hover:bg-emerald-700 transition-all shadow-lg font-bold text-xs md:text-sm uppercase"
                       >
                          <FileText size={18} />
                          <span className="hidden md:inline">Save PDF</span>
                          <span className="md:hidden">PDF</span>
                       </button>
                      </>
                  )}
                </div>
            )}

            {/* Mini Theme Toggle for Collapsed State */}
            {!isHeaderExpanded && (
                 <button 
                    onClick={toggleTheme}
                    className="absolute top-2.5 right-12 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all"
                 >
                    {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                 </button>
            )}
          </div>
        </header>

        {/* View Routing */}
        {view === 'tracker' ? (
            <Tracker 
                key={resetKey} // Crucial: Forces re-initialization on reset
                onBack={() => setView('calculator')} 
                onViewStats={() => setView('stats')}
                planData={data}
                planProgress={planProgress}
                isInteractive={isInteractive}
                onRegisterResult={handleRegisterResult}
                onReset={performFullReset}
            />
        ) : view === 'stats' ? (
            <Stats 
                onBack={() => setView('tracker')} 
                startBalance={settings.startAmount}
            />
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative">
                
                {/* Sidebar Controls - REMOVED STICKY to prevent overlap */}
                <div className="lg:col-span-3 space-y-6 relative z-0">
                    <ControlPanel 
                        settings={settings} 
                        onUpdate={setSettings} 
                        onConnect={() => setView('tracker')}
                        isInteractive={isInteractive}
                        onToggleInteractive={() => setIsInteractive(!isInteractive)}
                        onResetProgress={performFullReset}
                    />

                    {/* AI Analysis Card */}
                    <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800 transition-colors mb-6">
                        <div className="flex items-center gap-2 mb-4 text-purple-600 dark:text-purple-400">
                            <Sparkles size={24} strokeWidth={2.5} />
                            <h3 className="font-black text-xl uppercase tracking-wide text-slate-800 dark:text-white">AI Analysis</h3>
                        </div>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                            Evaluate the feasibility and psychological pressure of this plan.
                        </p>
                        
                        {!aiInsight && (
                            <button 
                                onClick={handleAnalyze}
                                disabled={isAnalyzing}
                                className="w-full py-3 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg font-bold uppercase text-xs tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Thinking...
                                    </>
                                ) : (
                                    <>Analyze Plan</>
                                )}
                            </button>
                        )}

                        {aiInsight && (
                            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-lg border border-slate-100 dark:border-slate-800">
                                <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                                    {aiInsight}
                                </p>
                                <button 
                                    onClick={() => setAiInsight(null)}
                                    className="mt-2 text-[10px] font-bold uppercase text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    Clear Analysis
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content - Spreadsheet */}
                <div className="lg:col-span-9 relative z-0">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-700 p-1 overflow-hidden transition-colors">
                        <div className="overflow-x-auto">
                            <div className="min-w-[600px] md:min-w-0 p-2 md:p-6">
                                 <Spreadsheet 
                                    data={data} 
                                    ref={tableRef}
                                    isInteractive={isInteractive}
                                    planProgress={planProgress}
                                    onRegisterResult={(id, type, amount) => handleRegisterResult(id, type, amount)} // Default to today
                                 />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800 p-5 rounded-xl">
                            <p className="text-emerald-700 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">Total Profit</p>
                            <p className="text-3xl font-black text-emerald-900 dark:text-emerald-300 tracking-tight">
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data[data.length - 1].total - settings.startAmount)}
                            </p>
                        </div>
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-100 dark:border-blue-800 p-5 rounded-xl">
                            <p className="text-blue-700 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-1">Final Balance</p>
                            <p className="text-3xl font-black text-blue-900 dark:text-blue-300 tracking-tight">
                                 {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data[data.length - 1].total)}
                            </p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-100 dark:border-purple-800 p-5 rounded-xl">
                            <p className="text-purple-700 dark:text-purple-400 text-xs font-black uppercase tracking-widest mb-1">Growth Factor</p>
                            <p className="text-3xl font-black text-purple-900 dark:text-purple-300 tracking-tight">
                                {((data[data.length - 1].total / settings.startAmount) * 100).toLocaleString()}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}