'use client';

import type { NewsArticle } from '@/lib/types';

interface NewsPanelProps {
  articles: NewsArticle[];
  loading?: boolean;
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  return `${days} 天前`;
}

export default function NewsPanel({ articles, loading }: NewsPanelProps) {
  if (loading) {
    return (
      <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">相关新闻</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-800/50 border border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">相关新闻</h3>
      {articles.length === 0 ? (
        <p className="text-slate-500 text-sm">暂无新闻</p>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {articles.map((article, idx) => (
            <a
              key={idx}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <div className="border-l-2 border-amber-500/30 pl-3 py-1 hover:border-amber-500 transition-colors">
                <h4 className="text-sm font-medium text-slate-200 group-hover:text-amber-400 transition-colors line-clamp-2">
                  {article.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                  <span>{article.source}</span>
                  <span>·</span>
                  <span>{timeAgo(article.publishedAt)}</span>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
