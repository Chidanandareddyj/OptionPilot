import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { radius } from "./radius.ts";
import { semantic } from "./semantic.ts";

const css = readFileSync(new URL("../../../../apps/web/app/globals.css", import.meta.url), "utf8");

function block(pattern: RegExp) {
  const match = css.match(pattern);
  assert.ok(match, `missing CSS block ${pattern}`);
  return match[1];
}

function colors(source: string) {
  const found = new Map<string, string>();
  for (const match of source.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]+)\s*;/g)) {
    const name = match[1].replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
    found.set(name, match[2].toLowerCase());
  }
  return found;
}

function camel(name: string) {
  return name.replace(/-([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());
}

test("semantic colours match globals.css", () => {
  const dark = colors(block(/:root,\s*:root\.dark\s*\{([\s\S]*?)\n\}/));
  const light = colors(block(/:root\.light\s*\{([\s\S]*?)\n\}/));
  assert.deepEqual(Object.fromEntries(dark), semantic.saffron);
  assert.deepEqual(Object.fromEntries(light), semantic.paper);
});

test("radius scale matches globals.css", () => {
  const theme = block(/@theme inline \{([\s\S]*?)\n\}/);
  const found: Record<string, number> = {};
  for (const match of theme.matchAll(/--radius-([a-z0-9-]+):\s*(\d+)px\s*;/g)) {
    found[camel(match[1])] = Number(match[2]);
  }
  assert.deepEqual(found, radius);
});
