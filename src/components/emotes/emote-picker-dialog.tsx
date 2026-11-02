import { useEffect, useState } from "react";

import { texts } from "@/texts";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@rede-enois/design-system/ui";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

import { emoteImageUrl } from "@/lib/emotes/api";
import { loadRecentEmotes, rememberRecentEmote } from "@/lib/emotes/recent-emotes";
import { useEmoteIndex, useEmotePage } from "@/lib/emotes/use-emotes";

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
  const [recentes, setRecentes] = useState<string[]>([]);
  const [aba, setAba] = useState<"recent" | "all">("all");

  // A busca só vai ao backend depois de uma pausa: cada tecla dispararia uma página nova. O termo
  // e a página voltam ao começo JUNTOS — separados, o app pediria a página atual com o termo novo
  // e logo em seguida a primeira página, dois pedidos para o mesmo resultado. Sem termo novo não há
  // o que recomeçar: abrir o seletor também rodava esta espera e desfazia a troca de página.
  useEffect(() => {
    if (!open) return;
    const proximoTermo = busca.trim();
    if (proximoTermo === termo) return;
    const timer = setTimeout(() => {
      setTermo(proximoTermo);
      setPagina(1);
    }, ESPERA_DA_BUSCA);
    return () => clearTimeout(timer);
  }, [busca, open, termo]);

  // Fechou: da próxima vez começa do começo, não no meio de uma busca antiga.
  // Opening starts on "Recentes" when there is anything there (issue #555), else on the full list.
  useEffect(() => {
    if (!open) {
      setBusca("");
      setTermo("");
      setPagina(1);
      return;
    }
    const salvos = loadRecentEmotes();
    setRecentes(salvos);
    setAba(salvos.length > 0 ? "recent" : "all");
  }, [open]);

  // Typing a search always shows the full list: "Recentes" is for browsing, not for finding.
  const mostrandoRecentes = aba === "recent" && !busca.trim() && recentes.length > 0;

  const escolher = (code: string) => {
    setRecentes(rememberRecentEmote(code));
    onSelect(code);
  };

  const { data, isLoading, isError, isPlaceholderData } = useEmotePage(
    pagina,
    termo,
    open && !mostrandoRecentes,
  );

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
            aria-label={texts.emotes.searchPlaceholder}
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder={texts.emotes.searchPlaceholder}
            className="pl-8"
            autoFocus
          />
        </div>

        {recentes.length > 0 && !busca.trim() && (
          <Tabs value={aba} onValueChange={(value) => setAba(value as "recent" | "all")}>
            <TabsList>
              <TabsTrigger value="recent">{texts.emotes.tabRecent}</TabsTrigger>

              <TabsTrigger value="all">{texts.emotes.tabAll}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {mostrandoRecentes ? (
          <RecentEmotesGrid codes={recentes} onSelect={escolher} />
        ) : (
          <>
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
                  <EmoteCell
                    key={`${emote.provider}-${emote.id}`}
                    code={emote.code}
                    src={emoteImageUrl(emote.thumb)}
                    onSelect={escolher}
                  />
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
          </>
        )}

        <p className="text-[11px] text-text-subtle">{texts.emotes.hint}</p>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Lives inside the dialog content, so the index is only read while the picker is open: a closed
 * picker in the composer costs no request.
 */
function RecentEmotesGrid({
  codes,
  onSelect,
}: {
  codes: string[];
  onSelect: (code: string) => void;
}) {
  const index = useEmoteIndex();
  // Only codes still in the catalog: one that left it would render a broken image.
  const visible = codes.flatMap((code) => {
    const src = index.get(code);
    return src ? [{ code, src }] : [];
  });

  return (
    <div className="max-h-[45vh] min-w-0 overflow-y-auto pr-1">
      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-text-subtle">{texts.emotes.loading}</p>
      ) : (
        <div className="grid grid-cols-6 gap-1 sm:grid-cols-8">
          {visible.map(({ code, src }) => (
            <EmoteCell key={code} code={code} src={src} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmoteCell({
  code,
  src,
  onSelect,
}: {
  code: string;
  src: string;
  onSelect: (code: string) => void;
}) {
  return (
    <button
      type="button"
      title={code}
      aria-label={code}
      onClick={() => onSelect(code)}
      // O clique é confirmado na própria célula: só `hover` não aparece no toque, e em
      // telas pequenas a pessoa não sabia se pegou a certa.
      className="flex h-11 items-center justify-center rounded-lg p-1 transition hover:bg-surface-2 active:bg-surface-2 active:ring-2 active:ring-ring"
    >
      <img
        src={src}
        alt={code}
        loading="lazy"
        decoding="async"
        className="h-8 w-8 object-contain"
      />
    </button>
  );
}
