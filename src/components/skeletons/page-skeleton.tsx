import { PageSkeleton as PageSkeletonView } from "@rede-enois/design-system/patterns";

import { AppContainer } from "@/components/app-container";

/**
 * Casca de página inteira no lugar da rota que ainda está chegando.
 *
 * Renderiza dentro do `AppContainer` de propósito: sem isso, o cabeçalho e a barra lateral
 * sumiriam enquanto o loader roda e a tela "piscaria" quando a página chegada substituísse tudo.
 */
export function PageSkeleton() {
  return (
    <AppContainer>
      <PageSkeletonView />
    </AppContainer>
  );
}
