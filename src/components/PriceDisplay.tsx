// src/components/PriceDisplay.tsx — Prix barré + % réduction
import React from 'react';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PriceDisplay({ price, originalPrice, size = 'md', className = '' }: PriceDisplayProps) {
  const hasDiscount = originalPrice && originalPrice > price;
  const discountPct = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const mainSize = size === 'lg' ? 'text-[38px]' : size === 'sm' ? 'text-base' : 'text-2xl';
  const subSize  = size === 'lg' ? 'text-[20px]' : size === 'sm' ? 'text-[10px]' : 'text-sm';
  const oldSize  = size === 'lg' ? 'text-base'   : size === 'sm' ? 'text-[9px]'  : 'text-[11px]';

  return (
    <div className={`flex flex-wrap items-baseline gap-2 ${className}`}>
      {/* Prix actuel */}
      <span className={`price-brumerie font-black leading-none ${mainSize}`}
        style={{ fontFamily: "'Syne',sans-serif", letterSpacing: '-0.04em' }}>
        {price.toLocaleString('fr-FR')}
        <span className={`text-slate-400 font-bold ml-1 ${subSize}`}
          style={{ fontFamily: "'DM Sans',sans-serif" }}>FCFA</span>
      </span>

      {hasDiscount && (
        <div className="flex items-center gap-1.5">
          {/* Ancien prix barré */}
          <span className={`text-slate-400 line-through font-bold ${oldSize}`}>
            {originalPrice!.toLocaleString('fr-FR')}
          </span>
          {/* Badge % */}
          <span className={`bg-red-500 text-white font-black rounded-lg px-1.5 py-0.5 ${oldSize}`}>
            -{discountPct}%
          </span>
        </div>
      )}
    </div>
  );
}
