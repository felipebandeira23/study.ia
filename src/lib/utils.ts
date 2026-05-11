/**
 * Builds a title for a study note from its content.
 * Returns a truncated version (max 80 chars) or a default title.
 */
export function buildNoteTitle(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return "Resumo de estudo";
  return normalized.length > 80 ? `${normalized.slice(0, 77)}...` : normalized;
}

/**
 * Builds a title for a flashcard deck from its content.
 * Returns a prefixed, truncated version (max 60 chars) or a default title.
 */
export function buildDeckTitle(content: string): string {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (!normalized) return "Deck de estudos";
  const trimmed =
    normalized.length > 60 ? `${normalized.slice(0, 57)}...` : normalized;
  return `Deck: ${trimmed}`;
}

/**
 * Clamps a flashcard count to the allowed range [1, 50].
 * Defaults to 10 when the value is null or undefined.
 */
export function clampCardCount(count: number | null | undefined): number {
  return Math.min(Math.max(count ?? 10, 1), 50);
}

/**
 * Strips markdown code-block fences from a string and trims whitespace.
 * Used when AI responses are wrapped in ```json ... ``` blocks.
 */
export function stripMarkdownCodeBlock(text: string): string {
  return text.replace(/```(?:json)?\n?/g, "").trim();
}
