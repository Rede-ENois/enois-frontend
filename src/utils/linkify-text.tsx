import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

export function linkifyText(text: string) {
  const parts: ReactNode[] = [];
  const regex = /(@\w+|https?:\/\/[^\s]+)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    const token = match[0];
    if (token.startsWith("@")) {
      const username = token.slice(1);
      parts.push(
        <Link
          key={key++}
          to="/perfil/$username"
          params={{ username }}
          className="font-medium text-primary hover:underline"
        >
          {token}
        </Link>,
      );
    } else {
      parts.push(
        <a
          key={key++}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="break-words text-primary hover:underline"
        >
          {token}
        </a>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts.length > 0 ? parts : text;
}
