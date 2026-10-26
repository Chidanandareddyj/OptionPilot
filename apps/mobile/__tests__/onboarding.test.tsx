import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { ONBOARDING_STORAGE_KEY, OnboardingProvider, useOnboarding } from "@/lib/onboarding";

const wrapper = ({ children }: { children: ReactNode }) => <OnboardingProvider>{children}</OnboardingProvider>;

beforeEach(() => AsyncStorage.clear());

describe("OnboardingProvider", () => {
  it("starts unseen and remembers completion", async () => {
    const { result } = await renderHook(useOnboarding, { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.seen).toBe(false);
    await act(() => result.current.complete());
    expect(result.current.seen).toBe(true);
    expect(await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY)).toBe("1");
  });

  it("is seen on the next launch", async () => {
    await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, "1");
    const { result } = await renderHook(useOnboarding, { wrapper });
    await waitFor(() => expect(result.current.seen).toBe(true));
  });
});
