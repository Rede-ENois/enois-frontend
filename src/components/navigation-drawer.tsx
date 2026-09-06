import { texts } from "@/texts";
import type { NavigationDrawerProps } from "@/types/components/navigation/navigation-drawer-props";

import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AppBrand } from "./app-brand";
import { NavigationLinks } from "./navigation-links";

export function NavigationDrawer({ open, onClose }: NavigationDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose(); }}>
      <SheetContent side="left" overlayClassName="bg-black/50 backdrop-blur-sm md:hidden" className="w-72 border-border-soft bg-surface-card p-0 shadow-card md:hidden [&>button]:right-3 [&>button]:top-2.5 [&>button]:grid [&>button]:h-9 [&>button]:w-9 [&>button]:place-items-center [&>button]:rounded-full [&>button]:text-text-subtle [&>button]:opacity-100 [&>button]:transition [&>button:hover]:bg-surface-2 [&>button:hover]:text-primary sm:[&>button]:top-3.5">
        <SheetTitle className="sr-only">{texts.navigation.drawerTitle}</SheetTitle>
        <div className="flex h-14 items-center border-b border-border-soft px-3 sm:h-16"><AppBrand onClick={onClose} /></div>
        <NavigationLinks onNavigate={onClose} className="overflow-y-auto p-3" />
      </SheetContent>
    </Sheet>
  );
}
