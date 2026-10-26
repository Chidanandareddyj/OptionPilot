import {
  LOGO_ARROW,
  LOGO_ARROW_COLOR,
  LOGO_RING_BOTTOM,
  LOGO_RING_COLOR,
  LOGO_RING_SLASH,
  LOGO_RING_TOP,
  LOGO_VIEW_BOX,
} from "@optionpilot/shared";
import React from "react";

export interface OptionPilotLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  /**
   * - "original": Navy blue ring (#12244E) + Teal arrow (#25B4B6). Best for light surfaces.
   * - "adaptive": White / currentColor ring + Teal arrow (#25B4B6). Best for dark headers & buttons.
   * - "monochrome": Inherits parent text color for the entire logo.
   */
  variant?: "original" | "adaptive" | "monochrome";
}

export function OptionPilotLogo({
  className = "size-7",
  variant = "adaptive",
  ...props
}: OptionPilotLogoProps) {
  const ringColor =
    variant === "monochrome"
      ? "currentColor"
      : variant === "adaptive"
      ? "currentColor"
      : LOGO_RING_COLOR;

  const arrowColor =
    variant === "monochrome" ? "currentColor" : LOGO_ARROW_COLOR;

  return (
    <svg
      viewBox={LOGO_VIEW_BOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OptionPilot Logo"
      {...props}
    >
      {/* Top-Left Ring Segment */}
      <path d={LOGO_RING_TOP} fill={ringColor} />

      {/* Dynamic Slashed Accent in Lower Arc */}
      <path d={LOGO_RING_SLASH} fill={ringColor} />

      {/* Bottom-Right Main Ring Segment */}
      <path d={LOGO_RING_BOTTOM} fill={ringColor} />

      {/* Teal Dynamic Upward Arrow with Full, Uncut Arrowhead */}
      <path d={LOGO_ARROW} fill={arrowColor} />
    </svg>
  );
}

export default OptionPilotLogo;
