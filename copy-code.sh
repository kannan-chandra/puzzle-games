#!/usr/bin/env bash
set -euo pipefail

# Directories to include (relative to repo root)
INCLUDE_DIRS=("src" "scripts" "public")

# File extensions to include
EXTS=(
  "astro" "ts" "tsx" "js" "jsx" "mjs" "cjs"
  "json" "txt" "md" "mdx"
  "css" "scss" "sass" "less"
  "html" "yml" "yaml" "toml"
  "svg"
)

# Build find expression for extensions
FIND_EXT_EXPR=()
for ext in "${EXTS[@]}"; do
  FIND_EXT_EXPR+=( -iname "*.${ext}" -o )
done
unset 'FIND_EXT_EXPR[${#FIND_EXT_EXPR[@]}-1]' # remove trailing -o

# Find matching files, sorted
FILES=$(
  find "${INCLUDE_DIRS[@]}" \
    -type f \
    \( "${FIND_EXT_EXPR[@]}" \) \
    -not -path "*/node_modules/*" \
    -not -path "*/dist/*" \
    -not -path "*/.astro/*" \
    -not -path "*/.git/*" \
    2>/dev/null \
  | LC_ALL=C sort
)

if [[ -z "${FILES}" ]]; then
  echo "No matching files found under: ${INCLUDE_DIRS[*]}" >&2
  exit 1
fi

# Concatenate with headers and copy to clipboard
{
  echo "===== CONCATENATED ASTRO CODEBASE ====="
  echo "Generated: $(date)"
  echo "Root: $(pwd)"
  echo

  while IFS= read -r file; do
    echo "============================================================"
    echo "FILE: ${file}"
    echo "============================================================"
    echo
    cat "${file}"
    echo
    echo
  done <<< "${FILES}"
} | pbcopy

echo "✅ Copied concatenated contents of $(echo "${FILES}" | wc -l | tr -d ' ') files to clipboard via pbcopy."
