import React, { useState, useEffect } from 'react';
import {
  LineChart,
  BarChart2,
  PieChart,
  Table,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
  Percent,
  Database,
  ArrowRight
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function EdaPage({ onNavigateDatasets }) {
  const { datasets, activeDatasetId, setActiveDatasetId, activeDataset } = useDataset();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState('');

  useEffect(() => {
    if (!activeDatasetId) {
      setProfile(null);
      return;
    }

    setLoading(true);
    fetch(`/api/eda/profile?dataset_id=${activeDatasetId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load profile');
        return res.json();
      })
      .then((data) => {
        setProfile(data);
        if (data.columns && data.columns.length > 0) {
          const firstNumeric = data.columns.find((c) => c.type === 'numeric');
          setSelectedColumn(firstNumeric ? firstNumeric.name : data.columns[0].name);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('EDA fetch error:', err);
        setProfile(null);
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
          Exploratory Data Analysis requires an active clinical cohort. Please upload a CSV or XLSX dataset in Dataset Management to compute summary distributions and correlations.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#758278] animate-pulse">
        Computing summary statistics, distribution histograms, and correlation matrices for {activeDataset?.name}...
      </div>
    );
  }

  const columns = profile?.columns || [];
  const colObj = columns.find((c) => c.name === selectedColumn) || columns[0];
  const targetCounts = profile?.target_distribution?.counts || (
    profile?.target_distribution && typeof profile?.target_distribution === 'object' && !profile?.target_distribution.counts
      ? profile.target_distribution
      : {}
  );
  const correlations = profile?.correlations || {};

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <LineChart className="w-5 h-5 text-[#456B56]" />
            <span>Exploratory Data Analysis (EDA)</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Statistical distributions, missing-value audits, and correlation matrices for <strong className="text-[#456B56]">{profile?.dataset_name || activeDataset?.name}</strong>.
          </p>
        </div>

        {/* Dataset & Column Selector */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-[#F0F5EF] px-3 py-1.5 rounded-xl border border-[#E4EAE3]">
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

          <div className="flex items-center gap-1.5 bg-[#F7F9F6] px-3 py-1.5 rounded-xl border border-[#E4EAE3]">
            <span className="font-semibold text-[#758278]">Feature:</span>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="bg-transparent font-semibold text-[#456B56] focus:outline-none cursor-pointer"
            >
              {columns.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Row 1: Selected Feature Stats & Distribution Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Descriptive Summary Stats */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
            <div>
              <h3 className="font-bold text-xs text-[#35463B]">{colObj?.name}</h3>
              <p className="text-[11px] text-[#758278]">Type: {colObj?.type}</p>
            </div>
            <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2 py-0.5 rounded-full font-semibold">
              {colObj?.missing_percentage}% Missing
            </span>
          </div>

          {colObj?.type === 'numeric' && colObj.stats ? (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6]">
                <span className="text-[#758278]">Mean Value</span>
                <span className="font-bold text-[#35463B]">{colObj.stats.mean}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6]">
                <span className="text-[#758278]">Median</span>
                <span className="font-bold text-[#35463B]">{colObj.stats.median}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6]">
                <span className="text-[#758278]">Standard Deviation</span>
                <span className="font-bold text-[#35463B]">{colObj.stats.std}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6]">
                <span className="text-[#758278]">Min / Max</span>
                <span className="font-bold text-[#35463B]">
                  {colObj.stats.min} – {colObj.stats.max}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6]">
                <span className="text-[#758278]">Interquartile (Q1 – Q3)</span>
                <span className="font-bold text-[#35463B]">
                  {colObj.stats.q25} – {colObj.stats.q75}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6]">
                <span className="text-[#758278]">Distinct Categories</span>
                <span className="font-bold text-[#35463B]">{colObj?.unique_count || colObj?.unique_values || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6]">
                <span className="text-[#758278]">Mode (Most Frequent)</span>
                <span className="font-bold text-[#35463B] truncate max-w-[140px]">
                  {Array.isArray(colObj?.top_categories) && colObj.top_categories.length > 0
                    ? `${colObj.top_categories[0].category} (${colObj.top_categories[0].count})`
                    : colObj?.top_categories && typeof colObj.top_categories === 'object'
                    ? Object.keys(colObj.top_categories)[0]
                    : 'N/A'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Distribution Histogram / Category Bar Chart */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
            <h3 className="font-bold text-xs text-[#35463B]">Distribution Histogram: {colObj?.name}</h3>
            <span className="text-[11px] text-[#758278]">
              Sample size: {profile?.total_rows ? profile.total_rows.toLocaleString() : 'N/A'} encounters
            </span>
          </div>

          <div className="h-56 flex items-end justify-between gap-2 pt-6 px-4 border-b border-l border-[#E4EAE3]">
            {colObj?.histogram && colObj.histogram.length > 0 ? (
              colObj.histogram.map((bin, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] text-[#758278] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {bin.count}
                  </span>
                  <div
                    className="w-full bg-[#779985] hover:bg-[#456B56] rounded-t-md transition-all duration-300"
                    style={{
                      height: `${Math.max(8, (bin.count / Math.max(...colObj.histogram.map((b) => b.count || 1))) * 100)}%`,
                    }}
                  ></div>
                  <span className="text-[9px] text-[#96A499] truncate w-full text-center" title={bin.bin || `${bin.bin_start}–${bin.bin_end}`}>
                    {bin.bin || `${bin.bin_start}–${bin.bin_end}`}
                  </span>
                </div>
              ))
            ) : Array.isArray(colObj?.top_categories) && colObj.top_categories.length > 0 ? (
              colObj.top_categories.slice(0, 6).map((item, i) => {
                const cat = item.category;
                const cnt = item.count;
                const maxCount = Math.max(...colObj.top_categories.map((c) => c.count || 1));
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                    <span className="text-[10px] text-[#758278] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                      {cnt}
                    </span>
                    <div
                      className="w-full bg-[#8BAFA3] hover:bg-[#456B56] rounded-t-md transition-all duration-300"
                      style={{
                        height: `${Math.max(8, (cnt / maxCount) * 100)}%`,
                      }}
                    ></div>
                    <span className="text-[9px] text-[#96A499] truncate w-full text-center" title={cat}>
                      {cat}
                    </span>
                  </div>
                );
              })
            ) : colObj?.top_categories && typeof colObj.top_categories === 'object' ? (
              Object.entries(colObj.top_categories).slice(0, 6).map(([cat, cnt], i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                  <span className="text-[10px] text-[#758278] opacity-0 group-hover:opacity-100 transition-opacity font-mono">
                    {cnt}
                  </span>
                  <div
                    className="w-full bg-[#8BAFA3] hover:bg-[#456B56] rounded-t-md transition-all duration-300"
                    style={{
                      height: `${Math.max(8, (cnt / Math.max(...Object.values(colObj.top_categories))) * 100)}%`,
                    }}
                  ></div>
                  <span className="text-[9px] text-[#96A499] truncate w-full text-center" title={cat}>
                    {cat}
                  </span>
                </div>
              ))
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-[#758278]">
                Distribution data unavailable for this attribute.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Target Distribution & Clinical Correlation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Target Outcome Balance */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
            <h3 className="font-bold text-xs text-[#35463B]">Target Outcome Balance</h3>
            <span className="text-[11px] text-[#758278]">readmitted attribute</span>
          </div>

          <div className="space-y-3 pt-2 text-xs">
            {Object.entries(targetCounts).length > 0 ? (
              Object.entries(targetCounts).map(([label, count], i) => {
                const totalEncounters = Object.values(targetCounts).reduce((a, b) => a + (typeof b === 'number' ? b : 0), 0) || 1;
                const numericCount = typeof count === 'number' ? count : 0;
                const pct = ((numericCount / totalEncounters) * 100).toFixed(1);
                return (
                  <div key={i} className="space-y-1">
                    <div className="flex justify-between font-semibold">
                      <span className="text-[#35463B]">{label}</span>
                      <span className="text-[#758278] font-mono">
                        {numericCount.toLocaleString()} encounters ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#F0F5EF] h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#456B56]"
                        style={{
                          width: `${(numericCount / totalEncounters) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-xs text-[#758278] italic py-2">
                No target readmission column detected in this dataset.
              </div>
            )}
          </div>
        </div>

        {/* Feature Correlation Matrix */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
            <h3 className="font-bold text-xs text-[#35463B]">Clinical Predictor Correlation Matrix (Pearson)</h3>
            <span className="text-[11px] text-[#758278]">Excludes administrative identifiers</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-center border-collapse">
              <thead>
                <tr>
                  <th className="p-2 text-left font-semibold text-[#758278] text-[10px]"></th>
                  {Object.keys(correlations).map((k) => (
                    <th key={k} className="p-2 font-semibold text-[#456B56] text-[10px] truncate max-w-[80px]" title={k}>
                      {k}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F5EF]">
                {Object.entries(correlations).map(([rowK, rowVals]) => (
                  <tr key={rowK}>
                    <td className="p-2 text-left font-semibold text-[#35463B] text-[10px] truncate max-w-[100px]" title={rowK}>
                      {rowK}
                    </td>
                    {Object.keys(correlations).map((colK) => {
                      const val = rowVals[colK] !== undefined ? rowVals[colK] : 0;
                      const intensity = Math.min(1, Math.abs(val) * 1.5);
                      return (
                        <td
                          key={colK}
                          className="p-2 font-mono text-[11px]"
                          style={{
                            backgroundColor: val > 0 ? `rgba(119, 153, 133, ${intensity * 0.35})` : `rgba(223, 234, 224, ${intensity * 0.4})`,
                            color: '#35463B',
                            fontWeight: Math.abs(val) > 0.3 ? 'bold' : 'normal',
                          }}
                        >
                          {val.toFixed(2)}
                        </td>
                      );
                    })}
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
