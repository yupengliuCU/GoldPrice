export type Currency = 'USD' | 'CNY';
export type WeightUnit = 'oz' | 'g' | 'kg';

export interface GoldPrice {
  price: number;           // USD per troy oz
  prevClose: number;       // previous close price
  change: number;          // absolute change
  changePercent: number;   // percentage change
  timestamp: number;
}

export interface ExchangeRate {
  rate: number;  // e.g. 1 USD = X CNY
  timestamp: number;
}

export interface NewsArticle {
  title: string;
  description: string;
  url: string;
  image: string | null;
  source: string;
  publishedAt: string;
}

export interface SignalDetail {
  name: string;
  score: number;    // 0-100
  weight: number;   // 0-1
  label: string;
  description: string;
}

export interface AnalysisResult {
  recommendation: 'buy' | 'hold' | 'sell';
  compositeScore: number;
  signals: SignalDetail[];
  reasons: string[];
}

export const UNIT_LABELS: Record<WeightUnit, string> = {
  oz: '盎司',
  g: '克',
  kg: '千克',
};
