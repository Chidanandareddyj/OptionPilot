import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_BOARD_VIEW, type BoardView } from "@optionpilot/shared";
import { DEFAULT_STRATEGY } from "./model";

type BoardState = {
  strategy: string;
  setStrategy: (strategy: string) => void;
  view: BoardView;
  setView: (update: BoardView | ((view: BoardView) => BoardView)) => void;
};

const Context = createContext<BoardState | null>(null);

/** The board's strategy and filters. The Derivatives tab and its Filters sheet both edit them, so they live above both. */
export function BoardStateProvider({ children }: { children: ReactNode }) {
  const [strategy, setStrategy] = useState<string>(DEFAULT_STRATEGY);
  const [view, setView] = useState<BoardView>(DEFAULT_BOARD_VIEW);
  const value = useMemo(() => ({ strategy, setStrategy, view, setView }), [strategy, view]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useBoardState(): BoardState {
  const value = useContext(Context);
  if (!value) throw new Error("useBoardState needs a BoardStateProvider above it.");
  return value;
}
