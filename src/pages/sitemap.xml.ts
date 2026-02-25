import type { APIRoute } from "astro";
import { getAllPuzzleMeta } from "../lib/puzzles";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function absoluteUrl(site: URL, path: string): string {
  return new URL(path, site).toString();
}

export const GET: APIRoute = async ({ site }) => {
  const baseSite = site ?? new URL("https://kurumbu-games.com");
  const puzzles = await getAllPuzzleMeta();

  const staticEntries = [
    absoluteUrl(baseSite, "/"),
    absoluteUrl(baseSite, "/deductory/"),
    absoluteUrl(baseSite, "/deductory/archive/"),
  ];

  const puzzleEntries = puzzles.map((puzzle) => ({
    loc: absoluteUrl(baseSite, `/deductory/p/${puzzle.date}/`),
    lastmod: puzzle.date,
  }));

  const lines = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...staticEntries.map(
      (loc) => `  <url><loc>${escapeXml(loc)}</loc></url>`
    ),
    ...puzzleEntries.map(
      (entry) =>
        `  <url><loc>${escapeXml(entry.loc)}</loc><lastmod>${entry.lastmod}</lastmod></url>`
    ),
    `</urlset>`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
};
