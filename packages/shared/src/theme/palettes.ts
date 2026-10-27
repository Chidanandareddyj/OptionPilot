/**
 * Raw palette hex from the design file.
 * `input` here is the field fill. The web calls that `--muted` / `--secondary`.
 * The web's `--input` is the field border and matches `border`.
 */
export const saffron = {
  name: "Saffron on warm black",
  dark: true,
  background: "#131209",
  card: "#181818",
  input: "#1F1F1F",
  accent: "#272727",
  border: "#313131",
  foreground: "#F2F2F0",
  mutedForeground: "#ABABA8",
  faint: "#8D8D8A",
  primary: "#E09B3F",
  primaryForeground: "#131209",
  profit: "#5DB58C",
  loss: "#DB6F63",
  heroFrom: "#FFFFFF",
  heroTo: "#9B9B9B",
} as const;

export const paper = {
  name: "Light paper",
  dark: false,
  background: "#F4EFE6",
  card: "#FBF8F2",
  input: "#FFFFFF",
  accent: "#EAE3D6",
  border: "#D6CCBA",
  foreground: "#1C1A17",
  mutedForeground: "#575044",
  faint: "#6B6458",
  primary: "#C23B16",
  primaryForeground: "#FFF8F0",
  profit: "#0B6E55",
  loss: "#A3203A",
  heroFrom: "#1C1A17",
  heroTo: "#6B6458",
} as const;
