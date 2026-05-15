import { CallbackListener, PlayerRef } from "@remotion/player";
import { useCallback, useSyncExternalStore } from "react";

export const useCurrentPlayerFrame = (
  ref: React.RefObject<PlayerRef | null>,
) => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const { current } = ref;
      if (!current) {
        return () => undefined;
      }
      const updater: CallbackListener<"frameupdate"> = () => {
        onStoreChange();
      };
      current.addEventListener("frameupdate", updater);
      return () => {
        current.removeEventListener("frameupdate", updater);
      };
    },
    [ref],
  );

  const data = useSyncExternalStore<number>(
    subscribe,
    () => ref.current?.getCurrentFrame() ?? 0,
    () => 0,
  );

  return data;
};

export const useCurrentPlayerStatus = (
  ref: React.RefObject<PlayerRef | null>,
) => {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const { current } = ref;
      if (!current) {
        return () => undefined;
      }
      const updater: CallbackListener<"play" | "pause"> = () => {
        onStoreChange();
      };

      current.addEventListener("play", updater);
      current.addEventListener("pause", updater);
      return () => {
        current.removeEventListener("play", updater);
        current.removeEventListener("pause", updater);
      };
    },
    [ref],
  );

  const data = useSyncExternalStore<boolean>(
    subscribe,
    () => ref.current?.isPlaying() ?? false,
    () => false,
  );

  return data;
};
