import AsyncStorage from "@react-native-async-storage/async-storage";
import { act, renderHook, waitFor } from "@testing-library/react-native";
import type { ReactNode } from "react";
import { Uniwind } from "uniwind";
import { themeColors } from "@/lib/theme/colors";
import { APPEARANCE_STORAGE_KEY, ThemeProvider, useTheme } from "@/lib/theme/ThemeProvider";

const wrapper = ({ children }: { children: ReactNode }) => <ThemeProvider>{children}</ThemeProvider>;

beforeEach(async () => {
  await AsyncStorage.clear();
  (Uniwind.setTheme as jest.Mock).mockClear();
  jest.requireMock("uniwind").__reset();
});

describe("ThemeProvider", () => {
  it("follows the phone until a choice is saved", async () => {
    const { result } = await renderHook(useTheme, { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.appearance).toBe("system");
    expect(Uniwind.setTheme).not.toHaveBeenCalled();
  });

  it("restores a saved choice and applies it", async () => {
    await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, "light");
    const { result } = await renderHook(useTheme, { wrapper });
    await waitFor(() => expect(result.current.appearance).toBe("light"));
    expect(Uniwind.setTheme).toHaveBeenCalledWith("light");
    expect(result.current.scheme).toBe("light");
    expect(result.current.colors).toBe(themeColors.light);
  });

  it("ignores a saved value it does not know", async () => {
    await AsyncStorage.setItem(APPEARANCE_STORAGE_KEY, "sepia");
    const { result } = await renderHook(useTheme, { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.appearance).toBe("system");
  });

  it("saves and applies a new choice", async () => {
    const { result } = await renderHook(useTheme, { wrapper });
    await waitFor(() => expect(result.current.isReady).toBe(true));
    await act(() => result.current.setAppearance("light"));
    expect(Uniwind.setTheme).toHaveBeenCalledWith("light");
    expect(await AsyncStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("light");
    expect(result.current.scheme).toBe("light");
  });

  it("throws when used outside the provider", async () => {
    jest.spyOn(console, "error").mockImplementation(() => undefined);
    await expect(renderHook(useTheme)).rejects.toThrow("useTheme must be used inside ThemeProvider");
  });
});
