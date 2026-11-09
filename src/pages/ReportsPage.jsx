import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Plus,
  FileCode,
  FileSpreadsheet,
  CheckCircle2,
  Calendar,
  Clock,
  Database,
  Layers,
  Sparkles,
  ShieldCheck,
  Filter,
  X
} from 'lucide-react';
import { useDataset } from '../context/DatasetContext';

export default function ReportsPage() {
  const { activeDatasetId } = useDataset();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Provenance Options from Backend
  const [provenanceOpts, setProvenanceOpts] = useState({
    projects: [],
    datasets: [],
    analysis_runs: []
  });

  // Modal Form State
  const [title, setTitle] = useState('Hospital Readmission KDD Comprehensive Study');
  const [format, setFormat] = useState('pdf');
  const [selectedProjectId, setSelectedProjectId] = useState(1);
  const [selectedDatasetId, setSelectedDatasetId] = useState(activeDatasetId || '');
  const [selectedArmId, setSelectedArmId] = useState('');
  const [selectedClusterId, setSelectedClusterId] = useState('');
  const [selectedClassificationId, setSelectedClassificationId] = useState('');

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

  const fetchProvenanceOptions = () => {
    fetch('/api/reports/provenance-options')
      .then((res) => res.json())
      .then((data) => {
        setProvenanceOpts(data);
        if (data.projects && data.projects.length > 0) {
          setSelectedProjectId(data.projects[0].id);
        }
        let defaultDsId = data.datasets && data.datasets.length > 0 ? data.datasets[0].id : 1;
        if (activeDatasetId && data.datasets && data.datasets.some((d) => d.id === activeDatasetId)) {
          defaultDsId = activeDatasetId;
        }
        setSelectedDatasetId(defaultDsId);

        // Filter default runs strictly to this dataset
        const dsRuns = (data.analysis_runs || []).filter((r) => !r.dataset_id || r.dataset_id === defaultDsId);
        const arm = dsRuns.find((r) => r.category === 'arm');
        setSelectedArmId(arm ? String(arm.id) : '');

        const cluster = dsRuns.find((r) => r.category === 'clustering');
        setSelectedClusterId(cluster ? String(cluster.id) : '');

        const classification = dsRuns.find((r) => r.category === 'classification');
        setSelectedClassificationId(classification ? String(classification.id) : '');
      })
      .catch((e) => console.warn('Provenance options error:', e));
  };

  const handleDatasetChange = (newDatasetId) => {
    const dsId = Number(newDatasetId);
    setSelectedDatasetId(dsId);
    const dsRuns = provenanceOpts.analysis_runs.filter((r) => !r.dataset_id || r.dataset_id === dsId);
    const arm = dsRuns.find((r) => r.category === 'arm');
    setSelectedArmId(arm ? String(arm.id) : '');
    const cluster = dsRuns.find((r) => r.category === 'clustering');
    setSelectedClusterId(cluster ? String(cluster.id) : '');
    const classification = dsRuns.find((r) => r.category === 'classification');
    setSelectedClassificationId(classification ? String(classification.id) : '');
  };

  useEffect(() => {
    fetchReports();
    fetchProvenanceOptions();
  }, []);

  const handleOpenModal = () => {
    fetchProvenanceOptions();
    setShowModal(true);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);

    const analysisIds = [];
    if (selectedArmId) analysisIds.push(parseInt(selectedArmId, 10));
    if (selectedClusterId) analysisIds.push(parseInt(selectedClusterId, 10));
    if (selectedClassificationId) analysisIds.push(parseInt(selectedClassificationId, 10));

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
          project_id: selectedProjectId,
          dataset_id: selectedDatasetId,
          analysis_ids: analysisIds,
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

  const currentDataset = provenanceOpts.datasets.find((d) => d.id === Number(selectedDatasetId)) || provenanceOpts.datasets[0];
  const armRuns = provenanceOpts.analysis_runs.filter((r) => r.category === 'arm' && (!r.dataset_id || r.dataset_id === Number(selectedDatasetId)));
  const clusterRuns = provenanceOpts.analysis_runs.filter((r) => r.category === 'clustering' && (!r.dataset_id || r.dataset_id === Number(selectedDatasetId)));
  const classificationRuns = provenanceOpts.analysis_runs.filter((r) => r.category === 'classification' && (!r.dataset_id || r.dataset_id === Number(selectedDatasetId)));

  const selectedArmRun = provenanceOpts.analysis_runs.find((r) => String(r.id) === String(selectedArmId));
  const selectedClusterRun = provenanceOpts.analysis_runs.find((r) => String(r.id) === String(selectedClusterId));
  const selectedClassRun = provenanceOpts.analysis_runs.find((r) => String(r.id) === String(selectedClassificationId));
  const selectedRunsCodes = [
    selectedArmRun ? `${selectedArmRun.analysis_code} (${selectedArmRun.algorithm})` : null,
    selectedClusterRun ? `${selectedClusterRun.analysis_code} (${selectedClusterRun.algorithm})` : null,
    selectedClassRun ? `${selectedClassRun.analysis_code} (${selectedClassRun.algorithm})` : null,
  ].filter(Boolean);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#456B56]" />
            <span>Reports &amp; Analytical Artifact Exports</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Generate verifiable clinical study documents in PDF/HTML, CSV, and JSON format with full analytical provenance and dataset tracking.
          </p>
        </div>

        <button
          onClick={handleOpenModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Report</span>
        </button>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
          <div>
            <h3 className="font-bold text-xs text-[#35463B]">Generated Analytical Study Reports</h3>
            <p className="text-[11px] text-[#758278]">Traceable artifacts stored in repository storage with verified run provenance.</p>
          </div>
          <span className="text-[11px] font-bold text-[#456B56] bg-[#DFEAE0] px-2.5 py-1 rounded-full">
            {reports.length} Artifacts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4EAE3] text-[#758278] text-[10px] uppercase font-semibold">
                <th className="pb-3">Report Code</th>
                <th className="pb-3">Study Title</th>
                <th className="pb-3">Artifact Format</th>
                <th className="pb-3">Target Project</th>
                <th className="pb-3">Author</th>
                <th className="pb-3">Generated Timestamp</th>
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DFEAE0] text-[#456B56] hover:bg-[#cdded0] font-semibold text-xs border border-[#CDDED0] transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </td>
                </tr>
              ))}
              {reports.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#758278]">
                    No reports generated yet. Click &quot;Generate New Report&quot; to synthesize clinical findings.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Generation Configuration Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-[#35463B]/25 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4EAE3] p-6 max-w-xl w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E4EAE3] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#35463B] flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#456B56]" />
                  <span>Configure Clinical KDD Report Synthesis</span>
                </h3>
                <p className="text-[11px] text-[#758278] mt-0.5">
                  Select study dataset and specific analysis run IDs for verified analytical provenance.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-[#758278] hover:bg-[#F0F5EF]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleGenerate} className="space-y-4 text-xs">
              {/* Report Title */}
              <div>
                <label className="block font-semibold text-[#35463B] mb-1">Study Report Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-[#35463B] focus:ring-1 focus:ring-[#779985]"
                />
              </div>

              {/* Project & Dataset Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#35463B] mb-1">Target Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-[#35463B] focus:ring-1 focus:ring-[#779985]"
                  >
                    {provenanceOpts.projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#35463B] mb-1">Cohort Dataset</label>
                  <select
                    value={selectedDatasetId}
                    onChange={(e) => handleDatasetChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-[#35463B] focus:ring-1 focus:ring-[#779985]"
                  >
                    {provenanceOpts.datasets.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.row_count ? d.row_count.toLocaleString() : 0} rows)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Specific Analysis Run Selectors */}
              <div className="bg-[#F7F9F6] border border-[#E4EAE3] rounded-2xl p-4 space-y-3">
                <h4 className="font-bold text-[11px] text-[#456B56] uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#456B56]" />
                  <span>Analytical Run Provenance Selection</span>
                </h4>

                {/* Association Rule Mining Run */}
                <div>
                  <label className="block font-semibold text-[#35463B] mb-1">
                    Association Rule Mining Run:
                  </label>
                  <select
                    value={selectedArmId}
                    onChange={(e) => setSelectedArmId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E4EAE3] rounded-xl text-[#35463B] text-[11px]"
                  >
                    <option value="">(None / Exclude Association Mining)</option>
                    {armRuns.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.analysis_code} • {r.algorithm} • Executed: {r.created_at}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Clustering Run */}
                <div>
                  <label className="block font-semibold text-[#35463B] mb-1">
                    Patient Clustering Run:
                  </label>
                  <select
                    value={selectedClusterId}
                    onChange={(e) => setSelectedClusterId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E4EAE3] rounded-xl text-[#35463B] text-[11px]"
                  >
                    <option value="">(None / Exclude Patient Clustering)</option>
                    {clusterRuns.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.analysis_code} • {r.algorithm} (k=5) • Executed: {r.created_at}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Classification Run */}
                <div>
                  <label className="block font-semibold text-[#35463B] mb-1">
                    Readmission Classification Run:
                  </label>
                  <select
                    value={selectedClassificationId}
                    onChange={(e) => setSelectedClassificationId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-[#E4EAE3] rounded-xl text-[#35463B] text-[11px]"
                  >
                    <option value="">(None / Exclude Classification Model)</option>
                    {classificationRuns.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.analysis_code} • {r.algorithm} • Executed: {r.created_at}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Provenance Live Preview Card */}
              <div className="bg-[#E7F1ED] border border-[#D2E5DE] rounded-xl p-3 text-[11px] text-[#35463B] space-y-1">
                <div className="font-bold text-[#456B56]">Provenance Summary for Generated Report:</div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="bg-white border border-[#CDDED0] px-2 py-0.5 rounded-md font-mono text-[10px]">
                    Dataset ID: {currentDataset?.id || 'N/A'} ({currentDataset?.row_count ? currentDataset.row_count.toLocaleString() : 0} encounters)
                  </span>
                  <span className="bg-white border border-[#CDDED0] px-2 py-0.5 rounded-md font-mono text-[10px]">
                    Runs: {selectedRunsCodes.length > 0 ? selectedRunsCodes.join(', ') : 'None selected'}
                  </span>
                  <span className="bg-white border border-[#CDDED0] px-2 py-0.5 rounded-md font-mono text-[10px]">
                    Preprocessing: Standard Clinical Protocol
                  </span>
                </div>
              </div>

              {/* Format Selector */}
              <div>
                <label className="block font-semibold text-[#35463B] mb-1">Export Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pdf', label: 'PDF / HTML Document' },
                    { id: 'csv', label: 'CSV Analytical Data' },
                    { id: 'json', label: 'JSON Provenance Bundle' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFormat(f.id)}
                      className={`py-2 px-3 rounded-xl font-bold text-[11px] border transition-all text-center cursor-pointer ${
                        format === f.id
                          ? 'bg-[#DFEAE0] text-[#456B56] border-[#456B56]'
                          : 'bg-[#F7F9F6] text-[#758278] border-[#E4EAE3]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-3 border-t border-[#E4EAE3]">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-[#758278] hover:bg-[#F0F5EF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="px-5 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white font-semibold disabled:opacity-50 cursor-pointer shadow-xs transition-all"
                >
                  {generating ? 'Compiling Artifact...' : 'Generate Verified Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
