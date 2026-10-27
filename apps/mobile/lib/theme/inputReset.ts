import { Platform } from "react-native";

/** Browsers add their own focus outline to an input. The wrapping view draws the design's ring, so it is removed. */
export const INPUT_RESET = Platform.OS === "web" ? ({ outlineStyle: "none" } as object) : { outlineWidth: 0 };
