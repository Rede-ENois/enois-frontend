import { usePreferencesStore } from "@/stores/preferences.store";
import {
  type SandboxedHtmlFrameProps,
  SandboxedHtmlFrame as SandboxedHtmlFrameView,
} from "@rede-enois/design-system/patterns";

import { THEME_STYLE_ELEMENT_ID } from "@/lib/theme/apply-theme";
import { useLiteMode } from "@/lib/use-lite-mode";

/**
 * Renderiza o HTML de uma pagina dentro de um iframe isolado, com o tema do app e o modo lite
 * (sem autoplay delegado).
 */
export function SandboxedHtmlFrame(
  props: Omit<SandboxedHtmlFrameProps, "theme" | "themeStyleElementId" | "lite">,
) {
  const theme = usePreferencesStore((state) => state.theme);
  const lite = useLiteMode();

  return (
    <SandboxedHtmlFrameView
      {...props}
      theme={theme}
      themeStyleElementId={THEME_STYLE_ELEMENT_ID}
      lite={lite}
    />
  );
}
