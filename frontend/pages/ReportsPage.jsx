import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Plus,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('Hospital Readmission KDD Summary Study');
  const [format, setFormat] = useState('pdf');
  const [generating, setGenerating] = useState(false);

  const fetchReports = () => {
    fetch('/api/reports')
      .then((res) => res.json())
      .then((data) => {
        setReports(data.reports || []);
        setLoading(false);
      })
      .catch((e) => {
        console.warn(e);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('clinova_token') || ''}`,
        },
        body: JSON.stringify({
          title,
          format,
          project_id: 1,
        }),
      });
      if (res.ok) {
        setShowModal(false);
        fetchReports();
      }
    } catch (e) {
      console.error('Report generation error:', e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#456B56]" />
            <span>Reports & Analytical Artifact Exports</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Generate verifiable clinical study documents in PDF/HTML, CSV, and JSON format with full analytical grounding.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <h3 className="font-bold text-xs text-[#35463B]">Generated Study Reports</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4EAE3] text-[#758278] text-[10px] uppercase font-semibold">
                <th className="pb-3">Report Code</th>
                <th className="pb-3">Title</th>
                <th className="pb-3">Format</th>
                <th className="pb-3">Project</th>
                <th className="pb-3">Author</th>
                <th className="pb-3">Generated At</th>
                <th className="pb-3 text-right">Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F5EF]">
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-[#F7F9F6] transition-colors">
                  <td className="py-3 font-mono font-bold text-[#456B56]">{r.report_code}</td>
                  <td className="py-3 font-semibold text-[#35463B]">{r.title}</td>
                  <td className="py-3">
                    <span className="uppercase text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#DFEAE0] text-[#456B56] border border-[#CDDED0]">
                      {r.format}
                    </span>
                  </td>
                  <td className="py-3 text-[#35463B]">{r.project_name || 'Readmission Study'}</td>
                  <td className="py-3 text-[#758278]">{r.author_name || 'Dr. Ananya Rao'}</td>
                  <td className="py-3 text-[#758278] text-[11px]">{r.created_at}</td>
                  <td className="py-3 text-right">
                    <a
                      href={`/api/reports/${r.id}/download`}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#DFEAE0] text-[#456B56] hover:bg-[#cdded0] font-semibold text-xs border border-[#CDDED0] transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#35463B]/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4EAE3] p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-[#35463B]">Generate Clinical KDD Report</h3>
            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#35463B] mb-1">Report Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-[#35463B] focus:ring-1 focus:ring-[#779985]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#35463B] mb-1">Output Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {['pdf', 'csv', 'json'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFormat(f)}
                      className={`py-2 rounded-xl uppercase font-bold text-[11px] border transition-all ${
                        format === f
                          ? 'bg-[#DFEAE0] text-[#456B56] border-[#456B56]'
                          : 'bg-[#F7F9F6] text-[#758278] border-[#E4EAE3]'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-[#758278] hover:bg-[#F0F5EF]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white font-semibold disabled:opacity-50"
                >
                  {generating ? 'Compiling Artifact...' : 'Generate Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
