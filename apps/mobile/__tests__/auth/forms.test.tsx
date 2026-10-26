import { act, fireEvent, screen } from "@testing-library/react-native";
import type { ComponentType } from "react";
import ForgotPassword from "@/app/(auth)/forgot-password";
import SignIn from "@/app/(auth)/sign-in";
import SignUp from "@/app/(auth)/sign-up";
import VerifyEmail from "@/app/(auth)/verify-email";
import { createAuthApi } from "@/lib/auth/authApi";
import { AuthProvider } from "@/lib/auth";
import { createSessionStore } from "@/lib/auth/sessionStore";
import { renderThemed } from "../test-utils";
import { jsonResponse, makeJwt, memoryBackend, USER } from "./helpers";

const BASE = "https://www.optionpilot.tech";

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn(() => true) };
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));

let fetchImpl: jest.Mock<ReturnType<typeof fetch>, Parameters<typeof fetch>>;
let backend: ReturnType<typeof memoryBackend>;

beforeEach(() => {
  jest.clearAllMocks();
  mockParams = {};
  fetchImpl = jest.fn();
  backend = memoryBackend();
});

async function renderScreen(Screen: ComponentType) {
  const api = createAuthApi({ baseUrl: BASE, fetchImpl });
  await renderThemed(
    <AuthProvider api={api} store={createSessionStore(backend)} baseUrl={BASE}>
      <Screen />
    </AuthProvider>,
  );
}

const paths = () => fetchImpl.mock.calls.map(([url]) => String(url).replace(`${BASE}/api/auth`, ""));
const bodyOf = (index: number) => JSON.parse(fetchImpl.mock.calls[index]![1]!.body as string);
const button = (name: string) => screen.getByRole("button", { name });

describe("sign in (05, 06, 07)", () => {
  it("keeps Log in disabled until both fields have something in them", async () => {
    await renderScreen(SignIn);
    expect(button("Log in")).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Email"), "asha@example.com");
    expect(button("Log in")).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Password"), "hunter22!");
    expect(button("Log in")).toBeEnabled();
  });

  it("shows a field message for an invalid email and sends nothing", async () => {
    await renderScreen(SignIn);
    await fireEvent.changeText(screen.getByLabelText("Email"), "asha@");
    await fireEvent.changeText(screen.getByLabelText("Password"), "x");
    await fireEvent.press(button("Log in"));
    expect(screen.getByText("Enter a valid email address.")).toBeOnTheScreen();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("shows the error card for wrong credentials", async () => {
    fetchImpl.mockResolvedValue(jsonResponse({ code: "INVALID_EMAIL_OR_PASSWORD" }, { status: 401 }));
    await renderScreen(SignIn);
    await fireEvent.changeText(screen.getByLabelText("Email"), "asha@example.com");
    await fireEvent.changeText(screen.getByLabelText("Password"), "wrong");
    await fireEvent.press(button("Log in"));

    expect(await screen.findByText("Could not sign in")).toBeOnTheScreen();
    expect(
      screen.getByText("Incorrect email or password. Check both and try again, or reset your password."),
    ).toBeOnTheScreen();
    expect(backend.data.size).toBe(0);
  });

  it("stores the session after a good sign-in", async () => {
    fetchImpl
      .mockResolvedValueOnce(jsonResponse({ user: USER }, { headers: { "set-auth-token": "signed.token" } }))
      .mockResolvedValueOnce(jsonResponse({ token: makeJwt(Math.floor(Date.now() / 1000) + 900) }));
    await renderScreen(SignIn);
    await fireEvent.changeText(screen.getByLabelText("Email"), "asha@example.com");
    await fireEvent.changeText(screen.getByLabelText("Password"), "hunter22!");
    await fireEvent.press(button("Log in"));

    expect(paths()).toEqual(["/sign-in/email", "/token"]);
    expect(backend.data.size).toBe(1);
  });

  it("sends an unverified account to the code screen with a new code", async () => {
    fetchImpl
      .mockResolvedValueOnce(jsonResponse({ code: "EMAIL_NOT_VERIFIED" }, { status: 403 }))
      .mockResolvedValueOnce(jsonResponse({ success: true }));
    await renderScreen(SignIn);
    await fireEvent.changeText(screen.getByLabelText("Email"), " asha@example.com ");
    await fireEvent.changeText(screen.getByLabelText("Password"), "hunter22!");
    await fireEvent.press(button("Log in"));

    expect(paths()).toEqual(["/sign-in/email", "/email-otp/send-verification-otp"]);
    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: "/verify-email", params: { email: "asha@example.com" } });
  });

  it("shows and hides the password", async () => {
    await renderScreen(SignIn);
    expect(screen.getByLabelText("Password")).toHaveProp("secureTextEntry", true);
    await fireEvent.press(button("Show password"));
    expect(screen.getByLabelText("Password")).toHaveProp("secureTextEntry", false);
  });

  it("links to forgot password and sign up", async () => {
    await renderScreen(SignIn);
    await fireEvent.press(screen.getByRole("link", { name: "Forgot your password?" }));
    await fireEvent.press(screen.getByRole("link", { name: "Sign up" }));
    expect(mockRouter.push.mock.calls).toEqual([["/forgot-password"], ["/sign-up"]]);
  });
});

describe("sign up (08)", () => {
  async function fill(values: { name?: string; email?: string; password?: string; confirm?: string }) {
    if (values.name !== undefined) await fireEvent.changeText(screen.getByLabelText("Name"), values.name);
    if (values.email !== undefined) await fireEvent.changeText(screen.getByLabelText("Email"), values.email);
    if (values.password !== undefined) await fireEvent.changeText(screen.getByLabelText("Password"), values.password);
    if (values.confirm !== undefined) await fireEvent.changeText(screen.getByLabelText("Confirm password"), values.confirm);
  }

  it("flags every empty field", async () => {
    await renderScreen(SignUp);
    await fireEvent.press(button("Create account"));
    for (const message of ["Enter your name.", "Enter your email.", "Enter a password.", "Confirm your password."]) {
      expect(screen.getByText(message)).toBeOnTheScreen();
    }
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("flags a short password and a mismatch, and clears a message once the field is edited", async () => {
    await renderScreen(SignUp);
    await fill({ name: "Asha", email: "asha@example.com", password: "short", confirm: "shorter" });
    await fireEvent.press(button("Create account"));
    expect(screen.getByText("Use at least 8 characters.")).toBeOnTheScreen();
    expect(screen.getByText("Passwords do not match.")).toBeOnTheScreen();

    await fill({ password: "hunter22!" });
    expect(screen.queryByText("Use at least 8 characters.")).toBeNull();
  });

  it("creates the account, asks for a code, drops any session and opens the code screen", async () => {
    fetchImpl.mockImplementation(async () => jsonResponse({ user: USER }));
    await renderScreen(SignUp);
    await fill({ name: "Asha", email: "asha@example.com", password: "hunter22!", confirm: "hunter22!" });
    await fireEvent.press(button("Create account"));

    expect(paths()).toEqual(["/sign-up/email", "/email-otp/send-verification-otp", "/sign-out"]);
    expect(bodyOf(0)).toEqual({ name: "Asha", email: "asha@example.com", password: "hunter22!" });
    expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: "/verify-email", params: { email: "asha@example.com" } });
    expect(backend.data.size).toBe(0);
  });

  it("explains an existing account", async () => {
    fetchImpl.mockResolvedValue(jsonResponse({ code: "USER_ALREADY_EXISTS" }, { status: 422 }));
    await renderScreen(SignUp);
    await fill({ name: "Asha", email: "asha@example.com", password: "hunter22!", confirm: "hunter22!" });
    await fireEvent.press(button("Create account"));
    expect(await screen.findByText("Account already exists")).toBeOnTheScreen();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });
});

describe("verify email (09, 10)", () => {
  beforeEach(() => {
    mockParams = { email: "asha@example.com" };
  });

  it("shows the address, keeps Verify disabled until six digits and keeps only digits", async () => {
    await renderScreen(VerifyEmail);
    expect(screen.getByText("asha@example.com")).toBeOnTheScreen();
    expect(screen.getByText("0:30")).toBeOnTheScreen();
    expect(button("Verify email")).toBeDisabled();
    await fireEvent.changeText(screen.getByLabelText("Verification code"), "48a29-15");
    expect(screen.getByLabelText("Verification code")).toHaveProp("value", "482915");
    expect(button("Verify email")).toBeEnabled();
  });

  it("verifies, shows the confirmation and opens sign-in after 3 s", async () => {
    jest.useFakeTimers();
    try {
      fetchImpl.mockResolvedValue(jsonResponse({ status: true }));
      await renderScreen(VerifyEmail);
      await fireEvent.changeText(screen.getByLabelText("Verification code"), "482915");
      await fireEvent.press(button("Verify email"));

      expect(bodyOf(0)).toEqual({ email: "asha@example.com", otp: "482915" });
      expect(screen.getByText("Email verified")).toBeOnTheScreen();
      expect(mockRouter.replace).not.toHaveBeenCalled();
      await act(async () => {
        jest.advanceTimersByTime(3000);
      });
      expect(mockRouter.replace).toHaveBeenCalledWith("/sign-in");
    } finally {
      jest.useRealTimers();
    }
  });

  it("shows the error card for a wrong code", async () => {
    fetchImpl.mockResolvedValue(jsonResponse({ code: "INVALID_OTP" }, { status: 400 }));
    await renderScreen(VerifyEmail);
    await fireEvent.changeText(screen.getByLabelText("Verification code"), "000000");
    await fireEvent.press(button("Verify email"));
    expect(await screen.findByText("Could not verify")).toBeOnTheScreen();
    expect(screen.getByText("That code is not right. Check it and try again.")).toBeOnTheScreen();
  });

  it("offers a new code once the wait is over", async () => {
    jest.useFakeTimers();
    try {
      fetchImpl.mockResolvedValue(jsonResponse({ success: true }));
      await renderScreen(VerifyEmail);
      expect(screen.queryByRole("link", { name: "Resend code" })).toBeNull();
      await act(async () => {
        jest.advanceTimersByTime(30_000);
      });
      await fireEvent.press(screen.getByRole("link", { name: "Resend code" }));
      expect(paths()).toEqual(["/email-otp/send-verification-otp"]);
      expect(screen.getByText("0:30")).toBeOnTheScreen();
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("forgot password (11, 12)", () => {
  it("checks the email before sending", async () => {
    await renderScreen(ForgotPassword);
    await fireEvent.press(button("Send reset link"));
    expect(screen.getByText("Enter your email.")).toBeOnTheScreen();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("sends the link and shows where it went", async () => {
    fetchImpl.mockResolvedValue(jsonResponse({ status: true }));
    await renderScreen(ForgotPassword);
    await fireEvent.changeText(screen.getByLabelText("Email"), "asha@example.com");
    await fireEvent.press(button("Send reset link"));

    expect(paths()).toEqual(["/request-password-reset"]);
    expect(bodyOf(0)).toEqual({ email: "asha@example.com", redirectTo: `${BASE}/auth/reset-password` });
    expect(await screen.findByText("Check your email")).toBeOnTheScreen();
    expect(screen.getByText("asha@example.com")).toBeOnTheScreen();
    expect(button("Open email app")).toBeOnTheScreen();
  });

  it("shows the error card when the request fails", async () => {
    fetchImpl.mockRejectedValue(new TypeError("Network request failed"));
    await renderScreen(ForgotPassword);
    await fireEvent.changeText(screen.getByLabelText("Email"), "asha@example.com");
    await fireEvent.press(button("Send reset link"));
    expect(await screen.findByText("Could not send")).toBeOnTheScreen();
    expect(screen.getByText("Could not reach OptionPilot. Check your connection and try again.")).toBeOnTheScreen();
  });
});
