import { GoogleGenAI } from "@google/genai";
import { CheckpointRow } from "../types";

export const analyzePlan = async (data: CheckpointRow[], risk: number, reward: number) => {
  if (!process.env.API_KEY) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Summarize data to avoid token limits if table is huge
  const start = data[0];
  const end = data[data.length - 1];
  const summary = `
    Plan Start: $${start.amount}
    Plan End (Step ${end.id}): $${end.amount}
    Risk per trade: ${risk}%
    Reward Ratio: 1:${reward}
  `;

  const prompt = `
    Analyze this compounding trading plan:
    ${summary}
    
    Please provide a brief, motivating, yet realistic assessment of this growth curve. 
    Mention the psychological difficulty of handling larger lot sizes (like ${end.lotSize} lots) at the end compared to the start.
    Keep it under 100 words.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Analysis Failed", error);
    return "Could not generate analysis at this time.";
  }
};