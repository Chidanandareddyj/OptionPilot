import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { spawnSync } from "node:child_process";

const result = spawnSync("npx", ["eslint", "-f", "json"], {
  encoding: "utf8",
  maxBuffer: 20 * 1024 * 1024,
});

if (result.error) {
  throw result.error;
}

// ESLint exits 1 when it finds errors. That is the current baseline, so only
// a crash (any other status, or unparseable output) is a failure by itself.
if (result.status !== 0 && result.status !== 1) {
  process.stderr.write(result.stderr ?? "");
  process.exit(result.status ?? 1);
}

const data = JSON.parse(result.stdout);
const rows = [];
for (const file of data) {
  const rel = relative(process.cwd(), file.filePath);
  for (const message of file.messages) {
    const firstLine = String(message.message).split("\n")[0];
    rows.push(
      `${rel}:${message.line}:${message.column}: ${message.severity} ${message.ruleId} ${firstLine}`,
    );
  }
}
rows.sort();

const actual = rows.length === 0 ? "" : `${rows.join("\n")}\n`;
const expectedPath = new URL("../eslint-baseline.txt", import.meta.url);
const expected = readFileSync(expectedPath, "utf8");

if (actual === expected) {
  const errors = rows.filter((row) => row.includes(": 2 ")).length;
  const warnings = rows.length - errors;
  console.log(
    `ESLint matches the recorded baseline (${errors} errors, ${warnings} warnings). Existing findings are not fixed in this check.`,
  );
  process.exit(0);
}

console.error("ESLint output differs from .github/eslint-baseline.txt.");
console.error("New or removed findings fail this check. The existing findings were left as they are.");
const expectedLines = new Set(expected.split("\n").filter(Boolean));
const actualLines = new Set(rows);
for (const line of [...actualLines].filter((line) => !expectedLines.has(line))) {
  console.error(`+ ${line}`);
}
for (const line of [...expectedLines].filter((line) => !actualLines.has(line))) {
  console.error(`- ${line}`);
}
process.exit(1);
