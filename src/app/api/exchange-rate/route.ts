import { NextResponse } from 'next/server';
import { EXCHANGE_CACHE_DURATION } from '@/lib/constants';

let cache: { data: unknown; timestamp: number } = { data: null, timestamp: 0 };

export async function GET() {
  try {
    if (cache.data && Date.now() - cache.timestamp < EXCHANGE_CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const url = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`
      : 'https://open.er-api.com/v6/latest/USD';

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Exchange rate API returned ${res.status}`);
    }

    const data = await res.json();
    const result = {
      rate: data.rates?.CNY || data.conversion_rates?.CNY || 7.25,
      timestamp: Date.now(),
    };

    cache = { data: result, timestamp: Date.now() };
    return NextResponse.json(result);
  } catch (error) {
    console.error('Exchange rate API error:', error);
    if (cache.data) {
      return NextResponse.json(cache.data);
    }
    // Fallback rate
    return NextResponse.json({ rate: 7.25, timestamp: Date.now() });
  }
}
