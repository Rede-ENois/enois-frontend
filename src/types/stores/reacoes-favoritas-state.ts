/**
 * A fileira de reações favoritas e de onde ela veio.
 *
 * `escolheu` separa "nunca escolheu" (a pessoa vê o padrão: joinha e coração roxo) de "escolheu
 * esta fileira" — no seletor compacto, só a escolha da pessoa substitui o que o design system
 * desenha.
 */
export interface ReacoesFavoritasState {
  favoritas: string[];
  escolheu: boolean;

  alternar: (tipo: string) => void;
  mover: (tipo: string, direcao: -1 | 1) => void;
}
