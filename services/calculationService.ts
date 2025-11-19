
import { CalculationSettings, CheckpointRow } from '../types';

export const generateData = (settings: CalculationSettings): CheckpointRow[] => {
  const data: CheckpointRow[] = [];
  let currentAmount = settings.startAmount;

  for (let i = 1; i <= settings.steps; i++) {
    // Calculate Lot Size: Based on the image logic ($20 = 0.02), so Amount / 1000
    const rawLotSize = currentAmount / settings.lotDivisor;
    // Round to 2 decimal places for standard lots
    const lotSize = Math.max(0.01, parseFloat(rawLotSize.toFixed(2)));

    // Calculate Profit
    // Risk Amount = Balance * (Risk% / 100)
    // Profit = Risk Amount * Reward Ratio
    
    const riskAmount = currentAmount * (settings.riskPercentage / 100);
    const profit = riskAmount * settings.rewardRatio;

    data.push({
      id: i,
      amount: parseFloat(currentAmount.toFixed(2)),
      lotSize: lotSize,
      riskAmount: parseFloat(riskAmount.toFixed(2)),
      profit: parseFloat(profit.toFixed(2)),
      total: parseFloat((currentAmount + profit).toFixed(2))
    });

    currentAmount += profit;
  }

  return data;
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(val);
};
