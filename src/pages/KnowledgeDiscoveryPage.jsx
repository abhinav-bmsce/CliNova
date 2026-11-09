import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Sparkles,
  Share2,
  Users2,
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  Download,
  CheckCircle2,
  ArrowRight,
  Database,
  Network
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function KnowledgeDiscoveryPage({ onNavigateTab }) {
  const { datasets, activeDatasetId, setActiveDatasetId, activeDataset } = useDataset();

  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeDatasetId) {
      setInsights(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/knowledge/insights?dataset_id=${activeDatasetId}`)
      .then((res) => res.json())
      .then((data) => {
        setInsights(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load knowledge insights:', err);
        setInsights(null);
        setLoading(false);
      });
  }, [activeDatasetId]);

  if (!activeDatasetId || datasets.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-[#E4EAE3] p-12 text-center max-w-2xl mx-auto shadow-clinova-card space-y-4 my-8">
        <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center mx-auto">
          <Database className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-[#35463B]">No Healthcare Dataset Selected</h3>
        <p className="text-xs text-[#758278] leading-relaxed">
          Knowledge Discovery synthesizes patterns across analytical runs. Please upload or select a clinical dataset in Dataset Management to begin.
        </p>
      </div>
    );
  }

  const discoveries = insights?.discoveries || [];
  const topRules = insights?.top_rules || [];
  const hasData = discoveries.length > 0 || topRules.length > 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-[#456B56]" />
            <span>Knowledge Discovery &amp; Multi-Engine Pattern Synthesis</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Combines ARM co-occurrences, K-Means phenotyping, and Decision Tree predictors into verified clinical intelligence on <strong className="text-[#456B56]">{activeDataset?.name}</strong>.
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

          <button
            onClick={() => alert('Clinical findings exported to clipboard and study notes.')}
            disabled={!hasData}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Findings</span>
          </button>
        </div>
      </div>

      {!hasData && !loading ? (
        <div className="bg-white rounded-3xl border border-[#E4EAE3] p-12 text-center max-w-xl mx-auto shadow-clinova-card space-y-4 my-8">
          <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center mx-auto">
            <Lightbulb className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#35463B]">No Discovered Patterns Yet</h3>
          <p className="text-xs text-[#758278] leading-relaxed">
            Knowledge Discovery automatically synthesizes clinical evidence when you run KDD algorithms on <strong className="text-[#456B56]">{activeDataset?.name}</strong>. Execute one or more analyses below to discover actionable patterns.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab && onNavigateTab('association_rules')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F0F5EF] hover:bg-[#DFEAE0] text-[#456B56] text-xs font-semibold border border-[#CDDED0] transition-all cursor-pointer"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Mine Association Rules</span>
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('clustering')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F0F5EF] hover:bg-[#DFEAE0] text-[#456B56] text-xs font-semibold border border-[#CDDED0] transition-all cursor-pointer"
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>Cluster Patients</span>
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('readmission')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Train Decision Tree</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Row 1: High-Confidence Evidence Cards */}
          {discoveries.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#758278]">
                Primary Verified Clinical Discoveries ({discoveries.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {discoveries.map((d, idx) => (
                  <div
                    key={d.id || idx}
                    className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#456B56] bg-[#DFEAE0] px-2 py-0.5 rounded-full border border-[#CDDED0]">
                          {d.category}
                        </span>
                        <span className="text-xs font-mono text-[#96A499]">#0{idx + 1}</span>
                      </div>
                      <h4 className="text-sm font-bold text-[#35463B] leading-snug">{d.title}</h4>
                      <p className="text-xs text-[#758278] leading-relaxed">{d.evidence}</p>
                    </div>

                    <div className="pt-3 border-t border-[#F0F5EF] flex items-center gap-1.5 text-[11px] font-semibold text-[#456B56]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Empirically Grounded</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Row 2: Ranked Interesting Patterns Table */}
          {topRules.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
                <div>
                  <h3 className="font-bold text-xs text-[#35463B]">
                    Multi-Criteria Interestingness Ranking
                  </h3>
                  <span className="text-[11px] text-[#758278]">
                    Score = 0.40(Lift) + 0.35(Confidence) + 0.25(Support)
                  </span>
                </div>
                <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2.5 py-1 rounded-full font-bold">
                  {topRules.length} Ranked Patterns
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E4EAE3] text-[#758278] text-[10px] uppercase font-semibold">
                      <th className="pb-2.5">Pattern Summary</th>
                      <th className="pb-2.5">Support</th>
                      <th className="pb-2.5">Confidence</th>
                      <th className="pb-2.5">Lift</th>
                      <th className="pb-2.5">Interestingness Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0F5EF]">
                    {topRules.map((r, idx) => (
                      <tr key={idx} className="hover:bg-[#F7F9F6] transition-colors">
                        <td className="py-3 font-semibold text-[#35463B]">{r.summary}</td>
                        <td className="py-3 font-mono text-[#758278]">{(r.support * 100).toFixed(1)}%</td>
                        <td className="py-3 font-mono text-[#758278]">{(r.confidence * 100).toFixed(1)}%</td>
                        <td className="py-3 font-mono font-bold text-[#456B56]">{r.lift}</td>
                        <td className="py-3 font-mono font-bold text-[#456B56]">
                          <span className="bg-[#DFEAE0] px-2 py-0.5 rounded-full text-[11px] border border-[#CDDED0]">
                            {r.interestingness_score}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Disclaimer Banner */}
          <div className="p-4 rounded-2xl bg-[#F4EBDD] border border-[#EBDCC7] text-xs text-[#725B3E] flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#8C533D]" />
            <div className="space-y-1">
              <span className="font-bold block">Scientific &amp; Clinical Grounding Policy:</span>
              <p className="leading-relaxed">
                All presented patterns reflect observational associations discovered within the multi-hospital study cohort. Lift and feature importance measure statistical correlations, not direct pathophysiological causation. Findings are intended to support clinical quality reviews and post-discharge coordination.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
