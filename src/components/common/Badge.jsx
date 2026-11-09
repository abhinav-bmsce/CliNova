import React from 'react';

const VARIANTS = {
  sage: 'bg-[#DFEAE0] text-[#456B56] border-[#CDDED0]',
  teal: 'bg-[#E7F1ED] text-[#456B56] border-[#D2E5DE]',
  beige: 'bg-[#F4EBDD] text-[#725B3E] border-[#EBDCC7]',
  peach: 'bg-[#F3E5DC] text-[#8C533D] border-[#EBD1C3]',
  lavender: 'bg-[#EEEAF5] text-[#5D4A77] border-[#E0D8ED]',
  neutral: 'bg-[#F0F5EF] text-[#758278] border-[#E4EAE3]',
};

export default function Badge({ children, variant = 'sage', size = 'sm', className = '' }) {
  const variantClass = VARIANTS[variant] || VARIANTS.sage;
  const sizeClass = size === 'xs' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${variantClass} ${sizeClass} ${className}`}
    >
      {children}
    </span>
  );
}

