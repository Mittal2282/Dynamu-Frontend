import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Manages paginated infinite-scroll data.
 * fetchFn(params) must return Promise<{ items, total, hasMore }>.
 * Automatically resets to page 1 whenever params change.
 */
export function useInfiniteList(fetchFn, params) {
  const [items, setItems]     = useState([]);
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
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
    fetchFn({ ...params, page, limit: 20 })
      .then((res) => {
        if (cancelled) return;
        const newItems = res?.items ?? [];
        setItems((prev) => page === 1 ? newItems : [...prev, ...newItems]);
        setHasMore(res?.hasMore ?? false);
        setTotal(res?.total ?? 0);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Failed to load');
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
export function useSentinel(onIntersect) {
  const ref = useRef(null);
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
