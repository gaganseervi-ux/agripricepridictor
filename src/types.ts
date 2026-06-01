export interface Crop {
  id: string;
  name: string;
  category: string;
  description?: string;
}

export interface MarketPrice {
  id: string;
  date: string; // YYYY-MM-DD
  cropName: string;
  market: string;
  modalPrice: number; // Price per quintal (100kg)
  isSample?: boolean;
}

export interface PredictionRecord {
  id: string;
  cropName: string;
  market: string;
  targetDate: string; // YYYY-MM-DD
  predictedPrice: number;
  confidenceScore: number; // 0 to 100
  createdAt: string;
}

export interface ModelMetrics {
  mae: number;
  rmse: number;
  r2: number;
  accuracyPercent: number;
  sampleCount: number;
  trainedAt: string;
}

export interface DashboardStats {
  totalCrops: number;
  averagePrice: number;
  averagePriceChange: number; // percentage
  predictionAccuracy: number; // average accuracy / R2
  totalUploads: number;
}

export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  rainfall: number; // mm
  impact: string; // Gemini impact or rule-based
}

export interface AIRecommendation {
  cropName: string;
  market: string;
  advice: string;
  bestSellingMonth: string;
  alternateCrop?: string;
}
