// src/scripts/puzzleClient.ts
import { renderRichTextLiteHtml } from "../lib/richText";

function getUnlockedDateET(now: Date): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function clear(el: Element) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function renderQA(container: HTMLElement, data: any) {
  clear(container);

  const card = document.createElement("section");
  card.className = "qa-card";

  const q = document.createElement("h2");
  q.className = "qa-question";
  q.textContent = data.question || "Question";

  const optionsWrap = document.createElement("div");
  optionsWrap.className = "qa-options";
  optionsWrap.setAttribute("role", "group");
  optionsWrap.setAttribute("aria-label", "Answer options");

  const feedback = document.createElement("div");
  feedback.className = "qa-feedback";
  feedback.setAttribute("aria-live", "polite");

  const explanation = document.createElement("div");
  explanation.className = "qa-explanation";
  explanation.style.display = "none";

  let answered = false;
  const correctIndex = Number(data.answer) - 1;

  const buttons: HTMLButtonElement[] = (data.options || []).map((optText: any, idx: number) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "qa-option";
    btn.textContent = String(optText);

    btn.addEventListener("click", () => {
      if (answered) return;
      answered = true;

      const isCorrect = idx === correctIndex;

      buttons.forEach((b, j) => {
        b.disabled = true;
        b.classList.add("is-locked");
        if (j === correctIndex) b.classList.add("is-correct");
        if (j === idx) b.classList.add("is-selected");
        if (j === idx && !isCorrect) b.classList.add("is-wrong");
      });

      feedback.textContent = isCorrect ? "Correct!" : "Not quite.";

      if (data.explanation && String(data.explanation).trim().length > 0) {
        explanation.style.display = "";

        clear(explanation);
        const h = document.createElement("h3");
        h.textContent = "Explanation";
        explanation.appendChild(h);

        const body = document.createElement("div");
        body.className = "qa-explanation-body";
        body.innerHTML = renderRichTextLiteHtml(data.explanation);
        explanation.appendChild(body);
      }
    });

    return btn;
  });

  optionsWrap.append(...buttons);
  card.append(q, optionsWrap, feedback, explanation);
  container.appendChild(card);
}

async function loadPuzzleClient(date: string, base: string) {
  const unlockedDate = getUnlockedDateET(new Date());
  if (date > unlockedDate) {
    window.location.href = `${base}`;
    return;
  }

  const puzzleEl = document.getElementById(`puzzle-content-${date}`);
  const qaEl = document.getElementById(`qa-${date}`);
  if (!puzzleEl || !qaEl) return;

  try {
    const res = await fetch(`${base}puzzles/${date}.json`, { cache: "no-store" });
    if (!res.ok) throw new Error("Puzzle not found");
    const data = await res.json();

    puzzleEl.innerHTML = renderRichTextLiteHtml(data.puzzle);
    renderQA(qaEl as HTMLElement, data);
  } catch (e) {
    puzzleEl.innerHTML = "<p>Error loading puzzle.</p>";
    clear(qaEl);
    console.error("Failed to load puzzle:", e);
  }
}

// Auto-run: read data from the current script tag (module-safe fallback)
function findSelfScript(): HTMLScriptElement | null {
  // Best effort: currentScript (may be null for module scripts in some setups)
  const cs = document.currentScript as HTMLScriptElement | null;
  if (cs && cs.dataset && cs.dataset.puzzleClient === "1") return cs;

  // Fallback: find the script we marked
  return document.querySelector('script[data-puzzle-client="1"]');
}

const self = findSelfScript();
if (self) {
  const date = self.dataset.date || "";
  const base = self.dataset.base || "/";
  loadPuzzleClient(date, base);
} else {
  // Optional: helpful debugging
  console.warn("puzzleClient: could not locate its <script> tag for data-date/data-base.");
}
