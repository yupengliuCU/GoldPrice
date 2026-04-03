'use client';

import type { AnalysisResult, SignalDetail } from '@/lib/types';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  loading?: boolean;
}

const RECOMMENDATION_CONFIG = {
  buy: { label: '建议买入', color: 'emerald', emoji: '▲' },
  hold: { label: '建议观望', color: 'amber', emoji: '◆' },
  sell: { label: '建议卖出', color: 'rose', emoji: '▼' },
} as const;

function SignalBar({ signal }: { signal: SignalDetail }) {
  const barColor =
    signal.score >= 65 ? 'bg-emerald-500' :
    signal.score >= 40 ? 'bg-amber-500' :
    'bg-rose-500';

  const textColor =
    signal.score >= 65 ? 'text-emerald-400' :
    signal.score >= 40 ? 'text-amber-400' :
    'text-rose-400';

  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-slate-400">
          {signal.name}
          <span className="text-slate-600 ml-1">({(signal.weight * 100).toFixed(0)}%)</span>
        </span>
        <span className={`font-medium ${textColor}`}>
          {signal.label}
        </span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${signal.score}%` }}
        />
      </div>
      {signal.description && (
        <p className="text-xs text-slate-600 mt-0.5">{signal.description}</p>
      )}
    </div>
  );
}

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
      <div className="flex items-center justify-between mb-6">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
          config.color === 'emerald' ? 'bg-emerald-500/20 text-emerald-400' :
          config.color === 'amber' ? 'bg-amber-500/20 text-amber-400' :
          'bg-rose-500/20 text-rose-400'
        }`}>
          <span className="text-lg">{config.emoji}</span>
          <span className="text-lg font-bold">{config.label}</span>
        </div>
        <span className="text-2xl font-bold text-white">{analysis.compositeScore}</span>
      </div>

      {/* Signal bars */}
      <div className="mb-4">
        {analysis.signals.map((signal, idx) => (
          <SignalBar key={idx} signal={signal} />
        ))}
      </div>

      {/* Key reasons */}
      {analysis.reasons.length > 0 && (
        <div className="space-y-1.5 mb-4 pt-3 border-t border-slate-700">
          {analysis.reasons.map((reason, idx) => (
            <div key={idx} className="flex items-start gap-2 text-sm text-slate-300">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>{reason}</span>
            </div>
          ))}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 pt-3 border-t border-slate-700">
        <p className="text-xs text-slate-500 leading-relaxed">
          分析基于 RSI·均线交叉·新闻情绪·期现价差·波动率五维模型。仅供参考，不构成投资建议。
        </p>
      </div>
    </div>
  );
}
