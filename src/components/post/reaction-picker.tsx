import { type PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from "react";

import { REACTION_EMOJIS } from "@/constants/reaction-emojis";
import type { ReactionType } from "@/types/application/reaction/reaction-type";
import type { ReactionPickerProps } from "@/types/components/post/reaction-picker-props";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Quanto tempo de pressão abre o seletor em modo arrastar (o toque curto segue abrindo por clique). */
const HOLD_MS = 400;
/** Delay antes de abrir no hover (evita abrir ao passar o mouse de passagem). */
const HOVER_DELAY_MS = 300;
/** Delay antes de fechar ao sair do hover (tempo pra mover o mouse pro popup). */
const HOVER_CLOSE_MS = 400;

/**
 * Emoji sob o ponteiro. O gesto de arrastar passa por cima do popup — que é portado para o body e,
 * no toque, os eventos continuam mirando o gatilho (captura implícita) — então o que está sob o
 * dedo se descobre por coordenada, não pelo alvo do evento. Serve para toque e para mouse.
 */
function emojiAt(x: number, y: number): ReactionType | null {
  const element = document.elementFromPoint(x, y)?.closest<HTMLElement>("[data-reaction-emoji]");
  return (element?.dataset.reactionEmoji as ReactionType | undefined) ?? null;
}

/**
 * Seletor de reações com o gesto de segurar: pressionar o gatilho por um instante abre a lista de
 * emojis, e ARRASTAR com o dedo ainda pressionado até um emoji escolhe — soltar em cima reage e
 * fecha. Soltar fora de um emoji mantém o seletor aberto em modo clique, que é também o que um
 * toque curto faz (abrir por clique, como sempre abriu).
 *
 * Durante o gesto, `pointermove`/`pointerup` são seguidos na janela (o dedo sai do gatilho e entra
 * no popup). O clique que o navegador dispara no fim de um gesto de segurar é descartado —
 * `preventDefault` é o que o Popover do Radix respeita num handler composto pelo Slot, sem isso ele
 * fecharia (ou reabriria) o popup por conta própria.
 */
export function ReactionPicker({
  activeType,
  onReact,
  buttonClassName,
  buttonTitle,
  children,
}: ReactionPickerProps) {
  const [open, setOpen] = useState(false);
  const [holdMode, setHoldMode] = useState(false);
  const [dragType, setDragType] = useState<ReactionType | null>(null);
  const holdTimer = useRef<number | null>(null);
  const hoverOpenTimer = useRef<number | null>(null);
  const hoverCloseTimer = useRef<number | null>(null);
  const swallowClick = useRef(false);
  const onReactRef = useRef(onReact);
  onReactRef.current = onReact;

  const cancelHold = () => {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  };

  const cancelHoverTimers = () => {
    if (hoverOpenTimer.current !== null) {
      window.clearTimeout(hoverOpenTimer.current);
      hoverOpenTimer.current = null;
    }
    if (hoverCloseTimer.current !== null) {
      window.clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
  };

  const scheduleHoverOpen = () => {
    cancelHoverTimers();
    hoverOpenTimer.current = window.setTimeout(() => {
      hoverOpenTimer.current = null;
      setOpen(true);
    }, HOVER_DELAY_MS);
  };

  const scheduleHoverClose = () => {
    cancelHoverTimers();
    hoverCloseTimer.current = window.setTimeout(() => {
      hoverCloseTimer.current = null;
      setOpen(false);
    }, HOVER_CLOSE_MS);
  };

  useEffect(
    () => () => {
      cancelHold();
      cancelHoverTimers();
    },
    [],
  );

  // Vida do gesto de segurar: o ponteiro é seguido na janela; soltar em cima de um emoji reage e
  // fecha, soltar fora deixa o seletor aberto em modo clique.
  useEffect(() => {
    if (!holdMode) {
      return;
    }
    const move = (event: PointerEvent) => setDragType(emojiAt(event.clientX, event.clientY));
    const up = (event: PointerEvent) => {
      setHoldMode(false);
      setDragType(null);
      const type = emojiAt(event.clientX, event.clientY);
      if (type) {
        onReactRef.current(type);
        setOpen(false);
      }
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [holdMode]);

  const startPress = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    cancelHold();
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null;
      swallowClick.current = true;
      setHoldMode(true);
      setOpen(true);
      navigator.vibrate?.(10);
    }, HOLD_MS);
  };

  const endPress = () => cancelHold();

  // Um destaque por vez: durante o arrasto é o emoji sob o dedo; fora do gesto, o atual.
  const highlighted = dragType ?? activeType;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setHoldMode(false);
          setDragType(null);
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={`${buttonClassName} touch-none select-none [-webkit-touch-callout:none]`}
          title={buttonTitle}
          onPointerDown={startPress}
          onPointerUp={endPress}
          onPointerCancel={endPress}
          onPointerLeave={() => {
            if (!holdMode) {
              cancelHold();
            }
          }}
          onMouseEnter={scheduleHoverOpen}
          onMouseLeave={scheduleHoverClose}
          onContextMenu={(event) => event.preventDefault()}
          onClick={(event) => {
            if (swallowClick.current) {
              swallowClick.current = false;
              event.preventDefault();
            }
          }}
        >
          {children}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="top"
        onOpenAutoFocus={(event) => event.preventDefault()}
        onMouseEnter={cancelHoverTimers}
        onMouseLeave={scheduleHoverClose}
        className="w-fit max-w-[300px] rounded-2xl border-border p-1.5"
      >
        <div className="flex flex-wrap justify-center gap-1">
          {(Object.entries(REACTION_EMOJIS) as [ReactionType, string][]).map(([type, emoji]) => (
            <button
              key={type}
              type="button"
              data-reaction-emoji={type}
              title={type.toLowerCase()}
              onClick={() => {
                onReact(type);
                setOpen(false);
              }}
              onPointerEnter={() => setDragType(type)}
              onPointerLeave={() => setDragType((current) => (current === type ? null : current))}
              className={`rounded-lg px-2 py-1 text-xl transition ${
                highlighted === type ? "scale-110 bg-muted ring-1 ring-primary" : "hover:bg-muted"
              }`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
