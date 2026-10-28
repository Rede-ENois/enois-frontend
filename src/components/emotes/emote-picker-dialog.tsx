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
import { Search } from "lucide-react";

import { useGlobalEmotes } from "@/lib/emotes/use-global-emotes";
import { cn } from "@/lib/utils";

const FILTROS = [
  { id: "ALL", label: texts.emotes.all },
  { id: "BTTV", label: "BTTV" },
  { id: "FFZ", label: "FFZ" },
] as const;

/**
 * Seletor de figurinhas globais (BTTV + FFZ), no formato dos chats: busca, filtro por coleção e a
 * grade de emotes. O clique devolve o CÓDIGO (`KEKW`), que entra no texto como qualquer palavra.
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
  const { data, isLoading, isError } = useGlobalEmotes();

  const emotes = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return (data ?? []).filter(
      (emote) =>
        (filtro === "ALL" || emote.provider === filtro) &&
        (termo === "" || emote.code.toLowerCase().includes(termo)),
    );
  }, [busca, data, filtro]);

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
              onChange={(event) => setBusca(event.target.value)}
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
              onClick={() => setFiltro(item.id)}
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

          {!isLoading && !isError && emotes.length === 0 && (
            <p className="py-8 text-center text-sm text-text-subtle">{texts.emotes.empty}</p>
          )}

          <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
            {emotes.map((emote) => (
              <button
                key={`${emote.provider}-${emote.code}`}
                type="button"
                title={emote.code}
                onClick={() => onSelect(emote.code)}
                className={cn(
                  "flex h-11 items-center justify-center rounded-lg p-1 transition hover:bg-surface-2",
                )}
              >
                <img
                  src={emote.url}
                  alt={emote.code}
                  loading="lazy"
                  className="max-h-8 max-w-full object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        <p className="text-[11px] text-text-subtle">{texts.emotes.hint}</p>
      </DialogContent>
    </Dialog>
  );
}
