import { RefObject, useCallback, useSyncExternalStore } from "react";

export default function useResizeSubscription(
  timelineRef: RefObject<HTMLDivElement | null>,
) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("resize", onStoreChange);
    window.addEventListener("scroll", onStoreChange, { passive: true });
    return () => {
      window.removeEventListener("resize", onStoreChange);
      window.removeEventListener("scroll", onStoreChange);
    };
  }, []);

  const getCurrentLeft = () => {
    if (!timelineRef.current) {
      return 0;
    }
    return timelineRef.current.getBoundingClientRect().left + 16; // Account for padding in trackline component
  };

  return useSyncExternalStore<number>(subscribe, getCurrentLeft, () => 0);
}
