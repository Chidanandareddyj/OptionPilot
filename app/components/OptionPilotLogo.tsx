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
      : "#12244E";

  const arrowColor =
    variant === "monochrome" ? "currentColor" : "#25B4B6";

  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="OptionPilot Logo"
      {...props}
    >
      {/* Top-Left Ring Segment */}
      <path
        d="M 69 41
           L 69 28
           C 47 29 29 46 29 68
           C 29 78 33 87 39 94
           L 51 83
           C 47 79 44 74 44 68
           C 44 54 55 42 69 41 Z"
        fill={ringColor}
      />

      {/* Dynamic Slashed Accent in Lower Arc */}
      <path
        d="M 53 84
           C 63 78 72 71 78 66
           C 72 75 63 83 53 90
           Z"
        fill={ringColor}
      />

      {/* Bottom-Right Main Ring Segment */}
      <path
        d="M 53 95
           C 59 101 67 104 75 103
           C 94 101 107 85 107 66
           C 107 58 103 50 97 44
           L 86 54
           C 89 57 92 61 92 66
           C 92 78 82 88 71 89
           C 66 89 61 88 57 85
           Z"
        fill={ringColor}
      />

      {/* Teal Dynamic Upward Arrow with Full, Uncut Arrowhead */}
      <path
        d="M 23 83
           C 43 82 62 70 77 45
           L 70 39
           L 102 29
           L 95 61
           L 88 55
           C 69 74 47 82 23 83 Z"
        fill={arrowColor}
      />
    </svg>
  );
}

export default OptionPilotLogo;
