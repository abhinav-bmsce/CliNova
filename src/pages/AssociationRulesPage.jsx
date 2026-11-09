import React, { useState, useEffect } from 'react';
import {
  Network,
  Play,
  Download,
  Share2,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Database,
  AlertCircle
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function AssociationRulesPage() {
  const { datasets, activeDatasetId, setActiveDatasetId, activeDataset } = useDataset();

  const [algorithm, setAlgorithm] = useState('apriori'); // 'apriori' | 'fp-growth'
  const [minSupport, setMinSupport] = useState(0.03);
  const [minConfidence, setMinConfidence] = useState(0.60);
  const [minLift, setMinLift] = useState(1.5);
  const [targetConsequent, setTargetConsequent] = useState('readmitted = <30');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleRunMining = async (algoToRun = algorithm) => {
    if (!activeDatasetId) return;
    setLoading(true);
    setError(null);
    const endpoint = algoToRun === 'apriori' ? '/api/mining/apriori' : '/api/mining/fp-growth';

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: activeDatasetId,
          min_support: minSupport,
          min_confidence: minConfidence,
          min_lift: minLift,
          target_consequent: targetConsequent,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Association mining execution failed.');
      }
    } catch (e) {
      setError(`Network error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initial load for active dataset
  useEffect(() => {
    if (!activeDatasetId) {
      setResults(null);
      return;
    }
    fetch(`/api/mining/latest?dataset_id=${activeDatasetId}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.rules && data.rules.length > 0) {
          setResults(data);
        } else {
          setResults(null);
        }
      })
      .catch(() => setResults(null));
  }, [activeDatasetId]);

  const handleAlgorithmSwitch = (newAlgo) => {
    setAlgorithm(newAlgo);
    // Algorithm toggle preserves thresholds, target consequent, and dataset selection!
  };

  if (!activeDatasetId || datasets.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#E4EAE3] p-12 text-center max-w-2xl mx-auto shadow-clinova-card space-y-4 my-8">
        <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center mx-auto">
          <Database className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#35463B]">No Healthcare Dataset Selected</h3>
        <p className="text-xs text-[#758278] leading-relaxed">
          Association Rule Mining requires an active clinical cohort. Please upload or select a dataset in Dataset Management to discover attribute co-occurrences.
        </p>
      </div>
    );
  }

  const rules = results?.rules || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <Network className="w-5 h-5 text-[#456B56]" />
            <span>Association Rule Mining (Apriori &amp; FP-Growth)</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Discover multi-attribute clinical co-occurrences on <strong className="text-[#456B56]">{activeDataset?.name}</strong>. Target early readmission without leakage.
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

          {/* Algorithm Toggle */}
          <div className="flex items-center gap-1 bg-[#F0F5EF] p-1 rounded-2xl border border-[#E4EAE3]">
            <button
              onClick={() => handleAlgorithmSwitch('apriori')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                algorithm === 'apriori' ? 'bg-white text-[#456B56] shadow-xs' : 'text-[#758278]'
              }`}
            >
              Apriori Algorithm
            </button>
            <button
              onClick={() => handleAlgorithmSwitch('fp-growth')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                algorithm === 'fp-growth' ? 'bg-white text-[#456B56] shadow-xs' : 'text-[#758278]'
              }`}
            >
              FP-Growth Tree
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-[#FBEAE8] border border-[#F5C2BC] text-[#C53929] text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Parameter Control Panel */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
          <h3 className="font-bold text-xs text-[#35463B]">Algorithm Hyperparameter Configuration</h3>
          {results && (
            <div className="flex items-center gap-3 text-xs text-[#758278]">
              <span className="flex items-center gap-1 font-mono text-[#456B56]">
                <Clock className="w-3.5 h-3.5" />
                <span>{results.execution_time_ms} ms</span>
              </span>
              <span>•</span>
              <span className="font-semibold text-[#35463B]">{results.total_rules || rules.length} Rules Discovered</span>
              {results.analysis_code && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[#456B56] font-bold">[{results.analysis_code}]</span>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-xs">
          {/* Min Support */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-[#758278]">Min Support (P(A ∩ B)):</span>
              <span className="text-[#456B56] font-mono">{minSupport}</span>
            </div>
            <input
              type="range"
              min="0.01"
              max="0.10"
              step="0.01"
              value={minSupport}
              onChange={(e) => setMinSupport(parseFloat(e.target.value))}
              className="w-full accent-[#456B56]"
            />
          </div>

          {/* Min Confidence */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-[#758278]">Min Confidence (P(B|A)):</span>
              <span className="text-[#456B56] font-mono">{Math.round(minConfidence * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.40"
              max="0.90"
              step="0.05"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full accent-[#456B56]"
            />
          </div>

          {/* Min Lift */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <span className="text-[#758278]">Min Lift Threshold:</span>
              <span className="text-[#456B56] font-mono">{minLift}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={minLift}
              onChange={(e) => setMinLift(parseFloat(e.target.value))}
              className="w-full accent-[#456B56]"
            />
          </div>

          {/* Target Consequent */}
          <div className="space-y-1.5">
            <span className="text-[#758278] font-semibold block">Target Consequent:</span>
            <select
              value={targetConsequent}
              onChange={(e) => setTargetConsequent(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-xs font-semibold text-[#456B56] focus:ring-1 focus:ring-[#779985]"
            >
              <option value="readmitted = <30">Early Readmission (&lt;30 days)</option>
              <option value="">All Frequent Combinations</option>
            </select>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => handleRunMining()}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? 'Mining Itemsets...' : `Run ${algorithm === 'apriori' ? 'Apriori' : 'FP-Growth'} Mining`}</span>
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#F0F5EF]">
          <h3 className="font-bold text-xs text-[#35463B]">Discovered Clinical Association Rules</h3>
          <span className="text-[11px] text-[#758278]">Sorted by Lift Descending</span>
        </div>

        {rules.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4EAE3] text-[#758278] text-[10px] uppercase font-semibold">
                  <th className="pb-2.5">Antecedents (Conditions)</th>
                  <th className="pb-2.5">Consequent (Outcome)</th>
                  <th className="pb-2.5">Support</th>
                  <th className="pb-2.5">Confidence</th>
                  <th className="pb-2.5">Lift</th>
                  <th className="pb-2.5">Leverage</th>
                  <th className="pb-2.5">Conviction</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F5EF]">
                {rules.map((r, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F9F6] transition-colors">
                    <td className="py-3 font-semibold text-[#35463B]">
                      <div className="flex flex-wrap gap-1">
                        {r.antecedents.map((a, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-[#F0F5EF] text-[#35463B] text-[11px]">
                            {a}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 font-semibold text-[#456B56]">
                      <span className="px-2 py-0.5 rounded-md bg-[#DFEAE0] text-[#456B56] text-[11px] border border-[#CDDED0]">
                        {r.consequents.join(', ')}
                      </span>
                    </td>
                    <td className="py-3 font-mono text-[#758278]">{(r.support * 100).toFixed(1)}%</td>
                    <td className="py-3 font-mono text-[#758278]">{(r.confidence * 100).toFixed(1)}%</td>
                    <td className="py-3 font-mono font-bold text-[#456B56] text-sm">{r.lift}</td>
                    <td className="py-3 font-mono text-[#758278]">{r.leverage}</td>
                    <td className="py-3 font-mono text-[#758278]">{r.conviction}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-[#758278] space-y-1">
            <p className="font-semibold text-[#35463B]">No Association Rules Discovered</p>
            <p>Click &quot;Run {algorithm === 'apriori' ? 'Apriori' : 'FP-Growth'} Mining&quot; above to discover frequent itemsets for this dataset.</p>
          </div>
        )}
      </div>
    </div>
  );
}
