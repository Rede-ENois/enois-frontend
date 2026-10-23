import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Os jogos diários viraram uma CATEGORIA dentro de "Jogos da comunidade" (/games?categoria=diarios).
 *
 * <p>Esta rota continua existindo só para o endereço antigo não quebrar: quem tinha o link (ou o
 * favorito) cai na categoria certa, e o item separado do menu sai — o menu tem um só lugar de
 * jogos agora.
 */
export const Route = createFileRoute("/jogos-diarios")({
  beforeLoad: () => {
    throw redirect({ to: "/games", search: { categoria: "diarios" } });
  },
});
