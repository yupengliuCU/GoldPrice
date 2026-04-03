import { NextResponse } from 'next/server';
import { analyze } from '@/lib/analysis';
import type { NewsArticle } from '@/lib/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { articles, spotPrice, futuresPrice, historicalPrices } = body as {
      articles: NewsArticle[];
      spotPrice: number;
      futuresPrice: number;
      historicalPrices?: number[];
    };

    if (!spotPrice || !futuresPrice) {
      return NextResponse.json({ error: 'Missing price data' }, { status: 400 });
    }

    const result = analyze(articles || [], spotPrice, futuresPrice, historicalPrices || []);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Analysis API error:', error);
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
  }
}
