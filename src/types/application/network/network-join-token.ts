/** O token de ingresso, de uso único — o participante o leva ao instalador do runtime. */
export type NetworkJoinToken = {
  token: string;
  expiresAt: string;
  nextStep: string;
};
