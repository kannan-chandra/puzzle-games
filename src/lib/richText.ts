// src/lib/richText.ts

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function applyInlineFormatting(text: string): string {
  // **bold**
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // *italic* (avoid ** being treated as italics)
  text = text.replace(/(^|[^*])\*(?!\*)(.+?)\*(?!\*)/g, "$1<em>$2</em>");

  return text;
}

export function renderRichTextLiteHtml(raw: unknown): string {
  const s = String(raw ?? "");
  if (!s.trim()) return "";

  const normalized = s.replace(/\r\n/g, "\n");

  // Split into paragraphs on blank lines
  const paragraphs = normalized.split(/\n\s*\n/);

  return paragraphs
    .map((para) => {
      const escaped = escapeHtml(para);
      const formatted = applyInlineFormatting(escaped);
      const withLineBreaks = formatted.replace(/\n/g, "<br />");
      return `<p>${withLineBreaks}</p>`;
    })
    .join("\n");
}
