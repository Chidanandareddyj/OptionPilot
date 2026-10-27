import Constants from "expo-constants";

export const DEFAULT_API_BASE_URL = "https://www.optionpilot.tech";

/** The web app that serves `/api/auth/*` and `/api/*`, from `extra.apiBaseUrl` in app.config.ts. */
export function getApiBaseUrl(): string {
  const configured = Constants.expoConfig?.extra?.apiBaseUrl;
  const base = typeof configured === "string" && configured.length > 0 ? configured : DEFAULT_API_BASE_URL;
  return base.replace(/\/+$/, "");
}
