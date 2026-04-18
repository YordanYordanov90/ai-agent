/** Line opens a Markdown code fence (optional indent, optional language after ```). */
const FENCE_LINE = /^[ \t]*```/;

const replaceBrInPlainText = (segment: string): string =>
  segment
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&lt;br\s*\/?&gt;/gi, "\n");

/**
 * Prepares assistant text for Discord: HTML-style line breaks do not render in Discord
 * and should become real newlines. Skips replacements inside fenced code blocks so code
 * snippets are not altered.
 */
export function formatAssistantTextForDiscord(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let outsideBuf: string[] = [];
  let insideBuf: string[] = [];
  let inFence = false;

  const flushOutside = (): void => {
    if (outsideBuf.length === 0) return;
    out.push(replaceBrInPlainText(outsideBuf.join("\n")));
    outsideBuf = [];
  };

  const flushInside = (): void => {
    if (insideBuf.length === 0) return;
    out.push(insideBuf.join("\n"));
    insideBuf = [];
  };

  for (const line of lines) {
    if (FENCE_LINE.test(line)) {
      if (inFence) {
        flushInside();
      } else {
        flushOutside();
      }
      out.push(line);
      inFence = !inFence;
      continue;
    }
    if (inFence) {
      insideBuf.push(line);
    } else {
      outsideBuf.push(line);
    }
  }

  if (inFence) {
    flushInside();
  } else {
    flushOutside();
  }

  return out.join("\n");
}
