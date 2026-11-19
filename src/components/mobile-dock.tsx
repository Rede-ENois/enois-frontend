import { useEffect, useState } from "react";

import { useNavigate, useRouterState } from "@tanstack/react-router";

import { useAppShellStore } from "@/stores/app-shell.store";
import { texts } from "@/texts";
import { MobileDock as MobileDockView } from "@rede-enois/design-system/patterns";
import { Plus } from "lucide-react";

import { signalFor, useNavigationCounts } from "@/lib/navigation-signals";

import { DOCK_DESTINATIONS } from "./dock-destinations";

const NON_TEXT_INPUT_TYPES = new Set([
  "button",
  "checkbox",
  "color",
  "file",
  "hidden",
  "image",
  "radio",
  "range",
  "reset",
  "submit",
]);

function isEditableElement(element: Element | null): boolean {
  if (!element) return false;
  if (element.tagName === "TEXTAREA") return true;
  if (element.tagName === "INPUT") {
    const type = ((element as HTMLInputElement).type || "text").toLowerCase();
    return !NON_TEXT_INPUT_TYPES.has(type);
  }
  return (element as HTMLElement).isContentEditable === true;
}

function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    let blurTimer: number | undefined;

    const sync = () => {
      const focused = isEditableElement(document.activeElement);
      const vv = window.visualViewport;
      const viewportShrunk = vv ? window.innerHeight - vv.height > 150 : false;
      setOpen(focused || viewportShrunk);
    };

    const onFocusIn = () => {
      if (blurTimer !== undefined) {
        window.clearTimeout(blurTimer);
        blurTimer = undefined;
      }
      sync();
    };

    const onFocusOut = () => {
      if (blurTimer !== undefined) window.clearTimeout(blurTimer);
      blurTimer = window.setTimeout(sync, 0);
    };

    sync();
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);
    window.visualViewport?.addEventListener("resize", sync);

    return () => {
      if (blurTimer !== undefined) window.clearTimeout(blurTimer);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
      window.visualViewport?.removeEventListener("resize", sync);
    };
  }, []);

  return open;
}

/**
 * The phone's daily destinations a thumb away, with the same signals as the menu. "Publicar" opens
 * the feed composer (`compor=POST`), wherever the person is.
 */
export function MobileDock() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const counts = useNavigationCounts();
  // Chat apps hide the tab bar inside a thread: the floating dock covered the composer (and rose
  // with the keyboard over it). The back arrow of the thread leads to the list, where it returns.
  const conversationOpen = useAppShellStore((state) => state.conversationOpen);
  const keyboardOpen = useKeyboardOpen();

  if (conversationOpen || keyboardOpen) return null;

  return (
    <MobileDockView
      items={DOCK_DESTINATIONS.map((destination) => ({
        ...destination,
        active: pathname === destination.href || pathname.startsWith(`${destination.href}/`),
        signal: signalFor({ href: destination.href }, counts),
      }))}
      action={{
        label: texts.dock.publish,
        icon: Plus,
        onClick: () => void navigate({ to: "/feed", search: { compor: "POST" } }),
      }}
    />
  );
}
