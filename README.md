# Puzzle Games

A static daily logic puzzle site built with **Astro** and deployed to **GitHub Pages**.

* One logic puzzle per day (text-based for now)
* Simple UI: Today’s puzzle + archive
* Puzzles are authored as plain text files and compiled into JSON at build time
* Draft puzzles can be previewed in dev without shipping to production
* No backend required

Live URL (production):

```
https://kannan-chandra.github.io/puzzle-games/
```

---

## Local Development

### Prerequisites

* **Node.js 18+** (Node 20 recommended)
* npm

### Install dependencies

```bash
npm install
```

### Run the dev server

```bash
npm run dev
```

Local site:

```
http://localhost:4321/puzzle-games/
```

> Note: both `/puzzle-games` and `/puzzle-games/` are supported in dev via a redirect.

---

## Project Structure (important parts)

```
src/
  components/
    Layout.astro
  content/
    puzzles/
      2026-02-01.txt        ← puzzle source files (authoring format)
  lib/
    puzzles.ts              ← loads generated manifest
    time.ts                 ← ET date logic
  pages/
    index.astro             ← redirects to latest available puzzle
    archive.astro
    p/[date].astro
public/
  puzzles/
    2026-02-01.json         ← generated (do not edit by hand)
    manifest.json           ← generated (source of truth)
scripts/
  gen-puzzles.mjs           ← converts .txt → JSON + manifest
```

---

## Adding Puzzles (UPDATED)

> **Do not edit files in `public/puzzles/` directly.**
> They are generated automatically.

### 1) Create a new puzzle text file

Add a file under:

```
src/content/puzzles/YYYY-MM-DD.txt
```

Example: `src/content/puzzles/2026-02-05.txt`

### 2) Use the required puzzle format

Each puzzle file must contain **exactly these sections**, in any order, using this delimiter format:

```
Title
---
Title of the puzzle

Puzzle
---
Here is the puzzle text.

Question
---
What is the correct answer?

Options
---
Option A
Option B
Option C

Answer
---
2

Explanation
---
Optional extra context shown after answering.
```

Rules:

* Section names are **case-sensitive**
* All five sections are **required**
* `Explanation` is **optional**
* `Options` = one option per line
* `Answer` is a **1-based index** into the options list
* Script will throw an error if:

  * a section is missing
  * answer is out of range
  * filename is not `YYYY-MM-DD.txt`

Formatting:

* `**bold**` and `*italic*` are supported in `Puzzle` and `Explanation`
* Blank lines split paragraphs; single newlines become `<br />`

---

### 3) Generate puzzle JSON + manifest

Run:

```bash
npm run gen:puzzles
```

This will:

* Convert each `.txt` puzzle into `public/puzzles/YYYY-MM-DD.json`
* Generate `public/puzzles/manifest.json`
* Delete any stale JSON files for puzzles that no longer exist

You should **commit the generated `public/puzzles/` files**.

---

### 4) Draft puzzles (dev only)

To mark a puzzle as a draft, add this token at the very top of the file (whitespace allowed before it):

```
//draft
```

Behavior:

* `npm run dev` includes draft puzzles and appends ` (DRAFT)` to their titles
* `npm run build` and production output **exclude** drafts entirely

---

### 5) Run the site

```bash
npm run dev
```

* `/` redirects to the **latest available puzzle ≤ today (ET)**
* Archive lists **only puzzles that actually exist**
* Missing days are allowed (no requirement for daily continuity)

---

## How “Today” Works

* The site computes **today’s date in America/New_York**
* It looks at the generated `manifest.json`
* It redirects to the **most recent puzzle that is not in the future**
* If no puzzles exist yet, `/` shows a friendly message

No daily rebuild is required unless you add new puzzles.

---

## Build & Preview (Production Mode)

```bash
npm run build
npm run preview
```

Preview URL:

```
http://localhost:4321/puzzle-games/
```

---

## Deployment (GitHub Pages)

* Builds happen in **GitHub Actions**
* Output is static
* Hosted at:

  ```
  https://kannan-chandra.github.io/puzzle-games/
  ```

Astro config uses:

```js
site: "https://kannan-chandra.github.io"
base: "/puzzle-games/"
```

---

## Notes / Design Decisions

* `public/puzzles/manifest.json` is the **single source of truth**
* Routes are generated only for existing puzzles
* Future puzzle dates cannot be accessed unless a puzzle file exists
* Obfuscation/security is intentionally minimal (static site)
