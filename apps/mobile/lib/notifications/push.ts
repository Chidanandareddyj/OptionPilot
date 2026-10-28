import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import {
  AndroidImportance,
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  setNotificationChannelAsync,
  setNotificationHandler,
} from "expo-notifications";
import { Platform } from "react-native";

const KEY = "optionpilot.pushToken";

export type PushFetch = (path: string, init?: RequestInit) => Promise<Response>;

/** Show an alert while the app is open. No sound: the phone is already in the person's hand. */
export function configurePush(): void {
  if (Platform.OS === "web") return;
  setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

function easProjectId(): string | undefined {
  const id = Constants.expoConfig?.extra?.eas?.projectId;
  return typeof id === "string" && id.length > 0 ? id : undefined;
}

/** True only after this phone opted in and the system permission is still granted. */
export async function pushIsOn(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const token = await AsyncStorage.getItem(KEY);
  if (!token) return false;
  const permission = await getPermissionsAsync();
  return permission.status === "granted";
}

/**
 * Asks for permission, then registers the Expo token. Returns "denied" without registering
 * when the person says no. Web preview cannot receive a push.
 */
export async function enablePush(apiFetch: PushFetch): Promise<"on" | "denied" | "unavailable"> {
  if (Platform.OS === "web") return "unavailable";
  const existing = await getPermissionsAsync();
  const status = existing.status === "granted" ? existing.status : (await requestPermissionsAsync()).status;
  if (status !== "granted") return "denied";
  if (Platform.OS === "android") {
    await setNotificationChannelAsync("alerts", {
      name: "Price alerts",
      importance: AndroidImportance.DEFAULT,
    });
  }
  const token = (await getExpoPushTokenAsync({ projectId: easProjectId() })).data;
  const response = await apiFetch("/api/devices", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ token, platform: Platform.OS }),
  });
  if (!response.ok) throw new Error("Could not register this phone.");
  await AsyncStorage.setItem(KEY, token);
  return "on";
}

/** Tells the server to forget this phone, then forgets the token locally. A failed request still clears the phone. */
export async function disablePush(apiFetch: PushFetch): Promise<void> {
  const token = await AsyncStorage.getItem(KEY);
  if (token && Platform.OS !== "web") {
    await apiFetch("/api/devices", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token }),
    }).catch(() => {});
  }
  await AsyncStorage.removeItem(KEY);
}

/** The account route deletes every device. This only forgets the token kept on the phone. */
export async function clearPushToken(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
