import { Crop, MarketPrice, PredictionRecord, ModelMetrics } from "../types";

export interface HistoryResponse {
  success: boolean;
  prices: MarketPrice[];
  stats: {
    totalCrops: number;
    totalMarkets: number;
    averagePrice: number;
    predictionAccuracy: number;
    totalUploads: number;
  };
  modelMetrics: ModelMetrics;
}

export const apiService = {
  // Fetch lists of Crops
  async getCrops(): Promise<Crop[]> {
    const res = await fetch("/api/crops");
    const data = await res.json();
    return data.success ? data.crops : [];
  },

  // Fetch full chronological pricing history and metrics
  async getHistory(cropName?: string, market?: string): Promise<HistoryResponse> {
    const query = new URLSearchParams();
    if (cropName) query.append("cropName", cropName);
    if (market) query.append("market", market);

    const res = await fetch(`/api/history?${query.toString()}`);
    if (!res.ok) throw new Error("Failed to load crop history statistics.");
    return await res.json();
  },

  // Import uploaded CSV records
  async uploadCSV(csvString: string): Promise<{ success: boolean; message: string; recordCount?: number }> {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csvString }),
    });
    return await res.json();
  },

  // Train learning forest models
  async trainModel(): Promise<{ success: boolean; message: string; metrics?: ModelMetrics }> {
    const res = await fetch("/api/train", {
      method: "POST",
    });
    return await res.json();
  },

  // Make future crop predictions
  async getPrediction(cropName: string, market: string, targetDate: string): Promise<{ success: boolean; prediction: PredictionRecord }> {
    const res = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cropName, market, targetDate }),
    });
    return await res.json();
  },

  // Generate 30-day forecasts
  async get30DayForecast(cropName: string, market: string, startDate?: string): Promise<{ success: boolean; forecast: { date: string; predictedPrice: number; confidenceScore: number }[] }> {
    const res = await fetch("/api/forecast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cropName, market, startDate }),
    });
    return await res.json();
  },

  // Fetch climate observations
  async getWeatherImpact(cropName: string, location: string): Promise<{ success: boolean; weather: { temp: number; condition: string; humidity: number; rainfall: number; impact: string } }> {
    const res = await fetch("/api/weather", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cropName, location }),
    });
    return await res.json();
  },

  // Fetch Gemini advice
  async getAIRecommendation(cropName: string, market: string, historicalAverage: number, predictedPrice: number, targetDate: string): Promise<{ success: boolean; advice: string; bestSellingMonth: string; alternateCrop: string }> {
    const res = await fetch("/api/ai-insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cropName, market, historicalAverage, predictedPrice, targetDate }),
    });
    return await res.json();
  },

  // Revert user-uploaded items
  async resetDatabase(): Promise<{ success: boolean; message: string }> {
    const res = await fetch("/api/reset", {
      method: "POST",
    });
    return await res.json();
  },
};

export default apiService;
