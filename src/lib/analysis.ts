import type { NewsArticle, AnalysisResult, SignalDetail } from './types';

// ─── Signal 1: Price Momentum (RSI + Moving Average) ─────────────────────────

function calculateRSI(prices: number[], period = 14): number {
  if (prices.length < period + 1) return 50; // neutral if not enough data

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) gains += change;
    else losses += Math.abs(change);
  }

  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period);
  return 100 - (100 / (1 + rs));
}

function calculateMA(prices: number[], period: number): number {
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / slice.length;
}

function getMomentumSignal(prices: number[]): SignalDetail {
  const rsi = calculateRSI(prices);
  const currentPrice = prices[prices.length - 1];
  const ma5 = calculateMA(prices, Math.min(5, prices.length));
  const ma20 = calculateMA(prices, Math.min(20, prices.length));

  // RSI score: RSI > 70 = overbought (bearish), RSI < 30 = oversold (bullish)
  // We invert for buy signal: low RSI = high buy score
  let rsiScore: number;
  if (rsi >= 70) rsiScore = 30;       // overbought → bearish
  else if (rsi <= 30) rsiScore = 70;  // oversold → bullish
  else rsiScore = 50;                  // neutral

  // MA crossover: price above MA20 = bullish trend
  let maScore: number;
  if (currentPrice > ma20 * 1.02) maScore = 70;      // clearly above
  else if (currentPrice < ma20 * 0.98) maScore = 30;  // clearly below
  else maScore = 50;

  // MA5 vs MA20 crossover
  let crossScore: number;
  if (ma5 > ma20) crossScore = 65;
  else if (ma5 < ma20) crossScore = 35;
  else crossScore = 50;

  const score = Math.round(rsiScore * 0.4 + maScore * 0.3 + crossScore * 0.3);

  let label: string;
  if (score >= 65) label = '看涨';
  else if (score >= 40) label = '中性';
  else label = '看跌';

  return {
    name: '价格动量',
    score,
    weight: 0.35,
    label,
    description: `RSI(14)=${rsi.toFixed(1)} · 价格${currentPrice > ma20 ? '高于' : '低于'}MA20 · MA5${ma5 > ma20 ? '>' : '<'}MA20`,
  };
}

// ─── Signal 2: News Sentiment (Regex pattern matching) ───────────────────────

// Patterns with context — match verb forms, tenses, variations
const BULLISH_PATTERNS = [
  /gold\s+(?:price\s+)?(?:rises?|surges?|jumps?|gains?|soars?|rall(?:y|ies|ied)|climbs?|advances?|pushes?\s+(?:up|higher))/gi,
  /(?:prices?|gold)\s+(?:hit|reach|set)\s+(?:new\s+)?(?:record|high|all[- ]time)/gi,
  /safe[- ]haven\s+(?:demand|buying|asset|appeal)/gi,
  /(?:central\s+bank|央行)\s*(?:buy|bought|purchase|增持|买入)/gi,
  /(?:bullish|看涨|利好|避险需求|需求增加|金价上涨|黄金上涨|金价走高)/gi,
  /geopolitical\s+(?:risk|tension|uncertaint)/gi,
  /inflation\s+(?:hedge|concern|fear|worry|pressure)/gi,
  /(?:weak|weaken|soften)\w*\s+(?:dollar|usd|美元)/gi,
];

const BEARISH_PATTERNS = [
  /gold\s+(?:price\s+)?(?:drops?|falls?|declines?|slumps?|tumbles?|plunges?|sinks?|dips?|slides?|loses?|retreats?|eases?)/gi,
  /(?:prices?|gold)\s+(?:under\s+pressure|lose|lost)\s+ground/gi,
  /(?:profit[- ]taking|sell[- ]?off|selloff|selling\s+pressure)/gi,
  /(?:rate\s+hike|interest\s+rate\s+(?:rise|increase)|hawkish)/gi,
  /(?:strong|strength|strengthen)\w*\s+(?:dollar|usd|美元)/gi,
  /(?:bearish|看跌|利空|金价下跌|黄金下跌|金价走低|抛售)/gi,
  /(?:fed|federal\s+reserve)\s+(?:hawkish|tighten|rate)/gi,
  /(?:bond\s+yield|treasury\s+yield)\s+(?:rise|surge|jump|climb)/gi,
];

function calculateNewsSentiment(articles: NewsArticle[]): SignalDetail {
  // Weight recent articles more heavily
  const now = Date.now();
  let weightedBullish = 0;
  let weightedBearish = 0;
  let totalWeight = 0;

  for (const article of articles) {
    const hoursAgo = (now - new Date(article.publishedAt).getTime()) / 3600000;
    // Decay: articles from 0h ago = weight 1.0, 24h ago = 0.5, 48h+ = 0.25
    const timeWeight = Math.max(0.25, 1 - hoursAgo / 48);
    const text = `${article.title} ${article.description}`.toLowerCase();

    let bullCount = 0;
    let bearCount = 0;

    for (const pattern of BULLISH_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = text.match(pattern);
      if (matches) bullCount += matches.length;
    }

    for (const pattern of BEARISH_PATTERNS) {
      pattern.lastIndex = 0;
      const matches = text.match(pattern);
      if (matches) bearCount += matches.length;
    }

    weightedBullish += bullCount * timeWeight;
    weightedBearish += bearCount * timeWeight;
    totalWeight += timeWeight;
  }

  // Normalize to 0-100 scale
  const netSentiment = totalWeight > 0 ? (weightedBullish - weightedBearish) / totalWeight : 0;
  const score = Math.max(0, Math.min(100, Math.round(50 + netSentiment * 15)));

  let label: string;
  if (score >= 65) label = '偏多';
  else if (score >= 40) label = '中性';
  else label = '偏空';

  const total = Math.round(weightedBullish + weightedBearish);
  return {
    name: '新闻情绪',
    score,
    weight: 0.30,
    label,
    description: `看涨信号 ${Math.round(weightedBullish)} · 看跌信号 ${Math.round(weightedBearish)} · 共分析 ${articles.length} 篇`,
  };
}

// ─── Signal 3: Futures Spread ────────────────────────────────────────────────

function getSpreadSignal(spotPrice: number, futuresPrice: number): SignalDetail {
  const spreadPct = ((futuresPrice - spotPrice) / spotPrice) * 100;

  let score: number;
  let label: string;

  if (spreadPct > 3) {
    score = 75;
    label = '高升水 (强看涨)';
  } else if (spreadPct > 1.5) {
    score = 65;
    label = '升水 (偏看涨)';
  } else if (spreadPct >= 0) {
    score = 50;
    label = '正常升水 (中性)';
  } else if (spreadPct >= -1) {
    score = 35;
    label = '轻度贴水 (偏看跌)';
  } else {
    score = 25;
    label = '深度贴水 (强看跌)';
  }

  return {
    name: '期现价差',
    score,
    weight: 0.20,
    label,
    description: `价差 ${spreadPct >= 0 ? '+' : ''}${spreadPct.toFixed(2)}%`,
  };
}

// ─── Signal 4: Volatility ────────────────────────────────────────────────────

function getVolatilitySignal(prices: number[]): SignalDetail {
  if (prices.length < 5) {
    return { name: '波动率', score: 50, weight: 0.15, label: '数据不足', description: '' };
  }

  // Calculate recent daily returns volatility
  const returns = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const recentReturns = returns.slice(-10);
  const mean = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
  const variance = recentReturns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / recentReturns.length;
  const volatility = Math.sqrt(variance) * 100; // as percentage

  // High volatility = uncertain, suggest caution (hold)
  // Low volatility with uptrend = stable bull, good to buy
  // Low volatility with downtrend = stable bear, be careful
  const lastReturn = returns[returns.length - 1] || 0;

  let score: number;
  let label: string;

  if (volatility > 3) {
    score = 40; // high vol = caution
    label = '高波动 (谨慎)';
  } else if (volatility > 1.5) {
    score = lastReturn > 0 ? 55 : 45;
    label = '中等波动';
  } else {
    score = lastReturn > 0 ? 65 : 35;
    label = lastReturn > 0 ? '低波动上行' : '低波动下行';
  }

  return {
    name: '波动率',
    score,
    weight: 0.15,
    label,
    description: `日波动 ${volatility.toFixed(2)}% · 趋势${lastReturn >= 0 ? '上行' : '下行'}`,
  };
}

// ─── Composite Analysis ──────────────────────────────────────────────────────

export function analyze(
  articles: NewsArticle[],
  spotPrice: number,
  futuresPrice: number,
  historicalPrices: number[] = [],
): AnalysisResult {
  const signals: SignalDetail[] = [
    getMomentumSignal(historicalPrices.length > 0 ? historicalPrices : [spotPrice]),
    calculateNewsSentiment(articles),
    getSpreadSignal(spotPrice, futuresPrice),
    getVolatilitySignal(historicalPrices.length > 0 ? historicalPrices : [spotPrice]),
  ];

  // Weighted composite
  const compositeScore = Math.round(
    signals.reduce((sum, s) => sum + s.score * s.weight, 0)
  );

  let recommendation: 'buy' | 'hold' | 'sell';
  const reasons: string[] = [];

  if (compositeScore >= 62) {
    recommendation = 'buy';
  } else if (compositeScore >= 42) {
    recommendation = 'hold';
  } else {
    recommendation = 'sell';
  }

  // Generate reasons from each signal
  for (const signal of signals) {
    if (signal.score >= 65) {
      reasons.push(`${signal.name}: ${signal.label} (${signal.description})`);
    } else if (signal.score <= 35) {
      reasons.push(`${signal.name}: ${signal.label} (${signal.description})`);
    }
  }

  if (reasons.length === 0) {
    reasons.push('各项指标均处于中性区间，建议观望');
  }

  return {
    recommendation,
    compositeScore,
    signals,
    reasons,
  };
}
