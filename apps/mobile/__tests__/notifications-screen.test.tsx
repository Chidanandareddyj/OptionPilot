import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, fireEvent, screen, waitFor } from "@testing-library/react-native";
import * as Notifications from "expo-notifications";
import NotificationsScreen from "@/app/(app)/settings/notifications";
import { renderThemed } from "./test-utils";

const calls: { path: string; method: string; body: string }[] = [];
const mockApiFetch = jest.fn(async (path: string, init?: RequestInit) => {
  calls.push({ path, method: init?.method ?? "GET", body: String(init?.body ?? "") });
  return new Response(JSON.stringify({ ok: true }), { status: 200 });
});

jest.mock("expo-router", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- jest.mock factories cannot use imports
  const React = require("react");
  return {
    useRouter: () => ({ back: jest.fn(), canGoBack: () => true, replace: jest.fn() }),
    useFocusEffect: (effect: () => void | (() => void)) => {
      React.useEffect(() => effect(), [effect]);
    },
  };
});

jest.mock("@/lib/auth", () => ({
  useAuth: () => ({ apiFetch: (path: string, init?: RequestInit) => mockApiFetch(path, init) }),
}));

beforeEach(async () => {
  calls.length = 0;
  mockApiFetch.mockClear();
  await AsyncStorage.clear();
  (Notifications.getPermissionsAsync as jest.Mock).mockResolvedValue({ status: "undetermined" });
  (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "granted" });
  (Notifications.getExpoPushTokenAsync as jest.Mock).mockResolvedValue({ data: "ExponentPushToken[test]" });
});

describe("Notifications", () => {
  it("stays off until the switch is turned on, then registers this phone", async () => {
    await renderThemed(<NotificationsScreen />);
    const toggle = await screen.findByLabelText("Price alerts");
    expect(toggle.props.value).toBe(false);
    expect(calls).toEqual([]);

    await act(async () => {
      fireEvent(toggle, "valueChange", true);
    });

    await waitFor(() => expect(calls).toHaveLength(1));
    expect(calls[0]).toMatchObject({ path: "/api/devices", method: "POST" });
    expect(JSON.parse(calls[0].body)).toEqual({ token: "ExponentPushToken[test]", platform: "ios" });
    expect(screen.getByLabelText("Price alerts").props.value).toBe(true);

    await act(async () => {
      fireEvent(screen.getByLabelText("Price alerts"), "valueChange", false);
    });
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls[1]).toMatchObject({ path: "/api/devices", method: "DELETE" });
    expect(JSON.parse(calls[1].body)).toEqual({ token: "ExponentPushToken[test]" });
    expect(screen.getByLabelText("Price alerts").props.value).toBe(false);
  });

  it("does not register the phone when permission is denied", async () => {
    (Notifications.requestPermissionsAsync as jest.Mock).mockResolvedValue({ status: "denied" });
    await renderThemed(<NotificationsScreen />);
    await act(async () => {
      fireEvent(await screen.findByLabelText("Price alerts"), "valueChange", true);
    });
    expect(await screen.findByText("Notifications are blocked")).toBeOnTheScreen();
    expect(calls).toEqual([]);
    expect(screen.getByLabelText("Price alerts").props.value).toBe(false);
  });
});
