/** Quem não pode enviar vê o aviso no lugar do formulário, com o caminho para destravar. */
export interface AvisoDeEnvio {
  texto: string;
  acao: string;
  onAcao: () => void;
}
