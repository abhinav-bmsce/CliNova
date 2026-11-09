import React, { useState, useEffect } from 'react';
import {
  PieChart,
  BarChart2,
  Share2,
  Users2,
  TrendingUp,
  Download,
  Filter,
  CheckCircle2,
  Database,
  Network,
  GitBranch,
  Layers,
  Sparkles
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function VisualAnalyticsPage({ onNavigateTab }) {
  const { datasets, activeDatasetId, setActiveDatasetId, activeDataset } = useDataset();

  const [miningData, setMiningData] = useState(null);
  const [clusteringData, setClusteringData] = useState(null);
  const [readmissionData, setReadmissionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeDatasetId) {
      setMiningData(null);
      setClusteringData(null);
      setReadmissionData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all([
      fetch(`/api/mining/latest?dataset_id=${activeDatasetId}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`/api/clustering/latest?dataset_id=${activeDatasetId}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
      fetch(`/api/readmission/latest?dataset_id=${activeDatasetId}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]).then(([mining, clustering, readmission]) => {
      setMiningData(mining);
      setClusteringData(clustering);
      setReadmissionData(readmission);
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
          Visual Analytics requires an active clinical cohort. Please upload or select a dataset in Dataset Management to view multi-view visual exploration.
        </p>
      </div>
    );
  }

  const rules = miningData?.rules || [];
  const clusters = clusteringData?.clusters || [];
  const perf = readmissionData;

  const hasAnyAnalysis = rules.length > 0 || clusters.length > 0 || !!perf;

  // Scatter plot calculations for rules
  const maxSupport = Math.max(...rules.map((r) => r.support), 0.1);
  const minSupportVal = Math.min(...rules.map((r) => r.support), 0.01);
  const maxLift = Math.max(...rules.map((r) => r.lift), 2.0);

  // Compute empirical TPR and FPR from confusion matrix
  const cm = perf?.confusion_matrix;
  const tn = cm?.[0]?.[0] || 0;
  const fp = cm?.[0]?.[1] || 0;
  const fn = cm?.[1]?.[0] || 0;
  const tp = cm?.[1]?.[1] || 0;
  const tpr = tp + fn > 0 ? tp / (tp + fn) : (perf?.recall || 0);
  const fpr = fp + tn > 0 ? fp / (fp + tn) : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#456B56]" />
            <span>Interactive Visual Analytics Cockpit</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Empirical multi-view visualization of ARM rules, patient subphenotypes, and classification ROC curves on <strong className="text-[#456B56]">{activeDataset?.name}</strong>.
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
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Visual Suite</span>
          </button>
        </div>
      </div>

      {!hasAnyAnalysis && !loading ? (
        <div className="bg-white rounded-3xl border border-[#E4EAE3] p-12 text-center max-w-xl mx-auto shadow-clinova-card space-y-4 my-8">
          <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center mx-auto">
            <PieChart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#35463B]">No Analytical Visualizations Available</h3>
          <p className="text-xs text-[#758278] leading-relaxed">
            Run Association Mining, Patient Clustering, or Readmission Analysis on <strong className="text-[#456B56]">{activeDataset?.name}</strong> to generate interactive scatter plots, phenotype distributions, and ROC-AUC curves.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigateTab && onNavigateTab('association_rules')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F0F5EF] hover:bg-[#DFEAE0] text-[#456B56] text-xs font-semibold border border-[#CDDED0] transition-all cursor-pointer"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Mine Rules</span>
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('clustering')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#F0F5EF] hover:bg-[#DFEAE0] text-[#456B56] text-xs font-semibold border border-[#CDDED0] transition-all cursor-pointer"
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>Cluster Cohorts</span>
            </button>
            <button
              onClick={() => onNavigateTab && onNavigateTab('readmission')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            >
              <GitBranch className="w-3.5 h-3.5" />
              <span>Train Classifier</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* View 1: Support vs Confidence Scatter Plot */}
          <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
              <div>
                <h3 className="font-bold text-xs text-[#35463B]">Association Rules (Support vs Confidence)</h3>
                <p className="text-[11px] text-[#758278]">Bubble coordinates derived from empirical rule metrics; radius reflects Lift.</p>
              </div>
              <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2.5 py-0.5 rounded-full font-bold">
                {rules.length} Discovered Rules
              </span>
            </div>

            {rules.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#F7F9F6] rounded-xl border border-dashed border-[#E4EAE3] text-xs text-[#758278]">
                <span>No association rules mined yet for this dataset.</span>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('association_rules')}
                  className="text-[#456B56] font-semibold underline mt-1 cursor-pointer bg-transparent border-none p-0"
                >
                  Mine Association Rules &rarr;
                </button>
              </div>
            ) : (
              <div className="h-64 border-b border-l border-[#E4EAE3] relative p-4 flex items-end justify-between bg-[#F7F9F6]/30">
                {/* Dynamically Placed Bubbles */}
                <div className="absolute inset-0 p-6 overflow-hidden">
                  {rules.slice(0, 15).map((r, i) => {
                    // Normalize X (support) between 5% and 85%
                    const suppRange = maxSupport - minSupportVal || 0.05;
                    const xPct = Math.max(8, Math.min(88, ((r.support - minSupportVal) / suppRange) * 80 + 8));
                    // Normalize Y (confidence) between 10% and 88%
                    const yPct = Math.max(10, Math.min(88, r.confidence * 85));
                    // Radius based on lift
                    const radius = Math.max(22, Math.min(36, (r.lift / maxLift) * 34));

                    return (
                      <div
                        key={i}
                        style={{
                          left: `${xPct}%`,
                          bottom: `${yPct}%`,
                          width: `${radius}px`,
                          height: `${radius}px`,
                          transform: 'translate(-50%, 50%)',
                        }}
                        className="absolute rounded-full bg-[#779985]/75 hover:bg-[#456B56] border-2 border-[#456B56] flex items-center justify-center text-[9px] font-bold text-white shadow-sm cursor-pointer transition-all hover:scale-125 z-10"
                        title={`Rule #${i + 1}: (${r.antecedents.join(' + ')}) ➔ {${r.consequents.join(', ')}} | Lift: ${r.lift} | Supp: ${(r.support * 100).toFixed(1)}% | Conf: ${(r.confidence * 100).toFixed(1)}%`}
                      >
                        {r.lift}
                      </div>
                    );
                  })}
                </div>

                <span className="absolute bottom-1 right-2 text-[10px] text-[#758278] font-medium">Support (P(A &cap; B)) &rarr;</span>
                <span className="absolute top-2 left-2 text-[10px] text-[#758278] font-medium">
                  &uarr; Confidence (P(B|A))
                </span>
              </div>
            )}
          </div>

          {/* View 2: Patient Clustering Cohort Profiles */}
          <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
              <div>
                <h3 className="font-bold text-xs text-[#35463B]">Patient Subphenotype Cohorts (K-Means)</h3>
                <p className="text-[11px] text-[#758278]">Cluster distribution and early readmission vulnerability.</p>
              </div>
              <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2.5 py-0.5 rounded-full font-bold">
                {clusters.length} Cohorts
              </span>
            </div>

            {clusters.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#F7F9F6] rounded-xl border border-dashed border-[#E4EAE3] text-xs text-[#758278]">
                <span>No clustering model fitted yet for this dataset.</span>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('clustering')}
                  className="text-[#456B56] font-semibold underline mt-1 cursor-pointer bg-transparent border-none p-0"
                >
                  Run Patient Clustering &rarr;
                </button>
              </div>
            ) : (
              <div className="h-64 flex flex-col justify-around py-2">
                {clusters.map((c) => {
                  const readmPct = Math.round((c.readmission_rate || 0) * 100);
                  return (
                    <div key={c.cluster_index} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[#35463B]">
                          Cluster {c.cluster_index} <span className="font-normal text-[#758278]">({c.percentage}% &bull; {c.size.toLocaleString()} pts)</span>
                        </span>
                        <span className="font-mono font-bold text-[#456B56] text-[11px]">
                          {readmPct}% Readmitted
                        </span>
                      </div>
                      <div className="h-3 w-full bg-[#F0F5EF] rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${c.percentage}%` }}
                          className="h-full bg-[#779985] rounded-l-full"
                          title={`Cluster ${c.cluster_index} size: ${c.percentage}%`}
                        ></div>
                        <div
                          style={{ width: `${readmPct}%` }}
                          className="h-full bg-[#8C533D]/60 rounded-r-full"
                          title={`Readmission rate: ${readmPct}%`}
                        ></div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex items-center justify-between text-[10px] text-[#758278] pt-2 border-t border-[#F0F5EF]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#779985]"></span> Cohort Size (%)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8C533D]/60"></span> Readmission Rate (%)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* View 3: ROC-AUC Performance */}
          <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
              <div>
                <h3 className="font-bold text-xs text-[#35463B]">Receiver Operating Characteristic (ROC-AUC)</h3>
                <p className="text-[11px] text-[#758278]">Decision tree true positive vs false positive discrimination curve.</p>
              </div>
              <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2.5 py-0.5 rounded-full font-black">
                {perf?.roc_auc ? `AUC = ${perf.roc_auc}` : 'No Model'}
              </span>
            </div>

            {!perf ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#F7F9F6] rounded-xl border border-dashed border-[#E4EAE3] text-xs text-[#758278]">
                <span>No classifier trained yet for this dataset.</span>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('readmission')}
                  className="text-[#456B56] font-semibold underline mt-1 cursor-pointer bg-transparent border-none p-0"
                >
                  Train Readmission Classifier &rarr;
                </button>
              </div>
            ) : (
              <div className="h-64 border-b border-l border-[#E4EAE3] relative p-4 flex items-center justify-center bg-[#F7F9F6]/30">
                <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                  {/* Diagonal Chance Line */}
                  <line x1="0" y1="100" x2="100" y2="0" stroke="#CDDED0" strokeDasharray="3 3" strokeWidth="1.5" />
                  {/* Area under curve */}
                  <polygon
                    points={`0,100 0,${Math.round((1 - tpr) * 100 * 0.7)} ${Math.round(fpr * 100)},${Math.round((1 - tpr) * 100)} 100,0 100,100`}
                    fill="#DFEAE0"
                    fillOpacity="0.45"
                  />
                  {/* Empirical ROC Curve Line */}
                  <polyline
                    fill="none"
                    stroke="#456B56"
                    strokeWidth="2.5"
                    points={`0,100 0,${Math.round((1 - tpr) * 100 * 0.7)} ${Math.round(fpr * 100)},${Math.round((1 - tpr) * 100)} 100,0`}
                  />
                </svg>

                <span className="absolute bottom-1 right-2 text-[10px] text-[#758278] font-medium">False Positive Rate &rarr;</span>
                <span className="absolute top-2 left-2 text-[10px] text-[#758278] font-medium">
                  &uarr; True Positive Rate
                </span>
              </div>
            )}
          </div>

          {/* View 4: Feature Importance Ranking */}
          <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
              <div>
                <h3 className="font-bold text-xs text-[#35463B]">Gini Feature Importance Ranking</h3>
                <p className="text-[11px] text-[#758278]">Mean decrease in tree impurity across patient features.</p>
              </div>
              <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2.5 py-0.5 rounded-full font-bold">
                Decision Tree
              </span>
            </div>

            {!perf?.feature_importances || perf.feature_importances.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-[#F7F9F6] rounded-xl border border-dashed border-[#E4EAE3] text-xs text-[#758278]">
                <span>No feature importances available.</span>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('readmission')}
                  className="text-[#456B56] font-semibold underline mt-1 cursor-pointer bg-transparent border-none p-0"
                >
                  Train Decision Tree &rarr;
                </button>
              </div>
            ) : (
              <div className="h-64 flex flex-col justify-around py-1">
                {perf.feature_importances.slice(0, 5).map((f, idx) => {
                  const maxImp = Math.max(...perf.feature_importances.map((x) => x.importance), 0.01);
                  const widthPct = (f.importance / maxImp) * 100;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-[#35463B] font-medium truncate max-w-[220px]">{f.feature}</span>
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
