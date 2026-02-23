import { useState, useEffect, useCallback } from 'react';
import { expensesApi } from '@/lib/api';
import type { Expense } from '@/types';

export function useExpenses(filters?: Record<string, string>) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    setError(null);
    expensesApi
      .list(filters)
      .then((res) => setExpenses(res.data.data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : 'Failed to load expenses')
      )
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters), refreshKey]);

  const refetch = useCallback(() => setRefreshKey((k) => k + 1), []);

  return { expenses, loading, error, refetch };
}
