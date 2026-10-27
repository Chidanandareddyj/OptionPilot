import { readFileSync } from "node:fs";
import { join } from "node:path";
import { semantic, type SemanticName } from "@optionpilot/shared";

const css = readFileSync(join(__dirname, "..", "global.css"), "utf8");

function variantBlock(name: "dark" | "light"): string {
  const start = css.indexOf(`@variant ${name} {`);
  return css.slice(start, css.indexOf("}", start));
}

function camel(name: string): SemanticName {
  return name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) as SemanticName;
}

describe.each([
  ["dark", semantic.saffron],
  ["light", semantic.paper],
] as const)("global.css %s colours", (name, tokens) => {
  const declarations = [...variantBlock(name).matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6});/g)];

  it("declares the colours the components use", () => {
    expect(declarations.length).toBeGreaterThanOrEqual(13);
  });

  it.each(declarations.map((match) => [match[1], match[2]] as const))("%s matches the shared token", (key, value) => {
    expect(value.toLowerCase()).toBe(tokens[camel(key)].toLowerCase());
  });
});
