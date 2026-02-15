import { promises as fs } from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve("src/content/puzzles");
const FILE_RE = /^\d{4}-\d{2}-\d{2}\.txt$/;
const DAY_MS = 24 * 60 * 60 * 1000;

function formatDateUTC(date) {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function nextDateFromLatest(dates) {
  if (dates.length === 0) {
    return formatDateUTC(new Date());
  }

  const latest = [...dates].sort().at(-1);
  const [y, m, d] = latest.split("-").map(Number);
  const next = new Date(Date.UTC(y, m - 1, d) + DAY_MS);
  return formatDateUTC(next);
}

function buildDraftTemplate(date) {
  return `//draft
Title
---
Draft Puzzle ${date}

Puzzle
---
Replace this placeholder puzzle text with your real puzzle.

Question
---
Replace with your question.

Options
---
Option 1
Option 2

Answer
---
1

Explanation
---
Replace with an explanation shown after the user answers.
`;
}

async function main() {
  await fs.mkdir(SRC_DIR, { recursive: true });

  const files = await fs.readdir(SRC_DIR);
  const dates = files
    .filter((name) => FILE_RE.test(name))
    .map((name) => name.slice(0, -4));

  const nextDate = nextDateFromLatest(dates);
  const outPath = path.join(SRC_DIR, `${nextDate}.txt`);

  try {
    await fs.access(outPath);
    throw new Error(`Draft already exists: ${outPath}`);
  } catch (err) {
    if (err && err.code !== "ENOENT") throw err;
  }

  const content = buildDraftTemplate(nextDate);
  await fs.writeFile(outPath, content, "utf8");
  console.log(`Created draft: ${outPath}`);
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});
