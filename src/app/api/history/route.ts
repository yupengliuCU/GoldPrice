import { NextResponse } from 'next/server';

// Cache historical data for 30 minutes
let cache: { data: unknown; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_DURATION = 30 * 60 * 1000;

// Storage + insurance cost for gold (~0.25% annually)
const STORAGE_COST = 0.0025;

// COMEX gold futures expire on the 3rd last business day of the contract month.
// We approximate as the 27th of that month.
const MONTH_MAP: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
  Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

function parseExpiryFromShortName(shortName: string): Date | null {
  // e.g. "Gold Jun 26" → June 2026
  const match = shortName.match(/(\w{3})\s+(\d{2})$/);
  if (!match) return null;
  const month = MONTH_MAP[match[1]];
  if (month === undefined) return null;
  const year = 2000 + parseInt(match[2]);
  // Approximate expiry: 27th of the contract month
  return new Date(year, month, 27);
}

async function fetchYahooChart(ticker: string, range = '3mo') {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=${range}`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result?.timestamp) return null;
  return {
    timestamps: result.timestamp as number[],
    closes: result.indicators.quote[0].close as (number | null)[],
    meta: result.meta as Record<string, unknown>,
  };
}

export async function GET() {
  try {
    if (cache.data && Date.now() - cache.timestamp < CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    // Fetch near-month, far-month, and risk-free rate in parallel
    const [nearMonth, farMonth, tbill] = await Promise.all([
      fetchYahooChart('GC=F'),
      fetchYahooChart('GCQ26.CMX'),
      fetchYahooChart('%5EIRX', '3mo'), // 13-week T-bill rate
    ]);

    if (!nearMonth) {
      throw new Error('No historical data from Yahoo Finance');
    }

    // Auto-detect expiry from GC=F shortName (e.g. "Gold Jun 26")
    const shortName = (nearMonth.meta?.shortName as string) || '';
    const futuresExpiry = parseExpiryFromShortName(shortName);
    // Fallback: 3 months from now
    const expiryDate = futuresExpiry || new Date(Date.now() + 90 * 86400000);

    // Build date-indexed maps
    const farMonthMap = new Map<string, number>();
    if (farMonth) {
      for (let i = 0; i < farMonth.timestamps.length; i++) {
        if (farMonth.closes[i] != null) {
          const date = new Date(farMonth.timestamps[i] * 1000).toISOString().split('T')[0];
          farMonthMap.set(date, farMonth.closes[i]!);
        }
      }
    }

    const tbillMap = new Map<string, number>();
    if (tbill) {
      for (let i = 0; i < tbill.timestamps.length; i++) {
        if (tbill.closes[i] != null) {
          const date = new Date(tbill.timestamps[i] * 1000).toISOString().split('T')[0];
          tbillMap.set(date, tbill.closes[i]!);
        }
      }
    }

    // Get latest T-bill rate as fallback
    let latestTbillRate = 3.6;
    if (tbill) {
      for (let i = tbill.closes.length - 1; i >= 0; i--) {
        if (tbill.closes[i] != null) {
          latestTbillRate = tbill.closes[i]!;
          break;
        }
      }
    }

    const history = nearMonth.timestamps
      .map((ts, i) => {
        const date = new Date(ts * 1000).toISOString().split('T')[0];
        const spot = nearMonth.closes[i];
        if (spot == null) return null;

        const futures = farMonthMap.get(date) ?? null;

        // Fair spread = (risk-free rate + storage cost) × T
        const currentDate = new Date(ts * 1000);
        const daysToExpiry = Math.max(0, (expiryDate.getTime() - currentDate.getTime()) / 86400000);
        const T = daysToExpiry / 365;
        const riskFreeRate = (tbillMap.get(date) ?? latestTbillRate) / 100;
        const fairSpreadPct = Number(((riskFreeRate + STORAGE_COST) * T * 100).toFixed(2));

        return {
          date,
          spot: Number(spot.toFixed(2)),
          futures: futures ? Number(futures.toFixed(2)) : Number(spot.toFixed(2)),
          fairSpreadPct,
        };
      })
      .filter(Boolean);

    const result = {
      history,
      contractInfo: {
        shortName,
        expiryDate: expiryDate.toISOString().split('T')[0],
        riskFreeRate: latestTbillRate,
      },
    };
    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error('History API error:', error);
    if (cache.data) {
      return NextResponse.json(cache.data);
    }
    return NextResponse.json({ history: [], contractInfo: null });
  }
}
