import { fireEvent, screen } from "@testing-library/react-native";
import SignOutConfirm from "@/app/(app)/sign-out";
import { AuthProvider } from "@/lib/auth";
import { createAuthApi } from "@/lib/auth/authApi";
import { createSessionStore } from "@/lib/auth/sessionStore";
import { renderThemed } from "../test-utils";
import { jsonResponse, memoryBackend, USER } from "./helpers";

const BASE = "https://www.optionpilot.tech";
const mockRouter = { back: jest.fn() };
jest.mock("expo-router", () => ({ useRouter: () => mockRouter }));

async function renderSheet(initial: Record<string, string>) {
  const backend = memoryBackend(initial);
  const fetchImpl = jest.fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>(async () => jsonResponse({ success: true }));
  await renderThemed(
    <AuthProvider api={createAuthApi({ baseUrl: BASE, fetchImpl })} store={createSessionStore(backend)} baseUrl={BASE}>
      <SignOutConfirm />
    </AuthProvider>,
  );
  return { backend, fetchImpl };
}

const stored = {
  "optionpilot.session": JSON.stringify({ mode: "bearer", sessionToken: "signed.token", user: USER }),
};

describe("sign-out confirmation (64)", () => {
  beforeEach(() => jest.clearAllMocks());

  it("names the account that will be signed out", async () => {
    await renderSheet(stored);
    expect(await screen.findByText("Sign out of OptionPilot?")).toBeOnTheScreen();
    expect(await screen.findByText(USER.email)).toBeOnTheScreen();
  });

  it("cancel leaves the session alone", async () => {
    const { backend, fetchImpl } = await renderSheet(stored);
    await fireEvent.press(screen.getAllByRole("button", { name: "Cancel" })[1]!);
    expect(mockRouter.back).toHaveBeenCalled();
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(backend.data.size).toBe(1);
  });

  it("signing out clears secure storage and tells the server", async () => {
    const { backend, fetchImpl } = await renderSheet(stored);
    await screen.findByText(USER.email);
    await fireEvent.press(screen.getByRole("button", { name: "Sign out" }));

    expect(backend.data.size).toBe(0);
    expect(String(fetchImpl.mock.calls[0]![0])).toBe(`${BASE}/api/auth/sign-out`);
  });
});
