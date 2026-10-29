import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import AccountScreen from "@/app/(app)/settings/account";
import CreateOrganization from "@/app/(app)/settings/create-organization";
import Organizations from "@/app/(app)/settings/organizations";
import Security from "@/app/(app)/settings/security";
import SettingsTab from "@/app/(app)/(tabs)/settings";
import { AuthError } from "@/lib/auth/errors";
import type { AccountSession, LinkedAccount, Organization, SessionInfo } from "@/lib/auth/authApi";
import { renderThemed } from "./test-utils";

const mockRouter = { back: jest.fn(), push: jest.fn() };
jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories cannot use imports
  const React = require("react");
  return {
    useRouter: () => mockRouter,
    useIsFocused: () => true,
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), [effect]);
    },
  };
});

const ME = { id: "u1", email: "asha@example.com", name: "Asha Rao" };
const mockAccount = {
  session: jest.fn<Promise<AccountSession>, []>(),
  changeEmail: jest.fn<Promise<void>, [string]>(),
  changePassword: jest.fn<Promise<void>, [string, string]>(),
  listAccounts: jest.fn<Promise<LinkedAccount[]>, []>(),
  listSessions: jest.fn<Promise<SessionInfo[]>, []>(),
  revokeSession: jest.fn<Promise<void>, [string]>(),
  listOrganizations: jest.fn<Promise<Organization[]>, []>(),
  createOrganization: jest.fn<Promise<void>, [string, string]>(),
};
const mockUpdateName = jest.fn<Promise<unknown>, [string]>();
jest.mock("@/lib/auth", () => ({
  ...jest.requireActual("@/lib/auth/errors"),
  useAuth: () => ({ user: ME, account: mockAccount, updateName: mockUpdateName }),
}));

function renderScreen(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
  return renderThemed(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const press = async (name: string | RegExp, index = 0) => fireEvent.press(screen.getAllByRole("button", { name })[index]!);

beforeEach(() => {
  jest.clearAllMocks();
  mockAccount.session.mockResolvedValue({ user: ME, sessionId: "s-1" });
  mockAccount.listAccounts.mockResolvedValue([]);
  mockAccount.listSessions.mockResolvedValue([]);
  mockAccount.listOrganizations.mockResolvedValue([]);
  mockAccount.changeEmail.mockResolvedValue();
  mockAccount.changePassword.mockResolvedValue();
  mockAccount.revokeSession.mockResolvedValue();
  mockAccount.createOrganization.mockResolvedValue();
  mockUpdateName.mockResolvedValue(null);
});

// Late query answers land inside act.
afterEach(async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
});

describe("Settings home (56, 57)", () => {
  it("shows the loading skeleton until the account details arrive", async () => {
    let release!: (value: AccountSession) => void;
    mockAccount.session.mockReturnValue(new Promise((resolve) => (release = resolve)));
    await renderScreen(<SettingsTab />);

    expect(screen.getByTestId("settings-loading")).toBeOnTheScreen();
    expect(screen.queryByText("Account")).toBeOnTheScreen(); // the kicker, not a row

    await act(async () => release({ user: ME, sessionId: "s-1" }));
    expect(await screen.findByText("asha@example.com")).toBeOnTheScreen();
    expect(screen.queryByTestId("settings-loading")).toBeNull();
  });

  it("lists the account rows and opens each one", async () => {
    await renderScreen(<SettingsTab />);
    await screen.findByText("Asha Rao");

    await press("Account");
    await press("Security");
    await press("Organizations");
    await press(/^Notifications/);
    await press("Sign out");
    await press("Delete account");

    expect(mockRouter.push.mock.calls.map(([path]) => path)).toEqual([
      "/settings/account",
      "/settings/security",
      "/settings/organizations",
      "/settings/notifications",
      "/sign-out",
      "/settings/delete-account",
    ]);
  });

  it("names the theme in the Appearance row", async () => {
    await renderScreen(<SettingsTab />);
    await screen.findByText("Asha Rao");
    expect(screen.getByText("System")).toBeOnTheScreen();
  });

  it("shows alerts as off until the phone has opted in", async () => {
    await renderScreen(<SettingsTab />);
    await screen.findByText("Asha Rao");
    expect(screen.getByRole("button", { name: /^Notifications/ })).toBeOnTheScreen();
    expect(screen.getByText("Off")).toBeOnTheScreen();
  });

  it("falls back to the identity saved on the device when the refresh fails", async () => {
    mockAccount.session.mockRejectedValue(new AuthError("network", "offline"));
    await renderScreen(<SettingsTab />);
    expect(await screen.findByText("asha@example.com")).toBeOnTheScreen();
  });
});

describe("Account (58, 59)", () => {
  it("saves a changed name through updateName", async () => {
    await renderScreen(<AccountScreen />);
    const field = await screen.findByDisplayValue("Asha Rao");

    await fireEvent.changeText(field, "Asha R");
    await press(/^Save name/);

    await waitFor(() => expect(mockUpdateName).toHaveBeenCalledWith("Asha R"));
    expect(await screen.findByText("Name saved.")).toBeOnTheScreen();
  });

  it("rejects an empty or over-long name without calling the server", async () => {
    await renderScreen(<AccountScreen />);
    const field = await screen.findByDisplayValue("Asha Rao");

    await fireEvent.changeText(field, "   ");
    await press(/^Save name/);
    expect(await screen.findByText("Enter your name.")).toBeOnTheScreen();

    await fireEvent.changeText(field, "x".repeat(40));
    await press(/^Save name/);
    expect(await screen.findByText("Use 32 characters at most.")).toBeOnTheScreen();
    expect(mockUpdateName).not.toHaveBeenCalled();
  });

  it("says when nothing changed", async () => {
    await renderScreen(<AccountScreen />);
    await screen.findByDisplayValue("Asha Rao");
    await press(/^Save name/);
    expect(await screen.findByText("No changes to save.")).toBeOnTheScreen();
    expect(mockUpdateName).not.toHaveBeenCalled();
  });

  it("asks for confirmation by email when the address changes, and validates it first", async () => {
    await renderScreen(<AccountScreen />);
    const field = await screen.findByDisplayValue("asha@example.com");

    await fireEvent.changeText(field, "not-an-email");
    await press(/^Save email/);
    expect(await screen.findByText("Enter a valid email address.")).toBeOnTheScreen();
    expect(mockAccount.changeEmail).not.toHaveBeenCalled();

    await fireEvent.changeText(field, "new@example.com");
    await press(/^Save email/);
    await waitFor(() => expect(mockAccount.changeEmail).toHaveBeenCalledWith("new@example.com"));
    expect(await screen.findByText("Check your inbox to confirm the new address.")).toBeOnTheScreen();
  });

  it("shows the server's reason when a name change fails", async () => {
    mockUpdateName.mockRejectedValue(new AuthError("unknown", "Name is not allowed."));
    await renderScreen(<AccountScreen />);
    await fireEvent.changeText(await screen.findByDisplayValue("Asha Rao"), "Asha R");
    await press(/^Save name/);
    expect(await screen.findByText("Name is not allowed.")).toBeOnTheScreen();
  });

  it("opens the avatar sheet from the avatar", async () => {
    await renderScreen(<AccountScreen />);
    await screen.findByDisplayValue("Asha Rao");
    await press("Change avatar");
    expect(mockRouter.push).toHaveBeenCalledWith("/settings/avatar");
  });
});

describe("Security (61)", () => {
  const fill = async (current: string, next: string, confirm: string) => {
    await fireEvent.changeText(screen.getByPlaceholderText("Current password"), current);
    await fireEvent.changeText(screen.getByPlaceholderText("New password"), next);
    await fireEvent.changeText(screen.getByPlaceholderText("Confirm password"), confirm);
  };

  it("checks the new password before calling the server", async () => {
    await renderScreen(<Security />);
    await fill("old-pass-1", "short", "short");
    await press(/^Save change password/);
    expect(await screen.findByText(/at least 8|8 characters/i)).toBeOnTheScreen();

    await fill("old-pass-1", "long-enough-1", "different-1");
    await press(/^Save change password/);
    expect(await screen.findByText(/match/i)).toBeOnTheScreen();
    expect(mockAccount.changePassword).not.toHaveBeenCalled();
  });

  it("changes the password and clears the fields", async () => {
    await renderScreen(<Security />);
    await fill("old-pass-1", "long-enough-1", "long-enough-1");
    await press(/^Save change password/);

    await waitFor(() => expect(mockAccount.changePassword).toHaveBeenCalledWith("old-pass-1", "long-enough-1"));
    expect(await screen.findByText("Password updated.")).toBeOnTheScreen();
    expect(screen.getByPlaceholderText("Current password").props.value).toBe("");
  });

  it("words a wrong current password plainly", async () => {
    mockAccount.changePassword.mockRejectedValue(new AuthError("invalid-credentials", "Invalid password", 400));
    await renderScreen(<Security />);
    await fill("wrong-pass", "long-enough-1", "long-enough-1");
    await press(/^Save change password/);
    expect((await screen.findAllByText("Your current password is not right.")).length).toBeGreaterThan(0);
  });

  it("shows connected accounts read-only, with no Unlink button", async () => {
    mockAccount.listAccounts.mockResolvedValue([
      { id: "a1", providerId: "google" },
      { id: "a2", providerId: "credential" },
    ]);
    await renderScreen(<Security />);
    expect(await screen.findByText("Google")).toBeOnTheScreen();
    expect(screen.queryByRole("button", { name: /unlink/i })).toBeNull();
  });

  it("lists sessions, marks this device, and revokes another one", async () => {
    mockAccount.listSessions.mockResolvedValue([
      { id: "s-1", token: "t-1", userAgent: "Mozilla/5.0 (iPhone) Safari/604", ipAddress: "1.1.1.1", createdAt: "2026-10-26T00:00:00Z" },
      { id: "s-2", token: "t-2", userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/130 Safari/537", ipAddress: "2.2.2.2", createdAt: "2026-10-25T00:00:00Z" },
    ]);
    await renderScreen(<Security />);

    expect(await screen.findByText("This device")).toBeOnTheScreen();
    expect(screen.getAllByRole("button", { name: /^Revoke/ })).toHaveLength(1);

    await press(/^Revoke Windows/);

    await waitFor(() => expect(mockAccount.revokeSession).toHaveBeenCalledWith("t-2"));
    await waitFor(() => expect(screen.queryByText("Windows · Chrome")).toBeNull());
    expect(screen.getByText("This device")).toBeOnTheScreen();
  });

  it("keeps the session in the list and says so when a revoke fails", async () => {
    mockAccount.listSessions.mockResolvedValue([
      { id: "s-2", token: "t-2", userAgent: "Mozilla/5.0 (Windows NT 10.0) Chrome/130 Safari/537", ipAddress: null, createdAt: null },
    ]);
    mockAccount.revokeSession.mockRejectedValue(new AuthError("unknown", "nope"));
    await renderScreen(<Security />);
    await screen.findByText("Windows · Chrome");

    await press(/^Revoke/);

    expect(await screen.findByText("Could not sign that device out. Try again.")).toBeOnTheScreen();
    expect(screen.getByText("Windows · Chrome")).toBeOnTheScreen();
  });
});

describe("Organizations (62)", () => {
  it("shows the empty state with a Create organization button", async () => {
    await renderScreen(<Organizations />);
    expect(await screen.findByText("No organizations yet")).toBeOnTheScreen();
    await press("Create organization");
    expect(mockRouter.push).toHaveBeenCalledWith("/settings/create-organization");
  });

  it("lists organizations by name and slug", async () => {
    mockAccount.listOrganizations.mockResolvedValue([{ id: "o1", name: "Acme Capital", slug: "acme-capital", logo: null }]);
    await renderScreen(<Organizations />);
    expect(await screen.findByText("Acme Capital")).toBeOnTheScreen();
    expect(screen.getByText("acme-capital")).toBeOnTheScreen();
    expect(screen.queryByText("No organizations yet")).toBeNull();
  });

  it("offers a retry when the list cannot load", async () => {
    mockAccount.listOrganizations.mockRejectedValueOnce(new AuthError("network", "offline"));
    await renderScreen(<Organizations />);
    expect(await screen.findByText("Could not load organizations")).toBeOnTheScreen();

    mockAccount.listOrganizations.mockResolvedValue([{ id: "o1", name: "Acme", slug: "acme", logo: null }]);
    await press("Try again");
    expect(await screen.findByText("Acme")).toBeOnTheScreen();
  });
});

describe("Create organization", () => {
  it("fills the slug from the name, creates, and closes", async () => {
    await renderScreen(<CreateOrganization />);
    await fireEvent.changeText(screen.getByLabelText("Name"), "Acme Capital");
    expect(screen.getByLabelText("Slug").props.value).toBe("acme-capital");

    await press("Create organization");

    await waitFor(() => expect(mockAccount.createOrganization).toHaveBeenCalledWith("Acme Capital", "acme-capital"));
    await waitFor(() => expect(mockRouter.back).toHaveBeenCalled());
  });

  it("does not submit a bad slug", async () => {
    await renderScreen(<CreateOrganization />);
    await fireEvent.changeText(screen.getByLabelText("Name"), "Acme");
    await fireEvent.changeText(screen.getByLabelText("Slug"), "Bad Slug!");
    await press("Create organization");
    expect(await screen.findByText("Use lowercase letters, numbers and dashes.")).toBeOnTheScreen();
    expect(mockAccount.createOrganization).not.toHaveBeenCalled();
  });

  it("shows the server's message when the slug is taken", async () => {
    mockAccount.createOrganization.mockRejectedValue(new AuthError("unknown", "Slug is taken"));
    await renderScreen(<CreateOrganization />);
    await fireEvent.changeText(screen.getByLabelText("Name"), "Acme");
    await press("Create organization");
    expect(await screen.findByText("Slug is taken")).toBeOnTheScreen();
    expect(mockRouter.back).not.toHaveBeenCalled();
  });
});
