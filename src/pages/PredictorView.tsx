import React, { useState, useEffect } from "react";
import { BrainCircuit, Calendar, MapPin, DollarSign, CloudRain, Star, FileText, CheckCircle, TrendingUp, AlertTriangle, Printer, Sparkles } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Crop, MarketPrice, PredictionRecord } from "../types";
import apiService from "../services/api";

interface PredictorViewProps {
  crops: Crop[];
  prices: MarketPrice[];
}

export const PredictorView: React.FC<PredictorViewProps> = ({ crops, prices }) => {
  // Input fields
  const [selectedCrop, setSelectedCrop] = useState("");
  const [selectedMarket, setSelectedMarket] = useState("");
  const [targetDate, setTargetDate] = useState("");

  // Lists of options
  const [mandiOptions, setMandiOptions] = useState<string[]>([]);

  // State managers
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<PredictionRecord | null>(null);
  const [historicalMargin, setHistoricalMargin] = useState<number | null>(null);
  
  // Bonus items
  const [forecastData, setForecastData] = useState<{ date: string; predictedPrice: number; confidenceScore: number }[]>([]);
  const [weatherData, setWeatherData] = useState<{ temp: number; condition: string; humidity: number; rainfall: number; impact: string } | null>(null);
  const [aiInsight, setAiInsight] = useState<{ advice: string; bestSellingMonth: string; alternateCrop: string } | null>(null);

  // Error boundary handler
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  // Sync markets when crop changes
  useEffect(() => {
    if (prices.length > 0) {
      const cropsInDB = Array.from(new Set(prices.map((p) => p.cropName)));
      if (cropsInDB.length > 0 && !selectedCrop) {
        setSelectedCrop(cropsInDB[0]);
      }
    }
  }, [prices]);

  useEffect(() => {
    if (selectedCrop && prices.length > 0) {
      // Find markets where this crop has entries
      const matching = prices.filter((p) => p.cropName.toLowerCase() === selectedCrop.toLowerCase());
      const markets = Array.from(new Set(matching.map((p) => p.market)));
      setMandiOptions(markets);
      
      if (markets.length > 0) {
        setSelectedMarket(markets[0]);
      } else {
        setSelectedMarket("");
      }
    }
  }, [selectedCrop, prices]);

  // Default values
  useEffect(() => {
    if (!targetDate) {
      // Set to 3 months from now
      const date = new Date();
      date.setMonth(date.getMonth() + 3);
      setTargetDate(date.toISOString().split("T")[0]);
    }
  }, []);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCrop || !selectedMarket || !targetDate) return;

    setLoading(true);
    setErrorStatus(null);
    setPrediction(null);
    setAiInsight(null);
    setWeatherData(null);
    setForecastData([]);

    try {
      // 1. Fetch future prediction
      const predRes = await apiService.getPrediction(selectedCrop, selectedMarket, targetDate);
      if (!predRes.success) throw new Error("Our ML nodes failed to calculate. Please double check that you have sufficient training data.");

      setPrediction(predRes.prediction);

      // 2. Fetch historical context average to show price change margins
      const matchedHistory = prices.filter(
        (p) =>
          p.cropName.toLowerCase() === selectedCrop.toLowerCase() &&
          p.market.toLowerCase() === selectedMarket.toLowerCase()
      );
      if (matchedHistory.length > 0) {
        const sum = matchedHistory.reduce((acc, p) => acc + p.modalPrice, 0);
        setHistoricalMargin(Math.round(sum / matchedHistory.length));
      } else {
        setHistoricalMargin(null);
      }

      // 3. Fire parallel bonus queries for a premium agricultural analysis suite
      const [forecastRes, weatherRes, aiRes] = await Promise.all([
        apiService.get30DayForecast(selectedCrop, selectedMarket, targetDate),
        apiService.getWeatherImpact(selectedCrop, selectedMarket.split(" ")[0]), // short location name
        apiService.getAIRecommendation(
          selectedCrop,
          selectedMarket,
          matchedHistory.length > 0 ? Math.round(matchedHistory.reduce((acc, p) => acc + p.modalPrice, 0) / matchedHistory.length) : 0,
          predRes.prediction.predictedPrice,
          targetDate
        ),
      ]);

      if (forecastRes.success) setForecastData(forecastRes.forecast);
      if (weatherRes.success) setWeatherData(weatherRes.weather);
      if (aiRes.success) setAiInsight(aiRes);

    } catch (err: any) {
      console.error(err);
      setErrorStatus(err.message || "An unexpected prediction error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Unique crops from historical price rows
  const cropNames = Array.from(new Set(prices.map((p) => p.cropName)));

  return (
    <div className="space-y-6">
      
      {/* SECTION 1: SEARCH & INPUT PANEL */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm print:hidden">
        <div>
          <h2 className="text-sm font-bold text-slate-900 md:text-base flex items-center gap-1.5">
            <BrainCircuit className="h-4.5 w-4.5 text-emerald-600" />
            Empirical Price Forecasting
          </h2>
          <p className="text-xs text-slate-500">
            Specify a crop, regional mandi, and target future calendar dates to calculate pricing forecasts
          </p>
        </div>

        <form onSubmit={handlePredict} className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Crop Selector */}
          <div>
            <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Crop Variety
            </label>
            <div className="relative">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pr-8 pl-3.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {cropNames.map((c, idx) => (
                  <option key={idx} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-3.5 border-4 border-transparent border-t-slate-500" />
            </div>
          </div>

          {/* Mandi/Market Selector */}
          <div>
            <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Select Mandi / Market
            </label>
            <div className="relative">
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pr-8 pl-3.5 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none disabled:bg-slate-50"
                disabled={mandiOptions.length === 0}
              >
                {mandiOptions.map((m, idx) => (
                  <option key={idx} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3.5 top-3.5 border-4 border-transparent border-t-slate-500" />
            </div>
          </div>

          {/* Target Future Date */}
          <div>
            <label className="block text-2xs font-extrabold uppercase tracking-wider text-slate-400 mb-1.5">
              Target Future Date
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Calendar className="absolute top-3 left-3.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={targetDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3.5 pl-10 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-emerald-600 px-5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-75 focus:outline-none"
              >
                {loading ? "Modeling..." : "Forecast"}
              </button>
            </div>
          </div>
        </form>

        {errorStatus && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-orange-50 p-3.5 text-xs text-orange-700 ring-1 ring-orange-500/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
            <span>{errorStatus}</span>
          </div>
        )}
      </section>

      {/* SECTION 2: EMPTY STATE MESSAGE */}
      {!prediction && !loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center print:hidden">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 md:text-base">Ready to Run Predictor Engine</h3>
          <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
            Configure parameters above and click **"Forecast"** to process Random Forest decision paths.
          </p>
        </div>
      )}

      {/* SECTION 3: LOADING SKELETON GAUGE */}
      {loading && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white py-16 text-center shadow-sm print:hidden">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          <h3 className="mt-4 text-xs font-bold text-slate-800">Bootstrapping Decision Node Trees</h3>
          <p className="mx-auto mt-1 max-w-xs text-2xs text-slate-400">
            Evaluating splits, parsing seasonal trend metrics, and fetching AI recommendations...
          </p>
        </div>
      )}

      {/* SECTION 4: PRESTIGE FORECAST CERTIFICATE & GRAPHS */}
      {prediction && !loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Certificate / Price Card - Prints independently on A4 page */}
          <div id="prediction-report-card" className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col justify-between ring-1 ring-emerald-500/10 relative overflow-hidden bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] [background-size:16px_16px]">
            {/* Stamp Detail */}
            <div className="absolute right-0 top-0 h-16 w-16 translate-x-4 -translate-y-4 rounded-full bg-emerald-50/70 border border-emerald-100 flex items-center justify-center rotate-12">
              <Star className="h-6 w-6 fill-emerald-500 text-emerald-500 opacity-20" />
            </div>

            <div>
              <div className="mb-4 border-b border-slate-150 pb-3">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">
                  Official Forecast
                </span>
                <h3 className="text-base font-black text-slate-900 font-sans tracking-tight">
                  AgriPrice Certificate
                </h3>
              </div>

              <div className="space-y-4">
                {/* Crop Name */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Crop Variety</span>
                  <p className="font-mono text-sm font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded inline-block mt-0.5">
                    {prediction.cropName}
                  </p>
                </div>

                {/* Mandi */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Mandi Locations</span>
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {prediction.market}
                  </p>
                </div>

                {/* Future Date */}
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase">Target Forecast Date</span>
                  <p className="text-xs font-bold text-slate-700 flex items-center gap-1 mt-0.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    {prediction.targetDate}
                  </p>
                </div>

                {/* Pricing result large */}
                <div className="border-t border-dashed border-slate-200 pt-3.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Predicted Price</span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-mono text-2xl font-black text-slate-950">
                      ₹{prediction.predictedPrice}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">/ Quintal</span>
                  </div>

                  {/* Profit margins status compared to historical */}
                  {historicalMargin && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] font-bold">
                      {prediction.predictedPrice >= historicalMargin ? (
                        <>
                          <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                          <span className="text-emerald-600">
                            +{Math.round(((prediction.predictedPrice - historicalMargin) / historicalMargin) * 100)}% above baseline
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingUp className="h-3.5 w-3.5 text-red-500 rotate-180" />
                          <span className="text-red-500">
                            -{Math.round(((historicalMargin - prediction.predictedPrice) / historicalMargin) * 100)}% below baseline
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Confidence Scores */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">ML Confidence Level</span>
                    <span className="font-mono text-xs font-extrabold text-indigo-600">
                      {prediction.confidenceScore}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${prediction.confidenceScore}%` }}
                      className="h-full bg-indigo-500 rounded-full transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Print and certification seal info */}
            <div className="mt-6 border-t border-slate-150 pt-3 flex items-center justify-between gap-1.5 text-4xs font-bold text-slate-400 uppercase tracking-widest print:hidden">
              <span>Verified Random Forest</span>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 rounded bg-slate-100 text-slate-600 px-2 py-1 text-[10px] font-bold hover:bg-emerald-600 hover:text-white transition"
              >
                <Printer className="h-3 w-3" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {/* Line Chart & Extra Analytics */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Chart: 30-day forecast line view */}
            {forecastData.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4">
                  <h3 className="text-xs font-bold text-slate-900 md:text-sm uppercase tracking-wide flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-emerald-600" />
                    30-Day Multi-Point Price Forecast Trajectory
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Calculated price curve over a 30-day index window starting from forecast target date
                  </p>
                </div>

                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={forecastData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="date"
                        stroke="#94a3b8"
                        fontSize={8}
                        tickFormatter={(v) => {
                          const p = v.split("-");
                          return p.length === 3 ? `${p[2]}/${p[1]}` : v;
                        }}
                      />
                      <YAxis stroke="#94a3b8" fontSize={8} />
                      <Tooltip
                        contentStyle={{ fontSize: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                        formatter={(val) => [`₹${val}`, "Forecast Price"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="predictedPrice"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#chartGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Climate Advisory Weather */}
              {weatherData && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#2563eb]">
                    Climate Advisory
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1 flex items-center gap-1.5">
                    <CloudRain className="h-4.5 w-4.5 text-[#2563eb]" />
                    {weatherData.condition} ({weatherData.temp}°C)
                  </h4>
                  <div className="mt-2 text-[10px] grid grid-cols-2 gap-1.5 border-b border-slate-100 pb-2 text-slate-500 font-mono">
                    <span>Humidity: {weatherData.humidity}%</span>
                    <span>Rainfall: {weatherData.rainfall}mm</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed italic">
                    {weatherData.impact}
                  </p>
                </div>
              )}

              {/* Gemini Crop Insights */}
              {aiInsight && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm ring-1 ring-emerald-500/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-600 flex items-center gap-0.5">
                      <Sparkles className="h-3 w-3" />
                      Gemini Agronomic Advice
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed font-semibold">
                    {aiInsight.advice}
                  </p>
                  
                  <div className="mt-3.5 space-y-1 bg-emerald-50/50 p-2 rounded-xl text-3xs text-emerald-800 font-semibold border border-emerald-50">
                    <div className="flex justify-between">
                      <span>Alternate Recommended Crop:</span>
                      <span className="font-bold underline">{aiInsight.alternateCrop}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium Price Selling Months:</span>
                      <span className="font-bold underline">{aiInsight.bestSellingMonth}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PredictorView;
