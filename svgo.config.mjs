// Configuração do SVGO usada pelo hook `svgo` do pre-commit. Otimiza sem mudar o desenho: os IDs
// ficam (CSS e <use> do branding apontam para eles), a <desc> fica (acessibilidade) e a precisão
// numérica é alta o bastante para não deslocar curvas do logo.
export default {
  multipass: true,
  js2svg: { pretty: true, indent: 2, finalNewline: true },
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false,
          cleanupNumericValues: { floatPrecision: 6 },
          convertPathData: { floatPrecision: 6 },
          removeDesc: false,
        },
      },
    },
  ],
};
