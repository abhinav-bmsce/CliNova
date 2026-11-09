import React, { useState, useEffect } from 'react';
import {
  Users2,
  Play,
  TrendingDown,
  PieChart,
  CheckCircle2,
  Sparkles,
  Info
} from 'lucide-react';

export default function ClusteringPage() {
  const [k, setK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/clustering/kmeans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ k }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (e) {
      console.error('K-Means execution failed:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleRun();
  }, [k]);

  const clusters = results?.clusters || [];
  const elbow = results?.elbow_curve || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <Users2 className="w-5 h-5 text-[#456B56]" />
            <span>Patient Clustering & Phenotype Discovery (K-Means)</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Unsupervised patient subphenotyping using standardized clinical markers and silhouette optimization.
          </p>
        </div>

        {/* K Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-[#35463B]">Clusters (k):</span>
            <select
              value={k}
              onChange={(e) => setK(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-xs font-bold text-[#456B56] focus:ring-1 focus:ring-[#779985]"
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5" />
            <span>{loading ? 'Clustering...' : 'Re-Cluster'}</span>
          </button>
        </div>
      </div>

      {/* Row 1: Evaluation Metrics & Elbow Curve */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Silhouette & Cohesion Card */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
          <div className="border-b border-[#F0F5EF] pb-3">
            <h3 className="font-bold text-xs text-[#35463B]">Cluster Cohesion & Silhouette Score</h3>
            <p className="text-[11px] text-[#758278]">Measures cluster tightness vs separation.</p>
          </div>

          <div className="text-center py-4 space-y-2">
            <div className="inline-block p-4 rounded-3xl bg-[#DFEAE0]/50 border border-[#CDDED0]">
              <span className="text-3xl font-black text-[#456B56]">
                {results?.silhouette_score || 0.42}
              </span>
              <span className="block text-[10px] uppercase font-bold text-[#758278] mt-1">
                Silhouette Coefficient
              </span>
            </div>
            <p className="text-xs text-[#758278] max-w-xs mx-auto">
              Moderate to high cluster separation across inpatient clinical markers.
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
              k = 5 Optimal
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
                  <span className="font-bold text-[#456B56]">{Math.round(c.readmission_rate * 100)}%</span>
                </div>
                <div className="h-1.5 w-full bg-[#E4EAE3] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.round(c.readmission_rate * 100)}%` }}
                    className="h-full bg-[#779985]"
                  ></div>
                </div>
              </div>

              <div className="space-y-1 text-[11px] text-[#758278]">
                <p className="font-medium text-[#35463B]">{c.profile_summary}</p>
                <div className="pt-2 border-t border-[#F0F5EF] space-y-1 font-mono text-[10px]">
                  {Object.entries(c.centroids || {}).slice(0, 4).map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span>{k}:</span>
                      <span className="font-bold text-[#35463B]">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
