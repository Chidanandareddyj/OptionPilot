import NetInfo from "@react-native-community/netinfo";
import { fireEvent, screen, waitFor } from "@testing-library/react-native";
import { STRATEGY_DEFINITIONS, mergeCompareDecision, type Decision } from "@optionpilot/shared";
import CompareScreen from "@/app/(app)/analysis/[id]/compare";
import RecommendSheet from "@/app/(app)/analysis/[id]/recommend";
import RecommendationScreen from "@/app/(app)/analysis/[id]/recommendation";
import { DETAIL, failure, fakeApi, renderApp } from "./app-harness";
import { decide } from "./fixtures/decision";

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
  dismissTo: jest.fn(),
  canGoBack: jest.fn(() => true),
};
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({ useRouter: () => mockRouter, useLocalSearchParams: () => mockParams }));

let mockApiFetch: ReturnType<typeof fakeApi>["apiFetch"];
jest.mock("@/lib/auth", () => ({ useAuth: () => ({ apiFetch: (path: string, init?: RequestInit) => mockApiFetch(path, init) }) }));

const useApi = (routes: Parameters<typeof fakeApi>[0]) => {
  const api = fakeApi(routes);
  mockApiFetch = api.apiFetch;
  return api;
};
const withDecision = (decision: unknown) => ({ ...DETAIL, decision });
const nameOf = (key: string) => STRATEGY_DEFINITIONS[key].name;
const rowNames = () => screen.getAllByRole("button", { name: /^\d\d .*ROI/ }).map((row) => /^\d\d (.*?), ROI/.exec(row.props.accessibilityLabel)![1]);

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = { id: "an-1" };
  (NetInfo.fetch as jest.Mock).mockResolvedValue({ isConnected: true, isInternetReachable: true });
});

describe("Compare all (25 to 28)", () => {
  it("lists every strategy in catalogue order before anything is scored", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<CompareScreen />);
    expect(await screen.findByRole("header", { name: /Compare all\s*12 strategies/ })).toBeOnTheScreen();
    expect(screen.getByText(/In catalogue order\./)).toBeOnTheScreen();
    expect(rowNames()).toEqual(Object.keys(STRATEGY_DEFINITIONS).map(nameOf));
  });

  it("lists them in the recommendation's order, the same as the website's explorer", async () => {
    const decision = decide("bearish");
    useApi({ "GET /api/analyses/an-1": withDecision(decision) });
    await renderApp(<CompareScreen />);
    expect(await screen.findByText(/Ranked by recommendation score\./)).toBeOnTheScreen();
    expect(rowNames()).toEqual(decision.strategies.map((s) => nameOf(s.key)));
  });

  it("filters by category and keeps the ranking order of what is left", async () => {
    const decision = decide("neutral");
    useApi({ "GET /api/analyses/an-1": withDecision(decision) });
    await renderApp(<CompareScreen />);
    const butterflies = (await screen.findAllByRole("tab")).find((tab) => /^Neutral/.test(tab.props.accessibilityLabel))!;
    await fireEvent.press(butterflies);
    const expected = decision.strategies.filter((s) => STRATEGY_DEFINITIONS[s.key].category === "neutral").map((s) => nameOf(s.key));
    expect(expected.length).toBeGreaterThan(0);
    expect(rowNames()).toEqual(expected);
    expect(butterflies.props.accessibilityState.selected).toBe(true);
  });

  it("searches by name and says so when nothing matches", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<CompareScreen />);
    await fireEvent.changeText(await screen.findByLabelText("Search strategy"), "butterfly");
    expect(rowNames()).toEqual(["Call Butterfly", "Put Butterfly"]);

    await fireEvent.changeText(screen.getByLabelText("Search strategy"), "zzz");
    expect(screen.queryAllByRole("button", { name: /ROI/ })).toHaveLength(0);
    expect(screen.getByText("No strategies match")).toBeOnTheScreen();
    expect(screen.getByText(/Nothing matches “zzz”/)).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Clear search" }));
    expect(rowNames()).toHaveLength(12);
  });

  it("loads a row's payoff on the analysis it came from", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<CompareScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: /^02 / }));
    const key = Object.keys(STRATEGY_DEFINITIONS)[1];
    expect(mockRouter.dismissTo).toHaveBeenCalledWith({
      pathname: "/analysis/[id]",
      params: expect.objectContaining({ id: "an-1", strategy: key, at: expect.any(String) }),
    });
  });

  it("marks the strategy it was opened from", async () => {
    mockParams = { id: "an-1", strategy: "bear_put_spread" };
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<CompareScreen />);
    const row = await screen.findByRole("button", { name: /Bear Put Spread, ROI/ });
    expect(row.props.accessibilityState.selected).toBe(true);
  });

  it("offers a retry when the analysis cannot be loaded", async () => {
    let attempt = 0;
    useApi({ "GET /api/analyses/an-1": () => (attempt++ === 0 ? failure(500, "boom") : DETAIL) });
    await renderApp(<CompareScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("header", { name: /Compare all/ })).toBeOnTheScreen();
  });
});

describe("Compare views (29)", () => {
  const pair = (): Decision => mergeCompareDecision(mergeCompareDecision(null, "left", decide("bullish")), "right", decide("bearish")) as Decision;

  it("switches to two views and offers to recommend", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<CompareScreen />);
    await fireEvent(await screen.findByLabelText("Compare views"), "valueChange", true);
    expect(await screen.findByRole("header", { name: "Compare views" })).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole("button", { name: "Recommend" }));
    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: "/analysis/[id]/recommend",
      params: { id: "an-1", pane: "left", from: "compare" },
    });
  });

  it("opens on the two views when a pair was saved, and goes back to the list with the switch", async () => {
    useApi({ "GET /api/analyses/an-1": withDecision(pair()) });
    await renderApp(<CompareScreen />);
    expect(await screen.findByRole("header", { name: "Compare views" })).toBeOnTheScreen();
    await fireEvent(screen.getByLabelText("Compare views"), "valueChange", false);
    expect(await screen.findByRole("header", { name: /Compare all/ })).toBeOnTheScreen();
  });
});

describe("Which strategy fits? sheet (30 to 32, 34)", () => {
  const field = () => screen.getByLabelText("Max loss per trade");
  const radio = (name: string) => screen.getByRole("radio", { name });

  it("starts on Bullish and 20,000 for an analysis that was never scored", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<RecommendSheet />);
    expect(await screen.findByRole("header", { name: "Which strategy fits?" })).toBeOnTheScreen();
    expect(radio("Bullish").props.accessibilityState.selected).toBe(true);
    expect(field()).toHaveDisplayValue("20,000");
  });

  it("starts from what was scored last, even when the analysis arrives after the sheet opens", async () => {
    useApi({ "GET /api/analyses/an-1": withDecision(decide("neutral", 5000)) });
    await renderApp(<RecommendSheet />);
    await waitFor(() => expect(radio("Neutral").props.accessibilityState.selected).toBe(true));
    expect(field()).toHaveDisplayValue("5,000");
  });

  it("scores the chosen view and budget, then opens the result", async () => {
    const api = useApi({ "GET /api/analyses/an-1": DETAIL, "POST /api/decide": decide("volatile", 8000) });
    await renderApp(<RecommendSheet />);
    await fireEvent.press(await screen.findByRole("radio", { name: "Volatile" }));
    await fireEvent.changeText(field(), "8000");
    await fireEvent.press(screen.getByRole("button", { name: "Recommend" }));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/analysis/[id]/recommendation", params: { id: "an-1" } }));
    const call = api.calls.find((c) => c.method === "POST")!;
    expect(JSON.parse(String(call.init?.body))).toEqual({ analysisId: "an-1", view: "volatile", maxLoss: 8000 });
  });

  it("shows Scoring… and locks the form while it waits", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL, "POST /api/decide": () => new Promise(() => {}) });
    await renderApp(<RecommendSheet />);
    await fireEvent.press(await screen.findByRole("button", { name: "Recommend" }));
    expect(await screen.findByText("Scoring…")).toBeOnTheScreen();
    expect(radio("Bearish").props.accessibilityState.disabled).toBe(true);
  });

  it("will not score an empty or zero budget", async () => {
    const api = useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<RecommendSheet />);
    await fireEvent.changeText(await screen.findByLabelText("Max loss per trade"), "0");
    await fireEvent.press(screen.getByRole("button", { name: "Recommend" }));
    expect(api.calls.some((c) => c.method === "POST")).toBe(false);
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("says why scoring failed, and clears the message when the form changes", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL, "POST /api/decide": failure(404, "Analysis not found") });
    await renderApp(<RecommendSheet />);
    await fireEvent.press(await screen.findByRole("button", { name: "Recommend" }));
    expect(await screen.findByText("Recommendation failed")).toBeOnTheScreen();
    expect(screen.getByText("Run the analysis again to get a recommendation, then try again.")).toBeOnTheScreen();
    expect(mockRouter.replace).not.toHaveBeenCalled();

    await fireEvent.changeText(field(), "9000");
    expect(screen.queryByText("Recommendation failed")).not.toBeOnTheScreen();
  });

  it("scores one pane of Compare views and goes back to it", async () => {
    mockParams = { id: "an-1", pane: "right", from: "compare" };
    const api = useApi({ "GET /api/analyses/an-1": DETAIL, "POST /api/decide": decide("bearish") });
    await renderApp(<RecommendSheet />);
    expect(await screen.findByRole("radio", { name: "Bearish" })).toBeOnTheScreen();
    expect(radio("Bearish").props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByRole("button", { name: "Recommend" }));

    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    expect(JSON.parse(String(api.calls.find((c) => c.method === "POST")!.init?.body))).toMatchObject({ view: "bearish", pane: "right" });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("lets the pane be switched, resetting to that pane's own view", async () => {
    mockParams = { id: "an-1", pane: "left", from: "compare" };
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<RecommendSheet />);
    expect((await screen.findByRole("radio", { name: "Bullish" })).props.accessibilityState.selected).toBe(true);
    await fireEvent.press(screen.getByRole("tab", { name: "Right view" }));
    expect(radio("Bearish").props.accessibilityState.selected).toBe(true);
  });

  it("closes back onto the result when it was opened from the result", async () => {
    mockParams = { id: "an-1", from: "result" };
    useApi({ "GET /api/analyses/an-1": DETAIL, "POST /api/decide": decide("bullish") });
    await renderApp(<RecommendSheet />);
    await fireEvent.press(await screen.findByRole("button", { name: "Recommend" }));
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("closes from the X", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<RecommendSheet />);
    await fireEvent.press(await screen.findByRole("button", { name: "Close" }));
    expect(mockRouter.back).toHaveBeenCalled();
  });
});

describe("Recommendation (33, 35)", () => {
  it("asks to score when nothing has been", async () => {
    useApi({ "GET /api/analyses/an-1": DETAIL });
    await renderApp(<RecommendationScreen />);
    expect(await screen.findByText("Nothing scored yet")).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole("button", { name: "Recommend" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/analysis/[id]/recommend", params: { id: "an-1", from: "result" } });
  });

  it("shows the pick, the three best and what the model said", async () => {
    const decision: Decision = { ...decide("neutral"), summary: "# Why this fits\n- Cheap to hold" };
    useApi({ "GET /api/analyses/an-1": withDecision(decision) });
    await renderApp(<RecommendationScreen />);

    expect(await screen.findByText("Neutral view · max loss ₹20,000 per trade")).toBeOnTheScreen();
    expect(screen.getByRole("header", { name: nameOf(decision.best!.key) })).toBeOnTheScreen();
    expect(screen.getByText("Recommended · top quant score")).toBeOnTheScreen();
    expect(screen.getByText("Why this fits")).toBeOnTheScreen();
    expect(screen.getByText("Cheap to hold")).toBeOnTheScreen();
    const ranked = screen.getAllByRole("button", { name: /^\d\d .*score \d+$/ });
    expect(ranked).toHaveLength(3);
    expect(ranked.map((row) => row.props.accessibilityLabel.split(",")[0])).toEqual(
      decision.strategies.slice(0, 3).map((s, i) => `0${i + 1} ${nameOf(s.key)}`),
    );
  });

  it("expands a row to its reasons and opens its payoff", async () => {
    const decision = decide("bullish");
    useApi({ "GET /api/analyses/an-1": withDecision(decision) });
    await renderApp(<RecommendationScreen />);
    const second = await screen.findByRole("button", { name: /^02 .*score/ });
    await fireEvent.press(second);
    expect(screen.getAllByRole("button", { name: `Show payoff for ${nameOf(decision.strategies[1].key)}` })).toHaveLength(1);
    await fireEvent.press(screen.getByRole("button", { name: `Show payoff for ${nameOf(decision.strategies[1].key)}` }));
    expect(mockRouter.dismissTo).toHaveBeenCalledWith({
      pathname: "/analysis/[id]",
      params: expect.objectContaining({ strategy: decision.strategies[1].key }),
    });
  });

  it("opens the best strategy's payoff, or rescoring", async () => {
    const decision = decide("neutral");
    useApi({ "GET /api/analyses/an-1": withDecision(decision) });
    await renderApp(<RecommendationScreen />);
    await fireEvent.press(await screen.findByRole("button", { name: "Open payoff" }));
    expect(mockRouter.dismissTo).toHaveBeenCalledWith({
      pathname: "/analysis/[id]",
      params: expect.objectContaining({ strategy: decision.best!.key }),
    });
    await fireEvent.press(screen.getByRole("button", { name: "Rescore" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/analysis/[id]/recommend", params: { id: "an-1", from: "result" } });
  });

  it("says so when no strategy fits the budget, and offers to change it", async () => {
    useApi({ "GET /api/analyses/an-1": withDecision(decide("bullish", 1)) });
    await renderApp(<RecommendationScreen />);
    expect(await screen.findByText(/No strategy is viable for this view and loss budget/)).toBeOnTheScreen();
    expect(screen.queryByText(/^Recommended/)).not.toBeOnTheScreen();
    expect(screen.getAllByText("Not viable").length).toBeGreaterThan(0);
    await fireEvent.press(screen.getByRole("button", { name: "Change loss budget" }));
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/analysis/[id]/recommend", params: { id: "an-1", from: "result" } });
  });

  it("shows the latest of two saved views as the single result only when it is a single decision", async () => {
    const pair = mergeCompareDecision(mergeCompareDecision(null, "left", decide("bullish")), "right", decide("bearish"));
    useApi({ "GET /api/analyses/an-1": withDecision(pair) });
    await renderApp(<RecommendationScreen />);
    expect(await screen.findByText("Nothing scored yet")).toBeOnTheScreen();
  });
});
