import { fireEvent, screen } from "@testing-library/react-native";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { FloatingTabBar } from "@/components/navigation/FloatingTabBar";
import { renderThemed } from "./test-utils";

function makeProps(index: number, defaultPrevented = false) {
  const names = ["terminal", "derivatives", "history", "settings"];
  const emit = jest.fn(() => ({ defaultPrevented }));
  const navigateToTab = jest.fn();
  const props = {
    state: { index, routes: names.map((name) => ({ key: `${name}-key`, name })) },
    emitter: { emit },
    navigateToTab,
  } as unknown as BottomTabBarProps;
  return { props, emit, navigateToTab };
}

describe("FloatingTabBar", () => {
  it("shows the four tabs in order and marks the current one", async () => {
    await renderThemed(<FloatingTabBar {...makeProps(1).props} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs.map((tab) => tab.props.accessibilityLabel)).toEqual([
      "Terminal",
      "Derivatives",
      "History",
      "Settings",
    ]);
    expect(screen.getByRole("tab", { name: "Derivatives" })).toBeSelected();
    expect(screen.getByRole("tab", { name: "Terminal" })).not.toBeSelected();
  });

  it("switches tab when another tab is pressed", async () => {
    const { props, emit, navigateToTab } = makeProps(0);
    await renderThemed(<FloatingTabBar {...props} />);
    await fireEvent.press(screen.getByRole("tab", { name: "Settings" }));
    expect(emit).toHaveBeenCalledWith({ type: "tabPress", target: "settings-key", canPreventDefault: true });
    expect(navigateToTab).toHaveBeenCalledWith("settings-key");
  });

  it("does not navigate when the tab is already open or the press was prevented", async () => {
    const current = makeProps(0);
    await renderThemed(<FloatingTabBar {...current.props} />);
    await fireEvent.press(screen.getByRole("tab", { name: "Terminal" }));
    expect(current.navigateToTab).not.toHaveBeenCalled();

    const prevented = makeProps(0, true);
    await renderThemed(<FloatingTabBar {...prevented.props} />);
    await fireEvent.press(screen.getByRole("tab", { name: "History" }));
    expect(prevented.navigateToTab).not.toHaveBeenCalled();
  });
});
