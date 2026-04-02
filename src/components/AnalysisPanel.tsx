'use client';

import type { AnalysisResult } from '@/lib/types';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  loading?: boolean;
}

const RECOMMENDATION_CONFIG = {
  buy: { label: '建议买入', color: 'emerald', emoji: '▲' },
  hold: { label: '建议观望', color: 'amber', emoji: '◆' },
  sell: { label: '建议卖出', color: 'rose', emoji: '▼' },
} as const;

export default function AnalysisPanel({ analysis, loading }: AnalysisPanelProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">投资分析</h3>
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-slate-700 rounded" />
          <div className="h-4 bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-700 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">投资分析</h3>
        <p className="text-slate-500 text-sm">等待数据加载...</p>
      </div>
    );
  }

  const config = RECOMMENDATION_CONFIG[analysis.recommendation];

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">投资分析</h3>

      {/* Main recommendation badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg mb-6 ${
        config.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
        config.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
        'bg-rose-500/20 text-rose-400'
      }`}>
        <span className="text-lg">{config.emoji}</span>
        <span className="text-lg font-bold">{config.label}</span>
      </div>

      {/* Sentiment gauge */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">新闻情绪</span>
          <span className="text-white font-medium">
            {analysis.sentimentLabel} ({analysis.sentimentScore.toFixed(0)}%)
          </span>
        </div>
        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              analysis.sentimentScore >= 65
                ? 'bg-emerald-500'
                : analysis.sentimentScore >= 40
                ? 'bg-amber-500'
                : 'bg-rose-500'
            }`}
            style={{ width: `${analysis.sentimentScore}%` }}
          />
        </div>
      </div>

      {/* Spread indicator */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">期现价差</span>
          <span className="text-white font-medium">
            {analysis.spreadPercent >= 0 ? '+' : ''}{analysis.spreadPercent.toFixed(2)}%
          </span>
        </div>
        <span className="text-xs text-slate-500">{analysis.spreadLabel}</span>
      </div>

      {/* Reasons */}
      <div className="space-y-2 mb-4">
        {analysis.reasons.map((reason, idx) => (
          <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
            <span className="text-amber-500 mt-0.5">•</span>
            <span>{reason}</span>
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-500 leading-relaxed">
          ⚠ 以上分析仅供参考，不构成投资建议。投资有风险，入市需谨慎。
        </p>
      </div>
    </div>
  );
}
