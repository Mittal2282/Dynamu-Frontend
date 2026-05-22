import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Manages paginated infinite-scroll data.
 * fetchFn(params) must return Promise<{ items, total, hasMore }>.
 * Automatically resets to page 1 whenever params change.
 */

export interface FetchParams {
  page: number;
  limit: number;
  [key: string]: unknown;
}

export interface FetchResult<T> {
  items: T[];
  total: number;
  hasMore: boolean;
}

export interface UseInfiniteListReturn<T> {
  items: T[];
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  hasMore: boolean;
  loading: boolean;
  error: string | null;
  loadMore: () => void;
  total: number;
}

export function useInfiniteList<T>(
  fetchFn: (params: FetchParams) => Promise<FetchResult<T>>,
  params: Record<string, unknown>
): UseInfiniteListReturn<T> {
  const [items, setItems]     = useState<T[]>([]);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);
  const [total, setTotal]     = useState(0);
  const paramsKey = JSON.stringify(params);

  // Reset list when filter/search params change
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setError(null);
  }, [paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch whenever page or params change
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFn({ ...params, page, limit: 20 } as FetchParams)
      .then((res) => {
        if (cancelled) return;
        const newItems = res?.items ?? [];
        setItems((prev) => page === 1 ? newItems : [...prev, ...newItems]);
        setHasMore(res?.hasMore ?? false);
        setTotal(res?.total ?? 0);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load'
          );
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, paramsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadMore = useCallback(() => {
    if (!loading && hasMore) setPage((p) => p + 1);
  }, [loading, hasMore]);

  return { items, setItems, hasMore, loading, error, loadMore, total };
}

/**
 * Returns a ref to attach to a sentinel element.
 * Calls onIntersect when the element enters the viewport.
 */
export function useSentinel(onIntersect: () => void): React.RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) onIntersect(); },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [onIntersect]);
  return ref;
}
