import { useState } from "react";

import { texts } from "@/texts";

export function useErrorBannerCopy(message: string, details: string[], hint?: string) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    const text = [
      texts.errors.details.error(message),
      ...details.map((detail) => `  ${detail}`),
      hint ? texts.errors.details.suggestion(hint) : "",
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard?.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return { copied, copy };
}
