
export interface CheckpointRow {
  id: number;
  amount: number;
  lotSize: number;
  profit: number;
  riskAmount: number; // Added for loss calculation
  total: number; // Accumulative total after profit
}

export interface CalculationSettings {
  startAmount: number;
  riskPercentage: number;
  rewardRatio: number;
  lotDivisor: number;
  steps: number;
}

export enum ExportType {
  IMAGE = 'IMAGE',
  PDF = 'PDF'
}

export interface DailyTradeData {
  date: string; // YYYY-MM-DD
  profit: number;
  trades: number;
  wins: number;
}

export interface TrackerState {
  [date: string]: DailyTradeData;
}

export interface PlanStepResult {
  status: 'WIN' | 'LOSS';
  date: string;
  amount: number;
}

export interface PlanProgress {
  currentStep: number;
  history: { [stepId: number]: PlanStepResult };
}
