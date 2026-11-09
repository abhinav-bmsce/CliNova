import React, { useState, useEffect } from 'react';
import {
  Users2,
  Play,
  TrendingDown,
  PieChart,
  CheckCircle2,
  Sparkles,
  Info,
  Database,
  AlertCircle
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function ClusteringPage() {
  const { datasets, activeDatasetId, setActiveDatasetId, activeDataset } = useDataset();

  const [k, setK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  const handleRun = async () => {
    if (!activeDatasetId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/clustering/kmeans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataset_id: activeDatasetId, k }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Clustering execution failed.');
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
    fetch(`/api/clustering/latest?dataset_id=${activeDatasetId}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data && data.clusters && data.clusters.length > 0) {
          setResults(data);
          if (data.k) setK(data.k);
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
          Patient Clustering requires an active clinical cohort. Please upload or select a dataset in Dataset Management to discover subphenotypes.
        </p>
      </div>
    );
  }

  const clusters = results?.clusters || [];
  const elbow = results?.elbow_curve || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <Users2 className="w-5 h-5 text-[#456B56]" />
            <span>Patient Clustering &amp; Phenotype Discovery (K-Means)</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Unsupervised patient subphenotyping using standardized clinical markers on <strong className="text-[#456B56]">{activeDataset?.name}</strong>.
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

          {/* K Selector */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#35463B]">Clusters (k):</span>
            <select
              value={k}
              onChange={(e) => setK(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-xs font-bold text-[#456B56] focus:ring-1 focus:ring-[#779985] cursor-pointer"
            >
              {[2, 3, 4, 5, 6, 7, 8].map((val) => (
                <option key={val} value={val}>
                  k = {val}
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
            <span>{loading ? 'Clustering...' : 'Re-Cluster'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#FDF2F0] border border-[#F5C2B8] text-[#9E3626] p-4 rounded-2xl text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {!results && !loading ? (
        <div className="bg-white rounded-3xl border border-[#E4EAE3] p-12 text-center max-w-xl mx-auto shadow-clinova-card space-y-4 my-8">
          <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center mx-auto">
            <Users2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#35463B]">No Clustering Run for this Cohort</h3>
          <p className="text-xs text-[#758278] leading-relaxed">
            Run K-Means clustering to partition <strong className="text-[#456B56]">{activeDataset?.name}</strong> encounters into homogeneous clinical cohorts based on length of stay, procedures, and medication counts.
          </p>
          <button
            onClick={handleRun}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Play className="w-4 h-4" />
            <span>Execute K-Means Clustering (k={k})</span>
          </button>
        </div>
      ) : (
        <>
          {/* Row 1: Evaluation Metrics & Elbow Curve */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Silhouette & Cohesion Card */}
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
              <div className="border-b border-[#F0F5EF] pb-3">
                <h3 className="font-bold text-xs text-[#35463B]">Cluster Cohesion &amp; Silhouette Score</h3>
                <p className="text-[11px] text-[#758278]">Measures cluster tightness vs separation.</p>
              </div>

              <div className="text-center py-4 space-y-2">
                <div className="inline-block p-4 rounded-3xl bg-[#DFEAE0]/50 border border-[#CDDED0]">
                  <span className="text-3xl font-black text-[#456B56]">
                    {typeof results?.silhouette_score === 'number'
                      ? results.silhouette_score.toFixed(3)
                      : 'N/A'}
                  </span>
                  <span className="block text-[10px] uppercase font-bold text-[#758278] mt-1">
                    Silhouette Coefficient
                  </span>
                </div>
                <p className="text-xs text-[#758278] max-w-xs mx-auto">
                  {typeof results?.silhouette_score === 'number' && results.silhouette_score >= 0.35
                    ? 'Good cluster separation across inpatient clinical markers.'
                    : 'Cluster structure identified across standardized clinical markers.'}
                </p>
              </div>
            </div>

            {/* Elbow Method Inertia Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
                <div>
                  <h3 className="font-bold text-xs text-[#35463B]">Elbow Method (Inertia vs k)</h3>
                  <p className="text-[11px] text-[#758278]">Optimal k lies at the point of diminishing returns.</p>
                </div>
                <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2 py-0.5 rounded-full font-semibold">
                  k = {k} Selected
                </span>
              </div>

              <div className="h-44 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-[#E4EAE3]">
                {elbow.map((item) => {
                  const maxInertia = Math.max(...elbow.map((e) => e.inertia), 1);
                  const heightPct = (item.inertia / maxInertia) * 100;
                  const isSelected = item.k === k;
                  return (
                    <div key={item.k} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[9px] text-[#758278]">{Math.round(item.inertia)}</span>
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[36px] rounded-t-lg transition-all ${
                          isSelected ? 'bg-[#456B56]' : 'bg-[#779985]/60 hover:bg-[#779985]'
                        }`}
                      ></div>
                      <span className={`text-[10px] font-semibold ${isSelected ? 'text-[#456B56]' : 'text-[#758278]'}`}>
                        k={item.k}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Row 2: Discovered Cluster Phenotype Persona Cards */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-[#35463B]">Discovered Patient Subphenotypes ({clusters.length} Cohorts)</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clusters.map((c) => (
                <div
                  key={c.cluster_index}
                  className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#35463B]">Cluster {c.cluster_index}</span>
                    <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2 py-0.5 rounded-full font-bold">
                      {c.percentage}% ({c.size.toLocaleString()} pts)
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[#758278]">Readmission Rate</span>
                      <span className="font-bold text-[#456B56]">
                        {typeof c.readmission_rate === 'number' ? `${Math.round(c.readmission_rate * 100)}%` : 'N/A'}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-[#E4EAE3] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.round((c.readmission_rate || 0) * 100)}%` }}
                        className="h-full bg-[#779985]"
                      ></div>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] text-[#758278]">
                    <p className="font-medium text-[#35463B]">{c.profile_summary}</p>
                    <div className="pt-2 border-t border-[#F0F5EF] space-y-1 font-mono text-[10px]">
                      {Object.entries(c.centroids || {}).slice(0, 4).map(([featKey, featVal]) => (
                        <div key={featKey} className="flex justify-between">
                          <span>{featKey}:</span>
                          <span className="font-bold text-[#35463B]">{featVal}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
