import React, { useState, useEffect } from 'react';
import {
  Database,
  Users,
  Layers,
  Share2,
  Users2,
  BarChart3,
  Upload,
  Plus,
  Play,
  FileText,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Activity,
  HeartPulse,
  Sparkles,
  ShieldCheck,
  LineChart,
  FolderPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDataset } from '../context/DatasetContext';

export default function DashboardOverview({ onNavigateTab }) {
  const { token, currentUser } = useAuth();
  const { datasets, activeDatasetId, activeDataset } = useDataset();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (currentUser?.id) {
      headers['X-User-Id'] = String(currentUser.id);
    }

    const params = new URLSearchParams();
    if (currentUser?.id) {
      params.append('user_id', String(currentUser.id));
    }
    if (activeDatasetId) {
      params.append('dataset_id', String(activeDatasetId));
    }

    const url = `/api/dashboard/stats${params.toString() ? `?${params.toString()}` : ''}`;

    fetch(url, { headers })
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to fetch dashboard stats:', err);
        setLoading(false);
      });
  }, [token, currentUser?.id, activeDatasetId]);

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-pulse">
        <div className="h-44 bg-white rounded-3xl border border-[#E4EAE3] p-7"></div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-white rounded-2xl border border-[#E4EAE3]"></div>
          ))}
        </div>
      </div>
    );
  }

  const kpi = stats?.kpi || {
    datasets: 0,
    encounters: 0,
    projects: 0,
    association_rules: 0,
    patient_clusters: 0,
    best_model_roc_auc: null,
  };

  const hasData = kpi.datasets > 0;
  const overview = stats?.dataset_overview;
  const topRules = stats?.association_rules_top_lift || [];
  const clusters = stats?.patient_clustering || [];
  const readmissionPerf = stats?.readmission_analysis;
  const featureImportance = stats?.feature_importance || [];
  const discoveries = stats?.recent_discoveries || [];
  const analyses = stats?.recent_analyses || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. WELCOME BANNER */}
      <div className="bg-white rounded-3xl border border-[#E4EAE3] p-7 shadow-clinova-card relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl z-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#35463B] tracking-tight flex items-center gap-2">
            <span>Welcome to CLINOVA</span>
            <span className="text-[#456B56]">🌿</span>
          </h2>
          <h3 className="text-lg font-serif italic text-[#456B56] font-semibold">
            Discover Beyond Data.
          </h3>
          <p className="text-xs text-[#758278] leading-relaxed">
            Clinical Knowledge Discovery and Readmission Intelligence Platform. Transform raw hospital encounter records into meaningful knowledge through data preprocessing, association rule mining, patient clustering, and AI-assisted interpretation.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            onClick={() => onNavigateTab && onNavigateTab('datasets')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Dataset</span>
          </button>
          <button
            onClick={() => onNavigateTab && onNavigateTab('projects')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#DFEAE0] hover:bg-[#cdded0] text-[#456B56] text-xs font-semibold border border-[#CDDED0] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Project</span>
          </button>
          {hasData && (
            <>
              <button
                onClick={() => onNavigateTab && onNavigateTab('association_rules')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F5EF] hover:bg-[#e2ebe0] text-[#35463B] text-xs font-semibold border border-[#E4EAE3] transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 text-[#456B56]" />
                <span>Run Analysis</span>
              </button>
              <button
                onClick={() => onNavigateTab && onNavigateTab('reports')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F5EF] hover:bg-[#e2ebe0] text-[#35463B] text-xs font-semibold border border-[#E4EAE3] transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#456B56]" />
                <span>Generate Report</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* 2. STATS KPI CARDS (6 METRICS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Datasets */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#758278] block">Datasets</span>
            <span className="text-2xl font-bold text-[#35463B] font-mono">{kpi.datasets}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
        </div>

        {/* Encounters */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#758278] block">Encounters</span>
            <span className="text-2xl font-bold text-[#35463B] font-mono">
              {kpi.encounters.toLocaleString()}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#E7F1ED] text-[#456B56] flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Projects */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#758278] block">Projects</span>
            <span className="text-2xl font-bold text-[#35463B] font-mono">{kpi.projects}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F0F5EF] text-[#456B56] flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Association Rules */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#758278] block">Association Rules</span>
            <span className="text-2xl font-bold text-[#35463B] font-mono">{kpi.association_rules}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#F4EBDD] text-[#8C6D46] flex items-center justify-center">
            <Share2 className="w-5 h-5" />
          </div>
        </div>

        {/* Patient Clusters */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#758278] block">Patient Clusters</span>
            <span className="text-2xl font-bold text-[#35463B] font-mono">{kpi.patient_clusters}</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#EEEAF5] text-[#5D5276] flex items-center justify-center">
            <Users2 className="w-5 h-5" />
          </div>
        </div>

        {/* Best Model (ROC-AUC) */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-[#758278] block">Best ROC-AUC</span>
            <span className={`font-bold text-[#456B56] font-mono ${kpi.best_model_roc_auc !== null && kpi.best_model_roc_auc !== undefined ? 'text-2xl' : 'text-xs text-[#758278] block leading-tight'}`}>
              {kpi.best_model_roc_auc !== null && kpi.best_model_roc_auc !== undefined ? kpi.best_model_roc_auc : 'Not yet analyzed'}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. ZERO-STATE ONBOARDING GUIDE (When No Datasets Available) */}
      {!hasData && (
        <div className="bg-white rounded-3xl border border-[#E4EAE3] p-8 shadow-clinova-card space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center mx-auto">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-[#35463B]">Start Your Healthcare KDD Workflow</h3>
            <p className="text-xs text-[#758278] leading-relaxed">
              No clinical datasets have been uploaded to your workspace yet. Follow the 3-step Knowledge Discovery protocol to discover clinical rules and readmission subphenotypes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-[#F7F9F6] border border-[#E4EAE3] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#456B56] font-mono">STEP 01</span>
                <Database className="w-4 h-4 text-[#456B56]" />
              </div>
              <h4 className="text-sm font-bold text-[#35463B]">Upload Healthcare Cohort</h4>
              <p className="text-xs text-[#758278] leading-relaxed">
                Ingest de-identified clinical encounter records in CSV or XLSX format with automatic attribute and schema verification.
              </p>
              <button
                onClick={() => onNavigateTab && onNavigateTab('datasets')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#456B56] hover:underline cursor-pointer"
              >
                <span>Go to Dataset Management</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-[#F7F9F6] border border-[#E4EAE3] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#456B56] font-mono">STEP 02</span>
                <LineChart className="w-4 h-4 text-[#456B56]" />
              </div>
              <h4 className="text-sm font-bold text-[#35463B]">Explore &amp; Preprocess</h4>
              <p className="text-xs text-[#758278] leading-relaxed">
                Review missingness profiles, attribute distributions, and configure reproducible median or mode imputation without target leakage.
              </p>
              <button
                onClick={() => onNavigateTab && onNavigateTab('eda')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#456B56] hover:underline cursor-pointer"
              >
                <span>Open Exploratory Analysis</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-[#F7F9F6] border border-[#E4EAE3] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#456B56] font-mono">STEP 03</span>
                <Sparkles className="w-4 h-4 text-[#456B56]" />
              </div>
              <h4 className="text-sm font-bold text-[#35463B]">Discover &amp; Synthesize</h4>
              <p className="text-xs text-[#758278] leading-relaxed">
                Execute Apriori, FP-Growth, K-Means clustering, and Decision Tree modeling to formulate actionable clinical intelligence.
              </p>
              <button
                onClick={() => onNavigateTab && onNavigateTab('association_rules')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#456B56] hover:underline cursor-pointer"
              >
                <span>Explore Mining Engines</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. ACTIVE DATASET ANALYTICAL CHARTS (Rendered when datasets exist) */}
      {hasData && (
        <>
          {/* Row 1: Dataset Overview + Top Rules + Patient Clustering */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Dataset Overview (Donut Chart) */}
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F0F5EF]">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#456B56]" />
                    <h3 className="font-bold text-xs text-[#35463B]">Dataset Overview</h3>
                  </div>
                  <span className="text-[11px] text-[#758278]">Readmission Status</span>
                </div>

                {/* Donut Graphic */}
                <div className="flex flex-col items-center justify-center my-6 relative">
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-[#E7F1ED]"
                        strokeWidth="4"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-[#456B56]"
                        strokeDasharray={`${overview?.not_readmitted_pct ?? 100}, 100`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        stroke="currentColor"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-lg font-bold font-mono text-[#35463B]">
                        {kpi.encounters.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-[#758278]">Encounters</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-2 pt-2 border-t border-[#F0F5EF] text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#456B56]"></span>
                    <span className="text-[#35463B] font-medium">Not Readmitted</span>
                  </div>
                  <span className="font-mono text-[#758278]">
                    {overview?.not_readmitted_pct ?? 0}% ({overview?.not_readmitted_count?.toLocaleString() || 0})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#8BAFA3]"></span>
                    <span className="text-[#35463B] font-medium">Readmitted</span>
                  </div>
                  <span className="font-mono text-[#758278]">
                    {overview?.readmitted_pct ?? 0}% ({overview?.readmitted_count?.toLocaleString() || 0})
                  </span>
                </div>
              </div>
            </div>

            {/* 2. Association Rules (Top by Lift) */}
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F0F5EF]">
                  <div className="flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-[#456B56]" />
                    <h3 className="font-bold text-xs text-[#35463B]">Association Rules</h3>
                  </div>
                  <span className="text-[11px] text-[#758278]">Top rules by lift</span>
                </div>

                {topRules.length > 0 ? (
                  <div className="space-y-4 my-6">
                    {topRules.map((r, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#35463B]">{r.rule}</span>
                          <span className="font-mono font-bold text-[#456B56]">Lift: {r.lift}</span>
                        </div>
                        <div className="w-full bg-[#F0F5EF] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#456B56] h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (r.lift / 3.0) * 100)}%` }}
                          ></div>
                        </div>
                        <p className="text-[11px] text-[#758278] truncate">{r.description}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#758278]">
                    No association rules mined yet. Run Apriori or FP-Growth to view top rules.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#F0F5EF] flex justify-end">
                <button
                  onClick={() => onNavigateTab && onNavigateTab('association_rules')}
                  className="text-xs font-semibold text-[#456B56] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Explore All Rules</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. Patient Clustering (Donut / Phenotypes) */}
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#F0F5EF]">
                  <div className="flex items-center gap-2">
                    <Users2 className="w-4 h-4 text-[#456B56]" />
                    <h3 className="font-bold text-xs text-[#35463B]">Patient Clustering</h3>
                  </div>
                  <span className="text-[11px] text-[#758278]">K-Means Phenotypes</span>
                </div>

                {clusters.length > 0 ? (
                  <div className="space-y-3 my-5">
                    {clusters.map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-2 rounded-xl bg-[#F7F9F6]">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}></span>
                          <span className="font-semibold text-[#35463B]">{c.cluster}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-[#35463B] font-bold">{c.percentage}%</span>
                          <span className="text-[#456B56]">Readm: {c.readmission_rate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-[#758278]">
                    No clusters generated yet. Run K-Means in Patient Clustering.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-[#F0F5EF] flex justify-end">
                <button
                  onClick={() => onNavigateTab && onNavigateTab('clustering')}
                  className="text-xs font-semibold text-[#456B56] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>View Cluster Profiles</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Row 2: Readmission Decision Tree Performance + Feature Importance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Classification Performance Metrics */}
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#456B56]" />
                  <h3 className="font-bold text-xs text-[#35463B]">Readmission Analysis (Decision Tree)</h3>
                </div>
                <span className="text-[11px] font-mono text-[#456B56] font-bold">
                  {readmissionPerf ? `ROC-AUC: ${readmissionPerf.roc_auc}` : 'Not yet analyzed'}
                </span>
              </div>

              {readmissionPerf ? (
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
                    <span className="text-[10px] text-[#758278] block">Accuracy</span>
                    <span className="text-base font-bold text-[#35463B] font-mono">
                      {readmissionPerf.accuracy}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
                    <span className="text-[10px] text-[#758278] block">Precision</span>
                    <span className="text-base font-bold text-[#35463B] font-mono">
                      {readmissionPerf.precision}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
                    <span className="text-[10px] text-[#758278] block">Recall</span>
                    <span className="text-base font-bold text-[#35463B] font-mono">
                      {readmissionPerf.recall}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3]">
                    <span className="text-[10px] text-[#758278] block">F1-Score</span>
                    <span className="text-base font-bold text-[#35463B] font-mono">
                      {readmissionPerf.f1_score}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#758278] space-y-2">
                  <p>No decision tree model trained for this cohort yet.</p>
                  <button
                    onClick={() => onNavigateTab && onNavigateTab('readmission')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#456B56] hover:underline cursor-pointer"
                  >
                    <span>Train Readmission Classifier</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Feature Importance Ranking */}
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#456B56]" />
                  <h3 className="font-bold text-xs text-[#35463B]">Feature Importance Ranking</h3>
                </div>
                <span className="text-[11px] text-[#758278]">Gini Importance</span>
              </div>

              {featureImportance.length > 0 ? (
                <div className="space-y-2.5">
                  {featureImportance.map((f, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-[#35463B] font-medium">{f.feature}</span>
                        <span className="font-mono text-[#456B56] font-bold">{f.importance}</span>
                      </div>
                      <div className="w-full bg-[#F0F5EF] h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-[#779985] h-full rounded-full"
                          style={{ width: `${Math.min(100, f.importance * 300)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#758278]">
                  No feature importance available. Train a Decision Tree to compute Gini feature rankings.
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Recent Discoveries + Analysis History */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Discoveries */}
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#456B56]" />
                  <h3 className="font-bold text-xs text-[#35463B]">Recent Discoveries</h3>
                </div>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('knowledge_discovery')}
                  className="text-[11px] font-semibold text-[#456B56] hover:underline cursor-pointer"
                >
                  View All →
                </button>
              </div>

              {discoveries.length > 0 ? (
                <div className="space-y-3">
                  {discoveries.map((d, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-[#F7F9F6] border border-[#E4EAE3] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#456B56] bg-[#DFEAE0] px-2 py-0.5 rounded-md">
                          {d.category}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-[#35463B]">{d.title}</h4>
                      <p className="text-[11px] text-[#758278]">{d.evidence}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#758278]">
                  No clinical discoveries synthesized yet.
                </div>
              )}
            </div>

            {/* Analysis History */}
            <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
              <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#456B56]" />
                  <h3 className="font-bold text-xs text-[#35463B]">Analysis History</h3>
                </div>
                <button
                  onClick={() => onNavigateTab && onNavigateTab('history')}
                  className="text-[11px] font-semibold text-[#456B56] hover:underline cursor-pointer"
                >
                  View All →
                </button>
              </div>

              {analyses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E4EAE3] text-[#758278] text-[10px] uppercase font-semibold">
                        <th className="pb-2">Analysis ID</th>
                        <th className="pb-2">Project</th>
                        <th className="pb-2">Algorithm</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F5EF]">
                      {analyses.map((a, i) => (
                        <tr key={i}>
                          <td className="py-2.5 font-mono text-[#456B56] font-bold">{a.analysis_code}</td>
                          <td className="py-2.5 text-[#35463B]">{a.project}</td>
                          <td className="py-2.5 text-[#758278]">{a.algorithm}</td>
                          <td className="py-2.5">
                            <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2 py-0.5 rounded-full font-semibold">
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#758278]">
                  No analysis jobs executed yet.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
