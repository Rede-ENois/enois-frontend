import type { PapoStatus, PapoSubjectView } from "@rede-enois/design-system/domain";

/**
 * Um assunto em alta do Papo Reto, como o backend devolve.
 *
 * O tipo de tela reusa o agregado do design system: subject dobrado, status de trajetória,
 * pontuação e contagens do conjunto. Não existe autor, texto nem id de publicação aqui —
 * o backend não manda, e a rota não inventa.
 */
export type PapoAssuntoView = PapoSubjectView;
