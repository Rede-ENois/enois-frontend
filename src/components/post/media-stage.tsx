import { useCallback, useEffect, useRef, useState } from "react";

import { texts } from "@/texts";
import type { MediaStageProps } from "@/types/components/post/media-stage-props";
import { Volume2, VolumeX, X } from "lucide-react";

import { restoreSuspendedMedia, suspendOffscreenMedia } from "@/lib/lite-media";

/**
 * Palco de mídia do Modo lite: o vídeo escolhido abre em tela cheia e o resto da página sai de
 * cena — pausado e sem segurar buffer — enquanto a pessoa assiste.
 *
 * O que NÃO acontece, e é o ponto: nada é desmontado. O feed continua montado, na mesma
 * rolagem, e ao fechar a pessoa está exatamente onde estava — sem recarregar, sem voltar ao
 * topo, sem perder o que já tinha rolado. O vídeo volta para o card no segundo em que parou.
 *
 * Também não é a tela cheia do sistema: é uma camada do próprio app, então o voltar do
 * navegador, o gesto de fechar e o resto da interface continuam existindo.
 */
export function MediaStage({ src, initialTime = 0, muted = false, onClose }: MediaStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const closed = useRef(false);
  const [mutedNow, setMutedNow] = useState(muted);

  const close = useCallback(() => {
    if (closed.current) return;
    closed.current = true;
    onClose(videoRef.current?.currentTime ?? 0);
  }, [onClose]);

  useEffect(() => {
    // O resto da página sai de cena: tudo pausado, e os vídeos fora da tela devolvem a memória.
    suspendOffscreenMedia(videoRef.current);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      restoreSuspendedMedia();
    };
  }, [close]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={texts.posts.mediaStage.title}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black"
      onClick={close}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        playsInline
        controls
        muted={mutedNow}
        onLoadedMetadata={(event) => {
          // Continua do ponto onde o card estava (e de onde a pessoa parou da última vez).
          if (initialTime > 0) event.currentTarget.currentTime = initialTime;
        }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[100dvh] max-w-full bg-black"
      />

      <div className="absolute right-3 top-3 flex items-center gap-2">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            setMutedNow((value) => !value);
          }}
          aria-label={mutedNow ? texts.posts.mediaStage.unmute : texts.posts.mediaStage.mute}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
        >
          {mutedNow ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        <button
          type="button"
          autoFocus
          onClick={(event) => {
            event.stopPropagation();
            close();
          }}
          aria-label={texts.accessibility.close}
          title={texts.accessibility.close}
          className="grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
