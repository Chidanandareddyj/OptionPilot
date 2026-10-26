import NetInfo from "@react-native-community/netinfo";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { fakeApi } from "./app-harness";
import { openedStream, relaySends, renderBoard } from "./derivatives-harness";
import { FakeSource } from "./fixtures/relay";
import { RELEASE_GRACE_MS, useLiveFeed } from "@/lib/derivatives/FeedProvider";

let mockApiFetch: ReturnType<typeof fakeApi>["apiFetch"];
jest.mock("@/lib/auth", () => ({ useAuth: () => ({ apiFetch: (path: string, init?: RequestInit) => mockApiFetch(path, init) }) }));

let api: ReturnType<typeof fakeApi>;
const tokens = () => api.calls.filter((c) => c.path === "/api/derivatives/token").length;

/** A screen that holds the stream while shown, with a switch to hide it. */
function Viewer() {
  const [shown, setShown] = useState(true);
  const feed = useLiveFeed(shown);
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="toggle" onPress={() => setShown((s) => !s)}>
      <Text>{`${feed.companies.length} companies, ${feed.feed ? feed.feed.rows.size : 0} priced`}</Text>
    </Pressable>
  );
}

beforeEach(() => {
  FakeSource.all = [];
  api = fakeApi({ "GET /api/derivatives/token": { url: "https://relay.test", token: "9999999999999.aa" } });
  mockApiFetch = api.apiFetch;
  (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, isInternetReachable: true });
});

describe("FeedProvider", () => {
  it("opens one stream for a screen that wants prices and shares what arrives", async () => {
    await renderBoard(<Viewer />);
    const source = await openedStream();
    await relaySends(source);
    expect(await screen.findByText("6 companies, 6 priced")).toBeOnTheScreen();
    expect(FakeSource.all).toHaveLength(1);
    expect(tokens()).toBe(1);
  });

  it("keeps the stream through a short absence and closes it after the grace period", async () => {
    jest.useFakeTimers({ advanceTimers: true });
    try {
      await renderBoard(<Viewer />);
      const source = await openedStream();
      await relaySends(source);
      await fireEvent.press(screen.getByRole("button", { name: "toggle" }));
      await act(async () => {
        await jest.advanceTimersByTimeAsync(RELEASE_GRACE_MS - 5_000);
      });
      expect(source.closed).toBe(false);
      // Back before the grace ran out: the same stream carries on, past the point the grace would have ended.
      await fireEvent.press(screen.getByRole("button", { name: "toggle" }));
      await act(async () => {
        await jest.advanceTimersByTimeAsync(RELEASE_GRACE_MS / 2);
      });
      expect(source.closed).toBe(false);
      expect(FakeSource.all).toHaveLength(1);
      // Away for good: closed after the grace, and the rows are still held.
      await fireEvent.press(screen.getByRole("button", { name: "toggle" }));
      await act(async () => {
        await jest.advanceTimersByTimeAsync(RELEASE_GRACE_MS + 100);
      });
      expect(source.closed).toBe(true);
      expect(screen.getByText("6 companies, 6 priced")).toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
    }
  });

  it("opens a new stream with a fresh token when a screen asks again after it closed", async () => {
    jest.useFakeTimers({ advanceTimers: true });
    try {
      await renderBoard(<Viewer />);
      const first = await openedStream();
      await relaySends(first);
      await fireEvent.press(screen.getByRole("button", { name: "toggle" }));
      await act(async () => {
        await jest.advanceTimersByTimeAsync(RELEASE_GRACE_MS + 100);
      });
      await fireEvent.press(screen.getByRole("button", { name: "toggle" }));
      await waitFor(() => expect(FakeSource.all).toHaveLength(2));
      expect(tokens()).toBe(2);
    } finally {
      jest.useRealTimers();
    }
  });

  it("closes when the provider goes away", async () => {
    const view = await renderBoard(<Viewer />);
    const source = await openedStream();
    await view.unmount();
    expect(source.closed).toBe(true);
  });
});
