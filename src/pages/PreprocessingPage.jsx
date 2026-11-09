import React, { useState } from 'react';
import {
  Sliders,
  Play,
  CheckCircle2,
  FileCheck2,
  Download,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Database
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function PreprocessingPage() {
  const { datasets, activeDatasetId, setActiveDatasetId, activeDataset } = useDataset();
  const [strategy, setStrategy] = useState('median');
  const [removeDups, setRemoveDups] = useState(true);
  const [scale, setScale] = useState('standard');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    if (!activeDatasetId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/preprocessing/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: activeDatasetId,
          impute_strategy: strategy,
          remove_duplicates: removeDups,
          scale_numeric: scale,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.metrics);
      } else {
        const err = await res.json();
        setError(err.error || 'Preprocessing failed.');
      }
    } catch (e) {
      setError(`Execution network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!activeDatasetId || datasets.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#E4EAE3] p-12 text-center max-w-2xl mx-auto shadow-clinova-card space-y-4 my-8">
        <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center mx-auto">
          <Database className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#35463B]">No Healthcare Dataset Selected</h3>
        <p className="text-xs text-[#758278] leading-relaxed">
          Preprocessing requires an active clinical cohort. Please upload or select a dataset in Dataset Management to configure imputation, duplicate filtering, and standardization.
        </p>
      </div>
    );
  }

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
            Reproducible cleaning, imputation, and standardization on <strong className="text-[#456B56]">{activeDataset?.name}</strong>. Original raw files are preserved without modification.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#F0F5EF] px-3 py-1.5 rounded-xl border border-[#E4EAE3] text-xs">
            <span className="font-semibold text-[#456B56]">Target Cohort:</span>
            <select
              value={activeDatasetId}
              onChange={(e) => setActiveDatasetId(Number(e.target.value))}
              className="bg-transparent font-bold text-[#35463B] focus:outline-none cursor-pointer"
            >
              {datasets.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRun}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? 'Processing Encounters...' : 'Execute Preprocessing'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FBEAE8] border border-[#F5C2BC] text-[#C53929] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Preprocessing Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Missing Values Imputation */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-3">
          <h3 className="font-bold text-xs text-[#35463B]">1. Missing-Value Imputation</h3>
          <p className="text-[11px] text-[#758278]">
            Select imputation strategy to handle unrecorded laboratory markers and clinical attributes.
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
              <span className="text-[#35463B] font-medium">Median (Robust to Outliers)</span>
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
              <span className="text-[#35463B] font-medium">Complete Case Analysis (Drop NaN)</span>
            </label>
          </div>
        </div>

        {/* Card 2: De-duplication & Integrity */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-3">
          <h3 className="font-bold text-xs text-[#35463B]">2. Deduplication &amp; Integrity</h3>
          <p className="text-[11px] text-[#758278]">
            Prevent multiple encounter entries from duplicating clinical event counts.
          </p>
          <div className="pt-2 text-xs">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={removeDups}
                onChange={(e) => setRemoveDups(e.target.checked)}
                className="rounded text-[#456B56] focus:ring-[#779985]"
              />
              <span className="text-[#35463B] font-medium">Remove Duplicate Encounters</span>
            </label>
            <p className="text-[10px] text-[#758278] mt-2">
              Deduplication groups identical encounter records to prevent sample distortion in frequency calculations.
            </p>
          </div>
        </div>

        {/* Card 3: Numerical Normalization */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-3">
          <h3 className="font-bold text-xs text-[#35463B]">3. Feature Scaling &amp; Normalization</h3>
          <p className="text-[11px] text-[#758278]">
            Standardize continuous clinical features for distance-based clustering algorithms.
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
              <span className="text-[#35463B] font-medium">StandardScaler (Z-Score: μ=0, σ=1)</span>
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
              <span className="text-[#35463B] font-medium">MinMaxScaler (Range [0, 1])</span>
            </label>
          </div>
        </div>
      </div>

      {/* Before & After Audit Summary Card */}
      {results && (
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#456B56]" />
              <h3 className="font-bold text-xs text-[#35463B]">Preprocessing Audit Summary</h3>
            </div>
            <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2.5 py-0.5 rounded-full font-bold">
              Status: Verified
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
              <span className="text-[#758278] block">Initial Encounters</span>
              <span className="text-base font-bold text-[#35463B] font-mono">
                {(results.initial_rows ?? results.rows_before)?.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
              <span className="text-[#758278] block">Final Processed Encounters</span>
              <span className="text-base font-bold text-[#456B56] font-mono">
                {(results.final_rows ?? results.rows_after)?.toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
              <span className="text-[#758278] block">Attributes / Columns</span>
              <span className="text-base font-bold text-[#35463B] font-mono">
                {results.final_columns ?? results.columns_after}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
              <span className="text-[#758278] block">Duplicates Removed</span>
              <span className="text-base font-bold text-[#758278] font-mono">
                {results.duplicates_removed || 0}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F0F5EF] flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-2 text-[#758278]">
              <span className="font-semibold text-[#35463B]">Strategy Applied:</span>
              <span className="capitalize">{results.imputation_strategy} Imputation ({results.imputed_columns_count || 0} columns)</span>
            </div>
            {results.processed_file_path && (
              <div className="text-[11px] text-[#758278] font-mono truncate max-w-md" title={results.processed_file_path}>
                <span className="text-[#456B56] font-semibold">Artifact: </span>
                {results.output_filename || results.processed_file_path}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
