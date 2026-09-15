import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Decodes HTML entities and normalizes Unicode text (such as Tamil script, Rupee symbol, and emojis)
 * to prevent mojibake, escaped entities (e.g. &#39;, &amp;), and decomposed glyph artifacts.
 */
export function cleanUnicodeText(str?: string | null): string {
  if (!str) return "";

  let result = str;

  // Perform up to 2 decode passes in case of double-escaped entities like &amp;#39;
  for (let pass = 0; pass < 2; pass++) {
    if (!result.includes("&")) break;

    result = result
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&#39;/g, "'")
      .replace(/&#039;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .replace(/&bull;/g, "•")
      .replace(/&hellip;/g, "…")
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&copy;/g, "©")
      .replace(/&reg;/g, "®")
      .replace(/&trade;/g, "™")
      // Decimal entities: &#1234;
      .replace(/&#(\d+);/g, (_, code) => {
        try {
          return String.fromCodePoint(Number(code));
        } catch {
          return _;
        }
      })
      // Hex entities: &#x1F600;
      .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => {
        try {
          return String.fromCodePoint(parseInt(code, 16));
        } catch {
          return _;
        }
      });
  }

  // Canonical Unicode Normalization (NFC) ensures Tamil conjuncts & accents compose correctly
  try {
    result = result.normalize("NFC");
  } catch {
    // Ignore normalization error on unsupported environments
  }

  return result;
}
