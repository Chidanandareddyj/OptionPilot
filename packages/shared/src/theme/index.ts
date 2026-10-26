export { paper, saffron } from "./palettes";
export { radius } from "./radius";
export { semantic } from "./semantic";
export type { SemanticName } from "./semantic";
export { spacing } from "./spacing";
export { fonts, typeScale } from "./typography";

/** Saffron is dark. Paper is light. Same values as the web theme provider. */
export const THEMES = [
  { value: "dark", label: "Saffron", description: "Dark" },
  { value: "light", label: "Paper", description: "Light" },
] as const;
