import type { NewsArticle, AnalysisResult } from './types';

// Phrases specific to gold market sentiment (more precise than single words)
const BULLISH_PHRASES = [
  // Chinese
  '金价上涨', '金价走高', '黄金上涨', '黄金走高', '增持黄金', '央行买入',
  '避险需求', '需求增加', '创新高', '突破新高', '看涨', '利好黄金',
  // English - use multi-word phrases to avoid false positives
  'gold rises', 'gold surges', 'gold jumps', 'gold gains', 'gold soars',
  'gold rallies', 'gold climbs', 'prices rise', 'prices surge',
  'safe haven', 'record high', 'all-time high', 'bullish',
  'buying gold', 'gold demand', 'central bank buying',
  'geopolitical risk', 'geopolitical tensions', 'inflation hedge',
];

const BEARISH_PHRASES = [
  // Chinese
  '金价下跌', '金价走低', '黄金下跌', '黄金走低', '抛售黄金', '减持黄金',
  '利率上升', '美元走强', '看跌', '利空黄金',
  // English
  'gold drops', 'gold falls', 'gold declines', 'gold slumps', 'gold tumbles',
  'gold plunges', 'gold sinks', 'gold dips', 'prices drop', 'prices fall',
  'gold down', 'bearish', 'sell-off', 'selloff',
  'rate hike', 'strong dollar', 'dollar strength',
  'profit taking', 'profit-taking',
];

// Single keywords that are strong signals on their own
const BULLISH_KEYWORDS = ['surge', 'soar', 'rally', 'bullish', 'record'];
const BEARISH_KEYWORDS = ['plunge', 'crash', 'bearish', 'slump', 'tumble'];

function calculateSentiment(articles: NewsArticle[]): number {
  const text = articles
    .map((a) => `${a.title} ${a.description}`)
    .join(' ')
    .toLowerCase();

  let positiveScore = 0;
  let negativeScore = 0;

  // Multi-word phrases (higher weight: +8 each)
  for (const phrase of BULLISH_PHRASES) {
    const regex = new RegExp(phrase.toLowerCase(), 'g');
    const matches = text.match(regex);
    if (matches) positiveScore += matches.length * 8;
  }

  for (const phrase of BEARISH_PHRASES) {
    const regex = new RegExp(phrase.toLowerCase(), 'g');
    const matches = text.match(regex);
    if (matches) negativeScore += matches.length * 8;
  }

  // Strong single keywords with word boundaries (lower weight: +4 each)
  for (const keyword of BULLISH_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) positiveScore += matches.length * 4;
  }

  for (const keyword of BEARISH_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) negativeScore += matches.length * 4;
  }

  // Normalize: score from 0-100, starting at 50
  const netScore = positiveScore - negativeScore;
  // Each 10 points of net score moves the gauge by 5%
  const score = 50 + netScore * 0.5;
  return Math.max(0, Math.min(100, Math.round(score)));
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
