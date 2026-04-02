import { NextResponse } from 'next/server';
import { NEWS_CACHE_DURATION } from '@/lib/constants';

let cache: { data: unknown; timestamp: number } = { data: null, timestamp: 0 };

export async function GET() {
  try {
    if (cache.data && Date.now() - cache.timestamp < NEWS_CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    const apiKey = process.env.GNEWS_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'News API key not configured' }, { status: 500 });
    }

    const query = encodeURIComponent('gold price');
    const url = `https://gnews.io/api/v4/search?q=${query}&lang=en&max=10&apikey=${apiKey}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`GNews API returned ${res.status}`);
    }

    const data = await res.json();

    const articles = (data.articles || []).map((article: Record<string, unknown>) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      image: article.image || null,
      source: (article.source as Record<string, string>)?.name || 'Unknown',
      publishedAt: article.publishedAt,
    }));

    cache = { data: { articles }, timestamp: Date.now() };
    return NextResponse.json({ articles });
  } catch (error) {
    console.error('News API error:', error);
    if (cache.data) {
      return NextResponse.json(cache.data);
    }
    return NextResponse.json({ articles: [] });
  }
}
