import { useState } from "react";

import { texts } from "@/texts";
import type { PostTypePickerProps } from "@/types/components/feed/post-type-picker-props";
import { Popover, PopoverContent, PopoverTrigger } from "@rede-enois/design-system/ui";
import { ChevronDown } from "lucide-react";

/**
 * Seletor de tipo do compositor. Mostra o tipo atual e abre a lista completa num popover do
 * design system (Radix): o conteúdo é portalado e o Radix mantém o painel dentro da viewport,
 * inclusive quando o botão cai para a segunda linha do compositor em telas pequenas.
 */
export function PostTypePicker({ options, value, onChange }: PostTypePickerProps) {
  const [open, setOpen] = useState(false);

  const current = options.find((option) => option.id === value) ?? options[0];

  if (!current) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          title={texts.feed.composer.typePicker.change}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal transition ${
            open
              ? "bg-primary text-primary-foreground"
              : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
          }`}
        >
          <current.icon className="h-3.5 w-3.5" />

          <>
            {texts.feed.composer.typePicker.label}: {current.label}
          </>

          <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        collisionPadding={8}
        aria-label={texts.feed.composer.typePicker.change}
        className="max-h-[60vh] w-[min(22rem,calc(100vw-1rem))] overflow-y-auto rounded-2xl border-border-soft p-2"
      >
        <div className="flex flex-wrap gap-1.5">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={option.id === value}
              onClick={() => {
                onChange(option.id);
                setOpen(false);
              }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-normal transition ${
                option.id === value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border-soft text-text-subtle hover:border-primary hover:text-primary"
              }`}
            >
              <option.icon className="h-3.5 w-3.5" />

              <>{option.label}</>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
