import type { RichTextToken } from "@/types/application/text/rich-text-token";

export function tokenizeRichText(text: string): RichTextToken[] {
  const tokens: RichTextToken[] = [];
  const regex = /(@\w+|https?:\/\/[^\s]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });
    }

    const value = match[0];
    tokens.push(
      value.startsWith("@")
        ? { type: "mention", value, username: value.slice(1) }
        : { type: "url", value },
    );
    lastIndex = match.index + value.length;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: "text", value: text.slice(lastIndex) });
  }

  return tokens.length > 0 ? tokens : [{ type: "text", value: text }];
}
