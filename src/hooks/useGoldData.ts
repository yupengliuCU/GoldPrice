'use client';

import { useState, useEffect, useCallback } from 'react';
import type { GoldPrice, NewsArticle, AnalysisResult } from '@/lib/types';
import { CLIENT_REFRESH_INTERVAL } from '@/lib/constants';

interface GoldData {
  spot: GoldPrice | null;
  futures: (GoldPrice & { estimated?: boolean }) | null;
  exchangeRate: number;
  news: NewsArticle[];
  analysis: AnalysisResult | null;
  historicalData: { date: string; spot: number; futures: number; fairSpreadPct: number }[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

export function useGoldData(): GoldData {
  const [data, setData] = useState<GoldData>({
    spot: null,
    futures: null,
    exchangeRate: 7.25,
    news: [],
    analysis: null,
    historicalData: [],
    loading: true,
    error: null,
    lastUpdated: null,
  });

  const fetchData = useCallback(async () => {
    try {
      setData((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch all data in parallel
      const [priceRes, rateRes, newsRes, historyRes] = await Promise.all([
        fetch('/api/gold-price'),
        fetch('/api/exchange-rate'),
        fetch('/api/news'),
        fetch('/api/history'),
      ]);

      const priceData = await priceRes.json();
      const rateData = await rateRes.json();
      const newsData = await newsRes.json();
      const historyData = await historyRes.json();

      if (priceData.error) {
        throw new Error(priceData.error);
      }

      // Fetch analysis
      let analysis: AnalysisResult | null = null;
      try {
        const analysisRes = await fetch('/api/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articles: newsData.articles || [],
            spotPrice: priceData.spot.price,
            futuresPrice: priceData.futures.price,
          }),
        });
        analysis = await analysisRes.json();
      } catch {
        console.error('Analysis fetch failed');
      }

      setData({
        spot: priceData.spot,
        futures: priceData.futures,
        exchangeRate: rateData.rate,
        news: newsData.articles || [],
        analysis,
        historicalData: historyData.history || [],
        loading: false,
        error: null,
        lastUpdated: new Date(),
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch data',
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, CLIENT_REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchData]);

  return data;
}
