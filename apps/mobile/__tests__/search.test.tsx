import { fireEvent, screen } from "@testing-library/react-native";
import SearchSheet from "@/app/(app)/search";
import { fakeApi, renderApp } from "./app-harness";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn() };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));

let mockApiFetch: ReturnType<typeof fakeApi>["apiFetch"];
jest.mock("@/lib/auth", () => ({ useAuth: () => ({ apiFetch: (path: string, init?: RequestInit) => mockApiFetch(path, init) }) }));

const SEARCH = "Search F&O symbol";

describe("Symbol search sheet (15 to 17)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const api = fakeApi({ "POST /api/analyze": () => new Promise(() => {}) });
    mockApiFetch = api.apiFetch;
  });

  it("starts with the popular stocks", async () => {
    await renderApp(<SearchSheet />);
    expect(screen.getByText("Popular F&O stocks")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: /^ICICIBANK,/ })).toBeOnTheScreen();
  });

  it("narrows the list as you type, and counts the matches", async () => {
    await renderApp(<SearchSheet />);
    await fireEvent.changeText(screen.getByLabelText(SEARCH), "rel");
    expect(screen.getByText("Matching derivatives")).toBeOnTheScreen();
    expect(screen.getByRole("button", { name: /^RELIANCE,/ })).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: /^SBIN,/ })).not.toBeOnTheScreen();
    expect(screen.getByText(/\d+ results?/)).toBeOnTheScreen();
  });

  it("tapping a match starts its analysis and moves on to the calculating screen", async () => {
    await renderApp(<SearchSheet />);
    await fireEvent.press(screen.getByRole("button", { name: /^SBIN,/ }));
    expect(mockApiFetch).toHaveBeenCalledWith("/api/analyze", expect.objectContaining({ method: "POST" }));
    expect(mockRouter.replace).toHaveBeenCalledWith("/analysis/new");
  });

  it("Return picks the first match, not the half-typed text", async () => {
    await renderApp(<SearchSheet />);
    const input = screen.getByLabelText(SEARCH);
    await fireEvent.changeText(input, "reli");
    await fireEvent(input, "submitEditing");
    const body = JSON.parse(String(mockApiFetch.mock.calls[0]![1]!.body));
    expect(body).toEqual({ company: "RELIANCE" });
  });

  it("Return on a symbol with no match queries it as typed", async () => {
    await renderApp(<SearchSheet />);
    const input = screen.getByLabelText(SEARCH);
    await fireEvent.changeText(input, "zzzq");
    expect(screen.getByText(/No predefined match/)).toBeOnTheScreen();
    await fireEvent(input, "submitEditing");
    expect(JSON.parse(String(mockApiFetch.mock.calls[0]![1]!.body))).toEqual({ company: "ZZZQ" });
  });

  it("does nothing on Return with an empty field", async () => {
    await renderApp(<SearchSheet />);
    await fireEvent(screen.getByLabelText(SEARCH), "submitEditing");
    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it("Cancel closes the sheet without analysing", async () => {
    await renderApp(<SearchSheet />);
    await fireEvent.press(screen.getByRole("link", { name: "Cancel" }));
    expect(mockRouter.back).toHaveBeenCalled();
    expect(mockApiFetch).not.toHaveBeenCalled();
  });
});
