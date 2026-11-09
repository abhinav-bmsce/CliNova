import React from 'react';
import { Layers, ArrowRight, ShieldCheck, Database, Sliders, Network, Users2, GitBranch, Lightbulb, Bot, FileText, PieChart } from 'lucide-react';
import Badge from '../components/common/Badge';

export default function ModulePlaceholderPage({
  title,
  phase,
  description,
  deliverables = [],
  icon: Icon = Layers,
  onNavigateHome,
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E4EAE3] p-8 shadow-clinova-card max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between pb-6 border-b border-[#F0F5EF]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-[#DFEAE0] text-[#456B56] border border-[#CDDED0] flex items-center justify-center">
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-[#35463B]">{title}</h2>
              <Badge variant="sage" size="xs">{phase}</Badge>
            </div>
            <p className="text-xs text-[#758278] mt-1">{description}</p>
          </div>
        </div>

        <button
          onClick={onNavigateHome}
          className="text-xs font-medium text-[#456B56] hover:underline flex items-center gap-1"
        >
          <span>Return to Dashboard</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-[#35463B] uppercase tracking-wider">
          Scheduled Deliverables in {phase}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {deliverables.map((item, index) => (
            <div
              key={index}
              className="p-3.5 rounded-xl border border-[#E4EAE3] bg-[#F7F9F6] text-xs text-[#35463B] flex items-start gap-2.5"
            >
              <span className="w-5 h-5 rounded-full bg-[#DFEAE0] text-[#456B56] flex items-center justify-center font-bold text-[10px] shrink-0">
                {index + 1}
              </span>
              <span className="leading-relaxed">{item}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 rounded-xl bg-[#E7F1ED] border border-[#D2E5DE] text-xs text-[#456B56] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#456B56]" />
          <span>Architecture initialized. Module activates strictly upon completing preceding phases.</span>
        </div>
        <span className="text-[11px] font-semibold">Strict Phased Delivery</span>
      </div>
    </div>
  );
}

