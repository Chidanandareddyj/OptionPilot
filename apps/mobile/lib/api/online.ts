import NetInfo from "@react-native-community/netinfo";
import { focusManager, onlineManager } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { AppState } from "react-native";

type NetState = { isConnected: boolean | null; isInternetReachable: boolean | null };

/** Offline only when the device says so: an unknown reachability counts as online. */
export const isOnline = (state: NetState) => state.isConnected !== false && state.isInternetReachable !== false;

/** Points React Query's online and focus signals at the device. Returns the cleanup. */
export function connectQueryManagers(): () => void {
  onlineManager.setEventListener((setOnline) => NetInfo.addEventListener((state) => setOnline(isOnline(state))));
  const subscription = AppState.addEventListener("change", (status) => focusManager.setFocused(status === "active"));
  return () => subscription.remove();
}

/** Whether the device can reach the internet, updating as it changes. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    let live = true;
    void NetInfo.fetch().then((state) => live && setOnline(isOnline(state)));
    const unsubscribe = NetInfo.addEventListener((state) => setOnline(isOnline(state)));
    return () => {
      live = false;
      unsubscribe();
    };
  }, []);
  return online;
}
