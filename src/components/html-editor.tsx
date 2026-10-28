import { PHONE_FRAME_CLASS } from "@/constants/post-page";
import type { HtmlEditorProps } from "@/types/components/html-editor/props";
import { HtmlEditor as HtmlEditorView } from "@rede-enois/design-system/patterns";

import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";

/**
 * Campo de HTML/CSS com pré-visualização ao vivo, no MESMO quadro isolado do render final — o que
 * o autor vê aqui é o que os outros veem depois.
 */
export function HtmlEditor({
  frameTitle,
  innerPadding,
  previewClassName,
  ...props
}: HtmlEditorProps) {
  return (
    <HtmlEditorView
      {...props}
      previewClassName={previewClassName ?? `mt-3 ${PHONE_FRAME_CLASS}`}
      preview={
        <SandboxedHtmlFrame
          html={props.value}
          title={frameTitle}
          className="h-full"
          innerPadding={innerPadding}
          // A prévia é uma janela do editor (área fixa): aqui a rolagem de dentro é o esperado.
          autoHeight={false}
        />
      }
    />
  );
}
