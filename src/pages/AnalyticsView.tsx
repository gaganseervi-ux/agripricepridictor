import React, { useState } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import { LineChart as LineIcon, BarChart2, Calendar, MapPin, SlidersHorizontal, Sliders } from "lucide-react";
import { MarketPrice } from "../types";

interface AnalyticsViewProps {
  prices: MarketPrice[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ prices }) => {
  // Filters
  const [selectedCrop, setSelectedCrop] = useState("Tomato");
  const [selectedMarket, setSelectedMarket] = useState("");

  const uniqueCrops = Array.from(new Set(prices.map((p) => p.cropName)));
  const uniqueMarkets = Array.from(new Set(prices.map((p) => p.market)));

  // Filter dataset for primary line chart (Historical Trends)
  const historicalData = prices.filter((p) => {
    const cropMatch = p.cropName.toLowerCase() === selectedCrop.toLowerCase();
    const marketMatch = selectedMarket === "" || p.market.toLowerCase() === selectedMarket.toLowerCase();
    return cropMatch && marketMatch;
  });

  // Aggregate monthly averages (Seasonal chart)
  const monthlyAverages = React.useMemo(() => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];

    const totals = Array.from({ length: 12 }, () => ({ sum: 0, count: 0 }));

    prices
      .filter((p) => p.cropName.toLowerCase() === selectedCrop.toLowerCase())
      .forEach((p) => {
        const date = new Date(p.date);
        const m = date.getMonth(); // 0 to 11
        if (!isNaN(m)) {
          totals[m].sum += p.modalPrice;
          totals[m].count += 1;
        }
      });

    return totalMap(months, totals);
  }, [prices, selectedCrop]);

  // Comparative market averages (Market-wise barchart)
  const marketComparisons = React.useMemo(() => {
    const marketMap: { [market: string]: { sum: number; count: number } } = {};
    
    prices
      .filter((p) => p.cropName.toLowerCase() === selectedCrop.toLowerCase())
      .forEach((p) => {
        if (!(p.market in marketMap)) {
          marketMap[p.market] = { sum: 0, count: 0 };
        }
        marketMap[p.market].sum += p.modalPrice;
        marketMap[p.market].count += 1;
      });

    return Object.entries(marketMap).map(([marketName, stats]) => ({
      name: marketName.split(" ")[0], // short name
      fullName: marketName,
      avgPrice: stats.count > 0 ? Math.round(stats.sum / stats.count) : 0,
    }));
  }, [prices, selectedCrop]);

  function totalMap(months: string[], totals: { sum: number; count: number }[]) {
    return months.map((mName, idx) => ({
      month: mName.substring(0, 3), // e.g. "Jan"
      fullName: mName,
      avgPrice: totals[idx].count > 0 ? Math.round(totals[idx].sum / totals[idx].count) : 0,
    })).filter(item => item.avgPrice > 0); // Hide empty months
  }

  // Pre-fill selected crop if state changes
  React.useEffect(() => {
    if (uniqueCrops.length > 0 && !uniqueCrops.includes(selectedCrop)) {
      setSelectedCrop(uniqueCrops[0]);
    }
  }, [prices]);

  return (
    <div className="space-y-6">
      
      {/* 1. FILTER RIBBON */}
      <section className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-4.5 w-4.5 text-slate-500" />
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Analytics Variable Filters
            </h3>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {/* Crop selection */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                Crop Variety
              </label>
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                {uniqueCrops.map((c, idx) => (
                  <option key={idx} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Market selection */}
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 mb-1">
                Market Location
              </label>
              <select
                value={selectedMarket}
                onChange={(e) => setSelectedMarket(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white py-1.5 px-3 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">All Markets Consolidated</option>
                {uniqueMarkets.map((m, idx) => (
                  <option key={idx} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 2. MAIN VISUALIZATION SEGMENT */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Visual 1: Historical Area Line Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <LineIcon className="h-4.5 w-4.5 text-emerald-600" />
              Chronological Market Pricing Trends
            </h3>
            <p className="text-2xs text-slate-500">
              Long-term time-series index for <span className="font-bold underline">{selectedCrop}</span>
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="historyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={8}
                  tickFormatter={(val) => {
                    // Short dates
                    const p = val.split("-");
                    return p.length === 3 ? `${p[1]}/${p[0].substring(2)}` : val;
                  }}
                />
                <YAxis stroke="#94a3b8" fontSize={8} />
                <Tooltip
                  contentStyle={{ fontSize: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}
                  formatter={(val, name, props) => [`₹${val}`, `${props.payload.market}`]}
                />
                <Area
                  type="monotone"
                  dataKey="modalPrice"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#historyGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visual 2: Comparative Market Bar Chart */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <MapPin className="h-4.5 w-4.5 text-[#2563eb]" />
              Market Node Arbitrage Averages
            </h3>
            <p className="text-2xs text-slate-500">
              Relative valuation difference across regional mandi zones
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={marketComparisons} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={8} />
                <Tooltip
                  contentStyle={{ fontSize: "10px", borderRadius: "8px" }}
                  formatter={(val) => [`₹${val}`, "Avg Price"]}
                />
                <Bar dataKey="avgPrice" fill="#2563eb" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visual 3: Monthly Seasonal Bar Chart */}
        <div className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
              <BarChart2 className="h-4.5 w-4.5 text-indigo-600" />
              Annual Seasonal Valuation Indices
            </h3>
            <p className="text-2xs text-slate-500">
              Composite historical month-by-month premium/valley cycles (identifies crop seasonality profiles)
            </p>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyAverages} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={9} />
                <YAxis stroke="#94a3b8" fontSize={8} />
                <Tooltip
                  contentStyle={{ fontSize: "10px", borderRadius: "8px" }}
                  formatter={(val) => [`₹${val}`, "Areal Index"]}
                />
                <Bar dataKey="avgPrice" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </section>

    </div>
  );
};

export default AnalyticsView;
