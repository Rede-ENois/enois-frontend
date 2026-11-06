// eslint-suppressions.json freezes lint debt that predates a rule. It may only shrink: a pull
// request that raises a count (for example by running `eslint --suppress-all` to hide a new
// violation) fails here. Deleting or renaming a legacy file frees its counts, so moving code does
// not need a maintainer to touch the baseline.
//
// Usage: node scripts/check-lint-suppressions.mjs <base-ref>
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";

const FILE = "eslint-suppressions.json";
const baseRef = process.argv[2];

if (!baseRef) {
  console.error("Usage: node scripts/check-lint-suppressions.mjs <base-ref>");
  process.exit(2);
}

function readBase() {
  try {
    const text = execFileSync("git", ["show", `${baseRef}:${FILE}`], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(text);
  } catch {
    return null;
  }
}

const base = readBase();
if (base === null) {
  console.log(`${FILE} does not exist on ${baseRef} yet: nothing to compare.`);
  process.exit(0);
}
const head = existsSync(FILE) ? JSON.parse(readFileSync(FILE, "utf8")) : {};

function countsByRule(suppressions) {
  const byRule = new Map();
  for (const [file, rules] of Object.entries(suppressions)) {
    for (const [rule, { count }] of Object.entries(rules)) {
      if (!byRule.has(rule)) byRule.set(rule, new Map());
      byRule.get(rule).set(file, count);
    }
  }
  return byRule;
}

const baseByRule = countsByRule(base);
const headByRule = countsByRule(head);
const failures = [];

for (const [rule, headFiles] of headByRule) {
  const baseFiles = baseByRule.get(rule) ?? new Map();
  const grown = [];
  let added = 0;
  for (const [file, count] of headFiles) {
    const before = baseFiles.get(file) ?? 0;
    if (count > before) {
      grown.push(`${file}: ${before} -> ${count}`);
      added += count - before;
    }
  }
  if (added === 0) continue;

  let freed = 0;
  for (const [file, count] of baseFiles) {
    if (!existsSync(file)) freed += count - (headFiles.get(file) ?? 0);
  }
  if (added > freed) failures.push({ rule, grown });
}

if (failures.length > 0) {
  console.error(`${FILE} grew. New code must pass the lint rules instead of being suppressed:\n`);
  for (const { rule, grown } of failures) {
    console.error(`  ${rule}`);
    for (const line of grown) console.error(`    ${line}`);
  }
  console.error(
    "\nFix the violations (views belong in @rede-enois/design-system), then run `npx eslint . --prune-suppressions`.",
  );
  process.exit(1);
}

console.log(`${FILE} did not grow.`);
