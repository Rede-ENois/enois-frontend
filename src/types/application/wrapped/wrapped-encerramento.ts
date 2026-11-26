/** As peças do fecho do ano. */
export type WrappedEncerramento = {
  temaPrincipal: string | null;
  caracteristica: "DEBATEDOR" | "ESPECIALISTA" | "OBSERVADOR" | "CRIADOR" | "COMUNITARIO" | null;
  estatistica: string | null;
};
