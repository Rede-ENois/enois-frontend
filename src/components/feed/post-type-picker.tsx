import { useRef, useState } from "react";

import { texts } from "@/texts";
import type { PostTypePickerProps } from "@/types/components/feed/post-type-picker-props";
import { Popover, PopoverContent, PopoverTrigger } from "@rede-enois/design-system/ui";
import { ChevronDown } from "lucide-react";

/**
 * Seletor de tipo do compositor. Mostra o tipo atual e abre a lista completa num popover do
 * design system (Radix): o conteúdo é portalado e o Radix mantém o painel dentro da viewport,
 * inclusive quando o botão cai para a segunda linha do compositor em telas pequenas.
 *
 * O painel abre abaixo da barra de ações (`data-composer-toolbar`), não do botão: em mobile o
 * toolbar quebra em várias linhas e abrir no botão cobriria Agendar/Publicar. Quando as ações
 * ficam na mesma linha (desktop), o deslocamento é o mesmo de antes (4px).
 */
export function PostTypePicker({ options, value, onChange }: PostTypePickerProps) {
  const [open, setOpen] = useState(false);
  const [sideOffset, setSideOffset] = useState(4);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const current = options.find((option) => option.id === value) ?? options[0];

  if (!current) return null;

  /**
   * Mede a distância até o fim da barra de ações. Feito no clique (antes de abrir), porque a
   * altura da barra muda com o wrap do mobile e medir num efeito causaria um salto no primeiro
   * frame do painel.
   */
  const alignBelowToolbar = () => {
    const trigger = triggerRef.current;
    const toolbar = trigger?.closest<HTMLElement>("[data-composer-toolbar]");

    if (!trigger || !toolbar) {
      setSideOffset(4);
      return;
    }

    const gap = toolbar.getBoundingClientRect().bottom - trigger.getBoundingClientRect().bottom;
    setSideOffset(Math.max(4, Math.round(gap) + 4));
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          ref={triggerRef}
          type="button"
          onClick={alignBelowToolbar}
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
        sideOffset={sideOffset}
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
