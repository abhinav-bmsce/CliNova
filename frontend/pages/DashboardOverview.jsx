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
  HeartPulse
} from 'lucide-react';

export default function DashboardOverview({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to fetch dashboard stats, using defaults:', err);
        setLoading(false);
      });
  }, []);

  const kpi = stats?.kpi || {
    datasets: 1,
    encounters: 101766,
    projects: 4,
    association_rules: 248,
    patient_clusters: 5,
    best_model_roc_auc: 0.84,
  };

  const overview = stats?.dataset_overview || {
    total_encounters: 101766,
    not_readmitted_count: 90145,
    not_readmitted_pct: 88.6,
    readmitted_count: 11621,
    readmitted_pct: 11.4,
  };

  const topRules = stats?.association_rules_top_lift || [
    { rule: 'Rule 1', lift: 2.78, description: '(> 5 medications, > 3 diagnoses) ➔ {Early readmission}' },
    { rule: 'Rule 2', lift: 2.31, description: '(Inpatient visits > 2, Insulin = Down) ➔ {Early readmission}' },
    { rule: 'Rule 3', lift: 1.96, description: '(Time in hospital > 6, High lab procedures) ➔ {Early readmission}' },
  ];

  const clusters = stats?.patient_clustering || [
    { cluster: 'Cluster 1', percentage: 27.4, color: '#779985' },
    { cluster: 'Cluster 2', percentage: 20.1, color: '#8BAFA3' },
    { cluster: 'Cluster 3', percentage: 19.6, color: '#DFEAE0' },
    { cluster: 'Cluster 4', percentage: 17.8, color: '#F4EBDD' },
    { cluster: 'Cluster 5', percentage: 15.1, color: '#EEEAF5' },
  ];

  const readmissionPerf = stats?.readmission_analysis || {
    roc_auc: 0.84,
    accuracy: 0.82,
    precision: 0.78,
    recall: 0.76,
    f1_score: 0.77,
  };

  const featureImportance = stats?.feature_importance || [
    { feature: 'Number of Inpatient Visits', importance: 0.28 },
    { feature: 'Time in Hospital', importance: 0.18 },
    { feature: 'Number of Medications', importance: 0.15 },
    { feature: 'Number of Diagnoses', importance: 0.12 },
    { feature: 'Age Group', importance: 0.09 },
  ];

  const discoveries = stats?.recent_discoveries || [
    {
      id: 1,
      title: 'Rule with highest lift (2.78) identified',
      evidence: '(> 5 medications, > 3 diagnoses) ➔ {Early readmission}',
      category: 'Association',
      variant: 'sage',
    },
    {
      id: 2,
      title: '5 distinct patient clusters discovered',
      evidence: 'Clusters show different readmission rates (6.2% – 18.7%)',
      category: 'Clustering',
      variant: 'teal',
    },
    {
      id: 3,
      title: 'Key predictor for readmission: inpatient visits',
      evidence: 'Most influential feature in decision tree (importance: 0.28)',
      category: 'Classification',
      variant: 'lavender',
    },
  ];

  const analyses = stats?.recent_analyses || [
    { analysis_code: 'AN-0043', project: 'Readmission Study', algorithm: 'Decision Tree', status: 'Completed', created_at: 'Jan 26, 2025, 10:24 AM' },
    { analysis_code: 'AN-0042', project: 'Patient Segmentation', algorithm: 'K-Means', status: 'Completed', created_at: 'Jan 26, 2025, 09:47 AM' },
    { analysis_code: 'AN-0041', project: 'Hospital Associations', algorithm: 'FP-Growth', status: 'Completed', created_at: 'Jan 25, 2025, 04:12 PM' },
    { analysis_code: 'AN-0040', project: 'Hospital Associations', algorithm: 'Apriori', status: 'Completed', created_at: 'Jan 25, 2025, 02:30 PM' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* 1. WELCOME BANNER WITH HOSPITAL CAMPUS GRAPHIC */}
      <div className="bg-white rounded-3xl border border-[#E4EAE3] p-7 shadow-clinova-card relative overflow-hidden flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl z-10">
          <h2 className="text-2xl lg:text-3xl font-bold text-[#35463B] tracking-tight flex items-center gap-2">
            Welcome to CLINOVA <span className="text-xl">🌿</span>
          </h2>
          <p className="text-xl font-semibold italic text-[#456B56] tracking-tight">
            Discover Beyond Data.
          </p>
          <p className="text-xs lg:text-sm text-[#758278] leading-relaxed max-w-xl">
            Turning complex clinical records into meaningful healthcare knowledge through data mining and AI-powered insights.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-3">
            <button
              onClick={() => onNavigateTab('datasets')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white font-medium text-xs shadow-xs transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Dataset</span>
            </button>
            <button
              onClick={() => onNavigateTab('projects')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E4EAE3] text-[#35463B] hover:bg-[#F7F9F6] font-medium text-xs transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#456B56]" />
              <span>New Project</span>
            </button>
            <button
              onClick={() => onNavigateTab('association_rules')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E4EAE3] text-[#35463B] hover:bg-[#F7F9F6] font-medium text-xs transition-all shadow-xs"
            >
              <Play className="w-4 h-4 text-[#456B56]" />
              <span>Run Analysis</span>
            </button>
            <button
              onClick={() => onNavigateTab('reports')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-[#E4EAE3] text-[#35463B] hover:bg-[#F7F9F6] font-medium text-xs transition-all shadow-xs"
            >
              <FileText className="w-4 h-4 text-[#456B56]" />
              <span>Generate Report</span>
            </button>
          </div>
        </div>

        {/* Hospital Building Aesthetic Graphic (Right side) */}
        <div className="hidden lg:block relative w-80 h-36 shrink-0 rounded-2xl overflow-hidden bg-gradient-to-r from-transparent via-[#F0F5EF]/50 to-[#DFEAE0]/30 border border-[#E4EAE3]">
          <div className="absolute inset-0 flex items-center justify-center opacity-85">
            {/* SVG Illustration of modern research hospital */}
            <svg viewBox="0 0 400 160" className="w-full h-full text-[#456B56]/20 fill-current">
              <path d="M40 160V60h80v100H40zm100 0V30h160v130H140zm180 0V70h80v90h-80z" opacity="0.3" />
              <path d="M190 50h60v20h-60zM190 80h60v20h-60zM190 110h60v20h-60zM60 80h40v20H60zM60 110h40v20H60zM340 90h40v20h-40zM340 120h40v20h-40z" fill="#779985" opacity="0.4" />
              <circle cx="220" cy="20" r="14" fill="#DFEAE0" />
              <path d="M217 12h6v16h-6zM212 17h16v6h-16z" fill="#456B56" />
            </svg>
          </div>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS (6 CARDS GRID) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Datasets */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DFEAE0] flex items-center justify-center text-[#456B56] shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-[#35463B] leading-none">{kpi.datasets}</span>
              <span className="text-[10px] font-bold text-[#456B56] bg-[#DFEAE0] px-1 py-0.2 rounded">↑+1</span>
            </div>
            <p className="text-[11px] text-[#758278] truncate mt-1">Datasets</p>
          </div>
        </div>

        {/* Patient Encounters */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E7F1ED] flex items-center justify-center text-[#456B56] shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xl font-bold text-[#35463B] leading-none">{kpi.encounters.toLocaleString()}</span>
            <p className="text-[11px] text-[#758278] truncate mt-1">Patient Encounters</p>
          </div>
        </div>

        {/* Analysis Projects */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#DFEAE0] flex items-center justify-center text-[#456B56] shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-[#35463B] leading-none">{kpi.projects}</span>
              <span className="text-[10px] font-bold text-[#456B56] bg-[#DFEAE0] px-1 py-0.2 rounded">↑+2</span>
            </div>
            <p className="text-[11px] text-[#758278] truncate mt-1">Analysis Projects</p>
          </div>
        </div>

        {/* Association Rules */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F4EBDD] flex items-center justify-center text-[#725B3E] shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xl font-bold text-[#35463B] leading-none">{kpi.association_rules}</span>
            <p className="text-[11px] text-[#758278] truncate mt-1">Association Rules</p>
          </div>
        </div>

        {/* Patient Clusters */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#E7F1ED] flex items-center justify-center text-[#456B56] shrink-0">
            <Users2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xl font-bold text-[#35463B] leading-none">{kpi.patient_clusters}</span>
            <p className="text-[11px] text-[#758278] truncate mt-1">Patient Clusters</p>
          </div>
        </div>

        {/* Best Model ROC-AUC */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-4 shadow-clinova-card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEEAF5] flex items-center justify-center text-[#5D4A77] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xl font-bold text-[#35463B] leading-none">{kpi.best_model_roc_auc}</span>
            <p className="text-[11px] text-[#758278] truncate mt-1">Best Model (ROC-AUC)</p>
          </div>
        </div>
      </div>

      {/* 3. CHARTS ROW 1 (3 CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Dataset Overview Donut Chart */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#456B56]" />
            <div>
              <h3 className="font-bold text-xs text-[#35463B]">Dataset Overview</h3>
              <p className="text-[11px] text-[#758278]">Patient encounters by readmission status</p>
            </div>
          </div>

          {/* SVG Donut Chart */}
          <div className="flex flex-col items-center justify-center py-2">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* Background track (Readmitted 11.4%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#F4EBDD"
                  strokeWidth="14"
                />
                {/* Main slice (Not Readmitted 88.6%) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#779985"
                  strokeWidth="14"
                  strokeDasharray="238.76"
                  strokeDashoffset={238.76 * (1 - 0.886)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-extrabold text-[#35463B]">101,766</span>
                <span className="text-[10px] text-[#758278] font-medium">Encounters</span>
              </div>
            </div>

            {/* Legend */}
            <div className="w-full pt-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#779985]"></span>
                  <span className="text-[#35463B] font-medium">Not Readmitted (88.6%)</span>
                </div>
                <span className="text-[#758278] font-mono text-[11px]">90,145</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F4EBDD] border border-[#EBDCC7]"></span>
                  <span className="text-[#35463B] font-medium">Readmitted (11.4%)</span>
                </div>
                <span className="text-[#758278] font-mono text-[11px]">11,621</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Association Rules Bar Chart */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-[#456B56]" />
            <div>
              <h3 className="font-bold text-xs text-[#35463B]">Association Rules</h3>
              <p className="text-[11px] text-[#758278]">Top rules by lift (Apriori)</p>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="h-52 flex flex-col justify-end pt-4 pb-2">
            <div className="flex-1 flex items-end justify-around gap-4 border-b border-[#E4EAE3] pb-2 relative">
              {/* Y Axis Guide lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] text-[#96A499]">
                <div className="border-b border-dashed border-[#F0F5EF] w-full pl-1">3.0</div>
                <div className="border-b border-dashed border-[#F0F5EF] w-full pl-1">2.0</div>
                <div className="border-b border-dashed border-[#F0F5EF] w-full pl-1">1.0</div>
                <div className="pl-1">0.0</div>
              </div>

              {topRules.map((r, idx) => {
                const heightPct = (r.lift / 3.0) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 z-10">
                    <span className="text-xs font-bold text-[#456B56]">{r.lift}</span>
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full max-w-[48px] bg-[#779985] rounded-t-lg transition-all hover:bg-[#456B56]"
                      title={r.description}
                    ></div>
                    <span className="text-[11px] font-semibold text-[#758278] mt-1">{r.rule}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Card 3: Patient Clustering Donut Chart */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
          <div className="flex items-center gap-2">
            <Users2 className="w-4 h-4 text-[#456B56]" />
            <div>
              <h3 className="font-bold text-xs text-[#35463B]">Patient Clustering</h3>
              <p className="text-[11px] text-[#758278]">Patient distribution across clusters (K-Means)</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {/* Donut graphic */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                {/* 5 Slices */}
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#779985" strokeWidth="12" strokeDasharray="238.76" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#8BAFA3" strokeWidth="12" strokeDasharray="238.76" strokeDashoffset={238.76 * 0.274} />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#DFEAE0" strokeWidth="12" strokeDasharray="238.76" strokeDashoffset={238.76 * (0.274 + 0.201)} />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F4EBDD" strokeWidth="12" strokeDasharray="238.76" strokeDashoffset={238.76 * (0.274 + 0.201 + 0.196)} />
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#EEEAF5" strokeWidth="12" strokeDasharray="238.76" strokeDashoffset={238.76 * (0.274 + 0.201 + 0.196 + 0.178)} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-base font-extrabold text-[#35463B]">5</span>
                <span className="text-[10px] text-[#758278] font-medium">Clusters</span>
              </div>
            </div>

            {/* Cluster Percentages Legend */}
            <div className="space-y-1.5 text-xs flex-1 pl-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#779985]"></span>
                <span className="text-[#35463B]">Cluster 1 (27.4%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#8BAFA3]"></span>
                <span className="text-[#35463B]">Cluster 2 (20.1%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#DFEAE0]"></span>
                <span className="text-[#35463B]">Cluster 3 (19.6%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F4EBDD]"></span>
                <span className="text-[#35463B]">Cluster 4 (17.8%)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EEEAF5]"></span>
                <span className="text-[#35463B]">Cluster 5 (15.1%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. CHARTS ROW 2 (READMISSION ANALYSIS & FEATURE IMPORTANCE) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Readmission Analysis (Decision Tree Performance) */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-[#456B56]" />
            <div>
              <h3 className="font-bold text-xs text-[#35463B]">Readmission Analysis</h3>
              <p className="text-[11px] text-[#758278]">Decision Tree Classification – Performance</p>
            </div>
          </div>

          <div className="grid grid-cols-5 gap-3 pt-2 items-center">
            {/* Big ROC-AUC Pill */}
            <div className="col-span-1 bg-[#DFEAE0]/50 border border-[#CDDED0] rounded-2xl p-3 text-center">
              <span className="text-[10px] font-bold text-[#456B56] block">ROC-AUC</span>
              <span className="text-2xl font-black text-[#456B56]">{readmissionPerf.roc_auc}</span>
            </div>

            {/* Metrics */}
            <div className="text-center">
              <p className="text-[11px] text-[#758278]">Accuracy</p>
              <p className="text-lg font-bold text-[#35463B]">{readmissionPerf.accuracy}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-[#758278]">Precision</p>
              <p className="text-lg font-bold text-[#35463B]">{readmissionPerf.precision}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-[#758278]">Recall</p>
              <p className="text-lg font-bold text-[#35463B]">{readmissionPerf.recall}</p>
            </div>
            <div className="text-center">
              <p className="text-[11px] text-[#758278]">F1-Score</p>
              <p className="text-lg font-bold text-[#35463B]">{readmissionPerf.f1_score}</p>
            </div>
          </div>
        </div>

        {/* Feature Importance (Decision Tree) */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#456B56]" />
            <div>
              <h3 className="font-bold text-xs text-[#35463B]">Feature Importance (Decision Tree)</h3>
            </div>
          </div>

          {/* Horizontal Bar Chart matching screenshot */}
          <div className="space-y-2 pt-1 text-xs">
            {featureImportance.map((f, idx) => {
              const widthPct = (f.importance / 0.30) * 100;
              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#35463B] font-medium">{f.feature}</span>
                    <span className="font-mono font-bold text-[#456B56]">{f.importance}</span>
                  </div>
                  <div className="h-2 w-full bg-[#F0F5EF] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full bg-[#779985] rounded-full transition-all duration-300"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. BOTTOM ROW (RECENT DISCOVERIES & ANALYSIS HISTORY) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Recent Discoveries */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm">💡</span>
              <h3 className="font-bold text-xs text-[#35463B]">Recent Discoveries</h3>
            </div>
            <button
              onClick={() => onNavigateTab('knowledge_discovery')}
              className="text-[11px] font-semibold text-[#456B56] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {discoveries.map((d) => (
              <div
                key={d.id}
                className="p-3 rounded-xl border border-[#E4EAE3] bg-[#F7F9F6] flex items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <p className="font-bold text-[#35463B]">{d.title}</p>
                  <p className="text-[11px] text-[#758278]">{d.evidence}</p>
                </div>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold border shrink-0 ${
                    d.variant === 'sage'
                      ? 'bg-[#DFEAE0] text-[#456B56] border-[#CDDED0]'
                      : d.variant === 'teal'
                      ? 'bg-[#E7F1ED] text-[#456B56] border-[#D2E5DE]'
                      : 'bg-[#EEEAF5] text-[#5D4A77] border-[#E0D8ED]'
                  }`}
                >
                  {d.category}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Analysis History */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#456B56]" />
              <h3 className="font-bold text-xs text-[#35463B]">Analysis History</h3>
            </div>
            <button
              onClick={() => onNavigateTab('history')}
              className="text-[11px] font-semibold text-[#456B56] hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4EAE3] text-[#758278] text-[10px] uppercase font-semibold">
                  <th className="pb-2">Analysis ID</th>
                  <th className="pb-2">Project</th>
                  <th className="pb-2">Algorithm</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Executed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F5EF]">
                {analyses.map((row, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F9F6] transition-colors">
                    <td className="py-2.5 font-mono font-medium text-[#35463B]">{row.analysis_code}</td>
                    <td className="py-2.5 text-[#35463B]">{row.project}</td>
                    <td className="py-2.5 text-[#758278]">{row.algorithm}</td>
                    <td className="py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#DFEAE0] text-[#456B56]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{row.status}</span>
                      </span>
                    </td>
                    <td className="py-2.5 text-right text-[#758278] text-[11px]">{row.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
