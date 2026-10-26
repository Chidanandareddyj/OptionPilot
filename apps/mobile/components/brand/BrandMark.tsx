import Svg, { Path } from "react-native-svg";
import {
  LOGO_ARROW,
  LOGO_ARROW_COLOR,
  LOGO_RING_BOTTOM,
  LOGO_RING_COLOR,
  LOGO_RING_SLASH,
  LOGO_RING_TOP,
  LOGO_VIEW_BOX,
} from "@optionpilot/shared";
import { useTheme } from "@/lib/theme/ThemeProvider";

/**
 * `original` has the navy ring and suits Paper. `adaptive` draws the ring in the foreground colour
 * so it stays visible on Saffron. Both use the website's path data from @optionpilot/shared.
 */
export type BrandVariant = "original" | "adaptive";

type BrandMarkProps = { size?: number; variant?: BrandVariant };

export function BrandMark({ size = 32, variant }: BrandMarkProps) {
  const { scheme, colors } = useTheme();
  const resolved: BrandVariant = variant ?? (scheme === "dark" ? "adaptive" : "original");
  const ring = resolved === "adaptive" ? colors.foreground : LOGO_RING_COLOR;

  return (
    <Svg
      width={size}
      height={size}
      viewBox={LOGO_VIEW_BOX}
      fill="none"
      accessibilityRole="image"
      accessibilityLabel="OptionPilot logo"
    >
      <Path d={LOGO_RING_TOP} fill={ring} />
      <Path d={LOGO_RING_SLASH} fill={ring} />
      <Path d={LOGO_RING_BOTTOM} fill={ring} />
      <Path d={LOGO_ARROW} fill={LOGO_ARROW_COLOR} />
    </Svg>
  );
}
