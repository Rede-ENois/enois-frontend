import { useEffect, useState } from "react";

import { texts } from "@/texts";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from "@rede-enois/design-system/ui";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { emoteImageUrl } from "@/lib/emotes/api";
import { useEmotePage } from "@/lib/emotes/use-emotes";

/** Pausa da busca: sem ela, cada tecla vira uma página nova no backend. */
const ESPERA_DA_BUSCA = 250;

/**
 * Seletor de figurinhas, no formato dos chats: busca e a grade. O clique devolve o CÓDIGO
 * (`KEKW`), que entra no texto como qualquer palavra.
 *
 * A lista é UMA só — populares primeiro, depois o resto em ordem alfabética — e vem PAGINADA do
 * backend (`GET /emotes?page&limit&q`), 40 por vez. Não há filtro por coleção: quem escolhe a
 * figurinha quer achar o código, não saber de qual provedor ela veio.
 *
 * Nada aqui fala com BTTV ou FrankerFaceZ: quem mantém o catálogo é o nosso backend, que também
 * serve a imagem (`/emotes/image/...`). É isso que garante que toda figurinha da lista já está no
 * cache do site — e aparece igual no texto de quem lê.
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
  const [termo, setTermo] = useState("");
  const [pagina, setPagina] = useState(1);

  // A busca só vai ao backend depois de uma pausa: cada tecla dispararia uma página nova. O termo
  // e a página voltam ao começo JUNTOS — separados, o app pediria a página atual com o termo novo
  // e logo em seguida a primeira página, dois pedidos para o mesmo resultado.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setTermo(busca.trim());
      setPagina(1);
    }, ESPERA_DA_BUSCA);
    return () => clearTimeout(timer);
  }, [busca, open]);

  // Fechou: da próxima vez começa do começo, não no meio de uma busca antiga.
  useEffect(() => {
    if (!open) {
      setBusca("");
      setTermo("");
      setPagina(1);
    }
  }, [open]);

  const { data, isLoading, isError, isPlaceholderData } = useEmotePage(pagina, termo, open);

  const itens = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const paginaAtual = data?.page ?? 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{texts.emotes.title}</DialogTitle>
        </DialogHeader>

        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-subtle" />
          <Input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder={texts.emotes.searchPlaceholder}
            className="pl-8"
            autoFocus
          />
        </div>

        <div
          className={`max-h-[45vh] min-w-0 overflow-y-auto pr-1 ${
            isPlaceholderData ? "opacity-60 transition-opacity" : ""
          }`}
          aria-busy={isPlaceholderData}
        >
          {isLoading && (
            <p className="py-8 text-center text-sm text-text-subtle">{texts.emotes.loading}</p>
          )}

          {isError && (
            <p className="py-8 text-center text-sm text-text-subtle">{texts.emotes.error}</p>
          )}

          {!isLoading && !isError && total === 0 && (
            <p className="py-8 text-center text-sm text-text-subtle">{texts.emotes.empty}</p>
          )}

          <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
            {itens.map((emote) => (
              <button
                key={`${emote.provider}-${emote.id}`}
                type="button"
                title={emote.code}
                aria-label={emote.code}
                onClick={() => onSelect(emote.code)}
                className="flex h-11 items-center justify-center rounded-lg p-1 transition hover:bg-surface-2"
              >
                <img
                  src={emoteImageUrl(emote.thumb)}
                  alt={emote.code}
                  loading="lazy"
                  decoding="async"
                  className="h-8 w-8 object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        {total > 0 && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] text-text-subtle">{texts.emotes.count(total)}</p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-full px-2"
                  aria-label={texts.emotes.previous}
                  disabled={paginaAtual <= 1}
                  onClick={() => setPagina(paginaAtual - 1)}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>

                <span className="whitespace-nowrap text-[11px] text-text-subtle">
                  {texts.emotes.page(paginaAtual, totalPages)}
                </span>

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-full px-2"
                  aria-label={texts.emotes.next}
                  disabled={paginaAtual >= totalPages}
                  onClick={() => setPagina(paginaAtual + 1)}
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
