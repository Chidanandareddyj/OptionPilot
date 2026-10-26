import NetInfo from "@react-native-community/netinfo";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import TerminalTab from "@/app/(app)/(tabs)/terminal";
import { DETAIL, failure, fakeApi, INDICES, QUOTES, renderApp, SUMMARY } from "./app-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), navigate: jest.fn() };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useIsFocused: () => true }));

let mockApiFetch: ReturnType<typeof fakeApi>["apiFetch"];
jest.mock("@/lib/auth", () => ({ useAuth: () => ({ apiFetch: (path: string, init?: RequestInit) => mockApiFetch(path, init) }) }));

const netInfo = NetInfo as unknown as { fetch: jest.Mock; addEventListener: jest.Mock };
const OFFLINE = { isConnected: false, isInternetReachable: false };

function routes(overrides: Parameters<typeof fakeApi>[0] = {}) {
  const api = fakeApi({
    "GET /api/market/indices": INDICES,
    "GET /api/market/quotes": { quotes: QUOTES },
    "GET /api/analyses": { analyses: [SUMMARY], nextCursor: null },
    "GET /api/analyses/an-1": DETAIL,
    ...overrides,
  });
  mockApiFetch = api.apiFetch;
  return api;
}

describe("Terminal home (13)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    netInfo.fetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
  });

  it("lists the indices and the stocks you looked at, with their prices", async () => {
    const api = routes();
    await renderApp(<TerminalTab />);

    expect(await screen.findByText("NIFTY")).toBeOnTheScreen();
    expect(screen.getByText("BANKNIFTY")).toBeOnTheScreen();
    expect(await screen.findByText("TCS")).toBeOnTheScreen();
    expect(screen.getByText(/1\.02%/)).toBeOnTheScreen();
    expect(screen.getByText(/0\.99%/)).toBeOnTheScreen();
    // RELIANCE was analysed last, so it leads the stocks, then the quick-access symbols follow.
    const quoteCall = api.calls.find((call) => call.path.startsWith("/api/market/quotes"));
    expect(decodeURIComponent(quoteCall!.path)).toContain("symbols=RELIANCE,");
  });

  it("shows the market status, and no fallback note, when the prices are live", async () => {
    routes();
    await renderApp(<TerminalTab />);
    expect(await screen.findByLabelText("NSE open 15:15 IST")).toBeOnTheScreen();
    expect(screen.queryByText(/approximate/i)).not.toBeOnTheScreen();
  });

  it("says so when the index prices are the saved fallback ones", async () => {
    routes({ "GET /api/market/indices": { ...INDICES, isLive: false, status: "CLOSED", source: "fallback" } });
    await renderApp(<TerminalTab />);
    expect(await screen.findByLabelText("NSE closed")).toBeOnTheScreen();
    expect(await screen.findByText(/approximate/i)).toBeOnTheScreen();
  });

  it("offers the newest saved analysis as the resume card, and opens it", async () => {
    routes();
    await renderApp(<TerminalTab />);
    const card = await screen.findByRole("button", { name: /Resume last analysis, RELIANCE/ });
    await fireEvent.press(card);
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/analysis/[id]", params: { id: "an-1" } });
  });

  it("hides the resume card when nothing was analysed yet", async () => {
    routes({ "GET /api/analyses": { analyses: [], nextCursor: null } });
    await renderApp(<TerminalTab />);
    await screen.findByText("TCS");
    expect(screen.queryByText("Resume last analysis")).not.toBeOnTheScreen();
  });

  it("starts an analysis from a recent symbol and opens the calculating screen", async () => {
    const api = routes({ "POST /api/analyze": () => new Promise(() => {}) });
    await renderApp(<TerminalTab />);
    await fireEvent.press(await screen.findByRole("button", { name: /TCS/ }));

    expect(mockRouter.push).toHaveBeenCalledWith("/analysis/new");
    await waitFor(() => expect(api.calls.some((call) => call.method === "POST")).toBe(true));
    expect(JSON.parse(String(api.calls.find((call) => call.method === "POST")!.init!.body))).toEqual({ company: "TCS" });
    expect(await screen.findByRole("button", { name: "Calculating…" })).toBeOnTheScreen();
  });

  it("offline: shows the banner, says Offline and will not start an analysis", async () => {
    netInfo.fetch.mockResolvedValue(OFFLINE);
    const api = routes();
    await renderApp(<TerminalTab />);

    expect(await screen.findByText("You are offline")).toBeOnTheScreen();
    expect(screen.getByLabelText("Offline")).toBeOnTheScreen();
    const analyze = screen.getByRole("button", { name: "Analyze" });
    expect(analyze).toBeDisabled();
    await fireEvent.press(analyze);
    expect(mockRouter.push).not.toHaveBeenCalled();
    expect(api.calls.some((call) => call.method === "POST")).toBe(false);
  });

  it("shows the failure from a run that went wrong as an alert", async () => {
    routes({ "POST /api/analyze": failure(500, "boom") });
    await renderApp(<TerminalTab />);
    await fireEvent.press(await screen.findByRole("button", { name: /TCS/ }));
    expect(await screen.findByText("Analysis failed")).toBeOnTheScreen();
    expect(screen.getByText(/Could not analyse TCS/)).toBeOnTheScreen();
  });

  it("shows the pull hint while the list is pulled down, and its release wording past the threshold", async () => {
    routes();
    await renderApp(<TerminalTab />);
    await screen.findByText("TCS");
    const list = screen.getByTestId("terminal-scroll");

    expect(screen.queryByText(/refresh prices/i)).not.toBeOnTheScreen();
    await act(async () => fireEvent.scroll(list, { nativeEvent: { contentOffset: { y: -30 } } }));
    expect(screen.getByText("Pull to refresh prices")).toBeOnTheScreen();
    await act(async () => fireEvent.scroll(list, { nativeEvent: { contentOffset: { y: -90 } } }));
    expect(screen.getByText("Release to refresh prices")).toBeOnTheScreen();
    await act(async () => fireEvent.scroll(list, { nativeEvent: { contentOffset: { y: 0 } } }));
    expect(screen.queryByText(/refresh prices/i)).not.toBeOnTheScreen();
  });

  it("releasing past the threshold fetches the prices again", async () => {
    const api = routes();
    await renderApp(<TerminalTab />);
    await screen.findByText("TCS");
    const before = api.calls.filter((call) => call.path.startsWith("/api/market/indices")).length;
    const list = screen.getByTestId("terminal-scroll");
    await act(async () => fireEvent(list, "scrollEndDrag", { nativeEvent: { contentOffset: { y: -90 } } }));
    await waitFor(() =>
      expect(api.calls.filter((call) => call.path.startsWith("/api/market/indices")).length).toBeGreaterThan(before),
    );
  });
});

describe("Browse by view (14)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    netInfo.fetch.mockResolvedValue({ isConnected: true, isInternetReachable: true });
  });

  it.each([
    ["Bullish", "bull_call_spread"],
    ["Bearish", "bear_put_spread"],
    ["Neutral", "call_butterfly"],
    ["Volatile", "long_straddle"],
  ])("opens the live derivatives board on %s's strategy", async (view, strategy) => {
    routes();
    await renderApp(<TerminalTab />);
    await fireEvent.press(await screen.findByRole("button", { name: new RegExp(`^${view}, \\d+ strategies`) }));
    expect(mockRouter.navigate).toHaveBeenCalledWith({ pathname: "/derivatives", params: { strategy, at: expect.any(String) } });
  });
});
