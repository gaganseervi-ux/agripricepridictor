import { useState, useEffect } from "react";
import { Sprout, RefreshCw, Cpu, BookOpen, AlertCircle } from "lucide-react";
import Navbar from "./components/Navbar";
import CSVUploader from "./components/CSVUploader";
import DashboardView from "./pages/DashboardView";
import PredictorView from "./pages/PredictorView";
import AnalyticsView from "./pages/AnalyticsView";
import apiService from "./services/api";
import { Crop, MarketPrice, ModelMetrics } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [crops, setCrops] = useState<Crop[]>([]);
  const [prices, setPrices] = useState<MarketPrice[]>([]);
  const [stats, setStats] = useState({
    totalCrops: 0,
    totalMarkets: 0,
    averagePrice: 0,
    predictionAccuracy: 0,
    totalUploads: 0,
  });
  const [modelMetrics, setModelMetrics] = useState<ModelMetrics | null>(null);

  // Loading and action indicators
  const [loading, setLoading] = useState<boolean>(true);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);
  const [appError, setAppError] = useState<string | null>(null);

  // Sync historical values and crops on mount
  const loadSystemData = async (showGlobalLoading = false) => {
    if (showGlobalLoading) setLoading(true);
    setAppError(null);
    try {
      const [cropsData, historyResults] = await Promise.all([
        apiService.getCrops(),
        apiService.getHistory(),
      ]);

      setCrops(cropsData);
      setPrices(historyResults.prices || []);
      setStats(historyResults.stats);
      setModelMetrics(historyResults.modelMetrics);
    } catch (err: any) {
      console.error("Mount data synchronization failure:", err);
      setAppError("System Error: Failed to synchronize historical sqlite registries.");
    } finally {
      if (showGlobalLoading) setLoading(false);
    }
  };

  useEffect(() => {
    loadSystemData(true);
  }, []);

  // Handle CSV Spreadsheet upload callback
  const handleCSVUpload = async (csvString: string) => {
    setAppError(null);
    try {
      const result = await apiService.uploadCSV(csvString);
      if (result.success) {
        // Reload sqlite stats
        await loadSystemData(false);
      } else {
        throw new Error(result.message || "Failed parsing uploaded data row structure.");
      }
    } catch (err: any) {
      console.error("CSV Upload failed:", err);
      setAppError(err.message || "Spreadsheet upload could not be processed.");
      throw err; // bubble up to uploader component error state
    }
  };

  // Trigger Random Forest Re-Training
  const handleTrainModel = async () => {
    setIsTraining(true);
    setAppError(null);
    try {
      const response = await apiService.trainModel();
      if (response.success && response.metrics) {
        setModelMetrics(response.metrics);
        // Refresh metrics state
        await loadSystemData(false);
      } else {
        throw new Error(response.message || "Model fitting failure. Insufficient pricing structures.");
      }
    } catch (err: any) {
      console.error(err);
      setAppError(err.message || "Random Forest fitting failed.");
    } finally {
      setIsTraining(false);
    }
  };

  // Revert custom imports to standard historical averages
  const handleResetDatabase = async () => {
    setIsResetting(true);
    setAppError(null);
    try {
      const result = await apiService.resetDatabase();
      if (result.success) {
        await loadSystemData(false);
      }
    } catch (err: any) {
      console.error(err);
      setAppError("Failed to reset baseline pricing indexes.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafbfc] text-slate-800 font-sans antialiased flex flex-col justify-between">
      
      {/* 1. STICKY HEADER NAV BAR */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onReset={handleResetDatabase}
        isResetting={isResetting}
        importedCount={stats.totalUploads}
      />

      {/* 2. MAIN GRID CONTAINER */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Error Ribbon */}
        {appError && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-xs text-red-800 shadow-sm">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
            <div>
              <span className="font-bold">Error Insight:</span> {appError}
            </div>
          </div>
        )}

        {/* Global Loading Spinner */}
        {loading ? (
          <div className="flex h-96 w-full flex-col items-center justify-center space-y-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse">
              Syncing Mandi Ledger Index...
            </p>
          </div>
        ) : (
          <div className="space-y-8 animate-fade-in duration-300">
            
            {/* View Switch Router */}
            {activeTab === "dashboard" && (
              <div className="space-y-8">
                {/* Statistics Overview & Tables */}
                <DashboardView stats={stats} prices={prices} />

                {/* CSV Importer & Training center */}
                <section className="border-t border-slate-200/80 pt-8">
                  <div className="mb-4">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1">
                      <Cpu className="h-4.5 w-4.5 text-emerald-600" />
                      Dataset Control & Training Nodes
                    </h3>
                    <p className="text-2xs text-slate-500">
                      Import additional crop records or trigger Random Forest Regressors to compute coefficients
                    </p>
                  </div>
                  <CSVUploader
                    onUploadSuccess={handleCSVUpload}
                    onTrainModel={handleTrainModel}
                    isTraining={isTraining}
                    metrics={modelMetrics}
                  />
                </section>
              </div>
            )}

            {activeTab === "predictor" && (
              <PredictorView crops={crops} prices={prices} />
            )}

            {activeTab === "analytics" && (
              <AnalyticsView prices={prices} />
            )}

          </div>
        )}
      </main>

      {/* 3. HUMBLE STANDARDISED APP FOOTER (No clutter, slop-free!) */}
      <footer className="w-full border-t border-[#e2e8f0] bg-white py-6 mt-12 print:hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-emerald-600/60" />
            <span className="text-xs font-bold text-slate-500 tracking-tight">
              Agriculture Price Predictor System
            </span>
          </div>
          <div className="flex items-center gap-4 text-4xs font-bold uppercase tracking-widest">
            <span>SQLite Local Ledger v1.2</span>
            <span>•</span>
            <span>Unbiased Random Forest Regressor Model</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
