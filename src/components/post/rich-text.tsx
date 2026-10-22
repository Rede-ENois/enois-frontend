import { type ReactNode, useMemo } from "react";

import { Link } from "@tanstack/react-router";

import type { RichTextProps } from "@/types/components/post/rich-text-props";
import type { RichNode } from "@/types/lib/rich-text/rich-node";

import { isOwnMediaUrl, withImageKitOriginal } from "@/lib/api/media";
import { splitByInlineMedia } from "@/lib/rich-text/inline-media";
import { parseRichText } from "@/lib/rich-text/parse";
import { directMediaKind, gifMediaUrl } from "@/lib/shared-links";
import { cn } from "@/lib/utils";
import { texts } from "@/texts";

import { InlineMedia } from "./inline-media";
import { SpoilerMedia } from "./spoiler-media";
import { SpoilerText } from "./spoiler-text";

/**
 * Renderiza a formatação leve (markdown) de todo campo de texto que não é HTML.
 *
 * Sai como elementos React (não há `dangerouslySetInnerHTML` em lugar nenhum): o pior caso de um
 * texto malicioso aqui é aparecer como texto. Posts sem formatação passam pelo mesmo caminho e
 * saem idênticos ao que saíam antes — parágrafos usam `whitespace-pre-line`, então quebras e
 * linhas vazias continuam valendo.
 *
 * Imagem só vira imagem quando o endereço é nosso (`![...](/media/x)` ou o CDN do app); endereço de
 * servidor de terceiro sai como link, porque imagem remota carrega sozinha e entrega o IP de quem
 * lê para quem publicou.
 */
export function RichText({ content, className, linkClassName, mediaIds, mediaSpoiler }: RichTextProps) {
  const linkClass = linkClassName ?? "text-primary hover:underline";

  // Imagem NO MEIO do texto (item 9): quando há mídias anexadas, o conteúdo é dividido nos
  // marcadores `{{media:id}}` e cada um vira a mídia no ponto exato; o texto entre eles passa
  // pelo mesmo pipeline de sempre. Sem marcador (ou sem mídias), é o caminho antigo, intacto.
  const chunks = useMemo(
    () =>
      mediaIds?.length ? splitByInlineMedia(content) : [{ kind: "text" as const, text: content }],
    [content, mediaIds],
  );

  return (
    <div className={className}>
      {chunks.map((chunk, chunkKey) => {
        // Um marcador cuja mídia não está na lista do post NÃO renderiza (o backend já recusa
        // na gravação; aqui é a segunda trava) — o texto ao redor continua.
        if (chunk.kind === "media") {
          return mediaIds?.includes(chunk.mediaId) ? (
            <InlineMedia key={`media-${chunkKey}`} mediaId={chunk.mediaId} mediaSpoiler={mediaSpoiler} />
          ) : null;
        }
        return parseRichText(chunk.text).map((block, key) =>
          renderBlock(block, `${chunkKey}-${key}`, linkClass, mediaSpoiler),
        );
      })}
    </div>
  );
}

function renderBlock(block: RichNode, key: React.Key, linkClass: string, mediaSpoiler = false): ReactNode {
  switch (block.kind) {
    case "heading":
      return (
        <p key={key} className={cn("mt-2 font-medium", HEADING_SIZE[block.level ?? 1])}>
          {renderInline(block.children ?? [], linkClass, mediaSpoiler)}
        </p>
      );

    case "quote":
      return (
        <blockquote key={key} className="my-2 border-l-2 border-border-soft pl-3 text-text-subtle">
          {renderInline(block.children ?? [], linkClass, mediaSpoiler)}
        </blockquote>
      );

    case "codeBlock":
      return (
        <pre
          key={key}
          className="my-2 overflow-x-auto rounded-xl bg-surface-1 p-3 text-sm leading-relaxed"
        >
          <code>{block.text}</code>
        </pre>
      );

    case "divider":
      return <hr key={key} className="my-3 border-border-soft" />;

    case "table":
      return (
        <div key={key} className="my-2 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {block.children?.map((child, index) => renderBlock(child, index, linkClass, mediaSpoiler))}
            </tbody>
          </table>
        </div>
      );

    case "tableRow":
      return (
        <tr key={key}>
          {block.children?.map((child, index) => renderBlock(child, index, linkClass, mediaSpoiler))}
        </tr>
      );

    case "tableCell": {
      const cellClass = cn(
        "border border-border-soft px-2 py-1 align-top",
        block.align === "center" && "text-center",
        block.align === "right" && "text-right",
        block.header && "bg-surface-1 font-medium",
      );

      return block.header ? (
        <th key={key} className={cellClass}>
          {renderInline(block.children ?? [], linkClass, mediaSpoiler)}
        </th>
      ) : (
        <td key={key} className={cellClass}>
          {renderInline(block.children ?? [], linkClass)}
        </td>
      );
    }

    case "list": {
      // Lista com caixa de marcar não leva marcador: a caixa já diz o que é.
      const task = block.children?.some((item) => item.checked !== undefined) ?? false;

      return block.ordered ? (
        <ol key={key} className="my-2 list-decimal space-y-1 pl-5">
          {block.children?.map((child, index) => renderBlock(child, index, linkClass, mediaSpoiler))}
        </ol>
      ) : (
        <ul key={key} className={cn("my-2 space-y-1", task ? "list-none pl-0" : "list-disc pl-5")}>
          {block.children?.map((child, index) => renderBlock(child, index, linkClass, mediaSpoiler))}
        </ul>
      );
    }

    case "listItem":
      return (
        <li key={key} className="whitespace-pre-line break-words">
          {block.checked !== undefined && (
            <input
              type="checkbox"
              checked={block.checked}
              disabled
              readOnly
              className="mr-1.5 align-middle accent-primary"
            />
          )}

          {renderInline(block.children ?? [], linkClass, mediaSpoiler)}

          {block.nested?.map((child, index) => renderBlock(child, index, linkClass))}
        </li>
      );

    default:
      return (
        <p key={key} className="whitespace-pre-line break-words">
          {renderInline(block.children ?? [], linkClass, mediaSpoiler)}
        </p>
      );
  }
}

function renderInline(nodes: RichNode[], linkClass: string, mediaSpoiler = false): ReactNode {
  return nodes.map((node, index) => {
    // Nó com filhos já foi lido de novo pelo parser (negrito com itálico dentro, link com
    // formatação): o texto cru só vale quando não há filhos.
    const inner = node.children ? renderInline(node.children, linkClass, mediaSpoiler) : node.text;

    switch (node.kind) {
      case "bold":
        return (
          <strong key={index} className="font-medium">
            {inner}
          </strong>
        );

      case "italic":
        return (
          <em key={index} className="italic">
            {inner}
          </em>
        );

      case "strike":
        return <s key={index}>{inner}</s>;

      case "code":
        return (
          <code key={index} className="rounded bg-surface-1 px-1.5 py-0.5 text-sm">
            {node.text}
          </code>
        );

      case "mention":
        return (
          <Link
            key={index}
            to="/perfil/$username"
            params={{ username: (node.text ?? "").replace("@", "") }}
            className={cn("font-medium", linkClass)}
          >
            {node.text}
          </Link>
        );

      case "spoiler":
        return <SpoilerText key={index} text={node.text ?? ""} />;

      case "link":
        if (isMidiaDireta(node.href)) {
          return renderMidia(node.href!, index, mediaSpoiler);
        }
        return (
          <a
            key={index}
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("break-words", linkClass)}
          >
            {inner}
          </a>
        );

      case "image":
        if (isMidiaDireta(node.href)) {
          return renderMidia(node.href!, index, mediaSpoiler);
        }
        return isOwnMediaUrl(node.href ?? "") ? (
          <SpoilerMedia active={mediaSpoiler} label={texts.posts.mediaSpoiler.reveal}>
            {() => (
              <img
                key={index}
                src={node.href}
                alt={node.text ?? ""}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="my-1 max-h-80 rounded-xl border border-border-soft object-contain"
              />
            )}
          </SpoilerMedia>
        ) : (
          <a
            key={index}
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn("break-words", linkClass)}
          >
            {node.text || node.href}
          </a>
        );

      default:
        return node.text;
    }
  });
}

const HEADING_SIZE: Record<number, string> = {
  1: "text-lg",
  2: "text-base",
  3: "text-base",
};

/** O endereço é MÍDIA direta (GIF de Giphy/Tenor, imagem/vídeo/áudio por extensão)? */
function isMidiaDireta(href?: string | null): boolean {
  if (!href) return false;
  return directMediaKind(href) !== null || gifMediaUrl(href) !== null;
}

/** Renderiza a mídia inline: o link cru sai do texto e a mídia roda no player (pedido da Mel). */
function renderMidia(href: string, key: React.Key, mediaSpoiler = false): ReactNode {
  const tipo = directMediaKind(href);
  if (tipo === "video") {
    return (
      <SpoilerMedia active={mediaSpoiler} label={texts.posts.mediaSpoiler.reveal}>
        {() => (
          <video
            key={key}
            src={withImageKitOriginal(href)}
            controls
            playsInline
            className="my-1 max-h-96 w-full rounded-xl border border-border-soft"
          />
        )}
      </SpoilerMedia>
    );
  }
  if (tipo === "audio") {
    return (
      <audio key={key} src={withImageKitOriginal(href)} controls className="my-1 w-full max-w-md" />
    );
  }
  return (
    <SpoilerMedia active={mediaSpoiler} label={texts.posts.mediaSpoiler.reveal}>
      {() => (
        <img
          key={key}
          src={gifMediaUrl(href) ?? href}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="my-1 max-h-96 rounded-xl border border-border-soft"
        />
      )}
    </SpoilerMedia>
  );
}
