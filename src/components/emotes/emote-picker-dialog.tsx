import { useMemo, useState } from "react";

import { texts } from "@/texts";
import type { EmoteProvider } from "@/types/application/emote/emote-provider";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from "@rede-enois/design-system/ui";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { emotePage } from "@/lib/emotes/pagination";
import { useGlobalEmotes } from "@/lib/emotes/use-global-emotes";

const FILTROS = [
  { id: "ALL", label: texts.emotes.all },
  { id: "BTTV", label: "BTTV" },
  { id: "FFZ", label: "FFZ" },
] as const;

/**
 * Seletor de figurinhas globais (BTTV + FFZ), no formato dos chats: busca, filtro por coleção e a
 * grade de emotes. O clique devolve o CÓDIGO (`KEKW`), que entra no texto como qualquer palavra.
 *
 * A grade mostra uma PÁGINA de miniaturas 1x, não a coleção inteira: com a lista toda de uma vez o
 * seletor baixava centenas de KB de imagem de uma vez só e demorava a abrir.
 */
export function EmotePickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (code: string) => void;
}) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"ALL" | EmoteProvider>("ALL");
  const [pagina, setPagina] = useState(1);
  const { data, isLoading, isError } = useGlobalEmotes();

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (data ?? []).filter(
      (emote) =>
        (filtro === "ALL" || emote.provider === filtro) &&
        (termo === "" || emote.code.toLowerCase().includes(termo)),
    );
  }, [busca, data, filtro]);

  const { items, page, totalPages } = useMemo(
    () => emotePage(filtrados, pagina),
    [filtrados, pagina],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{texts.emotes.title}</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-subtle" />
            <Input
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setPagina(1);
              }}
              placeholder={texts.emotes.searchPlaceholder}
              className="pl-8"
              autoFocus
            />
          </div>

          {FILTROS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={filtro === item.id ? "secondary" : "outline"}
              className="rounded-full"
              onClick={() => {
                setFiltro(item.id);
                setPagina(1);
              }}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="max-h-[45vh] min-w-0 overflow-y-auto pr-1">
          {isLoading && (
            <p className="py-8 text-center text-sm text-text-subtle">{texts.emotes.loading}</p>
          )}

          {isError && (
            <p className="py-8 text-center text-sm text-text-subtle">{texts.emotes.error}</p>
          )}

          {!isLoading && !isError && filtrados.length === 0 && (
            <p className="py-8 text-center text-sm text-text-subtle">{texts.emotes.empty}</p>
          )}

          <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
            {items.map((emote) => (
              <button
                key={`${emote.provider}-${emote.code}`}
                type="button"
                title={emote.code}
                aria-label={emote.code}
                onClick={() => onSelect(emote.code)}
                className="flex h-11 items-center justify-center rounded-lg p-1 transition hover:bg-surface-2"
              >
                <img
                  src={emote.preview}
                  alt={emote.code}
                  loading="lazy"
                  decoding="async"
                  className="h-8 w-8 object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        {filtrados.length > 0 && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-text-subtle">{texts.emotes.count(filtrados.length)}</p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-full px-2"
                  aria-label={texts.emotes.previous}
                  disabled={page <= 1}
                  onClick={() => setPagina(page - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                <span className="whitespace-nowrap text-[11px] text-text-subtle">
                  {texts.emotes.page(page, totalPages)}
                </span>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-full px-2"
                  aria-label={texts.emotes.next}
                  disabled={page >= totalPages}
                  onClick={() => setPagina(page + 1)}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        )}

        <p className="text-[11px] text-text-subtle">{texts.emotes.hint}</p>
      </DialogContent>
    </Dialog>
  );
}
