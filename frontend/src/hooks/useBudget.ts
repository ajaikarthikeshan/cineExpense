'use client';

import { useState, useEffect, useCallback } from 'react';
import { reportsApi } from '@/lib/api';
import type { BudgetReport } from '@/types';

export function useBudget() {
  const [summary, setSummary] = useState<BudgetReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    reportsApi
      .getBudgetVsActual()
      .then((res) => {
        if (!cancelled) setSummary(res.data);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Failed to load budget data');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    const intervalId = setInterval(() => setRefreshKey((k) => k + 1), 60_000);
    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { summary, loading, error, refresh };
}
