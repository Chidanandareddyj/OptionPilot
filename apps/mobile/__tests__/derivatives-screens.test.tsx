import NetInfo from "@react-native-community/netinfo";
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react-native";
import { AppState } from "react-native";
import { applyView, evaluateBoard, mergeTick, type BoardFeed } from "@optionpilot/shared";
import { MOBILE_BOARD_VIEW } from "@/lib/derivatives/model";
import DerivativesTab from "@/app/(app)/(tabs)/derivatives";
import FiltersSheet from "@/app/(app)/derivatives/filters";
import ContractSheet from "@/app/(app)/derivatives/contract/[key]";
import { failure, fakeApi } from "./app-harness";
import { openedStream, relaySends, renderBoard } from "./derivatives-harness";
import { FakeSource, FRIDAY_CLOSE, MONDAY_AFTERNOON, UNIVERSE, fullTick, liveRow, tickOf } from "./fixtures/relay";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), navigate: jest.fn(), canGoBack: jest.fn(() => true) };
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  useIsFocused: () => true,
}));

let mockApiFetch: ReturnType<typeof fakeApi>["apiFetch"];
jest.mock("@/lib/auth", () => ({ useAuth: () => ({ apiFetch: (path: string, init?: RequestInit) => mockApiFetch(path, init) }) }));

const TOKEN = { url: "https://relay.test", token: "9999999999999.aa" };
let api: ReturnType<typeof fakeApi>;
const useApi = (routes: Parameters<typeof fakeApi>[0] = {}) => {
  api = fakeApi({ "GET /api/derivatives/token": TOKEN, ...routes });
  mockApiFetch = api.apiFetch;
};
const tokenCalls = () => api.calls.filter((c) => c.path === "/api/derivatives/token").length;

const feedFrom = (tick: ReturnType<typeof fullTick>): BoardFeed => mergeTick(null, tick);
const cardNames = () => screen.getAllByRole("button", { name: /profit to risk/i }).map((c) => /^([A-Za-z]+),/.exec(c.props.accessibilityLabel)![1]);

let appStateHandler: ((state: string) => void) | undefined;

beforeEach(() => {
  jest.clearAllMocks();
  FakeSource.all = [];
  mockParams = {};
  useApi();
  (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, isInternetReachable: true });
  appStateHandler = undefined;
  jest.spyOn(AppState, "addEventListener").mockImplementation(((_: string, handler: (state: string) => void) => {
    appStateHandler = handler;
    return { remove: jest.fn() };
  }) as never);
});

afterEach(() => jest.restoreAllMocks());

describe("Derivatives tab (37)", () => {
  it("waits for prices with a skeleton, then lists every company A to Z", async () => {
    await renderBoard(<DerivativesTab />);
    expect(screen.getByRole("header", { name: "All derivatives" })).toBeOnTheScreen();
    expect(screen.getByText("Waiting for prices…")).toBeOnTheScreen();
    expect(screen.getByText("Connecting…")).toBeOnTheScreen();
    expect(screen.queryAllByRole("button", { name: /profit to risk/i })).toHaveLength(0);

    const source = await openedStream();
    expect(source.url).toBe("https://relay.test/stream?token=9999999999999.aa");
    await relaySends(source);

    const feed = feedFrom(fullTick());
    const expected = applyView(evaluateBoard(UNIVERSE, feed, "bull_call_spread").evaluations, MOBILE_BOARD_VIEW).map((e) => e.symbol);
    expect(expected.length).toBeGreaterThan(1);
    expect(cardNames()).toEqual(expected);
    expect(screen.getByText(`Showing ${expected.length} of ${expected.length} contracts`)).toBeOnTheScreen();
    expect(screen.getByText(/^NSE open/)).toBeOnTheScreen();
    expect(screen.queryByText("Connecting…")).not.toBeOnTheScreen();
  });

  it("shows each card's lot, spot, strikes, expiry and numbers", async () => {
    await renderBoard(<DerivativesTab />);
    await relaySends(await openedStream());
    const card = screen.getAllByRole("button", { name: /profit to risk/i })[0];
    const text = within(card);
    expect(text.getByText(/^lot \d+ · spot [\d,.]+ · [\d,]+ \/ [\d,]+ CE · 27 Oct$/)).toBeOnTheScreen();
    expect(text.getByText("Max profit per lot")).toBeOnTheScreen();
    expect(text.getByText("Max loss per lot")).toBeOnTheScreen();
    expect(text.getByText("Breakeven away")).toBeOnTheScreen();
    expect(text.getByText(/^\+₹/)).toBeOnTheScreen();
    expect(text.getByText(/^−₹|^-₹/)).toBeOnTheScreen();
  });

  it("opens a contract with the strategy it was ranked under", async () => {
    await renderBoard(<DerivativesTab />);
    await relaySends(await openedStream());
    const first = screen.getAllByRole("button", { name: /profit to risk/i })[0];
    await fireEvent.press(first);
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/derivatives/contract/[key]",
      params: { key: expect.stringMatching(/^NSE_EQ\|/), strategy: "bull_call_spread" },
    });
  });

  it("re-ranks for Bear Put Spread (45)", async () => {
    await renderBoard(<DerivativesTab />);
    await relaySends(await openedStream());
    await fireEvent.press(screen.getByRole("tab", { name: "Bear Put Spread" }));
    const expected = applyView(evaluateBoard(UNIVERSE, feedFrom(fullTick()), "bear_put_spread").evaluations, MOBILE_BOARD_VIEW).map((e) => e.symbol);
    expect(cardNames()).toEqual(expected);
  });

  it("opens on the strategy a Terminal tile asked for", async () => {
    mockParams = { strategy: "long_straddle", at: "1" };
    await renderBoard(<DerivativesTab />);
    await relaySends(await openedStream());
    expect(screen.getByRole("tab", { name: "Long Straddle" })).toBeOnTheScreen();
    expect(screen.getByRole("tab", { name: "Bull Call Spread" })).toBeOnTheScreen();
  });

  it("keeps the default for a strategy it does not know", async () => {
    mockParams = { strategy: "nonsense", at: "1" };
    await renderBoard(<DerivativesTab />);
    expect(screen.queryByRole("tab", { name: "nonsense" })).not.toBeOnTheScreen();
  });

  it("applies live ticks to the rows already shown", async () => {
    await renderBoard(<DerivativesTab />);
    const source = await openedStream();
    await relaySends(source);
    const before = screen.getAllByRole("button", { name: /profit to risk/i })[0].props.accessibilityLabel;
    const company = UNIVERSE[0];
    const row = liveRow(company, MONDAY_AFTERNOON + 1000);
    row.w = row.w.map(([k, ce, t1, pe, t2]) => [k, ce + 3, t1, pe, t2]);
    await act(async () => source.emit("tick", tickOf([row], MONDAY_AFTERNOON + 1000)));
    const after = screen.getAllByRole("button", { name: /profit to risk/i }).map((c) => c.props.accessibilityLabel);
    expect(after.join("|")).not.toBe(before);
    expect(after).toHaveLength(UNIVERSE.length);
  });
});

describe("Search, filters and empty (41 to 46)", () => {
  it("narrows by symbol and counts the search in the filter badge", async () => {
    await renderBoard(<DerivativesTab />);
    await relaySends(await openedStream());
    await fireEvent.changeText(screen.getByLabelText("Search symbol"), "ad");
    expect(cardNames().every((s) => s.startsWith("AD"))).toBe(true);
    expect(screen.getByText(/^Showing 2 of 6 contracts/)).toBeOnTheScreen();
    expect(screen.getByLabelText(/Filters, 1 on/)).toBeOnTheScreen();
  });

  it("says when nothing matches and clears the search from there", async () => {
    await renderBoard(<DerivativesTab />);
    await relaySends(await openedStream());
    await fireEvent.changeText(screen.getByLabelText("Search symbol"), "QQQ");
    expect(screen.getByText("No matching companies.")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Clear filters" }));
    expect(screen.queryByText("No matching companies.")).not.toBeOnTheScreen();
    expect(cardNames()).toHaveLength(UNIVERSE.length);
  });

  it("opens the filters sheet from the button", async () => {
    await renderBoard(<DerivativesTab />);
    await relaySends(await openedStream());
    await fireEvent.press(screen.getByLabelText(/^Filters/));
    expect(mockRouter.push).toHaveBeenCalledWith("/derivatives/filters");
  });

  it("filters on a minimum and removes the chip again", async () => {
    await renderBoard(
      <>
        <DerivativesTab />
        <FiltersSheet />
      </>,
    );
    await relaySends(await openedStream());
    const min = screen.getByLabelText("Min investment");
    await fireEvent.changeText(min, "1,500");
    expect(await screen.findByRole("button", { name: /Min ₹1,500/ })).toBeOnTheScreen();
    expect(cardNames()).toHaveLength(4);
    await fireEvent.press(screen.getByRole("button", { name: /Min ₹1,500/ }));
    await waitFor(() => expect(cardNames()).toHaveLength(UNIVERSE.length));
  });
});

describe("Filters sheet (41, 42)", () => {
  it("offers strategy, investment, min and max, stale rows, and a live count", async () => {
    await renderBoard(<FiltersSheet />);
    await relaySends(await openedStream());
    expect(screen.getByRole("header", { name: "Filters" })).toBeOnTheScreen();
    expect(screen.getByText("Investment")).toBeOnTheScreen();
    expect(screen.getByLabelText("Min investment")).toBeOnTheScreen();
    expect(screen.getByLabelText("Max investment")).toBeOnTheScreen();
    expect(screen.getByLabelText("Show stale rows")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: `Show ${UNIVERSE.length} contracts` })).toBeOnTheScreen();
  });

  it("applies each change to the board as it is made, and resets", async () => {
    await renderBoard(<FiltersSheet />);
    await relaySends(await openedStream());
    await fireEvent.press(screen.getByRole("tab", { name: "Low" }));
    const low = screen.getByRole("button", { name: /^Show \d+ contracts?$/ });
    expect(low.props.accessibilityLabel).not.toBe(`Show ${UNIVERSE.length} contracts`);
    await fireEvent.press(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.getByRole("button", { name: `Show ${UNIVERSE.length} contracts` })).toBeOnTheScreen();
  });

  it("closes with the X and the Show button", async () => {
    await renderBoard(<FiltersSheet />);
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    await fireEvent.press(screen.getByRole("button", { name: /^Show/ }));
    expect(mockRouter.back).toHaveBeenCalledTimes(2);
  });
});

describe("Market closed (38)", () => {
  const closed = () => fullTick(FRIDAY_CLOSE + 64 * 3600_000 + 60_000 * 0, "NORMAL_CLOSE");

  it("explains that prices are from the last close and when NSE opens next", async () => {
    await renderBoard(<DerivativesTab />);
    const source = await openedStream();
    const tick = tickOf(UNIVERSE.map((c) => liveRow(c, FRIDAY_CLOSE)), FRIDAY_CLOSE + 60_000 * 30, "CLOSED", false);
    await relaySends(source, tick);
    expect(screen.getByText("Market closed. Showing last close.")).toBeOnTheScreen();
    expect(screen.getByText(/Prices are from Friday 23 Oct 2026, 3:30 pm IST\. They refresh when NSE opens on Monday at 9:15 am IST\./)).toBeOnTheScreen();
    expect(screen.getByText("Opens weekdays 9:15 am IST")).toBeOnTheScreen();
    expect(screen.getByText("NSE closed")).toBeOnTheScreen();
    expect(closed().status).toBe("NORMAL_CLOSE");
    // Old trades are not stale while the market is shut.
    expect(cardNames()).toHaveLength(UNIVERSE.length);
  });
});

describe("Stale rows (39)", () => {
  const staleTick = () => {
    const rows = UNIVERSE.map((c, i) => liveRow(c, i < 2 ? MONDAY_AFTERNOON - 20 * 60_000 : MONDAY_AFTERNOON));
    return tickOf(rows, MONDAY_AFTERNOON);
  };

  it("hides rows whose legs have not traded for 15 minutes, and says so", async () => {
    await renderBoard(<DerivativesTab />);
    await relaySends(await openedStream(), staleTick());
    expect(cardNames()).toHaveLength(UNIVERSE.length - 2);
    expect(screen.getByText(`Showing ${UNIVERSE.length - 2} of ${UNIVERSE.length} contracts. 2 stale rows are hidden.`)).toBeOnTheScreen();
  });

  it("shows them faded when asked", async () => {
    await renderBoard(
      <>
        <DerivativesTab />
        <FiltersSheet />
      </>,
    );
    await relaySends(await openedStream(), staleTick());
    await fireEvent(screen.getByLabelText("Show stale rows"), "valueChange", true);
    expect(await screen.findByText(/2 stale rows shown faded/)).toBeOnTheScreen();
    expect(cardNames()).toHaveLength(UNIVERSE.length);
  });
});

describe("Pull to refresh (40) and reconnecting", () => {
  const pull = async (y: number) => {
    const list = screen.getByTestId("derivatives-list");
    const nativeEvent = { contentOffset: { y, x: 0 }, layoutMeasurement: { width: 390, height: 844 }, contentSize: { width: 390, height: 2000 } };
    await act(async () => fireEvent.scroll(list, { nativeEvent }));
    await act(async () => fireEvent(list, "scrollEndDrag", { nativeEvent }));
  };

  it("reconnects with a fresh token when pulled far enough, and keeps the rows meanwhile", async () => {
    await renderBoard(<DerivativesTab />);
    const first = await openedStream();
    await relaySends(first);
    expect(tokenCalls()).toBe(1);
    await pull(-120);
    await openedStream(2);
    expect(first.closed).toBe(true);
    expect(tokenCalls()).toBe(2);
    expect(cardNames()).toHaveLength(UNIVERSE.length);
    await relaySends(FakeSource.latest);
  });

  it("does nothing for a short pull", async () => {
    await renderBoard(<DerivativesTab />);
    await relaySends(await openedStream());
    await pull(-10);
    expect(tokenCalls()).toBe(1);
  });

  it("closes in the background and reconnects with a new token on return", async () => {
    await renderBoard(<DerivativesTab />);
    const first = await openedStream();
    await relaySends(first);
    await act(async () => appStateHandler!("background"));
    expect(first.closed).toBe(true);
    await act(async () => appStateHandler!("active"));
    const second = await openedStream(2);
    expect(second).not.toBe(first);
    expect(tokenCalls()).toBe(2);
    // What was held stays on the board while the new stream connects.
    expect(cardNames()).toHaveLength(UNIVERSE.length);
  });
});

describe("Feed error (48)", () => {
  it("says the live feed is unavailable while no token can be had, and recovers", async () => {
    let attempt = 0;
    useApi({ "GET /api/derivatives/token": () => (++attempt === 1 ? failure(503, "Live feed is not configured.") : TOKEN) });
    jest.useFakeTimers({ advanceTimers: true });
    try {
      await renderBoard(<DerivativesTab />);
      expect(await screen.findByText("Live feed unavailable")).toBeOnTheScreen();
      expect(screen.getByText(/Retrying automatically/)).toBeOnTheScreen();
      expect(screen.getByText("Waiting for prices…")).toBeOnTheScreen();
      await act(async () => {
        await jest.advanceTimersByTimeAsync(5_100);
      });
      const source = await openedStream();
      await relaySends(source);
      expect(screen.queryByText("Live feed unavailable")).not.toBeOnTheScreen();
      expect(cardNames()).toHaveLength(UNIVERSE.length);
    } finally {
      jest.useRealTimers();
    }
  });

  it("shows Reconnecting… when the stream drops after rows arrived, and keeps the rows", async () => {
    jest.useFakeTimers({ advanceTimers: true });
    try {
      await renderBoard(<DerivativesTab />);
      const source = await openedStream();
      await relaySends(source);
      await act(async () => source.emit("error", { message: "closed" }));
      expect(await screen.findByText("Reconnecting…")).toBeOnTheScreen();
      expect(cardNames()).toHaveLength(UNIVERSE.length);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(3_100);
      });
      await relaySends(await openedStream(2));
      expect(screen.queryByText("Reconnecting…")).not.toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
    }
  });

  it("shows Offline instead of a pill when the device has no network", async () => {
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: false, isInternetReachable: false });
    await renderBoard(<DerivativesTab />);
    expect(await screen.findByText("Offline")).toBeOnTheScreen();
  });
});

describe("Contract sheet (49, 50)", () => {
  const key = UNIVERSE[2].k;
  beforeEach(() => {
    mockParams = { key, strategy: "bull_call_spread" };
  });

  it("waits for prices when opened before any have arrived", async () => {
    await renderBoard(<ContractSheet />);
    expect(screen.getByLabelText("Waiting for prices")).toBeOnTheScreen();
  });

  it("shows the contract's numbers", async () => {
    await renderBoard(<ContractSheet />);
    await relaySends(await openedStream());
    expect(await screen.findByRole("header", { name: "ADANIGREEN" })).toBeOnTheScreen();
    for (const label of ["Max profit per lot", "Max loss per lot", "Investment", "Profit to risk", "Breakeven away", "Breakeven"]) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
    expect(screen.getByText(/^lot 150 · spot 180\.00 · [\d,]+ \/ [\d,]+ CE · 27 Oct$/)).toBeOnTheScreen();
  });

  it("switches to the payoff table, with the row nearest spot marked, and back", async () => {
    await renderBoard(<ContractSheet />);
    await relaySends(await openedStream());
    await fireEvent.press(await screen.findByRole("button", { name: "Payoff table" }));
    expect(screen.getByText("Closing price")).toBeOnTheScreen();
    expect(screen.getByLabelText(/nearest spot/i)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Show payoff" }));
    expect(screen.getByText("Max profit per lot")).toBeOnTheScreen();
  });

  it("says so when the contract is not on the board", async () => {
    mockParams = { key: "NSE_EQ|NOPE", strategy: "bull_call_spread" };
    await renderBoard(<ContractSheet />);
    await relaySends(await openedStream());
    expect(await screen.findByText("This contract is not on the board right now.")).toBeOnTheScreen();
  });

  it("closes with the X", async () => {
    await renderBoard(<ContractSheet />);
    await fireEvent.press(screen.getByRole("button", { name: "Close" }));
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it("starts an analysis for the symbol with Analyze", async () => {
    useApi({ "POST /api/analyze": new Promise(() => undefined) as never });
    await renderBoard(<ContractSheet />);
    await relaySends(await openedStream());
    await fireEvent.press(await screen.findByRole("button", { name: "Analyze" }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/analysis/new");
    await waitFor(() => expect(api.calls.some((c) => c.path === "/api/analyze")).toBe(true));
  });
});
