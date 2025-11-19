
import { TrackerState, PlanProgress } from '../types';

const TRACKER_KEY = 'compound_calculator_tracker_data';
const PLAN_KEY = 'compound_calculator_plan_progress';

// --- Tracker Data ---

export const saveTrackerData = (data: TrackerState) => {
  try {
    localStorage.setItem(TRACKER_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save tracker data", e);
  }
};

export const getTrackerData = (): TrackerState => {
  try {
    const data = localStorage.getItem(TRACKER_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error("Failed to load tracker data", e);
    return {};
  }
};

export const clearTrackerData = () => {
  try {
    localStorage.removeItem(TRACKER_KEY);
  } catch (e) {
    console.error("Failed to clear tracker data", e);
  }
};

// --- Plan Progress ---

export const savePlanProgress = (data: PlanProgress) => {
  try {
    localStorage.setItem(PLAN_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save plan progress", e);
  }
};

export const getPlanProgress = (): PlanProgress => {
  try {
    const data = localStorage.getItem(PLAN_KEY);
    return data ? JSON.parse(data) : { currentStep: 1, history: {} };
  } catch (e) {
    console.error("Failed to load plan progress", e);
    return { currentStep: 1, history: {} };
  }
};

export const clearPlanProgress = () => {
  try {
    localStorage.removeItem(PLAN_KEY);
  } catch (e) {
    console.error("Failed to clear plan progress", e);
  }
};
