
import { CalculationSettings, CheckpointRow, CurrencyCode } from '../types';

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

const EXCHANGE_RATE = 1500;

export const formatCurrency = (val: number, currency: CurrencyCode = 'USD') => {
  const amount = currency === 'NGN' ? val * EXCHANGE_RATE : val;
  
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'NGN' ? 0 : 2, // Naira usually doesn't need decimals for large amounts
    maximumFractionDigits: currency === 'NGN' ? 0 : 2,
  }).format(amount);
};

// Helper to convert input value based on currency
export const convertInputToUSD = (val: number, currency: CurrencyCode) => {
    return currency === 'NGN' ? val / EXCHANGE_RATE : val;
};

export const convertUSDToInput = (val: number, currency: CurrencyCode) => {
    return currency === 'NGN' ? val * EXCHANGE_RATE : val;
};
