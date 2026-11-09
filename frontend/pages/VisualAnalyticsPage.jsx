import React, { useState, useEffect } from 'react';
import {
  PieChart,
  BarChart2,
  Share2,
  Users2,
  TrendingUp,
  Download,
  Filter,
  CheckCircle2
} from 'lucide-react';

export default function VisualAnalyticsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then((res) => res.json())
      .then((d) => setData(d))
      .catch((e) => console.warn(e));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <PieChart className="w-5 h-5 text-[#456B56]" />
            <span>Interactive Visual Analytics Cockpit</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Coordinated multi-view visual exploration rendered strictly in the sage, teal, and warm-white palette.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Visual Suite</span>
        </button>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Support vs Confidence Scatter Plot */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
            <div>
              <h3 className="font-bold text-xs text-[#35463B]">Association Rules (Support vs Confidence)</h3>
              <p className="text-[11px] text-[#758278]">Bubble size represents rule lift.</p>
            </div>
            <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2 py-0.5 rounded-full font-bold">
              248 Rules
            </span>
          </div>

          <div className="h-64 border-b border-l border-[#E4EAE3] relative p-4 flex items-end justify-between">
            {/* Coordinates / Bubbles */}
            <div className="absolute inset-0 p-6 flex items-center justify-around pointer-events-none">
              <div
                style={{ left: '25%', bottom: '81%' }}
                className="absolute w-8 h-8 rounded-full bg-[#779985]/70 border-2 border-[#456B56] flex items-center justify-center text-[9px] font-bold text-white shadow-sm pointer-events-auto"
                title="Rule 1: Lift 2.78, Supp 4.8%, Conf 81.2%"
              >
                2.78
              </div>
              <div
                style={{ left: '18%', bottom: '76%' }}
                className="absolute w-7 h-7 rounded-full bg-[#8BAFA3]/70 border-2 border-[#456B56] flex items-center justify-center text-[9px] font-bold text-white shadow-sm pointer-events-auto"
                title="Rule 2: Lift 2.31, Supp 3.9%, Conf 76.4%"
              >
                2.31
              </div>
              <div
                style={{ left: '32%', bottom: '70%' }}
                className="absolute w-6 h-6 rounded-full bg-[#779985]/60 border-2 border-[#456B56] flex items-center justify-center text-[8px] font-bold text-white shadow-sm pointer-events-auto"
                title="Rule 3: Lift 1.96, Supp 5.2%, Conf 69.8%"
              >
                1.96
              </div>
              <div
                style={{ left: '45%', bottom: '65%' }}
                className="absolute w-5 h-5 rounded-full bg-[#8BAFA3]/50 border border-[#456B56] pointer-events-auto"
              ></div>
              <div
                style={{ left: '55%', bottom: '62%' }}
                className="absolute w-5 h-5 rounded-full bg-[#8BAFA3]/50 border border-[#456B56] pointer-events-auto"
              ></div>
              <div
                style={{ left: '12%', bottom: '58%' }}
                className="absolute w-5 h-5 rounded-full bg-[#8BAFA3]/50 border border-[#456B56] pointer-events-auto"
              ></div>
            </div>

            <span className="absolute bottom-1 right-2 text-[10px] text-[#758278]">Support (P(A ∩ B)) ➔</span>
            <span className="absolute top-2 left-2 text-[10px] text-[#758278] rotate-90 origin-left">
              Confidence (P(B|A)) ➔
            </span>
          </div>
        </div>

        {/* ROC-AUC Curve */}
        <div className="bg-white rounded-2xl border border-[#E4EAE3] p-6 shadow-clinova-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#F0F5EF] pb-3">
            <div>
              <h3 className="font-bold text-xs text-[#35463B]">Receiver Operating Characteristic (ROC-AUC)</h3>
              <p className="text-[11px] text-[#758278]">Decision tree true positive vs false positive rate.</p>
            </div>
            <span className="text-[10px] bg-[#DFEAE0] text-[#456B56] px-2.5 py-0.5 rounded-full font-black">
              AUC = 0.84
            </span>
          </div>

          <div className="h-64 border-b border-l border-[#E4EAE3] relative p-4 flex items-center justify-center">
            {/* SVG ROC Curve */}
            <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
              {/* Diagonal Chance Line */}
              <line x1="0" y1="100" x2="100" y2="0" stroke="#E4EAE3" strokeDasharray="3 3" strokeWidth="1.5" />
              {/* Area under curve */}
              <polygon
                points="0,100 0,60 15,35 30,22 55,14 80,8 100,0 100,100"
                fill="#DFEAE0"
                fillOpacity="0.4"
              />
              {/* ROC Curve Line */}
              <polyline
                fill="none"
                stroke="#456B56"
                strokeWidth="2.5"
                points="0,100 0,60 15,35 30,22 55,14 80,8 100,0"
              />
            </svg>

            <span className="absolute bottom-1 right-2 text-[10px] text-[#758278]">False Positive Rate ➔</span>
            <span className="absolute top-2 left-2 text-[10px] text-[#758278] rotate-90 origin-left">
              True Positive Rate ➔
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
