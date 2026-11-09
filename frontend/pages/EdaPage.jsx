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
  Percent
} from 'lucide-react';

export default function EdaPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedColumn, setSelectedColumn] = useState('time_in_hospital');

  useEffect(() => {
    fetch('/api/eda/profile')
      .then((res) => res.json())
      .then((data) => {
        setProfile(data);
        if (data.columns && data.columns.length > 0) {
          const firstNumeric = data.columns.find((c) => c.type === 'numeric');
          if (firstNumeric) setSelectedColumn(firstNumeric.name);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('EDA fetch error:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-[#758278] animate-pulse">
        Computing summary statistics, distribution histograms, and correlation matrices...
      </div>
    );
  }

  const columns = profile?.columns || [];
  const colObj = columns.find((c) => c.name === selectedColumn) || columns[0];
  const targetDist = profile?.target_distribution || {};
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
            Statistical distributions, missing-value audits, and correlation matrices for UCI Diabetes cohort.
          </p>
        </div>

        {/* Column Selector */}
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#35463B]">Explore Feature:</span>
          <select
            value={selectedColumn}
            onChange={(e) => setSelectedColumn(e.target.value)}
            className="px-3 py-1.5 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-xs font-semibold text-[#456B56] focus:outline-none focus:ring-1 focus:ring-[#779985]"
          >
            {columns.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
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
                <span className="text-[#758278]">Std Deviation</span>
                <span className="font-bold text-[#35463B]">{colObj.stats.std}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6]">
                <span className="text-[#758278]">Median (50%)</span>
                <span className="font-bold text-[#456B56]">{colObj.stats.median}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6]">
                <span className="text-[#758278]">Range [Min - Max]</span>
                <span className="font-bold text-[#35463B]">
                  [{colObj.stats.min} – {colObj.stats.max}]
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#F7F9F6]">
                <span className="text-[#758278]">Interquartile Range [25% - 75%]</span>
                <span className="font-bold text-[#35463B]">
                  [{colObj.stats.q25} – {colObj.stats.q75}]
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              <p className="text-[11px] text-[#758278]">Top Categories Frequency:</p>
              {colObj?.top_categories?.slice(0, 5).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-1.5 rounded-lg bg-[#F7F9F6]">
                  <span className="text-[#35463B] font-medium">{cat.category}</span>
                  <span className="font-mono text-[#456B56]">
                    {cat.count} ({cat.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Feature Distribution Histogram / Frequencies */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-clinova-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
            <h3 className="font-bold text-xs text-[#35463B]">
              Empirical Distribution: {colObj?.name}
            </h3>
            <span className="text-xs text-[#758278]">
              {colObj?.type === 'numeric' ? '10-Bin Histogram' : 'Category Frequency'}
            </span>
          </div>

          {colObj?.type === 'numeric' && colObj.histogram ? (
            <div className="h-48 flex items-end justify-between gap-2 pt-6 pb-2 border-b border-[#E4EAE3]">
              {colObj.histogram.map((bin, idx) => {
                const maxCount = Math.max(...colObj.histogram.map((b) => b.count), 1);
                const heightPct = (bin.count / maxCount) * 100;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                    <span className="text-[9px] text-[#758278]">{bin.count}</span>
                    <div
                      style={{ height: `${Math.max(6, heightPct)}%` }}
                      className="w-full bg-[#779985] hover:bg-[#456B56] rounded-t-md transition-all"
                      title={`Range: ${bin.bin_start} - ${bin.bin_end}, Count: ${bin.count}`}
                    ></div>
                    <span className="text-[9px] text-[#96A499] truncate w-full text-center">
                      {bin.bin_start}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              {colObj?.top_categories?.map((cat, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-[#35463B]">{cat.category}</span>
                    <span className="font-bold text-[#456B56]">{cat.percentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-[#F0F5EF] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${cat.percentage}%` }}
                      className="h-full bg-[#779985] rounded-full"
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Pearson Correlation Heatmap */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <h3 className="font-bold text-xs text-[#35463B]">
          Pearson Correlation Matrix (Clinical Markers)
        </h3>
        <p className="text-[11px] text-[#758278]">
          Pairwise correlation coefficients computed across inpatient encounter features.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border border-[#E4EAE3] rounded-xl overflow-hidden">
            <thead>
              <tr className="bg-[#F0F5EF] text-[#456B56] font-semibold text-[10px] uppercase">
                <th className="p-2.5 text-left border-r border-[#E4EAE3]">Feature</th>
                {Object.keys(correlations).map((k) => (
                  <th key={k} className="p-2 border-r border-[#E4EAE3] truncate max-w-[80px]">
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4EAE3]">
              {Object.keys(correlations).map((rowKey) => (
                <tr key={rowKey}>
                  <td className="p-2.5 text-left font-semibold text-[#35463B] bg-[#F7F9F6] border-r border-[#E4EAE3] text-[11px]">
                    {rowKey}
                  </td>
                  {Object.keys(correlations).map((colKey) => {
                    const r = correlations[rowKey][colKey] || 0;
                    const isDiag = rowKey === colKey;
                    const bgTint = isDiag
                      ? 'bg-[#DFEAE0] font-bold text-[#456B56]'
                      : r > 0.3
                      ? 'bg-[#E7F1ED] font-semibold text-[#456B56]'
                      : r < -0.1
                      ? 'bg-[#F3E5DC] text-[#8C533D]'
                      : 'text-[#758278]';
                    return (
                      <td key={colKey} className={`p-2 border-r border-[#E4EAE3] text-[11px] ${bgTint}`}>
                        {r.toFixed(2)}
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
  );
}
