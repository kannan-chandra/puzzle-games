export interface PuzzleMeta {
  date: string;
  title: string;
}

let cachedManifest: PuzzleMeta[] | null = null;

async function loadManifest(): Promise<PuzzleMeta[]> {
  if (cachedManifest) return cachedManifest;

  // Astro sets SSR=true for server/build environments.
  if (import.meta.env.SSR) {
    // Read the generated manifest directly from public/
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const manifestPath = path.resolve("public/puzzles/manifest.json");

    const raw = await fs.readFile(manifestPath, "utf8");
    cachedManifest = JSON.parse(raw) as PuzzleMeta[];
    return cachedManifest;
  }

  // Browser: fetch from the deployed site (base-path aware)
  const base = import.meta.env.BASE_URL;
  const res = await fetch(`${base}puzzles/manifest.json`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch manifest: ${res.status}`);
  }
  cachedManifest = (await res.json()) as PuzzleMeta[];
  return cachedManifest;
}

export async function getAllPuzzleMeta(): Promise<PuzzleMeta[]> {
  return loadManifest();
}

export async function hasPuzzleDate(date: string): Promise<boolean> {
  const manifest = await loadManifest();
  return manifest.some((p) => p.date === date);
}

export async function getPuzzleMeta(date: string): Promise<PuzzleMeta | undefined> {
  const manifest = await loadManifest();
  return manifest.find((p) => p.date === date);
}

import { compareDates } from "./time";

export async function getLatestAvailablePuzzleDate(
  unlockedDate: string
): Promise<string | null> {
  const all = await getAllPuzzleMeta();
  if (all.length === 0) return null;

  // dates are YYYY-MM-DD so lexicographic sort works
  const eligible = all
    .map((p) => p.date)
    .filter((d) => compareDates(d, unlockedDate) <= 0)
    .sort(); // ascending

  return eligible.length ? eligible[eligible.length - 1] : null;
}
