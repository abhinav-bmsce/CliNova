import React, { useState, useEffect } from 'react';
import {
  GitBranch,
  Play,
  ShieldCheck,
  TrendingUp,
  BarChart3,
  Layers,
  CheckCircle2,
  AlertCircle,
  Database
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function ReadmissionPage() {
  const { datasets, activeDatasetId, setActiveDatasetId, activeDataset } = useDataset();

  const [maxDepth, setMaxDepth] = useState(5);
  const [minSamplesLeaf, setMinSamplesLeaf] = useState(20);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleTrain = async () => {
    if (!activeDatasetId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/readmission/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: activeDatasetId,
          max_depth: maxDepth,
          min_samples_leaf: minSamplesLeaf,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Decision tree training failed.');
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeDatasetId) {
      setResults(null);
      return;
    }
    setError(null);
    fetch(`/api/readmission/latest?dataset_id=${activeDatasetId}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.roc_auc !== undefined) {
          setResults(data);
          if (data.parameters?.max_depth) setMaxDepth(data.parameters.max_depth);
          if (data.parameters?.min_samples_leaf) setMinSamplesLeaf(data.parameters.min_samples_leaf);
        } else {
          setResults(null);
        }
      })
      .catch(() => setResults(null));
  }, [activeDatasetId]);

  if (!activeDatasetId || datasets.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#E4EAE3] p-12 text-center max-w-2xl mx-auto shadow-clinova-card space-y-4 my-8">
        <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center mx-auto">
          <Database className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#35463B]">No Healthcare Dataset Selected</h3>
        <p className="text-xs text-[#758278] leading-relaxed">
          Readmission Analysis requires an active clinical cohort. Please upload or select a dataset in Dataset Management to train the classification tree.
        </p>
      </div>
    );
  }

  const perf = results;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-[#456B56]" />
            <span>Readmission Analysis (Decision Tree Classifier)</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Supervised 30-day early hospital readmission classification on <strong className="text-[#456B56]">{activeDataset?.name}</strong> with patient-level grouped leakage prevention.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Cohort Selector */}
          <div className="flex items-center gap-1.5 bg-[#F0F5EF] px-3 py-1.5 rounded-xl border border-[#E4EAE3] text-xs">
            <span className="font-semibold text-[#456B56]">Cohort:</span>
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

          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DFEAE0] text-[#456B56] text-xs font-semibold border border-[#CDDED0]">
            <ShieldCheck className="w-4 h-4" />
            <span>Grouped Split (patient_id)</span>
          </div>

          <button
            onClick={handleTrain}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? 'Fitting Tree...' : 'Re-Train Classifier'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#FDF2F0] border border-[#F5C2B8] text-[#9E3626] p-4 rounded-2xl text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!perf && !loading ? (
        <div className="bg-white rounded-3xl border border-[#E4EAE3] p-12 text-center max-w-xl mx-auto shadow-clinova-card space-y-4 my-8">
          <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center mx-auto">
            <GitBranch className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#35463B]">No Classification Model Trained for this Cohort</h3>
          <p className="text-xs text-[#758278] leading-relaxed">
            Train a Decision Tree classifier on <strong className="text-[#456B56]">{activeDataset?.name}</strong> to predict early 30-day readmissions and extract clinical feature importances without data leakage.
          </p>
          <button
            onClick={handleTrain}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Train Decision Tree Classifier</span>
          </button>
        </div>
      ) : perf ? (
        <>
          {/* Row 1: KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#DFEAE0]/50 border border-[#CDDED0] text-center">
              <span className="text-[11px] font-bold text-[#456B56] block">ROC-AUC</span>
              <span className="text-2xl font-black text-[#456B56] mt-0.5 block">{perf.roc_auc}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E4EAE3] text-center shadow-clinova-card">
              <span className="text-[11px] text-[#758278] block">Accuracy</span>
              <span className="text-2xl font-bold text-[#35463B] mt-0.5 block">{perf.accuracy}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E4EAE3] text-center shadow-clinova-card">
              <span className="text-[11px] text-[#758278] block">Precision</span>
              <span className="text-2xl font-bold text-[#35463B] mt-0.5 block">{perf.precision}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E4EAE3] text-center shadow-clinova-card">
              <span className="text-[11px] text-[#758278] block">Recall</span>
              <span className="text-2xl font-bold text-[#35463B] mt-0.5 block">{perf.recall}</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-[#E4EAE3] text-center shadow-clinova-card">
              <span className="text-[11px] text-[#758278] block">F1-Score</span>
              <span className="text-2xl font-bold text-[#35463B] mt-0.5 block">{perf.f1_score}</span>
            </div>
          </div>

          {/* Row 2: Confusion Matrix & Feature Importance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Confusion Matrix Table */}
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
              <div className="border-b border-[#F0F5EF] pb-3">
                <h3 className="font-bold text-xs text-[#35463B]">Confusion Matrix (Grouped Test Set)</h3>
                <p className="text-[11px] text-[#758278]">Evaluated on completely unseen patient encounters.</p>
              </div>

              <div className="overflow-x-auto pt-2">
                <table className="w-full text-center text-xs border border-[#E4EAE3] rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-[#F0F5EF] text-[#456B56] font-semibold text-[10px] uppercase">
                      <th className="p-3 text-left border-r border-[#E4EAE3]">Actual / Predicted</th>
                      <th className="p-3 border-r border-[#E4EAE3]">Pred: Not Readmitted</th>
                      <th className="p-3">Pred: Early Readmitted (&lt;30)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E4EAE3]">
                    <tr>
                      <td className="p-3 text-left font-semibold text-[#35463B] bg-[#F7F9F6] border-r border-[#E4EAE3]">
                        Actual: Not Readmitted
                      </td>
                      <td className="p-3 font-mono font-bold text-[#456B56] bg-[#DFEAE0]/40 border-r border-[#E4EAE3]">
                        {perf.confusion_matrix?.[0]?.[0]?.toLocaleString()} (TN)
                      </td>
                      <td className="p-3 font-mono text-[#8C533D] bg-[#F3E5DC]/30">
                        {perf.confusion_matrix?.[0]?.[1]?.toLocaleString()} (FP)
                      </td>
                    </tr>
                    <tr>
                      <td className="p-3 text-left font-semibold text-[#35463B] bg-[#F7F9F6] border-r border-[#E4EAE3]">
                        Actual: Early Readmission
                      </td>
                      <td className="p-3 font-mono text-[#8C533D] bg-[#F3E5DC]/30 border-r border-[#E4EAE3]">
                        {perf.confusion_matrix?.[1]?.[0]?.toLocaleString()} (FN)
                      </td>
                      <td className="p-3 font-mono font-bold text-[#456B56] bg-[#DFEAE0]/40">
                        {perf.confusion_matrix?.[1]?.[1]?.toLocaleString()} (TP)
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Feature Importance Bar Chart */}
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
              <div className="border-b border-[#F0F5EF] pb-3">
                <h3 className="font-bold text-xs text-[#35463B]">Feature Importance Ranking</h3>
                <p className="text-[11px] text-[#758278]">Mean decrease in Gini impurity across all decision nodes.</p>
              </div>

              <div className="space-y-2.5 pt-1 text-xs">
                {perf.feature_importances?.map((f, idx) => {
                  const maxImp = Math.max(...perf.feature_importances.map((x) => x.importance), 0.01);
                  const widthPct = (f.importance / maxImp) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#35463B] font-medium">{f.feature}</span>
                        <span className="font-mono font-bold text-[#456B56]">{f.importance}</span>
                      </div>
                      <div className="h-2 w-full bg-[#F0F5EF] rounded-full overflow-hidden">
                        <div
                          style={{ width: `${widthPct}%` }}
                          className="h-full bg-[#779985] rounded-full"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 3: Decision Rules */}
          {perf.decision_rules && perf.decision_rules.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-3">
              <h3 className="font-bold text-xs text-[#35463B]">Extracted Decision Rules &amp; Tree Paths</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {perf.decision_rules.map((rule, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3] font-mono text-[11px] text-[#35463B]">
                    {rule}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
