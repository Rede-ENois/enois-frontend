import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { LinkPreviewCardProps } from "@/types/components/post/link-preview-card-props";

import { resolveCdnUrl } from "@/lib/api/media";
import { absoluteLinkUrl, internalPathOf } from "@/lib/link-preview/paths";
import { linkPreviewQueryOptions } from "@/lib/link-preview/query";

import { domainOf, labelOf, safeImageUrl, targetOf } from "./link-preview-card.helpers";

/**
 * O cartão de um link publicado num post ou comentário.
 *
 * Uma página do próprio Énóis abre dentro do app com o que a página tem (título, resumo, primeira
 * imagem); um site de fora mostra o que ele declara para compartilhamento (título, descrição e
 * imagem do SEO). O site sem nada disso continua com o cartão simples (host + "abrir página"), que
 * era o comportamento de antes — nunca um quadrado vazio.
 */
export function LinkPreviewCard({ url, compact = false }: LinkPreviewCardProps) {
  const absolute = absoluteLinkUrl(url);
  const { data: previewData } = useQuery({
    ...linkPreviewQueryOptions(absolute ?? url),
    enabled: absolute != null,
  });

  if (!absolute) return null;

  const preview = previewData ?? null;

  const target = targetOf(absolute, preview, internalPathOf(absolute));
  const title = preview?.title?.trim() || null;
  const description = preview?.description?.trim() || null;
  const image = safeImageUrl(preview?.imageUrl ?? null);
  const label = labelOf(preview, absolute);

  const hasCard = Boolean(title || image);
  const frame = compact ? "mt-2 gap-2 rounded-lg p-2" : "mt-3 gap-3 rounded-xl p-3 sm:gap-4 sm:p-4";

  // Sem nada para mostrar além do endereço, o cartão é o de antes: o host e o convite a abrir.
  if (!hasCard) {
    return (
      <a
        href={absolute}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex min-w-0 items-center ${frame} border border-border-soft bg-surface-1 text-sm font-normal transition hover:bg-surface-3`}
      >
        <div
          className={`grid shrink-0 place-items-center rounded-lg bg-surface-2 font-bold text-primary ${
            compact ? "h-7 w-7 text-[10px]" : "h-8 w-8 text-xs"
          }`}
        >
          {domainOf(absolute).slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate font-normal text-text-strong">{domainOf(absolute)}</p>

          <p className="truncate text-xs font-normal text-text-subtle">
            {texts.posts.linkPreview.open}
          </p>
        </div>
      </a>
    );
  }

  const body = (
    <>
      {image ? (
        <img
          src={image}
          alt={title ? texts.posts.linkPreview.imageAlt(title) : ""}
          // Cartão do feed: a imagem é decorativa e não pode empurrar o layout quando não carrega.
          loading="lazy"
          referrerPolicy="no-referrer"
          className={`shrink-0 rounded-lg bg-surface-2 object-cover ${
            compact ? "h-12 w-16" : "h-16 w-24 sm:h-20 sm:w-32"
          }`}
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-xs font-normal uppercase tracking-wide text-text-subtle ${compact ? "" : "mb-0.5"}`}
        >
          {label}
        </p>
        {title ? (
          <p
            className={`line-clamp-2 font-normal text-text-strong ${compact ? "text-sm" : "text-base"}`}
          >
            {title}
          </p>
        ) : null}
        {description && !compact ? (
          <p className="mt-0.5 line-clamp-2 text-sm font-normal text-text-subtle">{description}</p>
        ) : null}
        <p className="mt-1 truncate text-xs font-normal text-primary">
          {target.outside ? texts.posts.linkPreview.open : texts.posts.linkPreview.openInternal}
        </p>
      </div>
    </>
  );

  const frameClass = `flex min-w-0 items-start ${frame} border border-border-soft bg-surface-1 transition hover:bg-surface-3`;

  // Página do próprio app: navega dentro; o resto abre em outra aba, como o link sempre abriu.
  if (target.outside) {
    return (
      <a
        href={target.href}
        target="_blank"
        rel="noopener noreferrer"
        className={frameClass}
        aria-label={title ? `${texts.posts.linkPreview.open}: ${title}` : undefined}
      >
        {body}
      </a>
    );
  }

  return (
    <Link
      to={target.href}
      className={frameClass}
      aria-label={title ? `${texts.posts.linkPreview.openInternal}: ${title}` : undefined}
    >
      {body}
    </Link>
  );
}
