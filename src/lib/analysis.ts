import type { NewsArticle, AnalysisResult } from './types';

const BULLISH_KEYWORDS = [
  '上涨', '走高', '增持', '避险', '需求增加', '央行买入', '创新高', '突破',
  '看涨', '利好', '买入', '金价涨', '黄金涨',
  'bullish', 'rally', 'surge', 'safe haven', 'demand', 'record high',
  'all-time high', 'buying', 'soar', 'jump', 'gain',
];

const BEARISH_KEYWORDS = [
  '下跌', '走低', '抛售', '减持', '利率上升', '美元走强', '回落', '下滑',
  '看跌', '利空', '卖出', '金价跌', '黄金跌',
  'bearish', 'drop', 'sell-off', 'rate hike', 'strong dollar',
  'decline', 'fall', 'plunge', 'slump', 'tumble',
];

function calculateSentiment(articles: NewsArticle[]): number {
  const text = articles
    .map((a) => `${a.title} ${a.description}`)
    .join(' ')
    .toLowerCase();

  let positiveCount = 0;
  let negativeCount = 0;

  for (const keyword of BULLISH_KEYWORDS) {
    const regex = new RegExp(keyword.toLowerCase(), 'g');
    const matches = text.match(regex);
    if (matches) positiveCount += matches.length;
  }

  for (const keyword of BEARISH_KEYWORDS) {
    const regex = new RegExp(keyword.toLowerCase(), 'g');
    const matches = text.match(regex);
    if (matches) negativeCount += matches.length;
  }

  // Score from 0-100, starting at 50 (neutral)
  const score = 50 + (positiveCount - negativeCount) * 5;
  return Math.max(0, Math.min(100, score));
}

function getSpreadSignal(spreadPercent: number): { score: number; label: string } {
  if (spreadPercent > 2) {
    return { score: 70, label: '高升水 (看涨)' };
  } else if (spreadPercent >= 0) {
    return { score: 50, label: '正常升水 (中性)' };
  } else {
    return { score: 30, label: '贴水 (看跌)' };
  }
}

export function analyze(
  articles: NewsArticle[],
  spotPrice: number,
  futuresPrice: number
): AnalysisResult {
  const sentimentScore = calculateSentiment(articles);
  const spreadPercent = ((futuresPrice - spotPrice) / spotPrice) * 100;
  const spreadSignal = getSpreadSignal(spreadPercent);

  const compositeScore = sentimentScore * 0.6 + spreadSignal.score * 0.4;

  let recommendation: 'buy' | 'hold' | 'sell';
  let reasons: string[] = [];

  if (compositeScore >= 65) {
    recommendation = 'buy';
    reasons.push('综合评分偏高，市场情绪积极');
  } else if (compositeScore >= 40) {
    recommendation = 'hold';
    reasons.push('综合评分中性，建议观望等待更明确信号');
  } else {
    recommendation = 'sell';
    reasons.push('综合评分偏低，市场情绪消极');
  }

  if (sentimentScore >= 65) {
    reasons.push('新闻情绪偏多，市场看涨信号较强');
  } else if (sentimentScore <= 35) {
    reasons.push('新闻情绪偏空，市场看跌信号较强');
  }

  if (spreadPercent > 2) {
    reasons.push(`期现价差 ${spreadPercent.toFixed(2)}%，期货溢价较高`);
  } else if (spreadPercent < 0) {
    reasons.push(`期现价差 ${spreadPercent.toFixed(2)}%，出现贴水`);
  }

  let sentimentLabel: string;
  if (sentimentScore >= 65) sentimentLabel = '偏多';
  else if (sentimentScore >= 40) sentimentLabel = '中性';
  else sentimentLabel = '偏空';

  return {
    recommendation,
    compositeScore,
    sentimentScore,
    spreadScore: spreadSignal.score,
    spreadPercent,
    sentimentLabel,
    spreadLabel: spreadSignal.label,
    reasons,
  };
}
