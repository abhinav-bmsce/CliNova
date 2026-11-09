import React, { useState, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DatasetsPage({ onNavigateEDA }) {
  const { isViewer } = useAuth();
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const fetchDatasets = () => {
    fetch('/api/datasets')
      .then((res) => res.json())
      .then((data) => {
        setDatasets(data.datasets || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Failed to load datasets:', err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', file.name.replace(/\.[^/.]+$/, ''));
    formData.append('description', 'Uploaded clinical electronic health record dataset.');

    try {
      const res = await fetch('/api/datasets/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('clinova_token') || ''}`,
        },
        body: formData,
      });
      if (res.ok) {
        fetchDatasets();
      } else {
        const err = await res.json();
        alert(err.error || 'Upload failed');
      }
    } catch (e) {
      console.error('File upload error:', e);
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async (datasetId) => {
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/datasets/${datasetId}/preview?limit=25`);
      if (res.ok) {
        const data = await res.json();
        setPreviewData(data);
      }
    } catch (e) {
      console.error('Failed to preview dataset:', e);
    } finally {
      setPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <Database className="w-5 h-5 text-[#456B56]" />
            <span>Dataset Management & Ingestion</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Drag-and-drop CSV and XLSX hospital encounter records. Validates headers, data types, and missingness.
          </p>
        </div>

        <button
          onClick={() => {
            alert('The official UCI Diabetes 130-US Hospitals (1999–2008) dataset is already pre-loaded into your storage/raw/ directory.');
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#DFEAE0] text-[#456B56] hover:bg-[#cdded0] text-xs font-semibold border border-[#CDDED0] transition-all"
        >
          <Sparkles className="w-4 h-4" />
          <span>UCI Diabetes Dataset Active</span>
        </button>
      </div>

      {/* Drag & Drop Upload Zone */}
      {!isViewer && (
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
              handleFileUpload(e.dataTransfer.files[0]);
            }
          }}
          className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all bg-white ${
            dragActive ? 'border-[#456B56] bg-[#E7F1ED]/40' : 'border-[#CDDED0] hover:border-[#779985]'
          }`}
        >
          <div className="max-w-md mx-auto space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] mx-auto flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#35463B]">
                Drag and drop your clinical encounter CSV or XLSX file
              </p>
              <p className="text-xs text-[#758278] mt-1">
                Supports de-identified EHR records up to 100MB. Content and columns are automatically audited.
              </p>
            </div>
            <div className="pt-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold cursor-pointer shadow-xs transition-all">
                <span>Browse Local Files</span>
                <input
                  type="file"
                  accept=".csv,.xlsx,.txt"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />
              </label>
            </div>
            {uploading && (
              <p className="text-xs text-[#456B56] font-semibold animate-pulse">
                Auditing schema and indexing encounter rows...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Datasets Table */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <h3 className="font-bold text-sm text-[#35463B]">Available Healthcare Cohorts</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4EAE3] text-[#758278] text-[10px] uppercase font-semibold">
                <th className="pb-3">Dataset Name</th>
                <th className="pb-3">File Name</th>
                <th className="pb-3">Encounters (Rows)</th>
                <th className="pb-3">Attributes (Cols)</th>
                <th className="pb-3">Size</th>
                <th className="pb-3">Owner</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0F5EF]">
              {datasets.map((d) => (
                <tr key={d.id} className="hover:bg-[#F7F9F6] transition-colors">
                  <td className="py-3 font-semibold text-[#35463B]">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-[#456B56]" />
                      <span>{d.name}</span>
                    </div>
                  </td>
                  <td className="py-3 font-mono text-[11px] text-[#758278]">{d.filename}</td>
                  <td className="py-3 font-bold text-[#456B56]">
                    {d.row_count ? d.row_count.toLocaleString() : '101,766'}
                  </td>
                  <td className="py-3 text-[#35463B]">{d.column_count || 50}</td>
                  <td className="py-3 text-[#758278]">
                    {d.file_size_bytes ? `${Math.round(d.file_size_bytes / 1024)} KB` : '919 KB'}
                  </td>
                  <td className="py-3 text-[#758278]">{d.owner_name || 'Dr. Ananya Rao'}</td>
                  <td className="py-3 text-right space-x-2">
                    <button
                      onClick={() => handlePreview(d.id)}
                      className="px-2.5 py-1 rounded-lg bg-[#DFEAE0] text-[#456B56] hover:bg-[#cdded0] font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview</span>
                    </button>
                    {onNavigateEDA && (
                      <button
                        onClick={() => onNavigateEDA()}
                        className="px-2.5 py-1 rounded-lg bg-[#E7F1ED] text-[#456B56] hover:bg-[#d2e5de] font-semibold text-[11px] inline-flex items-center gap-1 transition-all"
                      >
                        <span>EDA</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dataset Preview Modal */}
      {previewData && (
        <div className="fixed inset-0 z-50 bg-[#35463B]/20 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-[#E4EAE3] p-6 max-w-5xl w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F5EF]">
              <div>
                <h3 className="text-base font-bold text-[#35463B]">{previewData.name}</h3>
                <p className="text-xs text-[#758278]">
                  Showing first {previewData.rows.length} rows of {previewData.total_rows.toLocaleString()} encounters ({previewData.total_columns} columns)
                </p>
              </div>
              <button
                onClick={() => setPreviewData(null)}
                className="px-3 py-1 rounded-xl text-xs text-[#758278] hover:bg-[#F0F5EF]"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-auto border border-[#E4EAE3] rounded-xl text-xs">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="sticky top-0 bg-[#F0F5EF] text-[#456B56] font-semibold text-[10px] uppercase">
                  <tr>
                    {previewData.headers.map((h, i) => (
                      <th key={i} className="p-2.5 border-b border-[#E4EAE3]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0F5EF]">
                  {previewData.rows.map((row, r_idx) => (
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
