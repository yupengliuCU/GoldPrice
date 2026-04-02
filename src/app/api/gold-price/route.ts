import { NextResponse } from 'next/server';
import { GOLD_CACHE_DURATION } from '@/lib/constants';

let cache: { data: unknown; timestamp: number } = { data: null, timestamp: 0 };

export async function GET() {
  try {
    if (cache.data && Date.now() - cache.timestamp < GOLD_CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    // Fetch spot from GoldAPI (real XAU/USD spot) and futures from Yahoo Finance (GC=F near-month)
    const [spotRes, futuresRes] = await Promise.all([
      fetch('https://www.goldapi.io/api/XAU/USD', {
        headers: {
          'x-access-token': process.env.GOLD_API_KEY || '',
          'Content-Type': 'application/json',
        },
      }),
      fetch('https://query1.finance.yahoo.com/v8/finance/chart/GC=F?interval=1d&range=1d', {
        headers: { 'User-Agent': 'Mozilla/5.0' },
      }),
    ]);

    // Parse spot (GoldAPI)
    if (!spotRes.ok) {
      throw new Error(`GoldAPI returned ${spotRes.status}`);
    }
    const spotData = await spotRes.json();

    // Parse futures (Yahoo Finance GC=F)
    let futuresResult: {
      price: number;
      prevClose: number;
      change: number;
      changePercent: number;
      estimated: boolean;
    };

    try {
      const yfData = await futuresRes.json();
      const meta = yfData.chart?.result?.[0]?.meta;
      if (meta?.regularMarketPrice) {
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose || meta.previousClose || price;
        const change = Number((price - prevClose).toFixed(2));
        const changePercent = prevClose ? Number(((change / prevClose) * 100).toFixed(2)) : 0;
        futuresResult = { price, prevClose, change, changePercent, estimated: false };
      } else {
        throw new Error('No futures data');
      }
    } catch {
      // Fallback: estimate from spot
      futuresResult = {
        price: spotData.price * 1.008,
        prevClose: spotData.prev_close_price * 1.008,
        change: Number((spotData.ch * 1.008).toFixed(2)),
        changePercent: spotData.chp,
        estimated: true,
      };
    }

    const result = {
      spot: {
        price: spotData.price,
        prevClose: spotData.prev_close_price,
        change: spotData.ch,
        changePercent: spotData.chp,
        timestamp: Date.now(),
      },
      futures: {
        ...futuresResult,
        timestamp: Date.now(),
      },
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
