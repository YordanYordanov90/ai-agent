const SAFE_CHAR = /[A-Za-z0-9:_-]/u;

/**
 * Reduces prompt-injection via routing labels: strips control chars / newlines,
 * keeps a tight charset, truncates. Use only in system metadata, not user messages.
 */
export function sanitizeRoutingLabel(raw: string, maxLen: number): string {
  const trimmed = raw.trim().slice(0, maxLen);
  const withoutControls = trimmed.replace(/[\u0000-\u001F\u007F]/gu, "");
  const collapsed = withoutControls.replace(/\s+/gu, "");
  const safe = collapsed
    .split("")
    .filter((ch) => SAFE_CHAR.test(ch))
    .join("");
  if (safe.length === 0) return "unknown";
  return safe.slice(0, maxLen);
}
