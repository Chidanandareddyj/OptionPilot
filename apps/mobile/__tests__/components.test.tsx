import { fireEvent, screen } from "@testing-library/react-native";
import { AppearancePicker } from "@/components/appearance/AppearancePicker";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button, Tag, Text } from "@/components/ui";
import { renderThemed } from "./test-utils";

describe("Button", () => {
  it("calls onPress", async () => {
    const onPress = jest.fn();
    await renderThemed(<Button label="Continue" onPress={onPress} />);
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("does not fire while loading or disabled", async () => {
    const onPress = jest.fn();
    await renderThemed(
      <>
        <Button label="Loading" loading onPress={onPress} />
        <Button label="Disabled" disabled onPress={onPress} />
      </>,
    );
    await fireEvent.press(screen.getByRole("button", { name: "Loading" }));
    await fireEvent.press(screen.getByRole("button", { name: "Disabled" }));
    expect(onPress).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Loading" })).toBeBusy();
  });
});

describe("Text", () => {
  it("applies the type scale size", async () => {
    await renderThemed(<Text size="4xl">Heading</Text>);
    expect(screen.getByText("Heading")).toHaveStyle({ fontSize: 36, lineHeight: 40 });
  });

  it("tightens the letter spacing for headings", async () => {
    await renderThemed(<Text size="4xl" tight>Heading</Text>);
    expect(screen.getByText("Heading")).toHaveStyle({ letterSpacing: -0.72 });
  });
});

describe("BrandMark", () => {
  it("renders the logo with an accessible label", async () => {
    await renderThemed(<BrandMark />);
    expect(screen.getByLabelText("OptionPilot logo")).toBeTruthy();
  });
});

describe("AppearancePicker", () => {
  it("offers Dark, Light and System and marks the current one", async () => {
    await renderThemed(<AppearancePicker />);
    expect(await screen.findByRole("radio", { name: /^System\./ })).toBeSelected();
    expect(screen.getByRole("radio", { name: /^Dark\./ })).not.toBeSelected();
    expect(screen.getByRole("radio", { name: /^Light\./ })).not.toBeSelected();
  });

  it("selects a theme when pressed", async () => {
    await renderThemed(<AppearancePicker />);
    await fireEvent.press(await screen.findByRole("radio", { name: /^Light\./ }));
    expect(screen.getByRole("radio", { name: /^Light\./ })).toBeSelected();
    expect(screen.getByRole("radio", { name: /^System\./ })).not.toBeSelected();
  });
});

describe("Tag", () => {
  it("colours an outline tag's label for Viable and Not viable, and leaves a plain one quiet", async () => {
    await renderThemed(
      <>
        <Tag variant="outline" tone="profit" label="Viable" />
        <Tag variant="outline" tone="loss" label="Not viable" />
        <Tag variant="outline" label="Quiet" />
      </>,
    );
    const classes = (label: string) => String(screen.getByText(label).props.className);
    expect(classes("Viable")).toContain("text-profit");
    expect(classes("Not viable")).toContain("text-loss");
    expect(classes("Quiet")).not.toMatch(/text-(profit|loss)/);
  });
});
