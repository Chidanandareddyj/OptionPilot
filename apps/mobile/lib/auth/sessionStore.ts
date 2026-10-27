import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import type { AuthMode, AuthUser, StoredSession } from "./types";

/** Where the session is kept between launches. */
export interface SessionStore {
  load(): Promise<StoredSession | null>;
  save(session: StoredSession): Promise<void>;
  clear(): Promise<void>;
}

export type KeyValueBackend = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  deleteItem(key: string): Promise<void>;
};

const SESSION_KEY = "optionpilot.session";

/** iOS Keychain and Android Keystore. The session token never goes anywhere less safe on a device. */
const secureBackend: KeyValueBackend = {
  getItem: (key) => SecureStore.getItemAsync(key),
  setItem: (key, value) => SecureStore.setItemAsync(key, value),
  deleteItem: (key) => SecureStore.deleteItemAsync(key),
};

/** Browsers have no secure storage. This only serves the web preview used for design checks. */
const previewBackend: KeyValueBackend = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  deleteItem: (key) => AsyncStorage.removeItem(key),
};

function parse(raw: string): StoredSession | null {
  try {
    const value = JSON.parse(raw) as Partial<StoredSession> | null;
    if (!value || (value.mode !== "bearer" && value.mode !== "cookie")) return null;
    const user = value.user as Partial<AuthUser> | undefined;
    if (!user || typeof user.id !== "string" || typeof user.email !== "string") return null;
    const sessionToken = typeof value.sessionToken === "string" ? value.sessionToken : null;
    if (value.mode === "bearer" && !sessionToken) return null;
    const mode: AuthMode = value.mode;
    return { mode, sessionToken, user: { id: user.id, email: user.email, name: user.name ?? "" } };
  } catch {
    return null;
  }
}

export function createSessionStore(
  backend: KeyValueBackend = Platform.OS === "web" ? previewBackend : secureBackend,
): SessionStore {
  return {
    async load() {
      const raw = await backend.getItem(SESSION_KEY);
      return raw ? parse(raw) : null;
    },
    save: (session) => {
      // The avatar can be a large data URL, and secure storage is for the session token and identity.
      const { image: _image, ...user } = session.user;
      return backend.setItem(SESSION_KEY, JSON.stringify({ ...session, user }));
    },
    clear: () => backend.deleteItem(SESSION_KEY),
  };
}
