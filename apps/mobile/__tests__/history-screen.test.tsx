import { act, fireEvent, screen, waitFor, within } from "@testing-library/react-native";
import type { AnalysisSummary } from "@optionpilot/shared";
import HistoryTab from "@/app/(app)/(tabs)/history";
import { UNDO_MS } from "@/lib/history/useHistoryDelete";
import { failure, renderApp } from "./app-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn() };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useIsFocused: () => true }));

let mockApiFetch: (path: string, init?: RequestInit) => Promise<Response>;
jest.mock("@/lib/auth", () => ({ useAuth: () => ({ apiFetch: (path: string, init?: RequestInit) => mockApiFetch(path, init) }) }));

const row = (n: number, tag = "12 strategies"): AnalysisSummary => ({
  id: `an-${n}`,
  company: `SYM${n}`,
  spot: 100 + n,
  tag,
  createdAt: new Date(Date.UTC(2026, 9, 25, 10, 0) - n * 3600_000).toISOString(),
});
const FIRST = [row(1, "Neutral · Put Butterfly"), row(2, "Compare view"), row(3)];
const SECOND = [row(4), row(5)];

/** A server with two pages, a cursor between them, and deletes that can be told to fail. */
function server({ failDelete = false, firstPage = FIRST, secondPage = SECOND, hang = false } = {}) {
  const calls: { method: string; path: string }[] = [];
  mockApiFetch = jest.fn(async (path: string, init?: RequestInit) => {
    const method = init?.method ?? "GET";
    calls.push({ method, path });
    if (hang) return new Promise<Response>(() => {});
    if (method === "DELETE") return failDelete ? failure(500, "Boom") : new Response(null, { status: 204 });
    if (path === "/api/analyses") return new Response(JSON.stringify({ analyses: firstPage, nextCursor: secondPage.length ? "next-1" : null }));
    if (path === "/api/analyses?cursor=next-1") return new Response(JSON.stringify({ analyses: secondPage, nextCursor: null }));
    return failure(404, "Not found");
  });
  return calls;
}

const deleteButtons = () => screen.getAllByRole("button", { name: "Delete" });

describe("History tab (51 to 54)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("lists the saved analyses newest first, each with spot, tag and time", async () => {
    server();
    await renderApp(<HistoryTab />);
    expect(await screen.findByText("SYM1")).toBeOnTheScreen();
    expect(screen.getByText("₹101.00")).toBeOnTheScreen();
    expect(screen.getByText("Neutral · Put Butterfly")).toBeOnTheScreen();
    expect(screen.getByText("Compare view")).toBeOnTheScreen();
    expect(screen.getByText("25 Oct, 02:30 pm IST")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: "Analysis history" })).toBeOnTheScreen();
    expect(screen.getByText("3+ saved snapshots. Open one to reload that analysis.")).toBeOnTheScreen();
  });

  it("shows placeholders while loading", async () => {
    server({ hang: true });
    await renderApp(<HistoryTab />);
    expect(screen.getByText("Loading saved analyses.")).toBeOnTheScreen();
    expect(screen.queryByText("No saved analyses")).not.toBeOnTheScreen();
  });

  it("shows the empty state, which opens the terminal", async () => {
    server({ firstPage: [], secondPage: [] });
    await renderApp(<HistoryTab />);
    expect(await screen.findByText("No saved analyses")).toBeOnTheScreen();
    expect(screen.getByText("0 saved snapshots.")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Open the terminal" }));
    expect(mockRouter.navigate).toHaveBeenCalledWith("/terminal");
  });

  it("says so when the list cannot be loaded, and tries again", async () => {
    mockApiFetch = jest.fn(async () => failure(500, "Boom"));
    await renderApp(<HistoryTab />);
    expect(await screen.findByText("Could not load history")).toBeOnTheScreen();
    expect(screen.getByText("Could not load your saved analyses.")).toBeOnTheScreen();
    const calls = (mockApiFetch as jest.Mock).mock.calls.length;
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect((mockApiFetch as jest.Mock).mock.calls.length).toBeGreaterThan(calls));
  });

  it("opens a row as a saved snapshot that goes back to History", async () => {
    server();
    await renderApp(<HistoryTab />);
    await fireEvent.press(await screen.findByLabelText(/^SYM1, ₹101\.00, Neutral · Put Butterfly, saved /));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/analysis/[id]", params: { id: "an-1", snapshot: "1", back: "History" } });
  });

  it("loads the next page with the cursor when the end is reached, and drops the plus on the last page", async () => {
    const calls = server();
    await renderApp(<HistoryTab />);
    await screen.findByText("SYM1");
    expect(screen.queryByText("SYM4")).not.toBeOnTheScreen();
    await fireEvent(screen.getByTestId("history-list"), "endReached");
    expect(await screen.findByText("SYM4")).toBeOnTheScreen();
    expect(screen.getByText("SYM5")).toBeOnTheScreen();
    expect(calls.map((call) => call.path)).toEqual(["/api/analyses", "/api/analyses?cursor=next-1"]);
    expect(screen.getByText("5 saved snapshots. Open one to reload that analysis.")).toBeOnTheScreen();
    // Nothing further to ask for.
    await fireEvent(screen.getByTestId("history-list"), "endReached");
    expect(calls).toHaveLength(2);
  });

  it("offers to retry when a later page fails, keeping the rows it has", async () => {
    let fail = true;
    server();
    const inner = mockApiFetch;
    mockApiFetch = async (path, init) => (path.includes("cursor") && fail ? failure(500, "Boom") : inner(path, init));
    await renderApp(<HistoryTab />);
    await screen.findByText("SYM1");
    await fireEvent(screen.getByTestId("history-list"), "endReached");
    const retry = await screen.findByRole("button", { name: "Could not load more. Try again" });
    expect(screen.getByText("SYM1")).toBeOnTheScreen();
    fail = false;
    await fireEvent.press(retry);
    expect(await screen.findByText("SYM5")).toBeOnTheScreen();
  });

  describe("delete", () => {
    beforeEach(() => jest.useFakeTimers({ advanceTimers: true }));
    afterEach(() => jest.useRealTimers());

    it("removes the row at once, offers Undo, and sends the DELETE when the window ends", async () => {
      const calls = server();
      await renderApp(<HistoryTab />);
      await screen.findByText("SYM2");
      await fireEvent.press(deleteButtons()[1]!);

      expect(screen.queryByText("SYM2")).not.toBeOnTheScreen();
      expect(screen.getByText("SYM2 deleted.")).toBeOnTheScreen();
      expect(calls.some((call) => call.method === "DELETE")).toBe(false);

      await act(async () => {
        jest.advanceTimersByTime(UNDO_MS + 10);
      });
      await waitFor(() => expect(calls).toContainEqual({ method: "DELETE", path: "/api/analyses/an-2" }));
      expect(screen.queryByText("SYM2")).not.toBeOnTheScreen();
      expect(screen.queryByText("SYM2 deleted.")).not.toBeOnTheScreen();
    });

    it("brings the row back on Undo, and never sends the DELETE", async () => {
      const calls = server();
      await renderApp(<HistoryTab />);
      await screen.findByText("SYM2");
      await fireEvent.press(deleteButtons()[1]!);
      await fireEvent.press(screen.getByRole("button", { name: "Undo" }));
      expect(screen.getByText("SYM2")).toBeOnTheScreen();
      expect(screen.queryByText("SYM2 deleted.")).not.toBeOnTheScreen();
      await act(async () => {
        jest.advanceTimersByTime(UNDO_MS * 2);
      });
      expect(calls.some((call) => call.method === "DELETE")).toBe(false);
      // Back in its place, between its neighbours.
      const symbols = screen.getAllByText(/^SYM\d$/).map((node) => node.props.children);
      expect(symbols.slice(0, 3)).toEqual(["SYM1", "SYM2", "SYM3"]);
    });

    it("puts the row back, and says why, when the server refuses", async () => {
      const calls = server({ failDelete: true });
      await renderApp(<HistoryTab />);
      await screen.findByText("SYM2");
      await fireEvent.press(deleteButtons()[1]!);
      expect(screen.queryByText("SYM2")).not.toBeOnTheScreen();
      await act(async () => {
        jest.advanceTimersByTime(UNDO_MS + 10);
      });
      expect(await screen.findByText("Could not delete SYM2. It is back in your history.")).toBeOnTheScreen();
      expect(screen.getByText("SYM2")).toBeOnTheScreen();
      expect(calls.filter((call) => call.method === "DELETE")).toHaveLength(1);
      await fireEvent.press(screen.getByRole("button", { name: "Dismiss" }));
      expect(screen.queryByText(/Could not delete/)).not.toBeOnTheScreen();
    });

    it("sends a pending delete straight away when a second row is deleted", async () => {
      const calls = server();
      await renderApp(<HistoryTab />);
      await screen.findByText("SYM3");
      await fireEvent.press(deleteButtons()[0]!);
      await fireEvent.press(deleteButtons()[0]!);
      await waitFor(() => expect(calls).toContainEqual({ method: "DELETE", path: "/api/analyses/an-1" }));
      expect(screen.getByText("SYM2 deleted.")).toBeOnTheScreen();
    });

    it("sends a pending delete when the screen goes away, so it is not lost", async () => {
      const calls = server();
      const view = await renderApp(<HistoryTab />);
      await screen.findByText("SYM1");
      await fireEvent.press(deleteButtons()[0]!);
      await view.unmount();
      await waitFor(() => expect(calls).toContainEqual({ method: "DELETE", path: "/api/analyses/an-1" }));
    });

    it("can be done from the row's accessibility actions too", async () => {
      server();
      await renderApp(<HistoryTab />);
      const rowButton = await screen.findByLabelText(/^SYM3, /);
      await fireEvent(rowButton, "accessibilityAction", { nativeEvent: { actionName: "delete" } });
      expect(screen.getByText("SYM3 deleted.")).toBeOnTheScreen();
      expect(within(screen.getByTestId("history-list")).queryByText("SYM3")).not.toBeOnTheScreen();
    });
  });
});
