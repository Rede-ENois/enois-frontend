/**
 * Histórico de novidades versionado junto com o código.
 *
 * É a fonte do popup de primeiro acesso e da página /novidades. O painel admin
 * (/novidades/atual) continua funcionando como aviso extra e é somado a esta lista.
 */
import type { ChangelogRelease } from "@/types/application/changelog/changelog-release";

/** Mais recente primeiro: é dele que sai a versão exibida e dispensada. */
export const CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    version: "2026.11.05",
    date: "Novembro de 2026",
    title: "O que mudou no É-Nóis",
    description:
      "Melhorias de layout, design system e recursos para você chegar mais rápido no que importa.",
    items: [
      {
        id: "feed-personalizacao",
        tag: "Feed",
        title: "O feed do seu jeito",
        description:
          "A escolha de assuntos e os filtros saíram do topo do feed e agora ficam juntos numa aba de personalização.",
        steps: [
          "Abra o feed e toque no botão de personalização",
          "Escolha os assuntos e o tipo de post que quer ver",
          "Feche a aba: o feed já volta filtrado",
        ],
        action: { label: "Experimentar", to: "/feed" },
      },
      {
        id: "grupos-descobrir",
        tag: "Grupos",
        title: "Encontre novos grupos",
        description:
          "O painel Descobrir sugere grupos da rede a partir dos seus interesses, direto na página de grupos.",
        steps: [
          "Abra Grupos",
          "Use o painel Descobrir para ver sugestões",
          "Entre no grupo e participe dos canais",
        ],
        action: { label: "Experimentar", to: "/grupos" },
      },
      {
        id: "modo-leve",
        tag: "Desempenho",
        title: "Mais leve no seu aparelho",
        description:
          "Os modos lite e BATATA reduzem animações e economizam memória em aparelhos mais simples ou com internet ruim.",
        steps: ["Abra sua conta", "Entre em Uso saudável", "Ative Modo lite ou BATATA"],
        action: { label: "Experimentar", to: "/conta" },
      },
      {
        id: "novidades-da-plataforma",
        tag: "Novidades",
        title: "Avisos de atualização",
        description:
          "Agora você vê um resumo das mudanças no primeiro acesso após cada atualização, com o passo a passo de como usar.",
        steps: [
          "O resumo aparece uma vez por versão, ao abrir o feed",
          "Para não receber mais, desative em Conta → Novidades",
          "O histórico completo fica em Novidades, no Explorar",
        ],
        action: { label: "Ver histórico", to: "/novidades" },
      },
    ],
  },
];

export const LATEST_CHANGELOG_VERSION = CHANGELOG_RELEASES[0]?.version ?? "2026.11.05";
