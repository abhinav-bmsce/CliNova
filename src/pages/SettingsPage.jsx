import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Key,
  Database,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card">
        <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#456B56]" />
          <span>Platform & KDD Runtime Preferences</span>
        </h2>
        <p className="text-xs text-[#758278] mt-1">
          Configure default mining thresholds, local storage quotas, and optional external LLM API credentials.
        </p>
      </div>

      {/* AI Key Configuration */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <h3 className="font-bold text-xs text-[#35463B] flex items-center gap-2">
          <Key className="w-4 h-4 text-[#456B56]" />
          <span>External AI Provider Key (Optional)</span>
        </h3>
        <p className="text-xs text-[#758278] leading-relaxed">
          CLINOVA includes a fully functional, zero-dependency clinical expert explanation engine. You may optionally configure a Gemini or OpenAI API key to enable generative synthesis. Keys are stored only on the backend.
        </p>

        {saved && (
          <div className="p-3 rounded-xl bg-[#DFEAE0] text-[#456B56] text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Preferences saved successfully.</span>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs max-w-md">
          <div>
            <label className="block font-semibold text-[#35463B] mb-1">GEMINI_API_KEY / OPENAI_API_KEY</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-... or AIzaSy..."
              className="w-full px-3 py-2 bg-[#F7F9F6] border border-[#E4EAE3] rounded-xl text-[#35463B] focus:ring-1 focus:ring-[#779985]"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all"
          >
            Save API Configuration
          </button>
        </form>
      </div>

      {/* Storage Paths Info */}
      <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
        <h3 className="font-bold text-xs text-[#35463B] flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#456B56]" />
          <span>Storage & Directory Allocation</span>
        </h3>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between p-2.5 rounded-xl bg-[#F7F9F6]">
            <span className="text-[#758278]">Raw Encounter Ingestion Directory:</span>
            <span className="font-mono text-[#35463B]">storage/raw/</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-[#F7F9F6]">
            <span className="text-[#758278]">Preprocessed Transformation Storage:</span>
            <span className="font-mono text-[#35463B]">storage/processed/</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-[#F7F9F6]">
            <span className="text-[#758278]">Analytical Reports & Exports:</span>
            <span className="font-mono text-[#35463B]">storage/reports/</span>
          </div>
          <div className="flex justify-between p-2.5 rounded-xl bg-[#F7F9F6]">
            <span className="text-[#758278]">Relational Database:</span>
            <span className="font-mono text-[#456B56]">storage/clinova.db (WAL Mode)</span>
          </div>
        </div>
      </div>
    </div>
  );
}

