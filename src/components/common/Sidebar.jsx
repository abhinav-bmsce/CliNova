import React from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Database,
  History,
  LineChart,
  Sliders,
  Network,
  Users2,
  GitBranch,
  Lightbulb,
  Bot,
  PieChart,
  FileText,
  User,
  Settings,
  Shield,
  Activity
} from 'lucide-react';

export const NAVIGATION_ITEMS = [
  {
    section: 'Workspace',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'projects', label: 'My Projects', icon: FolderKanban },
      { id: 'datasets', label: 'Dataset Management', icon: Database },
      { id: 'history', label: 'Analysis History', icon: History },
    ],
  },
  {
    section: 'KDD Pipeline',
    items: [
      { id: 'eda', label: 'Exploratory Data Analysis', icon: LineChart },
      { id: 'preprocessing', label: 'Data Preprocessing', icon: Sliders },
      { id: 'association_rules', label: 'Association Rule Mining', icon: Network },
      { id: 'clustering', label: 'Patient Clustering', icon: Users2 },
      { id: 'readmission', label: 'Readmission Analysis', icon: GitBranch },
      { id: 'knowledge_discovery', label: 'Knowledge Discovery', icon: Lightbulb },
    ],
  },
  {
    section: 'Intelligence',
    items: [
      { id: 'ai_assistant', label: 'AI Knowledge Assistant', icon: Bot },
      { id: 'visual_analytics', label: 'Visual Analytics', icon: PieChart },
      { id: 'reports', label: 'Reports & Exports', icon: FileText },
    ],
  },
  {
    section: 'Account',
    items: [
      { id: 'profile', label: 'Profile', icon: User },
      { id: 'settings', label: 'Settings', icon: Settings },
      { id: 'admin', label: 'Administration', icon: Shield },
    ],
  },
];

export default function Sidebar({ activeTab = 'dashboard', onSelectTab }) {
  return (
    <aside className="w-64 bg-white border-r border-[#E4EAE3] flex flex-col h-screen sticky top-0 z-40 select-none">
      {/* Brand Header */}
      <div className="p-6 border-b border-[#E4EAE3]">
        <div className="flex items-center gap-3">
          {/* Green Medical Cross with Leaf Emblem matching screenshot */}
          <div className="w-11 h-11 rounded-2xl bg-[#DFEAE0] border border-[#CDDED0] flex items-center justify-center text-[#456B56] shadow-xs relative">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-[#456B56]" xmlns="http://www.w3.org/2000/svg">
              <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#779985] rounded-full border-2 border-white flex items-center justify-center">
              <span className="text-[7px] text-white">🌿</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-[#35463B] leading-none">
              CLINOVA
            </h1>
            <p className="text-[9px] font-bold text-[#758278] tracking-wider uppercase mt-1">
              CLINICAL INTELLIGENCE PLATFORM
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {NAVIGATION_ITEMS.map((section) => (
          <div key={section.section} className="space-y-1.5">
            <h2 className="px-3 text-[11px] font-semibold text-[#758278] tracking-tight">
              {section.section}
            </h2>

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all duration-150 text-left ${
                      isActive
                        ? 'bg-[#DFEAE0] text-[#456B56] font-bold shadow-xs'
                        : 'text-[#758278] hover:bg-[#F7F9F6] hover:text-[#35463B] font-medium'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        isActive ? 'text-[#456B56]' : 'text-[#758278]'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-[#E4EAE3] bg-[#F7F9F6]/40 flex items-center justify-between text-[11px] text-[#758278]">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#779985] animate-pulse"></span>
          <span>Engine Online</span>
        </div>
        <span className="font-mono text-[10px] text-[#96A499]">v1.0.0</span>
      </div>
    </aside>
  );
}
