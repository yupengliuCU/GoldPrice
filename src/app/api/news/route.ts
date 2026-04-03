import { NextResponse } from 'next/server';
import { NEWS_CACHE_DURATION } from '@/lib/constants';

let cache: { data: unknown; timestamp: number } = { data: null, timestamp: 0 };

function parseRssItem(itemXml: string) {
  const getTag = (tag: string) => {
    const match = itemXml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[(.+?)\\]\\]></${tag}>|<${tag}[^>]*>(.+?)</${tag}>`, 's'));
    return match ? (match[1] || match[2] || '').trim() : '';
  };

  const title = getTag('title');
  const link = getTag('link');
  const pubDate = getTag('pubDate');
  const source = getTag('source');
  // Google News description contains HTML snippet with the actual source
  const descRaw = getTag('description');
  const descText = descRaw.replace(/<[^>]+>/g, '').trim();

  return {
    title,
    description: descText,
    url: link,
    image: null,
    source: source || 'Google News',
    publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
  };
}

export async function GET() {
  try {
    if (cache.data && Date.now() - cache.timestamp < NEWS_CACHE_DURATION) {
      return NextResponse.json(cache.data);
    }

    // Google News RSS — free, real-time, no API key needed
    // "when:1d" filters to last 24 hours for freshest results
    const res = await fetch(
      'https://news.google.com/rss/search?q=gold+price+when:1d&hl=en-US&gl=US&ceid=US:en',
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!res.ok) {
      throw new Error(`Google News RSS returned ${res.status}`);
    }

    const xml = await res.text();

    // Parse RSS items
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    const allArticles = [];
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
      const article = parseRssItem(match[1]);
      if (article.title) {
        allArticles.push(article);
      }
    }

    // Sort by publish time (newest first) and take top 15
    allArticles.sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
    const articles = allArticles.slice(0, 15);

    cache = { data: { articles }, timestamp: Date.now() };
    return NextResponse.json({ articles });
  } catch (error) {
    console.error('News API error:', error);

    // Fallback to GNews if Google News fails
    try {
      const apiKey = process.env.GNEWS_API_KEY;
      if (apiKey) {
        const query = encodeURIComponent('gold price');
        const gNewsRes = await fetch(
          `https://gnews.io/api/v4/search?q=${query}&lang=en&max=10&apikey=${apiKey}`
        );
        const gNewsData = await gNewsRes.json();
        const articles = (gNewsData.articles || []).map((a: Record<string, unknown>) => ({
          title: a.title,
          description: a.description,
          url: a.url,
          image: a.image || null,
          source: (a.source as Record<string, string>)?.name || 'Unknown',
          publishedAt: a.publishedAt,
        }));
        return NextResponse.json({ articles });
      }
    } catch {
      // ignore fallback error
    }

    if (cache.data) {
      return NextResponse.json(cache.data);
    }
    return NextResponse.json({ articles: [] });
  }
}
