import React, { useState, useRef } from "react";
import { Upload, Info, CheckCircle2, AlertTriangle, Play, HelpCircle, FileText, Sparkles } from "lucide-react";
import { ModelMetrics } from "../types";

interface CSVUploaderProps {
  onUploadSuccess: (csvString: string) => Promise<void>;
  onTrainModel: () => Promise<void>;
  isTraining: boolean;
  metrics: ModelMetrics | null;
}

export const CSVUploader: React.FC<CSVUploaderProps> = ({
  onUploadSuccess,
  onTrainModel,
  isTraining,
  metrics,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [showCSVHelper, setShowCSVHelper] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Drag Events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Convert size to string representation
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = 2;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const processFile = async (file: File) => {
    setErrorMsg(null);
    setSuccessMsg(null);

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setErrorMsg("File selection failed. Please upload a structured .CSV spreadsheet.");
      return;
    }

    setFileDetails({
      name: file.name,
      size: formatBytes(file.size),
    });

    setUploadLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        if (!text) {
          setErrorMsg("Failed to read selection contents.");
          setUploadLoading(false);
          return;
        }

        // Validate basic headers first
        const firstLine = text.split(/\r?\n/)[0];
        const headers = firstLine.split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
        
        const hasDate = headers.includes("date");
        const hasCrop = headers.some(h => ["crop name", "crop", "cropname"].includes(h));
        const hasMarket = headers.includes("market");
        const hasPrice = headers.some(h => ["modal price", "price", "modalprice", "amount"].includes(h));

        if (!hasDate || !hasCrop || !hasMarket || !hasPrice) {
          setErrorMsg("Missing required headers! Ensure your CSV columns represent: Date, Crop Name, Market, and Modal Price.");
          setUploadLoading(false);
          return;
        }

        await onUploadSuccess(text);
        setSuccessMsg(`Import successful! Loaded dataset targets into SQLite. Click 'Train Random Forest' below to adapt predictions.`);
        setUploadLoading(false);
      };

      reader.onerror = () => {
        setErrorMsg("FileReader error reading CSV file.");
        setUploadLoading(false);
      };

      reader.readAsText(file);
    } catch (e: any) {
      setErrorMsg(e.message || "File processing failure.");
      setUploadLoading(false);
    }
  };

  // Handle Drops
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  // Handle Input selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Generate Sample CSV String for copy-pasting
  const downloadSampleTemplate = () => {
    const csvContent = "Date,Crop Name,Market,Modal Price\n2026-06-01,Tomato,Mumbai (Vashi),3200\n2026-06-01,Wheat,Delhi (Azadpur),2550\n2026-06-01,Potato,Bengaluru (Yeshwanthpur),1950";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "crop_prices_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      
      {/* LEFT PANEL: CSV FILE UPLOADER */}
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 md:text-base">
              Crop Pricing Dataset Import
            </h2>
            <p className="text-xs text-slate-500">
              Inject custom CSV files into the SQLite price register
            </p>
          </div>
          <button
            onClick={() => setShowCSVHelper(!showCSVHelper)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
            title="CSV Format Requirements"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        </div>

        {showCSVHelper && (
          <div className="mb-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-slate-200/50">
            <span className="font-bold text-slate-900">Required CSV Columns:</span>
            <ul className="mt-1 list-inside list-disc space-y-0.5 text-[11px]">
              <li><code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-emerald-700">Date</code> - formatted as YYYY-MM-DD or standard notation.</li>
              <li><code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-emerald-700">Crop Name</code> - e.g., Wheat, Rice, Tomato.</li>
              <li><code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-emerald-700">Market</code> - regional marketplace node.</li>
              <li><code className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200 text-emerald-700">Modal Price</code> - numeric pricing values per 100 kg.</li>
            </ul>
            <div className="mt-2.5 flex justify-end gap-2">
              <button
                onClick={downloadSampleTemplate}
                className="flex items-center gap-1 rounded bg-white px-2 py-1 text-[11px] font-semibold text-emerald-600 hover:bg-slate-100 border border-slate-200"
              >
                <FileText className="h-3 w-3" />
                <span>Download Sample</span>
              </button>
            </div>
          </div>
        )}

        {/* Drag Drop Field */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={triggerFileInput}
          className={`group flex flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
            dragActive
              ? "border-emerald-500 bg-emerald-50/40"
              : "border-slate-200 hover:border-emerald-500/70 hover:bg-slate-50/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".csv"
            onChange={handleFileChange}
          />

          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600">
            <Upload className="h-5 w-5" />
          </div>

          <p className="text-xs font-semibold text-slate-800">
            {uploadLoading ? "Reading spreadsheets..." : "Drag and drop pricing CSV, or browse"}
          </p>
          <p className="mt-1 text-[10px] text-slate-400">
            Supported formats: standard .csv spreadsheet files
          </p>

          {fileDetails && (
            <div className="mt-3.5 flex items-center gap-1.5 rounded-lg bg-slate-50 border border-slate-200/80 px-2.5 py-1 text-[11px] font-medium text-slate-600">
              <span className="truncate max-w-[140px] font-mono">{fileDetails.name}</span>
              <span className="text-slate-400">({fileDetails.size})</span>
            </div>
          )}
        </div>

        {/* Status Messages */}
        {errorMsg && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs text-red-700 ring-1 ring-red-500/10">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            <div>
              <span className="font-bold">Format Error:</span> {errorMsg}
            </div>
          </div>
        )}

        {successMsg && (
          <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 p-3 text-xs text-emerald-800 ring-1 ring-emerald-500/10">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <div>
              <span className="font-bold">Database loaded:</span> {successMsg}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT PANEL: RANDOM FOREST TRAINING */}
      <div className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-3">
          <div className="flex items-center gap-1.5">
            <h2 className="text-sm font-bold text-slate-900 md:text-base">
              Time Series Forecast Center
            </h2>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-600 uppercase tracking-wider ring-1 ring-indigo-600/10 flex items-center gap-0.5">
              <Sparkles className="h-2.5 w-2.5" />
              RF Regressors
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Configure decision parameters and initialize machine learning models
          </p>
        </div>

        <div className="flex-1 space-y-3.5">
          {/* Active stats */}
          <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-3 text-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Estimators
              </span>
              <p className="font-mono text-base font-bold text-slate-800">8 Decision Trees</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Hyperparameters
              </span>
              <p className="font-mono text-base font-bold text-slate-800">Depth=8 (Variance Reduc.)</p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Database Samples
              </span>
              <p className="font-mono text-base font-bold text-slate-800">
                {metrics ? metrics.sampleCount : "Initializing..."} Rows
              </p>
            </div>
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Last Optimized At
              </span>
              <p className="font-mono text-[11px] font-bold text-slate-800 truncate" title={metrics?.trainedAt}>
                {metrics ? new Date(metrics.trainedAt).toLocaleTimeString() : "Unoptimized"}
              </p>
            </div>
          </div>

          {/* Model Accuracy Output Gauge */}
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-3.5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-semibold text-slate-500">Algorithm Test Accuracy Score</span>
              <span className="font-mono text-sm font-black text-emerald-600">
                {metrics ? metrics.accuracyPercent : 85}%
              </span>
            </div>
            
            {/* Accuracy Progress Bar */}
            <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                style={{ width: `${metrics ? metrics.accuracyPercent : 85}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-indigo-500 transition-all duration-500"
              />
            </div>

            <div className="mt-2.5 grid grid-cols-3 gap-1 divide-x divide-slate-100 text-center">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">MAE Score</span>
                <p className="font-mono text-xs font-bold text-slate-700">₹{metrics ? metrics.mae : "145.2"}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">RMSE Score</span>
                <p className="font-mono text-xs font-bold text-slate-700">₹{metrics ? metrics.rmse : "198.8"}</p>
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase">R² Coefficient</span>
                <p className="font-mono text-xs font-bold text-slate-700">{metrics ? metrics.r2 : "0.88"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={onTrainModel}
          disabled={isTraining}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 text-xs font-bold text-white shadow-sm transition hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-75"
        >
          {isTraining ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Optimizing Random Forest Leaves...</span>
            </>
          ) : (
            <>
              <Play className="h-4 w-4 fill-white text-emerald-600" />
              <span>Train Random Forest Regressor</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
};

export default CSVUploader;
