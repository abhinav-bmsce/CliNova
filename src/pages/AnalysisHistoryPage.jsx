import React, { useState, useEffect } from 'react';
import {
  History,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  Filter,
  FileCode
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AnalysisHistoryPage() {
  const { token } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch('/api/history', { headers })
      .then((res) => res.json())
      .then((data) => {
        setHistory(data.history || []);
        setLoading(false);
      })
      .catch((e) => {
        console.warn(e);
        setLoading(false);
      });
  }, [token]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <History className="w-5 h-5 text-[#456B56]" />
            <span>Analysis Execution History &amp; Reproducibility Audit</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Complete provenance trail of all analytical runs, hyperparameters, and compute duration.
          </p>
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <h3 className="font-bold text-xs text-[#35463B]">Algorithm Execution Audit Trail</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4EAE3] text-[#758278] text-[10px] uppercase font-semibold">
                <th className="pb-3">Analysis Code</th>
                <th className="pb-3">Project</th>
                <th className="pb-3">Algorithm</th>
                <th className="pb-3">Execution Time</th>
                <th className="pb-3">Hyperparameters</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Initiated By</th>
                <th className="pb-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F5EF]">
              {history.map((row) => (
                <tr key={row.id} className="hover:bg-[#F7F9F6] transition-colors">
                  <td className="py-3 font-mono font-bold text-[#456B56]">{row.analysis_code}</td>
                  <td className="py-3 font-semibold text-[#35463B]">{row.project_name}</td>
                  <td className="py-3 text-[#35463B] font-medium">{row.algorithm}</td>
                  <td className="py-3 font-mono text-[#758278]">{row.execution_time_ms} ms</td>
                  <td className="py-3 font-mono text-[10px] text-[#456B56] max-w-xs truncate" title={row.parameters_json}>
                    {row.parameters_json || '{}'}
                  </td>
                  <td className="py-3">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#DFEAE0] text-[#456B56] border border-[#CDDED0]">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="capitalize">{row.status}</span>
                    </span>
                  </td>
                  <td className="py-3 text-[#758278]">{row.user_name}</td>
                  <td className="py-3 text-right text-[#758278] text-[11px]">{row.created_at}</td>
                </tr>
              ))}
              {history.length === 0 && !loading && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-[#758278]">
                    No analytical jobs have been executed yet. Run an algorithm from the KDD Pipeline to populate the audit trail.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
