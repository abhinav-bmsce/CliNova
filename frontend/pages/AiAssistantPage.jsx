import React, { useState } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  CheckCircle2,
  Clock,
  User,
  Info
} from 'lucide-react';

export default function AiAssistantPage() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Good day. I am the **CLINOVA Intelligence Assistant**. My explanations are strictly grounded in your active KDD results (Association Rules, K-Means Clusters, and Decision Tree Readmission Models). I will never fabricate medical statistics or confuse correlation with causation.\n\nHow may I assist your clinical analysis today?',
      provider: 'clinova-grounded-engine',
    },
  ]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const presets = [
    'Explain the rule with highest lift (2.78).',
    'Why are inpatient visits so predictive in the decision tree?',
    'What characteristics define the 5 patient clusters?',
    'What are the limitations of these findings?',
  ];

  const handleSend = async (userText) => {
    const textToSend = userText || query;
    if (!textToSend.trim() || loading) return;

    const userMsg = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: textToSend }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.explanation,
            provider: data.provider,
            evidence: data.evidence,
          },
        ]);
      }
    } catch (e) {
      console.error('AI chat error:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-[#E4EAE3] shadow-clinova-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#35463B] flex items-center gap-2">
            <Bot className="w-5 h-5 text-[#456B56]" />
            <span>CLINOVA Intelligence Explanation Assistant</span>
          </h2>
          <p className="text-xs text-[#758278] mt-1">
            Grounded clinical interpretation constrained strictly to stored KDD outputs.
          </p>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#DFEAE0] text-[#456B56] text-xs font-semibold border border-[#CDDED0]">
          <ShieldCheck className="w-4 h-4" />
          <span>Grounded & PHI Safe</span>
        </div>
      </div>

      {/* Suggested Questions Bar */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(p)}
            className="px-3 py-1.5 rounded-xl bg-white border border-[#E4EAE3] hover:bg-[#F0F5EF] text-xs text-[#35463B] font-medium shadow-xs transition-all"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Stream */}
      <div className="bg-white rounded-3xl border border-[#E4EAE3] p-6 shadow-clinova-card min-h-[460px] flex flex-col justify-between space-y-4">
        <div className="space-y-4 overflow-y-auto max-h-[500px] pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex gap-3 text-xs leading-relaxed ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-[#DFEAE0] text-[#456B56] border border-[#CDDED0] flex items-center justify-center shrink-0 font-bold">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl p-4 rounded-2xl ${
                  m.role === 'user'
                    ? 'bg-[#456B56] text-white rounded-tr-none'
                    : 'bg-[#F7F9F6] text-[#35463B] border border-[#E4EAE3] rounded-tl-none space-y-2'
                }`}
              >
                <div className="whitespace-pre-line">{m.content}</div>

                {m.provider && (
                  <div className="pt-2 border-t border-[#E4EAE3] flex items-center justify-between text-[10px] text-[#758278]">
                    <span className="flex items-center gap-1 font-mono">
                      <Sparkles className="w-3 h-3 text-[#779985]" />
                      <span>{m.provider}</span>
                    </span>
                    <span>Evidence-Linked</span>
                  </div>
                )}
              </div>

              {m.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-[#E7F1ED] text-[#456B56] border border-[#D2E5DE] flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 text-xs text-[#758278] items-center animate-pulse">
              <div className="w-8 h-8 rounded-full bg-[#DFEAE0] text-[#456B56] flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <span>Synthesizing grounded explanation from active KDD models...</span>
            </div>
          )}
        </div>

        {/* Input Field */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="relative pt-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about the clinical rules, patient clusters, or model performance..."
            className="w-full pl-4 pr-12 py-3 bg-[#F7F9F6] border border-[#E4EAE3] rounded-2xl text-xs text-[#35463B] placeholder-[#96A499] focus:outline-none focus:ring-1 focus:ring-[#779985]"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-[#456B56] hover:bg-[#35463B] text-white disabled:opacity-40 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
