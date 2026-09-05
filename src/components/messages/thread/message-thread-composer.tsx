import type { FormEventHandler } from "react";

import { Send } from "lucide-react";

import { texts } from "@/texts";

import { Input } from "@/components/ui/input";

export function MessageThreadComposer({ text, sending, onTextChange, onSubmit }: {
  text: string;
  sending: boolean;
  onTextChange: (value: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 border-t border-border p-3">
      <Input
        value={text}
        onChange={(event) => onTextChange(event.target.value)}
        placeholder={texts.messages.inputPlaceholder}
        className="h-10 rounded-full bg-muted"
      />
      <button
        type="submit"
        disabled={!text.trim() || sending}
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
      </button>
    </form>
  );
}
