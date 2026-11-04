# Instalação rápida (Web + PWA)

1. Copie os arquivos de `02-web/` para a pasta `public/` do seu frontend.
2. Copie `04-social/open-graph-1200x630.png` para `public/og-image.png`.
3. Adicione as tags de `head-snippet.html` no HTML inicial ou no metadado renderizado no servidor.
4. Em React/Next, configure também a rota de metadata/OG para páginas de perfil individual.
5. Importe `05-tokens/tokens.css` no CSS global, se desejar usar a paleta.

## Android

- Copie as imagens em `03-app/android/mipmap-*` para os diretórios de mesmo nome em `res/`.
- Para adaptive icon, use `03-app/adaptive/foreground-432.png` e `background-432.png` como layers. A integração final depende de seu framework Android/Expo.

## iOS

- `03-app/ios/AppIcon-1024.png` é RGB e completamente opaco, sem cantos arredondados; iOS aplica a máscara de cantos no ícone final.
- Ajuste o Asset Catalog (`AppIcon.appiconset`) conforme Xcode ou Expo; o pacote não altera seu projeto automaticamente.

## Notas

- Imagens rasterizadas e SVGs foram recriados para aproximar o 2º conceito escolhido. Não são arquivos vetoriais originais do gerador de imagens.
- Confirme direitos de marca e verifique o símbolo em tamanhos reais antes de publicar em larga escala.
- `icon-maskable-512.png` reserva área de segurança para a forma circular do launcher Android.
