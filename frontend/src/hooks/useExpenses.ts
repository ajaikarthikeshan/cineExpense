import { useState, useEffect } from 'react';
import { expensesApi } from '@/lib/api';
import type { Expense } from '@/types';

export function useExpenses(filters?: Record<string, string>) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    expensesApi
      .list(filters)
      .then((res) => setExpenses(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [JSON.stringify(filters)]);

  return { expenses, loading, error };
}
