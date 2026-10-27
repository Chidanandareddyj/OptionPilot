import NetInfo from "@react-native-community/netinfo";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import AnalysisScreen from "@/app/(app)/analysis/[id]";
import CalculatingScreen from "@/app/(app)/analysis/new";
import { DETAIL, failure, fakeApi, renderApp } from "./app-harness";
import { analysisResult } from "./fixtures/analysis";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), canGoBack: jest.fn(() => true) };
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockParams }));

let mockApiFetch: ReturnType<typeof fakeApi>["apiFetch"];
jest.mock("@/lib/auth", () => ({ useAuth: () => ({ apiFetch: (path: string, init?: RequestInit) => mockApiFetch(path, init) }) }));

const useApi = (routes: Parameters<typeof fakeApi>[0]) => {
  const api = fakeApi(routes);
  mockApiFetch = api.apiFetch;
  return api;
};

describe("Analysis screen (18 to 24)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { id: "an-1" };
    (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, isInternetReachable: true });
  });

  it("shows the placeholders while the analysis loads", async () => {
    useApi({ "GET /api/analyses/an-1": () => new Promise(() => {}) });
    await renderApp(<AnalysisScreen />);
    expect(screen.getByLabelText("Loading…")).toBeOnTheScreen();
  });

  it("shows the symbol, spot, expiry and lot, and the first strategy", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<AnalysisScreen />);

    expect(await screen.findByRole("header", { name: "RELIANCE" })).toBeOnTheScreen();
    expect(screen.getByText("₹1,190.00")).toBeOnTheScreen();
    expect(screen.getByText("Expiry 27 Oct 2026")).toBeOnTheScreen();
    expect(screen.getByText("Lot 500")).toBeOnTheScreen();
    expect(screen.getByLabelText(/^Strategy: Bull Call Spread/)).toBeOnTheScreen();
    expect(screen.getByRole("image", { name: /Payoff chart for Bull Call Spread/ })).toBeOnTheScreen();
    expect(screen.getByText("Max profit")).toBeOnTheScreen();
    expect(screen.getByText("Breakeven")).toBeOnTheScreen();
  });

  it("switches the strategy from the picker", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<AnalysisScreen />);
    await fireEvent.press(await screen.findByLabelText(/^Strategy: Bull Call Spread/));

    expect(screen.getByText("Choose a strategy")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: /^Bear Put Spread/ }));
    expect(screen.getByLabelText(/^Strategy: Bear Put Spread/)).toBeOnTheScreen();
    expect(screen.getByRole("image", { name: /Payoff chart for Bear Put Spread/ })).toBeOnTheScreen();
  });

  it("lists the payoff table rows, marking the one at the spot", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<AnalysisScreen />);
    await fireEvent.press(await screen.findByRole("tab", { name: /^Payoff table/ }));

    expect(screen.getByText("Price at expiry")).toBeOnTheScreen();
    expect(screen.getByLabelText(/^At [\d,]+, spot, /)).toBeOnTheScreen();
    expect(screen.queryByRole("image")).not.toBeOnTheScreen();
  });

  it("lists the legs with their strikes and premiums", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<AnalysisScreen />);
    await fireEvent.press(await screen.findByRole("tab", { name: /^Legs/ }));
    expect(screen.getAllByText(/Buy|Sell/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText(/Net (debit|credit)/)).toBeOnTheScreen();
  });

  it("opens the saved recommendation's strategy first", async () => {
    const decision = {
      view: "bearish",
      strategies: [{ key: "bear_put_spread", score: 90, viable: true, reasons: [] }],
      best: { key: "bear_put_spread" },
    };
    useApi({ "GET /api/analyses/an-1": { ...DETAIL, decision } });
    await renderApp(<AnalysisScreen />);
    expect(await screen.findByLabelText(/^Strategy: Bear Put Spread/)).toBeOnTheScreen();
  });

  it("goes back, or to the Terminal when it was opened with nothing to go back to", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<AnalysisScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "Back to Terminal" }));
    expect(mockRouter.back).toHaveBeenCalled();

    mockRouter.canGoBack.mockReturnValue(false);
    await fireEvent.press(screen.getByRole("button", { name: "Back to Terminal" }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/");
  });

  it("names the screen it came from in the back button", async () => {
    mockParams = { id: "an-1", back: "History" };
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<AnalysisScreen />);
    expect(await screen.findByRole("button", { name: "Back to History" })).toBeOnTheScreen();
  });

  it("opened from History: banners that it is a saved snapshot, and goes back to History", async () => {
    mockParams = { id: "an-1", snapshot: "1" };
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<AnalysisScreen />);
    expect(await screen.findByText("Saved snapshot")).toBeOnTheScreen();
    expect(screen.getByText("26 Oct, 09:30 am IST · prices as saved, not live")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: "Back to History" })).toBeOnTheScreen();
  });

  it("shows no snapshot banner for an analysis that was just run", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<AnalysisScreen />);
    await screen.findByRole("header", { name: "RELIANCE" });
    expect(screen.queryByText("Saved snapshot")).not.toBeOnTheScreen();
  });

  it("opens Compare and Recommend on the strategy being viewed", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<AnalysisScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "Compare" }));
    expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: "/analysis/[id]/compare", params: { id: "an-1", strategy: "bull_call_spread" } });
    await fireEvent.press(screen.getByRole("button", { name: "Recommend" }));
    expect(mockRouter.push).toHaveBeenLastCalledWith({ pathname: "/analysis/[id]/recommend", params: { id: "an-1" } });
  });

  it("shows the strategy Compare or the result sends back, each time it is sent", async () => {
    mockParams = { id: "an-1", strategy: "bear_put_spread", at: "1" };
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<AnalysisScreen />);
    expect(await screen.findByLabelText(/^Strategy: Bear Put Spread/)).toBeOnTheScreen();

    // The user picks another one from the strategy picker, then sends the same one again.
    await fireEvent.press(screen.getByLabelText(/^Strategy: Bear Put Spread/));
    await fireEvent.press(screen.getByRole("button", { name: /^Bull Call Spread/ }));
    expect(screen.getByLabelText(/^Strategy: Bull Call Spread/)).toBeOnTheScreen();

    mockParams = { id: "an-1", strategy: "bear_put_spread", at: "2" };
    // Any state change re-reads the route's params.
    await fireEvent.press(screen.getByRole("tab", { name: /^Legs/ }));
    expect(screen.getByLabelText(/^Strategy: Bear Put Spread/)).toBeOnTheScreen();
  });

  it("offers a retry when the analysis cannot be loaded", async () => {
    let attempt = 0;
    useApi({ "GET /api/analyses/an-1": () => (attempt++ === 0 ? failure(500, "boom") : DETAIL) });
    await renderApp(<AnalysisScreen />);

    expect(await screen.findByText("Could not open this analysis")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("header", { name: "RELIANCE" })).toBeOnTheScreen();
  });

  it("explains an analysis that holds no strategies", async () => {
    useApi({ "GET /api/analyses/an-1": { ...DETAIL, result: { underlying_spot_price: 1190 } } });
    await renderApp(<AnalysisScreen />);
    expect(await screen.findByText("This analysis has no strategies to show.")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeOnTheScreen();
  });
});

describe("Calculating screen (14 to 15)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  it("starts the analysis for a symbol in the link, then opens the result", async () => {
    mockParams = { symbol: "sbin" };
    const api = useApi({ "POST /api/analyze": { id: "new-1", ...analysisResult(), options: [] } });
    await renderApp(<CalculatingScreen />);

    expect(screen.getByLabelText("Calculating…")).toBeOnTheScreen();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/analysis/[id]", params: { id: "new-1" } }));
    expect(JSON.parse(String(api.calls[0]!.init!.body))).toEqual({ company: "SBIN" });
  });

  it("goes back to the Terminal when the analysis fails, so the alert can show", async () => {
    mockParams = { symbol: "SBIN" };
    useApi({ "POST /api/analyze": failure(500, "boom") });
    await renderApp(<CalculatingScreen />);
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  });

  it("returns to the Terminal when opened with no symbol and nothing running", async () => {
    useApi({});
    await renderApp(<CalculatingScreen />);
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith("/"));
  });

  it("drops a run that is still going when you back out", async () => {
    mockParams = { symbol: "SBIN" };
    const api = useApi({ "POST /api/analyze": () => new Promise(() => {}) });
    const view = await renderApp(<CalculatingScreen />);
    await waitFor(() => expect(api.calls).toHaveLength(1));
    const signal = api.calls[0]!.init!.signal as AbortSignal;
    expect(signal.aborted).toBe(false);

    await act(async () => view.unmount());
    expect(signal.aborted).toBe(true);
  });
});
