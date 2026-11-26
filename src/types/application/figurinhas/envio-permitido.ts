/**
 * A decisão do servidor sobre o envio de figurinha: identidade verificada e reputação mínima
 * (`GET /figurinhas/envios/pode`). `motivo` diz o que falta para a tela explicar.
 */
export interface EnvioPermitido {
  pode: boolean;
  reputacao: number;
  reputacaoMinima: number;
  identidadeVerificada: boolean;
  motivo: "IDENTITY_REQUIRED" | "LOW_REPUTATION" | null;
}
