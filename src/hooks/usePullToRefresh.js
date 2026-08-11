import { useEffect, useRef, useState } from "react";

/**
 * Native-like pull-to-refresh bound to the window scroll.
 * Activates only when the page is scrolled to the very top.
 *
 * @param {Function} onRefresh async refresh callback
 * @param {Object} opts { threshold = 70, resistance = 2.2 }
 */
export default function usePullToRefresh(onRefresh, { threshold = 70, resistance = 2.2 } = {}) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const active = useRef(false);

  useEffect(() => {
    const onTouchStart = (e) => {
      if (window.scrollY > 0 || refreshing) return;
      startY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onTouchMove = (e) => {
      if (!active.current || startY.current == null) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) { setPull(0); return; }
      // Only prevent default when actually pulling down at top, so horizontal
      // gestures / scroll within nested containers keep working.
      if (window.scrollY <= 0) e.preventDefault();
      setPull(Math.min(dy / resistance, threshold * 1.5));
    };

    const onTouchEnd = async () => {
      if (!active.current) { setPull(0); return; }
      active.current = false;
      if (pull >= threshold) {
        setRefreshing(true);
        setPull(threshold);
        try { await onRefresh?.(); } finally {
          setRefreshing(false);
          setPull(0);
        }
      } else {
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [pull, refreshing, onRefresh, threshold, resistance]);

  return { pull, refreshing };
}