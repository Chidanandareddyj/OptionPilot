import type { AnalysisSummary } from "@optionpilot/shared";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useDeleteAnalysis } from "@/lib/api/hooks";
import { ANALYSES_KEY, HISTORY_KEY } from "@/lib/api/keys";
import { insertAnalysis, removeFromPages, restoreToPages, withoutAnalysis, type HistoryData } from "./model";

/** How long Undo stays on screen before the delete is sent. */
export const UNDO_MS = 5000;

export type DeleteNotice = { kind: "deleted"; item: AnalysisSummary } | { kind: "failed"; item: AnalysisSummary };

/**
 * Swipe to delete with undo. The row leaves the lists at once (the History tab's pages and the
 * Terminal's recent list), the server is asked after the undo window, and the row comes back if the
 * server says no. Leaving the app sends a pending delete straight away, so it is not lost.
 */
export function useHistoryDelete() {
  const queryClient = useQueryClient();
  const mutation = useDeleteAnalysis();
  const { mutate } = mutation;
  const pending = useRef<{ item: AnalysisSummary; timer: ReturnType<typeof setTimeout> } | null>(null);
  const [notice, setNotice] = useState<DeleteNotice | null>(null);

  const hide = useCallback(
    (item: AnalysisSummary) => {
      queryClient.setQueryData<HistoryData>(HISTORY_KEY, (data) => data && removeFromPages(data, item.id));
      queryClient.setQueryData<AnalysisSummary[]>(ANALYSES_KEY, (list) => list && withoutAnalysis(list, item.id));
    },
    [queryClient],
  );

  const show = useCallback(
    (item: AnalysisSummary) => {
      queryClient.setQueryData<HistoryData>(HISTORY_KEY, (data) => data && restoreToPages(data, item));
      queryClient.setQueryData<AnalysisSummary[]>(ANALYSES_KEY, (list) => list && insertAnalysis(list, item));
    },
    [queryClient],
  );

  const commit = useCallback(
    (item: AnalysisSummary) => {
      mutate(item.id, {
        onError: () => {
          show(item);
          setNotice({ kind: "failed", item });
        },
      });
    },
    [mutate, show],
  );

  const flush = useCallback(() => {
    const current = pending.current;
    if (!current) return;
    clearTimeout(current.timer);
    pending.current = null;
    setNotice((shown) => (shown?.kind === "deleted" && shown.item.id === current.item.id ? null : shown));
    commit(current.item);
  }, [commit]);

  const remove = useCallback(
    (item: AnalysisSummary) => {
      flush();
      hide(item);
      pending.current = { item, timer: setTimeout(flush, UNDO_MS) };
      setNotice({ kind: "deleted", item });
    },
    [flush, hide],
  );

  const undo = useCallback(() => {
    const current = pending.current;
    if (!current) return;
    clearTimeout(current.timer);
    pending.current = null;
    show(current.item);
    setNotice(null);
  }, [show]);

  const dismiss = useCallback(() => setNotice((shown) => (shown?.kind === "failed" ? null : shown)), []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") flush();
    });
    return () => {
      subscription.remove();
      flush();
    };
  }, [flush]);

  return { notice, remove, undo, dismiss, deleting: mutation.isPending };
}
