import { promises as fs } from "node:fs";
import path from "node:path";

const SRC_DIR = path.resolve(
  process.env.PUZZLE_SRC_DIR || "src/content/puzzles"
);
const OUT_DIR = path.resolve("public/deductory/puzzles");
const DRAFT_TOKEN = "//draft";

const REQUIRED_SECTIONS = ["Title", "Puzzle", "Question", "Options", "Answer"];
const OPTIONAL_SECTIONS = ["Explanation"];

function stripDraftToken(raw) {
  const leadingMatch = raw.match(/^\s*/);
  const leading = leadingMatch ? leadingMatch[0].length : 0;
  if (raw.slice(leading, leading + DRAFT_TOKEN.length) !== DRAFT_TOKEN) {
    return { isDraft: false, body: raw };
  }

  let body = raw.slice(leading + DRAFT_TOKEN.length);
  if (body.startsWith("\r\n")) {
    body = body.slice(2);
  } else if (body.startsWith("\n")) {
    body = body.slice(1);
  }

  return { isDraft: true, body };
}

function parsePuzzleFile(text, filename) {
  const src = text.replace(/\r\n/g, "\n").trim() + "\n";
  const headerRe = /^([A-Za-z]+)\n---\n/gm;

  const headers = [];
  let m;
  while ((m = headerRe.exec(src)) !== null) {
    headers.push({
      name: m[1],
      start: m.index,
      contentStart: headerRe.lastIndex,
    });
  }

  if (headers.length === 0) {
    throw new Error(`${filename}: No section headers found.`);
  }

  const sections = {};
  for (let i = 0; i < headers.length; i++) {
    const h = headers[i];
    const nextStart = i + 1 < headers.length ? headers[i + 1].start : src.length;
    const content = src.slice(h.contentStart, nextStart).trim();

    if (sections[h.name]) {
      throw new Error(`${filename}: Duplicate section "${h.name}".`);
    }
    sections[h.name] = content;
  }

  // Validate required sections
  for (const name of REQUIRED_SECTIONS) {
    if (!sections[name] || sections[name].trim() === "") {
      throw new Error(`${filename}: Missing or empty section "${name}".`);
    }
  }

  // Validate no unexpected sections
  for (const name of Object.keys(sections)) {
    if (
      !REQUIRED_SECTIONS.includes(name) &&
      !OPTIONAL_SECTIONS.includes(name)
    ) {
      throw new Error(`${filename}: Unexpected section "${name}".`);
    }
  }

  const options = sections["Options"]
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (options.length < 2) {
    throw new Error(`${filename}: Options must contain at least 2 entries.`);
  }

  const answer = Number(sections["Answer"].trim());
  if (!Number.isInteger(answer) || answer < 1 || answer > options.length) {
    throw new Error(
      `${filename}: Answer must be an integer between 1 and ${options.length}.`
    );
  }

  const explanation = sections["Explanation"]
    ? sections["Explanation"]
        .replace(/\n{3,}/g, "\n\n") // normalize excessive spacing
        .trim()
    : undefined;

  return {
    title: sections["Title"].trim(),
    puzzle: sections["Puzzle"].trim(),
    question: sections["Question"].trim(),
    options,
    answer,
    ...(explanation ? { explanation } : {}),
  };
}

function compareDates(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function main() {
  const includeDrafts = process.argv.includes("--include-drafts");
  await ensureDir(OUT_DIR);

  const srcFiles = (await fs.readdir(SRC_DIR)).filter((f) =>
    f.endsWith(".txt")
  );

  if (srcFiles.length === 0) {
    console.log("No puzzle source files found.");
    return;
  }

  const writtenFiles = new Set();
  const manifest = [];

  for (const file of srcFiles) {
    const date = path.basename(file, ".txt");

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`${file}: Filename must be YYYY-MM-DD.txt`);
    }

    const raw = await fs.readFile(path.join(SRC_DIR, file), "utf8");
    const { isDraft, body } = stripDraftToken(raw);
    if (isDraft && !includeDrafts) {
      console.log(`Skipped draft ${file}`);
      continue;
    }

    const parsed = parsePuzzleFile(body, file);
    const displayTitle =
      isDraft && includeDrafts ? `${parsed.title} (DRAFT)` : parsed.title;

    const output = {
      date,
      title: displayTitle,
      puzzle: parsed.puzzle,
      question: parsed.question,
      options: parsed.options,
      answer: parsed.answer,
      ...(parsed.explanation ? { explanation: parsed.explanation } : {}),
    };

    const outFile = `${date}.json`;
    const outPath = path.join(OUT_DIR, outFile);

    await fs.writeFile(outPath, JSON.stringify(output, null, 2) + "\n");
    writtenFiles.add(outFile);
    console.log(`Wrote ${outFile}`);

    manifest.push({ date, title: displayTitle });
  }

  manifest.sort((a, b) => compareDates(a.date, b.date));

  const manifestPath = path.join(OUT_DIR, "manifest.json");
  await fs.writeFile(
    manifestPath,
    JSON.stringify(manifest, null, 2) + "\n"
  );
  writtenFiles.add("manifest.json");
  console.log("Wrote manifest.json");

  // Cleanup stale files
  const existingOutFiles = await fs.readdir(OUT_DIR);
  for (const file of existingOutFiles) {
    if (file.endsWith(".json") && !writtenFiles.has(file)) {
      await fs.unlink(path.join(OUT_DIR, file));
      console.log(`Deleted stale file ${file}`);
    }
  }
}

main().catch((err) => {
  console.error(err.stack || String(err));
  process.exit(1);
});
