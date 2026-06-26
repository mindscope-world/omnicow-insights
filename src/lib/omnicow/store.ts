import { useSyncExternalStore } from "react";

function createStore<T extends object>(initial: T) {
  let state = initial;
  const listeners = new Set<() => void>();
  const getState = () => state;
  const setState = (patch: Partial<T> | ((s: T) => Partial<T>)) => {
    const next = typeof patch === "function" ? patch(state) : patch;
    state = { ...state, ...next };
    listeners.forEach((l) => l());
  };
  const subscribe = (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  };
  function useStore<S>(selector: (s: T) => S): S {
    return useSyncExternalStore(
      subscribe,
      () => selector(getState()),
      () => selector(initial),
    );
  }
  return { getState, setState, useStore };
}

interface OfflineState {
  offline: boolean;
  language: "en" | "sw";
  scoreDisplay: "percent" | "band";
}

const offlineStore = createStore<OfflineState>({
  offline: false,
  language: "en",
  scoreDisplay: "percent",
});

export const setOffline = (offline: boolean) => offlineStore.setState({ offline });
export const setLanguage = (language: "en" | "sw") => offlineStore.setState({ language });
export const setScoreDisplay = (scoreDisplay: "percent" | "band") =>
  offlineStore.setState({ scoreDisplay });
export const offlineState = offlineStore.getState;

export function useOfflineStore<S>(selector: (s: OfflineState) => S): S {
  return offlineStore.useStore(selector);
}
