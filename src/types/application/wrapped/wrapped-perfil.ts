/** O perfil de participação, com as chaves estáveis das características. */
export type WrappedPerfil = {
  principal: "DEBATEDOR" | "ESPECIALISTA" | "OBSERVADOR" | "CRIADOR" | "COMUNITARIO" | null;
  caracteristicas: {
    chave: "DEBATEDOR" | "ESPECIALISTA" | "OBSERVADOR" | "CRIADOR" | "COMUNITARIO";
    motivo: string;
  }[];
};
