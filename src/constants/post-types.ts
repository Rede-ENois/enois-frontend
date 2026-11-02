import { texts } from "@/texts";
import {
  BadgeCheck,
  BarChart3,
  Briefcase,
  Calendar,
  Code2,
  FileText,
  GraduationCap,
  Lightbulb,
  type LucideIcon,
  Newspaper,
  Smile,
  Star,
  Vote,
} from "lucide-react";

/**
 * Catálogo de tipos de publicação — a lista que o composer mostra e que o backend aceita.
 *
 * Fica num lugar só, de propósito: acrescentar um tipo é uma linha aqui (mais o valor no enum do
 * backend), sem caçar botão espalhado pelo composer. `page` e `article` têm tratamento próprio
 * (página renderiza HTML, artigo tem texto maior em tabela separada), e é por isso que o composer
 * olha o `id` e não a posição.
 */
export const POST_TYPES: { id: string; label: string; icon: LucideIcon; hint?: string }[] = [
  { id: "INSIGHT", label: texts.feed.composer.types.insight, icon: Lightbulb },
  { id: "ARTICLE", label: texts.feed.composer.types.article, icon: FileText },
  { id: "QUESTION", label: texts.feed.composer.types.question, icon: BarChart3 },
  { id: "PROJECT", label: texts.feed.composer.types.project, icon: GraduationCap },
  { id: "OPPORTUNITY", label: texts.feed.composer.types.opportunity, icon: BadgeCheck },
  { id: "NEWS", label: texts.feed.composer.types.news, icon: Newspaper },
  { id: "TUTORIAL", label: texts.feed.composer.types.tutorial, icon: Code2 },
  { id: "REVIEW", label: texts.feed.composer.types.review, icon: Star },
  { id: "DIVERTIDO", label: texts.feed.composer.types.divertido, icon: Smile },
  {
    id: "MOMENT",
    label: texts.feed.composer.types.moment,
    icon: Calendar,
    hint: texts.feed.composer.types.momentHint,
  },
  {
    id: "POLL",
    label: texts.feed.composer.types.poll,
    icon: Vote,
    hint: texts.feed.composer.types.pollHint,
  },
  { id: "PAGE", label: texts.feed.composer.page, icon: Code2 },
  // Publicação corporativa: só aparece quando a identidade ativa é a profissional.
  { id: "BUSINESS", label: texts.feed.composer.types.business, icon: Briefcase },
];

/** Teto do texto do artigo — o mesmo do backend (`PublishPostService.MAX_ARTICLE_BODY`). */
export const ARTICLE_BODY_MAX_LENGTH = 10_000;

/** Enquete: os mesmos números do backend (`PublishPostService.MIN/MAX_POLL_*`). */
export const POLL_MIN_OPTIONS = 2;
export const POLL_MAX_OPTIONS = 6;
export const POLL_OPTION_MAX_LENGTH = 120;
