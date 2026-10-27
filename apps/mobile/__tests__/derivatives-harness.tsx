import { act, screen, waitFor } from "@testing-library/react-native";
import type { ReactElement } from "react";
import { BoardStateProvider } from "@/lib/derivatives/BoardState";
import { FeedProvider } from "@/lib/derivatives/FeedProvider";
import { renderApp } from "./app-harness";
import { FakeSource, UNIVERSE, fullTick } from "./fixtures/relay";

/** Renders under the board providers the signed-in layout supplies, with an EventSource double in place of the network. */
export async function renderBoard(ui: ReactElement) {
  return renderApp(
    <BoardStateProvider>
      <FeedProvider createSource={(url) => new FakeSource(url)}>{ui}</FeedProvider>
    </BoardStateProvider>,
  );
}

/** Waits for the app to open a stream and returns it. `count` is how many streams must exist by now. */
export async function openedStream(count = 1) {
  await waitFor(() => expect(FakeSource.all.length).toBeGreaterThanOrEqual(count));
  return FakeSource.latest;
}

/** The relay's first words: the universe, then a tick. */
export async function relaySends(source: FakeSource, tick = fullTick(), universe = UNIVERSE) {
  await act(async () => {
    source.emit("universe", universe);
    source.emit("tick", tick);
  });
}

export const nextText = (pattern: RegExp) => screen.findByText(pattern);
