'use client';

import type { Currency, WeightUnit } from '@/lib/types';
import { convertPrice, formatPrice, formatChange } from '@/lib/constants';
import { UNIT_LABELS } from '@/lib/types';

interface PriceCardProps {
  title: string;
  priceUsdOz: number;
  prevCloseUsdOz: number;
  change: number;
  changePercent: number;
  currency: Currency;
  unit: WeightUnit;
  exchangeRate: number;
  estimated?: boolean;
  loading?: boolean;
}

export default function PriceCard({
  title,
  priceUsdOz,
  prevCloseUsdOz,
  change,
  changePercent,
  currency,
  unit,
  exchangeRate,
  estimated,
  loading,
}: PriceCardProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-20 mb-4" />
        <div className="h-8 bg-slate-700 rounded w-40 mb-2" />
        <div className="h-4 bg-slate-700 rounded w-24" />
      </div>
    );
  }

  const rate = currency === 'CNY' ? exchangeRate : 1;
  const displayPrice = convertPrice(priceUsdOz, unit, rate);
  const isUp = change >= 0;

  return (
    <div className={`rounded-xl bg-slate-800/50 border p-6 transition-all hover:bg-slate-800/70 ${
      isUp ? 'border-emerald-500/30' : 'border-rose-500/30'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-slate-400">{title}</h3>
        {estimated && (
          <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
            估算
          </span>
        )}
      </div>

      <div className="text-3xl font-bold text-white mb-1">
        {formatPrice(displayPrice, currency)}
        <span className="text-sm font-normal text-slate-400 ml-1">
          /{UNIT_LABELS[unit]}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 text-sm font-medium ${
          isUp ? 'text-emerald-400' : 'text-rose-400'
        }`}>
          <span>{isUp ? '▲' : '▼'}</span>
          <span>{formatChange(change, changePercent)}</span>
        </div>
        <span className="text-xs text-slate-600">
          {new Date().toLocaleDateString('zh-CN')}
        </span>
      </div>
    </div>
  );
}
