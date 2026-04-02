'use client';

import { useState } from 'react';
import type { Currency, WeightUnit } from '@/lib/types';
import { useGoldData } from '@/hooks/useGoldData';
import PriceCard from '@/components/PriceCard';
import CurrencyUnitToggle from '@/components/CurrencyUnitToggle';
import PriceChart from '@/components/PriceChart';
import NewsPanel from '@/components/NewsPanel';
import AnalysisPanel from '@/components/AnalysisPanel';

export default function Home() {
  const [currency, setCurrency] = useState<Currency>('CNY');
  const [unit, setUnit] = useState<WeightUnit>('g');
  const data = useGoldData();

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                <span className="text-slate-900 font-bold text-sm">Au</span>
              </div>
              <h1 className="text-xl font-bold text-white">黄金价格追踪器</h1>
              {data.lastUpdated && (
                <span className="text-xs text-slate-500 hidden sm:inline">
                  更新于 {data.lastUpdated.toLocaleTimeString('zh-CN')}
                </span>
              )}
            </div>
            <CurrencyUnitToggle
              currency={currency}
              unit={unit}
              onCurrencyChange={setCurrency}
              onUnitChange={setUnit}
            />
          </div>
        </div>
      </header>

      {/* Error banner */}
      {data.error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-3 text-sm text-rose-400">
            {data.error}
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Price cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PriceCard
            title="现货价格 (Spot)"
            priceUsdOz={data.spot?.price || 0}
            prevCloseUsdOz={data.spot?.prevClose || 0}
            change={data.spot?.change || 0}
            changePercent={data.spot?.changePercent || 0}
            currency={currency}
            unit={unit}
            exchangeRate={data.exchangeRate}
            loading={data.loading}
          />
          <PriceCard
            title="期货价格 (Futures)"
            priceUsdOz={data.futures?.price || 0}
            prevCloseUsdOz={data.futures?.prevClose || 0}
            change={data.futures?.change || 0}
            changePercent={data.futures?.changePercent || 0}
            currency={currency}
            unit={unit}
            exchangeRate={data.exchangeRate}
            estimated={data.futures?.estimated}
            loading={data.loading}
          />
        </div>

        {/* Price chart */}
        <PriceChart
          data={data.historicalData}
          currency={currency}
          unit={unit}
          exchangeRate={data.exchangeRate}
          loading={data.loading}
        />

        {/* News + Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <NewsPanel articles={data.news} loading={data.loading} />
          <AnalysisPanel analysis={data.analysis} loading={data.loading} />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-xs text-slate-600 text-center">
            数据来源: GoldAPI · Yahoo Finance · GNews · ExchangeRate-API · 仅供参考，不构成投资建议
          </p>
        </div>
      </footer>
    </div>
  );
}
