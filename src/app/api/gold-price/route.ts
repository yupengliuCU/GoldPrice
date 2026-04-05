import { NextResponse } from 'next/server';
import { GOLD_CACHE_DURATION } from '@/lib/constants';

let cache: { data: unknown; timestamp: number } = { data: null, timestamp: 0 };

function parseYahooMeta(json: unknown) {
  const data = json as Record<string, unknown>;
  const chart = data.chart as Record<string, unknown> | undefined;
  const results = chart?.result as Record<string, unknown>[] | undefined;
  const meta = results?.[0]?.meta as Record<string, number> | undefined;
  if (!meta?.regularMarketPrice) return null;

  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose || meta.previousClose || price;
  const change = Number((price - prevClose).toFixed(2));
  const changePercent = prevClose ? Number(((change / prevClose) * 100).toFixed(2)) : 0;
  const marketTime = meta.regularMarketTime || 0;

  return { price, prevClose, change, changePercent, marketTime };
}

export async function GET() {
  try {
    if (cache.data && Date.now() - cache.timestamp < GOLD_CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    // Both spot (GC=F near-month) and futures (GCQ26 far-month) from Yahoo Finance
    // Yahoo Finance works 24/7, returns last known price even on weekends
    const [spotRes, futuresRes] = await Promise.all([
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=5d', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/GCQ26.CMX?interval=1d&range=5d', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }),
    ]);

    const spotData = parseYahooMeta(await spotRes.json());
    if (!spotData) {
      throw new Error('Failed to fetch spot price from Yahoo Finance');
    }

    const futuresData = parseYahooMeta(await futuresRes.json());

    // Detect if market is closed (last trade > 3 hours ago on a weekday, or it's weekend)
    const now = Date.now();
    const lastTradeAge = spotData.marketTime ? (now / 1000 - spotData.marketTime) : 0;
    const isWeekend = [0, 6].includes(new Date().getUTCDay());
    const marketClosed = isWeekend || lastTradeAge > 10800; // 3 hours

    const result = {
      spot: {
        price: spotData.price,
        prevClose: spotData.prevClose,
        change: spotData.change,
        changePercent: spotData.changePercent,
        timestamp: Date.now(),
      },
      futures: futuresData
        ? {
            price: futuresData.price,
            prevClose: futuresData.prevClose,
            change: futuresData.change,
            changePercent: futuresData.changePercent,
            estimated: false,
            timestamp: Date.now(),
          }
        : {
            price: spotData.price * 1.008,
            prevClose: spotData.prevClose * 1.008,
            change: Number((spotData.change * 1.008).toFixed(2)),
            changePercent: spotData.changePercent,
            estimated: true,
            timestamp: Date.now(),
          },
      marketClosed,
    };

    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error('Gold price API error:', error);
    if (cache.data) {
      return NextResponse.json(cache.data);
    }
    return NextResponse.json({ error: 'Failed to fetch gold price' }, { status: 500 });
  }
}
