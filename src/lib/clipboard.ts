// Copies rich HTML to the clipboard with a plain-text fallback baked into
// the same write — most paste targets (email clients, docs, rich-text
// fields) pick "text/html" when it's offered, while a plain textarea/input
// falls back to "text/plain" automatically. ClipboardItem isn't available in
// every browser/context, so this degrades to plain-text-only, then to the
// legacy execCommand API, rather than failing outright.
export async function copyHtmlToClipboard(html: string): Promise<void> {
  const plainText = htmlToPlainText(html);

  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
      // Fall through to plain-text copying below.
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(plainText);
    return;
  }

  legacyCopy(plainText);
}

// Never inserted into the visible DOM — used purely to let the browser's
// own HTML parser turn markup into the text a reader would actually see
// (collapsed whitespace, no tags), rather than hand-rolling an HTML stripper.
function htmlToPlainText(html: string): string {
  const container = document.createElement("div");
  container.innerHTML = html;
  return container.innerText.replace(/\n{3,}/g, "\n\n").trim();
}

function legacyCopy(text: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } finally {
    textarea.remove();
  }
}
