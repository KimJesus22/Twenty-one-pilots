import { useEffect, useCallback } from 'react';

const useInfiniteScroll = (callback, hasMore = true, loading = false) => {
  const handleScroll = useCallback(() => {
    if (loading || !hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Trigger when user is within 200px of the bottom
    const threshold = 200;

    if (scrollTop + windowHeight >= documentHeight - threshold) {
      callback();
    }
  }, [callback, hasMore, loading]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return null;
};

export default useInfiniteScroll;