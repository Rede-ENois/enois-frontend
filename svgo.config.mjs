// Configuração do SVGO usada pelo hook `svgo` do pre-commit. Otimiza sem mudar o desenho: os IDs
// ficam (CSS e <use> do branding apontam para eles), a <desc> fica (acessibilidade) e a precisão
// numérica é alta o bastante para não deslocar curvas do logo.
export default {
  multipass: true,
  // eol fixo: sem ele o svgo grava CRLF no Windows e briga com o hook mixed-line-ending.
  js2svg: { pretty: false, finalNewline: true, eol: "lf" },
  plugins: [
    {
      name: "preset-default",
      params: {
        overrides: {
          cleanupIds: false,
          cleanupNumericValues: { floatPrecision: 6 },
          convertPathData: { floatPrecision: 6 },
          removeDesc: false,
          // role="img" faz o leitor de tela anunciar o aria-label do SVG como imagem.
          removeUnknownsAndDefaults: { keepRoleAttr: true, keepAriaAttrs: true },
        },
      },
    },
  ],
};
