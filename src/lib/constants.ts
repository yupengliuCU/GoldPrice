// 1 troy ounce = 31.1035 grams
export const OZ_TO_GRAM = 31.1035;
export const OZ_TO_KG = 0.0311035;

// Convert price per oz to price per unit
export function convertPrice(
  pricePerOz: number,
  unit: 'oz' | 'g' | 'kg',
  exchangeRate: number = 1 // 1 for USD, CNY/USD rate for CNY
): number {
  let priceInCurrency = pricePerOz * exchangeRate;

  switch (unit) {
    case 'oz':
      return priceInCurrency;
    case 'g':
      return priceInCurrency / OZ_TO_GRAM;
    case 'kg':
      return priceInCurrency / OZ_TO_KG;
  }
}

// Format price with appropriate decimal places
export function formatPrice(price: number, currency: 'USD' | 'CNY'): string {
  const symbol = currency === 'USD' ? '$' : '¥';
  if (price >= 1000) {
    return `${symbol}${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `${symbol}${price.toFixed(2)}`;
}

// Format percentage change
export function formatChange(change: number, changePercent: number): string {
  const sign = change >= 0 ? '+' : '';
  return `${sign}${changePercent.toFixed(2)}%`;
}

// API refresh intervals (in ms)
export const GOLD_CACHE_DURATION = 15 * 60 * 1000;   // 15 minutes
export const NEWS_CACHE_DURATION = 10 * 60 * 1000;   // 10 minutes
export const EXCHANGE_CACHE_DURATION = 60 * 60 * 1000; // 60 minutes
export const CLIENT_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes
