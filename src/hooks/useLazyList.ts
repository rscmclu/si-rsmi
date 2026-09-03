import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLazyListOptions {
  initialBatch?: number;
  batchSize?: number;
  resetTriggers?: any[];
}

export function useLazyList<T>(
  items: T[],
  options: UseLazyListOptions = {}
) {
  const {
    initialBatch = 30,
    batchSize = 30,
    resetTriggers = []
  } = options;

  const [visibleCount, setVisibleCount] = useState<number>(initialBatch);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLElement | null>(null);

  // Reset visibleCount whenever resetTriggers change (e.g. search, filter changes)
  useEffect(() => {
    setVisibleCount(initialBatch);
    setIsLoadingMore(false);
  }, resetTriggers); // eslint-disable-line react-hooks/exhaustive-deps

  const hasMore = visibleCount < items.length;
  const displayedItems: T[] = items.slice(0, visibleCount);

  const loadMore = useCallback((customBatch?: number) => {
    if (visibleCount >= items.length) return;
    setIsLoadingMore(true);
    // Small timeout to allow smooth UI transition without blocking main thread
    setTimeout(() => {
      setVisibleCount(prev => Math.min(prev + (customBatch || batchSize), items.length));
      setIsLoadingMore(false);
    }, 50);
  }, [items.length, visibleCount, batchSize]);

  const loadAll = useCallback(() => {
    setVisibleCount(items.length);
  }, [items.length]);

  const reset = useCallback(() => {
    setVisibleCount(initialBatch);
  }, [initialBatch]);

  // Setup IntersectionObserver for smooth infinite scroll lazy loading
  const setSentinel = useCallback((node: HTMLElement | null) => {
    sentinelRef.current = node;

    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (node && hasMore) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore) {
            loadMore();
          }
        },
        {
          root: null,
          rootMargin: '200px', // trigger 200px before reaching bottom for instant smooth scrolling
          threshold: 0.1
        }
      );

      observerRef.current.observe(node);
    }
  }, [hasMore, loadMore]);

  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, []);

  return {
    displayedItems,
    visibleCount,
    totalCount: items.length,
    hasMore,
    isLoadingMore,
    loadMore,
    loadAll,
    reset,
    setSentinel
  };
}
