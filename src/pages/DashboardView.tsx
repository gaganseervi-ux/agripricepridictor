import React, { useState } from "react";
import { Search, MapPin, DollarSign, Calendar, TrendingUp, Cpu, Database, CheckCircle, TableProperties } from "lucide-react";
import { MarketPrice } from "../types";

interface DashboardViewProps {
  stats: {
    totalCrops: number;
    totalMarkets: number;
    averagePrice: number;
    predictionAccuracy: number;
    totalUploads: number;
  };
  prices: MarketPrice[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ stats, prices }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [marketFilter, setMarketFilter] = useState("");

  // Get list of unique markets for filter dropdown
  const uniqueMarkets = Array.from(new Set(prices.map((p) => p.market)));

  // Filter listings based on filters
  const filteredPrices = prices.filter((p) => {
    const matchesSearch = p.cropName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMarket = marketFilter === "" || p.market === marketFilter;
    return matchesSearch && matchesMarket;
  });

  // Take the latest 8 records to prevent layout bloating
  const recentPrices = filteredPrices.slice(-8).reverse();

  return (
    <div className="space-y-6">
      
      {/* 1. BENTO-GRID METRIC STATUS HIGHLIGHTS */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        
        {/* Metric 1: Total Crops */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between pb-1">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Crop Varieties</span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <Database className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-slate-800 md:text-2xl">
            {stats.totalCrops} Registered
          </p>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-emerald-600">
            <CheckCircle className="h-3 w-3" />
            <span>SQLite Table schema active</span>
          </div>
        </div>

        {/* Metric 2: Avg Price */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between pb-1">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Average Price (Qtl)</span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-slate-800 md:text-2xl">
            ₹{stats.averagePrice.toLocaleString("en-IN")}
          </p>
          <div className="mt-1.5 flex items-center gap-0.5 text-[10px] text-slate-500">
            <TrendingUp className="h-3 w-3 text-emerald-500" />
            <span className="text-emerald-600 font-bold">+3.8%</span>
            <span>seasonal rise</span>
          </div>
        </div>

        {/* Metric 3: Active Markets */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between pb-1">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Trading Hubs</span>
            <div className="rounded-lg bg-emerald-50 p-1.5 text-emerald-600">
              <MapPin className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-slate-800 md:text-2xl">
            {stats.totalMarkets} Regional
          </p>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500">
            <span>Primary Indian Mandis loaded</span>
          </div>
        </div>

        {/* Metric 4: Prediction Accuracy */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-sm transition hover:shadow-md">
          <div className="flex items-center justify-between pb-1">
            <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">Predictor R² Score</span>
            <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-1 font-mono text-xl font-bold text-indigo-700 md:text-2xl">
            {stats.predictionAccuracy}% Accuracy
          </p>
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-indigo-600 font-medium">
            <span>Random Forest validated on 20% test</span>
          </div>
        </div>

      </section>

      {/* 2. LIVE CROP REGISTER LISTING */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-900 md:text-base flex items-center gap-1.5">
              <TableProperties className="h-4 w-4 text-slate-500" />
              Latest Mandi Pricing Directory
            </h3>
            <p className="text-xs text-slate-500">
              Search and filter primary market price entries compiled in local database tables
            </p>
          </div>

          {/* Filtering Tools */}
          <div className="flex flex-col gap-2.5 sm:flex-row">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search crop variety..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pr-4 pl-9 text-xs font-semibold text-slate-800 placeholder-slate-400 transition hover:border-emerald-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none sm:w-48"
              />
            </div>

            {/* Market dropdown */}
            <div className="relative">
              <select
                value={marketFilter}
                onChange={(e) => setMarketFilter(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2 pr-8 pl-3.5 text-xs font-semibold text-slate-700 ring-offset-background transition hover:border-emerald-300 focus:border-emerald-500 focus:outline-none"
              >
                <option value="">All Trading Markets</option>
                {uniqueMarkets.map((m, idx) => (
                  <option key={idx} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-3 top-3 border-4 border-transparent border-t-slate-500" />
            </div>
          </div>
        </div>

        {/* Pricing Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full border-collapse text-left text-xs text-slate-500">
            <thead className="border-b border-slate-200 bg-slate-50/70 text-2xs font-extrabold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Crop Name</th>
                <th className="px-6 py-4">Market / Mandi</th>
                <th className="px-6 py-4">As-of Date</th>
                <th className="px-6 py-4">Modal Price / Quintal</th>
                <th className="px-6 py-4 text-right">Data Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-medium text-slate-700">
              {recentPrices.length > 0 ? (
                recentPrices.map((p, index) => (
                  <tr key={p.id || index} className="transition-colors hover:bg-slate-50/50">
                    <td className="px-6 py-4">
                      <span className="rounded-lg bg-emerald-50/60 font-semibold text-emerald-800 px-2 py-1 select-all font-mono">
                        {p.cropName}
                      </span>
                    </td>
                    <td className="px-6 py-4 flex items-center gap-1 text-slate-600">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{p.market}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{p.date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-bold font-mono">
                      ₹{p.modalPrice.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {p.isSample ? (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-3xs font-extrabold uppercase text-slate-400 ring-1 ring-slate-200">
                          Baseline Seed
                        </span>
                      ) : (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-3xs font-extrabold uppercase text-emerald-700 ring-1 ring-emerald-300">
                          User Upload
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">
                    No crop data points match your inputs. Upload a new CSV or adjust your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Display showing count */}
        <div className="mt-4 flex items-center justify-between text-2xs font-extrabold text-slate-400 uppercase tracking-widest">
          <span>Database Index Status: OK</span>
          <span>
            Displaying {recentPrices.length} of {filteredPrices.length} rows (
            {prices.length} total)
          </span>
        </div>
      </section>

    </div>
  );
};

export default DashboardView;
