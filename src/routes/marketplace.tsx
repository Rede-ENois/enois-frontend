import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * O marketplace virou parte da aba Loja dentro da Carteira (`/carteira?tab=loja`).
 *
 * A rota antiga continua existindo só para o endereço não quebrar: quem tinha o link (ou o
 * favorito) cai na loja, junto com os cosméticos e a moeda.
 */
export const Route = createFileRoute("/marketplace")({
  beforeLoad: () => {
    throw redirect({ to: "/carteira", search: { tab: "loja" } });
  },
});
