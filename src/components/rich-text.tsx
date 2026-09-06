import { Fragment } from "react";

import { Link } from "@tanstack/react-router";

import { tokenizeRichText } from "@/utils/text";

type RichTextProps = {
  text: string;
};

export function RichText({ text }: RichTextProps) {
  return tokenizeRichText(text).map((token, index) => {
    const key = `${token.type}-${index}-${token.value}`;
    const renderers = {
      text: () => <Fragment key={key}>{token.value}</Fragment>,
      mention: () => token.type !== "mention" ? null : <Link key={key} to="/perfil/$username" params={{ username: token.username }} className="font-medium text-primary hover:underline">{token.value}</Link>,
      url: () => <a key={key} href={token.value} target="_blank" rel="noopener noreferrer" className="break-words text-primary hover:underline">{token.value}</a>,
    } as const;
    return renderers[token.type]();
  });
}
