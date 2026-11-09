import React, { useState } from 'react';
import {
  Sliders,
  Play,
  CheckCircle2,
  FileCheck2,
  Download,
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function PreprocessingPage() {
  const [strategy, setStrategy] = useState('median');
  const [removeDups, setRemoveDups] = useState(true);
  const [scale, setScale] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/preprocessing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          impute_strategy: strategy,
          remove_duplicates: removeDups,
          scale_numeric: scale,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.metrics);
      }
    } catch (e) {
      console.error('Preprocessing execution error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <Sliders className="w-5 h-5 text-[#456B56]" />
            <span>Clinical Data Preprocessing Pipeline</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Reproducible cleaning, imputation, and standardization. Original raw datasets are never modified.
          </p>
        </div>

        <button
          onClick={handleRun}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
        >
          <Play className="w-4 h-4" />
          <span>{loading ? 'Processing Encounters...' : 'Execute Preprocessing'}</span>
        </button>
      </div>

      {/* Preprocessing Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Missing Values Imputation */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-3">
          <h3 className="font-bold text-xs text-[#35463B]">1. Missing-Value Imputation</h3>
          <p className="text-[11px] text-[#758278]">
            Select imputation strategy to handle unrecorded laboratory markers and patient telemetry.
          </p>
          <div className="space-y-2 pt-2 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                value="median"
                checked={strategy === 'median'}
                onChange={(e) => setStrategy(e.target.value)}
                className="text-[#456B56] focus:ring-[#779985]"
              />
              <span className="text-[#35463B] font-medium">Median (Robust to Clinical Skew)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                value="mode"
                checked={strategy === 'mode'}
                onChange={(e) => setStrategy(e.target.value)}
                className="text-[#456B56] focus:ring-[#779985]"
              />
              <span className="text-[#35463B] font-medium">Mode (Most Frequent Category)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="strategy"
                value="drop"
                checked={strategy === 'drop'}
                onChange={(e) => setStrategy(e.target.value)}
                className="text-[#456B56] focus:ring-[#779985]"
              />
              <span className="text-[#35463B] font-medium">Complete Case Analysis (Drop)</span>
            </label>
          </div>
        </div>

        {/* Card 2: Deduplication */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-3">
          <h3 className="font-bold text-xs text-[#35463B]">2. Encounter Deduplication</h3>
          <p className="text-[11px] text-[#758278]">
            Filter exact duplicate encounters and repeated discharge records.
          </p>
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={removeDups}
                onChange={(e) => setRemoveDups(e.target.checked)}
                className="rounded text-[#456B56] focus:ring-[#779985]"
              />
              <span className="text-[#35463B] font-semibold">Remove duplicate encounters</span>
            </label>
          </div>
        </div>

        {/* Card 3: Numerical Scaling */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-3">
          <h3 className="font-bold text-xs text-[#35463B]">3. Numerical Normalization</h3>
          <p className="text-[11px] text-[#758278]">
            Required for distance-based algorithms such as K-Means patient clustering.
          </p>
          <div className="space-y-2 pt-2 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="scale"
                value="standard"
                checked={scale === 'standard'}
                onChange={(e) => setScale(e.target.value)}
                className="text-[#456B56] focus:ring-[#779985]"
              />
              <span className="text-[#35463B] font-medium">StandardScaler (Mean=0, Var=1)</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="radio"
                name="scale"
                value="minmax"
                checked={scale === 'minmax'}
                onChange={(e) => setScale(e.target.value)}
                className="text-[#456B56] focus:ring-[#779985]"
              />
              <span className="text-[#35463B] font-medium">MinMaxScaler [0, 1] Range</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Comparison Panel */}
      {results && (
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#F0F5EF]">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#456B56]" />
              <h3 className="font-bold text-sm text-[#35463B]">Preprocessing Transformation Audit</h3>
            </div>
            <span className="text-xs bg-[#DFEAE0] text-[#456B56] px-2.5 py-1 rounded-full font-semibold">
              Status: Verified & Persisted
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-1">
            <div className="p-3.5 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
              <span className="text-[11px] text-[#758278]">Encounters Before / After</span>
              <p className="text-lg font-bold text-[#35463B] mt-0.5">
                {results.rows_before.toLocaleString()} ➔ {results.rows_after.toLocaleString()}
              </p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
              <span className="text-[11px] text-[#758278]">Duplicates Removed</span>
              <p className="text-lg font-bold text-[#456B56] mt-0.5">{results.duplicates_removed}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
              <span className="text-[11px] text-[#758278]">Imputed Columns</span>
              <p className="text-lg font-bold text-[#35463B] mt-0.5">{results.imputed_columns_count}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
              <span className="text-[11px] text-[#758278]">Strategy Applied</span>
              <p className="text-lg font-bold text-[#35463B] mt-0.5 capitalize">{results.imputation_strategy}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-[#E7F1ED] border border-[#D2E5DE] text-xs text-[#456B56] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#456B56]" />
              <span>Processed file saved to storage/processed/{results.output_filename}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
