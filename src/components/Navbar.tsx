import React from "react";
import { Sprout, RefreshCw, LayoutDashboard, BrainCircuit, BarChart3, Database } from "lucide-react";

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onReset: () => void;
  isResetting: boolean;
  importedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onReset,
  isResetting,
  importedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#e2e8f0] bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-4 ring-emerald-50/50">
            <Sprout className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-950 sm:text-lg">
              AgriPrice Predictor
            </h1>
            <p className="hidden text-[10px] font-semibold uppercase tracking-wider text-emerald-600 sm:block">
              Machine Learning Intel
            </p>
          </div>
        </div>

        {/* Center Tab Navigation */}
        <nav className="flex space-x-1 rounded-xl bg-slate-100 p-1 md:space-x-1.5">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all sm:px-3 sm:text-sm ${
              activeTab === "dashboard"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <button
            onClick={() => setActiveTab("predictor")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all sm:px-3 sm:text-sm ${
              activeTab === "predictor"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
            }`}
          >
            <BrainCircuit className="h-4 w-4" />
            <span className="hidden sm:inline">ML Prices</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all sm:px-3 sm:text-sm ${
              activeTab === "analytics"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Analytics Trends</span>
          </button>
        </nav>

        {/* Database & System Reset Actions */}
        <div className="flex items-center gap-2.5">
          {importedCount > 0 && (
            <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 md:flex ring-1 ring-emerald-600/10">
              <Database className="h-3.5 w-3.5" />
              <span>+{importedCount} User Records</span>
            </div>
          )}

          <button
            onClick={() => {
              if (window.confirm("Restore default historical multi-year records? This will delete custom uploaded sets.")) {
                onReset();
              }
            }}
            disabled={isResetting}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isResetting ? "animate-spin text-emerald-600" : ""}`} />
            <span className="hidden md:inline">Reset Baseline</span>
          </button>
        </div>

      </div>
    </header>
  );
};

export default Navbar;
