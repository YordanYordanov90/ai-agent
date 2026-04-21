const SENSITIVE_PATTERNS = [
  /sk-[a-zA-Z0-9_-]{46,48}/gi,
  /ghp_[a-zA-Z0-9]{35}[0-9A-Za-z_-]{1,5}/gi,
  /github_pat_[A-Za-z0-9_]{71,80}/gi,
  /AKIA[0-9A-Z]{16}/gi,
  /(?<!\\w)[a-f0-9]{32,64}(?!\\w)/gi,
  /(?<!\\w)[A-Za-z0-9+/]{32,}={0,3}(?!\\w)/gi,
];

export function redactSensitiveText(text: string): string {
  return SENSITIVE_PATTERNS.reduce((acc, pat) => acc.replace(pat, "[redacted]"), text);
}

/**
 * Pipes `inputStream` through per-chunk redaction. Uses a single reader for the
 * lifetime of the stream (calling getReader() per pull would lock the source
 * incorrectly after the first chunk).
 */
export function createRedactedTextStream(inputStream: ReadableStream<string>): ReadableStream<string> {
  const reader = inputStream.getReader();
  return new ReadableStream<string>({
    async pull(controller) {
      try {
        const { done, value } = await reader.read();
        if (done) {
          controller.close();
          return;
        }
        controller.enqueue(redactSensitiveText(value));
      } catch (e) {
        controller.error(e instanceof Error ? e : new Error(String(e)));
      }
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
}
