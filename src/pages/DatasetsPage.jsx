import React, { useState, useRef } from 'react';
import {
  Database,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Eye,
  Trash2,
  Download,
  Search,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Check,
  FileCode,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useDataset } from '../context/DatasetContext';

export default function DatasetsPage({ onNavigateEDA }) {
  const { isViewer, token } = useAuth();
  const { datasets, activeDatasetId, setActiveDatasetId, refreshDatasets, deleteDataset, loadingDatasets } = useDataset();
  
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [importingBenchmark, setImportingBenchmark] = useState(false);

  const fileInputRef = useRef(null);

  const handleImportBenchmark = async () => {
    setImportingBenchmark(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/datasets/import-benchmark', {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (res.ok) {
        setUploadSuccess(data.message || 'UCI Diabetes reference benchmark imported successfully.');
        await refreshDatasets();
        if (data.dataset?.id) setActiveDatasetId(data.dataset.id);
      } else {
        setUploadError(data.error || 'Failed to import reference benchmark.');
      }
    } catch (e) {
      setUploadError(`Benchmark import error: ${e.message}`);
    } finally {
      setImportingBenchmark(false);
    }
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['csv', 'xlsx', 'xls', 'txt'].includes(ext)) {
      setUploadError(`Unsupported format .${ext}. Please upload a .csv, .xlsx, or .xls file.`);
      return;
    }
    setSelectedFile(file);
    setUploadError(null);
    setUploadSuccess(null);
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('name', selectedFile.name.replace(/\.[^/.]+$/, ''));
    formData.append('description', 'User-uploaded clinical encounter cohort.');

    let res;
    try {
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      res = await fetch('/api/datasets/upload', {
        method: 'POST',
        headers,
        body: formData,
      });
    } catch (netErr) {
      setUploadError(`Upload network failure: Unable to reach backend server (${netErr.message}). Verify the backend is running on port 5050.`);
      setUploading(false);
      return;
    }

    try {
      const contentType = res.headers.get('content-type') || '';
      let payload = null;

      if (contentType.includes('application/json')) {
        try {
          payload = await res.json();
        } catch {
          payload = null;
        }
      }

      if (res.ok) {
        if (payload && payload.dataset) {
          setUploadSuccess(
            `Dataset "${payload.dataset.name}" successfully parsed and registered (${payload.dataset.row_count.toLocaleString()} encounters, ${payload.dataset.column_count} attributes).`
          );
          setSelectedFile(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
          await refreshDatasets();
          setActiveDatasetId(payload.dataset.id);
        } else {
          setUploadError('Upload acknowledged, but dataset metadata was missing from server response.');
        }
      } else {
        // Specific HTTP error code resolution
        let userMessage = payload?.error || payload?.message;
        if (!userMessage) {
          if (res.status === 413) {
            userMessage = 'Uploaded file exceeds the maximum allowable limit (100MB).';
          } else if (res.status === 401) {
            userMessage = 'Authentication session expired. Please log in again.';
          } else if (res.status === 403) {
            userMessage = 'Access denied: You do not have permission to upload datasets.';
          } else if (res.status === 502 || res.status === 504) {
            userMessage = 'Backend connectivity error (502/504): Python backend service is unreachable. Verify port 5050 is active.';
          } else {
            const rawText = await res.text().catch(() => '');
            if (rawText && rawText.trim().length > 0) {
              const cleanText = rawText.replace(/<[^>]*>?/gm, ' ').slice(0, 160).trim();
              userMessage = `Server error (HTTP ${res.status}): ${cleanText}`;
            } else {
              userMessage = `Upload failed with HTTP ${res.status} (Empty response from server).`;
            }
          }
        }
        setUploadError(userMessage);
      }
    } catch (parseErr) {
      setUploadError(`Error processing server response: ${parseErr.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (datasetId) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/datasets/${datasetId}/preview?limit=25`);
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        setPreviewData(data);
      } else {
        const errText = await res.text().catch(() => '');
        alert(`Failed to load preview (HTTP ${res.status}): ${errText.slice(0, 100) || 'Unknown error'}`);
      }
    } catch (e) {
      console.error('Failed to preview dataset:', e);
      alert(`Network error loading preview: ${e.message}`);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDelete = async (datasetId, datasetName) => {
    if (!window.confirm(`Are you sure you want to permanently delete dataset "${datasetName}"? This action cannot be undone.`)) {
      return;
    }
    const result = await deleteDataset(datasetId);
    if (!result.success) {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <Database className="w-5 h-5 text-[#456B56]" />
            <span>Dataset Management &amp; Cohort Ingestion</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Ingest de-identified clinical encounter records in CSV or XLSX format. Validates headers, schema profiling, and missingness audits.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[#758278] font-medium">
            Total Cohorts: <strong className="text-[#35463B] font-mono">{datasets.length}</strong>
          </span>
          {!isViewer && (
            <button
              type="button"
              onClick={handleImportBenchmark}
              disabled={importingBenchmark}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DFEAE0] hover:bg-[#cdded0] text-[#456B56] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
              title="Import the reference UCI Diabetes 130-US Hospitals study cohort"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{importingBenchmark ? 'Importing...' : 'Import UCI Benchmark'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Upload Zone */}
      {!isViewer && (
        <div className="bg-white rounded-3xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileSelect(e.dataTransfer.files[0]);
              }
            }}
            className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
              dragActive ? 'border-[#456B56] bg-[#E7F1ED]/40' : 'border-[#CDDED0] hover:border-[#779985]'
            }`}
          >
            <div className="max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] mx-auto flex items-center justify-center">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#35463B]">
                  Drag &amp; drop your clinical encounter CSV or XLSX file
                </p>
                <p className="text-xs text-[#758278] mt-1">
                  Supports de-identified records up to 100MB (.csv, .xlsx, .xls). Attributes and schema are verified upon ingestion.
                </p>
              </div>

              {/* Hidden HTML file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Browse Local Files</span>
                </button>
              </div>
            </div>
          </div>

          {/* Selected File Review & Upload Trigger */}
          {selectedFile && (
            <div className="p-4 rounded-2xl bg-[#F7F9F6] border border-[#E4EAE3] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#DFEAE0] text-[#456B56] flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#35463B]">{selectedFile.name}</h4>
                  <p className="text-[11px] text-[#758278]">
                    Size: {Math.round(selectedFile.size / 1024)} KB • Type: {selectedFile.type || 'Clinical spreadsheet'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="px-3 py-1.5 rounded-xl border border-[#E4EAE3] text-xs text-[#758278] hover:bg-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={uploading}
                  onClick={handleUploadSubmit}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Parsing & Ingesting...' : 'Upload & Register'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {uploadSuccess && (
            <div className="p-3.5 rounded-xl bg-[#DFEAE0] border border-[#CDDED0] text-[#456B56] text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Error Banner */}
          {uploadError && (
            <div className="p-3.5 rounded-xl bg-[#FBEAE8] border border-[#F5C2BC] text-[#C53929] text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Datasets Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0F5EF]">
          <div>
            <h3 className="font-bold text-xs text-[#35463B]">Available Healthcare Cohorts</h3>
            <p className="text-[11px] text-[#758278]">Select a dataset to activate it across all downstream KDD modules.</p>
          </div>
          <span className="text-[11px] text-[#758278]">
            Active: <strong className="text-[#456B56]">{datasets.find((d) => d.id === activeDatasetId)?.name || 'None'}</strong>
          </span>
        </div>

        {datasets.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E4EAE3] text-[#758278] text-[10px] uppercase font-semibold">
                  <th className="pb-3">Dataset Name</th>
                  <th className="pb-3">File Name</th>
                  <th className="pb-3">Encounters</th>
                  <th className="pb-3">Attributes</th>
                  <th className="pb-3">Size</th>
                  <th className="pb-3">Owner</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0F5EF]">
                {datasets.map((d) => {
                  const isActive = d.id === activeDatasetId;
                  return (
                    <tr key={d.id} className={`hover:bg-[#F7F9F6] transition-colors ${isActive ? 'bg-[#F0F5EF]/50' : ''}`}>
                      <td className="py-3 font-semibold text-[#35463B]">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-[#456B56]" />
                          <span>{d.name}</span>
                        </div>
                      </td>
                      <td className="py-3 font-mono text-[11px] text-[#758278]">{d.filename}</td>
                      <td className="py-3 font-mono font-bold text-[#456B56]">
                        {d.row_count ? d.row_count.toLocaleString() : '0'}
                      </td>
                      <td className="py-3 font-mono text-[#35463B]">{d.column_count || 0}</td>
                      <td className="py-3 text-[#758278]">
                        {d.file_size_bytes ? `${Math.round(d.file_size_bytes / 1024)} KB` : '—'}
                      </td>
                      <td className="py-3 text-[#758278]">{d.owner_name || 'Staff Researcher'}</td>
                      <td className="py-3">
                        {isActive ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-[#456B56] text-white px-2 py-0.5 rounded-full font-bold">
                            <Check className="w-3 h-3" />
                            <span>Active</span>
                          </span>
                        ) : (
                          <button
                            onClick={() => setActiveDatasetId(d.id)}
                            className="text-[10px] bg-[#DFEAE0] text-[#456B56] hover:bg-[#cdded0] px-2 py-0.5 rounded-full font-semibold cursor-pointer"
                          >
                            Set Active
                          </button>
                        )}
                      </td>
                      <td className="py-3 text-right space-x-2">
                        <button
                          onClick={() => handlePreview(d.id)}
                          className="px-2.5 py-1 rounded-lg bg-[#DFEAE0] text-[#456B56] hover:bg-[#cdded0] font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Preview</span>
                        </button>
                        {onNavigateEDA && (
                          <button
                            onClick={() => {
                              setActiveDatasetId(d.id);
                              onNavigateEDA();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-[#E7F1ED] text-[#456B56] hover:bg-[#d2e5de] font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <span>EDA</span>
                          </button>
                        )}
                        {!isViewer && (
                          <button
                            onClick={() => handleDelete(d.id, d.name)}
                            className="px-2 py-1 rounded-lg text-[#C53929] hover:bg-[#FBEAE8] font-semibold text-[11px] inline-flex items-center gap-1 transition-all cursor-pointer"
                            title="Delete dataset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-[#758278] space-y-3">
            <p className="text-xs">No healthcare cohorts uploaded yet.</p>
            <p className="text-[11px] text-[#96A499]">
              Drag and drop a CSV or XLSX file above, click &quot;Browse Local Files&quot;, or import the reference benchmark below.
            </p>
            {!isViewer && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleImportBenchmark}
                  disabled={importingBenchmark}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#DFEAE0] hover:bg-[#cdded0] text-[#456B56] text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{importingBenchmark ? 'Importing...' : 'Import UCI Diabetes Benchmark (Optional)'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dataset Preview & Schema Audit Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 bg-[#35463B]/25 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4EAE3] p-6 max-w-5xl w-full max-h-[88vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F5EF]">
              <div>
                <h3 className="text-base font-bold text-[#35463B] flex items-center gap-2">
                  <Database className="w-4 h-4 text-[#456B56]" />
                  <span>{previewData.name}</span>
                </h3>
                <p className="text-xs text-[#758278]">
                  Showing first {previewData.rows?.length || 0} rows of {previewData.total_rows?.toLocaleString() || 0} encounters ({previewData.total_columns} attributes)
                </p>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="p-1 rounded-lg text-[#758278] hover:bg-[#F0F5EF] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Column Schema Summary Tags */}
            {previewData.columns && previewData.columns.length > 0 && (
              <div className="p-3 bg-[#F7F9F6] rounded-xl border border-[#E4EAE3] space-y-1.5 text-xs">
                <span className="font-semibold text-[#456B56] text-[11px] block uppercase tracking-wide">
                  Schema &amp; Attribute Data Types:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                  {previewData.columns.map((c, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-white border border-[#E4EAE3] text-[11px] text-[#35463B] flex items-center gap-1 font-mono"
                    >
                      <strong className="text-[#456B56]">{c.name}:</strong>
                      <span className="text-[#758278]">{c.type}</span>
                      {c.null_count > 0 && (
                        <span className="text-[#C53929]">({c.null_count} nulls)</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Row Table */}
            <div className="flex-1 overflow-auto border border-[#E4EAE3] rounded-xl text-xs">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-[#F0F5EF] text-[#456B56] font-semibold text-[10px] uppercase">
                  <tr>
                    {previewData.headers?.map((h, i) => (
                      <th key={i} className="p-2.5 border-b border-[#E4EAE3]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F5EF]">
                  {previewData.rows?.map((row, r_idx) => (
                    <tr key={r_idx} className="hover:bg-[#F7F9F6]">
                      {row.map((cell, c_idx) => (
                        <td key={c_idx} className="p-2 text-[#35463B]">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
