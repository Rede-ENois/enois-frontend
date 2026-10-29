import { useEffect, useRef, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { NoticeSurface } from "@/types/application/notices/notice-surface";
import { Button, Input, useToast } from "@rede-enois/design-system/ui";
import { Megaphone } from "lucide-react";

import { ApiError, noticesApi } from "@/lib/api";
import { cn } from "@/lib/utils";

import { HtmlEditor } from "@/components/html-editor";

const SURFACES: NoticeSurface[] = ["BANNER", "MODAL", "BOTH"];

/**
 * Painel do aviso da plataforma: o admin escreve em HTML/CSS, escolhe onde aparece e publica.
 *
 * Uma publicacao substitui a anterior — nao ha lista nem rascunho. Por isso o formulario vem
 * preenchido com o que esta no ar: editar o aviso vigente e o caso comum, e reescrever por cima e
 * mais honesto do que esconder o conteudo antigo atras de um botao.
 */
export function NoticesSection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notice } = useQuery({
    queryKey: ["avisos", "ativo"],
    queryFn: () => noticesApi.current(),
    retry: false,
  });

  const [title, setTitle] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [surface, setSurface] = useState<NoticeSurface>("BANNER");
  // O aviso vigente preenche o formulario uma sola vez: sem isso, um "tirar do ar" seguido de
  // nova leitura jogaria por cima o texto que o admin ja esta corrigindo.
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current || !notice) return;
    seeded.current = true;
    setTitle(notice.title);
    setBodyHtml(notice.bodyHtml);
    setSurface(notice.surface);
  }, [notice]);

  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["avisos", "ativo"] });

  const publish = useMutation({
    mutationFn: () => noticesApi.publish({ title: title.trim(), bodyHtml, surface }),
    onSuccess: (saved) => {
      seeded.current = true;
      setTitle(saved.title);
      setBodyHtml(saved.bodyHtml);
      setSurface(saved.surface);
      toast(texts.moderator.notices.published, "success");
      refresh();
    },
    onError: (error) =>
      toast(error instanceof ApiError ? error.message : texts.moderator.notices.error, "error"),
  });

  const retire = useMutation({
    mutationFn: () => noticesApi.retire(),
    onSuccess: () => {
      toast(texts.moderator.notices.retired, "success");
      refresh();
    },
    onError: () => toast(texts.moderator.notices.error, "error"),
  });

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-text-subtle">
          {texts.moderator.notices.title}
        </h2>

        <p className="text-sm text-muted-foreground">{texts.moderator.notices.description}</p>
      </div>

      <div className="rounded-2xl border border-border-soft bg-surface-card p-4 text-sm">
        {notice ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-text-strong">
              {texts.moderator.notices.live(
                notice.title,
                texts.moderator.notices.surfaces[notice.surface],
              )}
            </p>

            <Button
              size="sm"
              variant="ghost"
              className="rounded-full text-destructive"
              disabled={retire.isPending}
              onClick={() => retire.mutate()}
            >
              {texts.moderator.notices.retire}
            </Button>
          </div>
        ) : (
          <p className="inline-flex items-center gap-2 text-text-subtle">
            <Megaphone className="h-4 w-4" />

            <>{texts.moderator.notices.none}</>
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="notice-title" className="text-xs font-normal text-text-subtle">
          {texts.moderator.notices.titleLabel}
        </label>

        <Input
          id="notice-title"
          value={title}
          maxLength={140}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={texts.moderator.notices.titlePlaceholder}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-normal text-text-subtle">
          {texts.moderator.notices.surfaceLabel}
        </p>

        <div className="flex flex-wrap gap-1.5">
          {SURFACES.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSurface(item)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium transition",
                surface === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border-soft text-text-subtle hover:border-primary/50 hover:text-primary",
              )}
            >
              {texts.moderator.notices.surfaces[item]}
            </button>
          ))}
        </div>

        <p className="text-xs text-text-subtle">{texts.moderator.notices.surfaceHint}</p>
      </div>

      <HtmlEditor
        id="notice-html"
        value={bodyHtml}
        onChange={setBodyHtml}
        label={texts.moderator.notices.htmlLabel}
        description={texts.moderator.notices.htmlHint}
        placeholder={'<style>\n.aviso { padding: 8px 12px; }\n</style>\n<p class="aviso">...</p>'}
        emptyPreview={texts.moderator.notices.emptyPreview}
        frameTitle={texts.moderator.notices.title}
        maxLength={20_000}
        innerPadding={false}
        previewClassName="-mx-3 -mb-3 mt-3 h-[160px] w-full"
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          className="rounded-full"
          disabled={publish.isPending || !title.trim() || !bodyHtml.trim()}
          onClick={() => publish.mutate()}
        >
          {publish.isPending
            ? texts.moderator.notices.publishing
            : notice
              ? texts.moderator.notices.republish
              : texts.moderator.notices.publish}
        </Button>

        <p className="text-xs text-text-subtle">{texts.moderator.notices.formHint}</p>
      </div>
    </section>
  );
}
