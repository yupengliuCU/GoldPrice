'use client';

import { useState } from 'react';
import {
  AreaChart,
  Area,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { Currency, WeightUnit } from '@/lib/types';
import { convertPrice, formatPrice } from '@/lib/constants';

interface ChartDataPoint {
  date: string;
  spot: number;           // USD/oz
  futures: number;        // USD/oz
  fairSpreadPct: number;  // fair value spread %
}

interface PriceChartProps {
  data: ChartDataPoint[];
  currency: Currency;
  unit: WeightUnit;
  exchangeRate: number;
  loading?: boolean;
}

type TimeRange = '7d' | '30d' | '90d';

export default function PriceChart({
  data,
  currency,
  unit,
  exchangeRate,
  loading,
}: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  if (loading) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <div className="h-4 bg-slate-700 rounded w-32 mb-4 animate-pulse" />
        <div className="h-64 bg-slate-700/30 rounded animate-pulse" />
      </div>
    );
  }

  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
  const filteredData = data.slice(-days);
  const rate = currency === 'CNY' ? exchangeRate : 1;

  const chartData = filteredData.map((d) => {
    const spot = convertPrice(d.spot, unit, rate);
    const futures = convertPrice(d.futures, unit, rate);
    const spread = futures - spot;
    const spreadPct = d.spot ? ((d.futures - d.spot) / d.spot) * 100 : 0;
    return {
      date: d.date,
      spot: Number(spot.toFixed(2)),
      futures: Number(futures.toFixed(2)),
      spread: Number(spread.toFixed(2)),
      spreadPct: Number(spreadPct.toFixed(2)),
      fairSpreadPct: d.fairSpreadPct,
    };
  });

  const symbol = currency === 'USD' ? '$' : '¥';

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">价格走势</h3>
        <div className="flex bg-slate-700 rounded-lg p-0.5">
          {(['7d', '30d', '90d'] as TimeRange[]).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm rounded-md transition-all ${
                timeRange === range
                  ? 'bg-amber-500 text-slate-900 font-medium'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {range === '7d' ? '7天' : range === '30d' ? '30天' : '90天'}
            </button>
          ))}
        </div>
      </div>

      {/* Price chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="spotGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="futuresGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis
              dataKey="date"
              stroke="#94A3B8"
              fontSize={12}
              tickFormatter={(v) => {
                const d = new Date(v);
                return `${d.getMonth() + 1}/${d.getDate()}`;
              }}
            />
            <YAxis
              stroke="#94A3B8"
              fontSize={12}
              tickFormatter={(v) => `${symbol}${v.toLocaleString()}`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1E293B',
                border: '1px solid #475569',
                borderRadius: '8px',
                color: '#F1F5F9',
              }}
              formatter={(value, name) => [
                formatPrice(Number(value), currency),
                name === 'spot' ? '现货' : '期货',
              ]}
              labelFormatter={(label) => {
                const d = new Date(label);
                return d.toLocaleDateString('zh-CN');
              }}
            />
            <Area
              type="monotone"
              dataKey="spot"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#spotGradient)"
              name="spot"
            />
            <Area
              type="monotone"
              dataKey="futures"
              stroke="#60A5FA"
              strokeWidth={2}
              fill="url(#futuresGradient)"
              name="futures"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex gap-6 mt-3 justify-center text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-slate-400">现货</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-400" />
          <span className="text-slate-400">期货</span>
        </div>
      </div>

      {/* Spread chart */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <h4 className="text-sm font-medium text-slate-400 mb-3">期现价差 (期货 - 现货)</h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="date"
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(v) => {
                  const d = new Date(v);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                }}
              />
              <YAxis
                stroke="#94A3B8"
                fontSize={11}
                tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(1)}%`}
                domain={['auto', 'auto']}
              />
              <ReferenceLine y={0} stroke="#64748B" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1E293B',
                  border: '1px solid #475569',
                  borderRadius: '8px',
                  color: '#F1F5F9',
                  fontSize: '13px',
                }}
                formatter={(value, name) => {
                  const v = Number(value);
                  if (name === 'fairSpreadPct') {
                    return [`${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, '公平价差 (Fair Value)'];
                  }
                  return [`${v >= 0 ? '+' : ''}${v.toFixed(2)}%`, '实际价差'];
                }}
                labelFormatter={(label) => {
                  const d = new Date(label);
                  return d.toLocaleDateString('zh-CN');
                }}
              />
              <Bar
                dataKey="spreadPct"
                name="spreadPct"
                radius={[2, 2, 0, 0]}
                fill="#8B5CF6"
                maxBarSize={12}
              />
              <Line
                type="monotone"
                dataKey="fairSpreadPct"
                name="fairSpreadPct"
                stroke="#10B981"
                strokeWidth={2}
                strokeDasharray="6 3"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-6 mt-3 justify-center text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-slate-400">实际价差</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0 border-t-2 border-dashed border-emerald-500" />
            <span className="text-slate-400">公平价差 (Cost of Carry)</span>
          </div>
        </div>
        <p className="text-xs text-slate-600 mt-2 text-center">
          公平价差 = (无风险利率 + 仓储成本) x 距到期时间 · 数据来源: 13周美国国债利率
        </p>
      </div>
    </div>
  );
}
