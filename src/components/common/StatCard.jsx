import React from 'react';

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'sage',
  accentColor = 'sage',
}) {
  const accentStyles = {
    sage: 'bg-[#DFEAE0] text-[#456B56]',
    teal: 'bg-[#E7F1ED] text-[#456B56]',
    beige: 'bg-[#F4EBDD] text-[#725B3E]',
    peach: 'bg-[#F3E5DC] text-[#8C533D]',
    lavender: 'bg-[#EEEAF5] text-[#5D4A77]',
  };

  const currentAccent = accentStyles[accentColor] || accentStyles.sage;

  return (
    <div className="bg-white rounded-2xl border border-[#E4EAE3] p-5 shadow-[0_2px_8px_-2px_rgba(69,107,86,0.05)] hover:shadow-[0_4px_16px_-4px_rgba(69,107,86,0.08)] transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[#758278] uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-[#35463B] tracking-tight">{value}</p>
        </div>
        {Icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${currentAccent}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between pt-3 border-t border-[#F0F5EF] text-xs">
        <span className="text-[#758278]">{subtitle}</span>
        {badgeText && (
          <span className="font-medium text-[#456B56] bg-[#DFEAE0] px-2 py-0.5 rounded-full text-[11px]">
            {badgeText}
          </span>
        )}
      </div>
    </div>
  );
}

