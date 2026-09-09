import { texts } from "@/texts";
import { useNavigationDrawerController } from "@/utils/navigation/use-navigation-drawer-controller";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { AppBrand } from "@/components/layout/app-brand";
import { NavigationLinks } from "@/components/navigation/navigation-links";

export function NavigationDrawer() {
  const { open, handleOpenChange } = useNavigationDrawerController();

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <DialogPrimitive.Content className="fixed inset-y-0 left-0 z-50 h-full w-72 gap-4 border-r border-border-soft bg-surface-card p-0 shadow-card transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left md:hidden sm:max-w-sm">
          <DialogPrimitive.Title className="sr-only">
            {texts.navigation.drawerTitle}
          </DialogPrimitive.Title>

          <div className="flex h-14 items-center border-b border-border-soft px-3 sm:h-16">
            <AppBrand />
          </div>

          <NavigationLinks variant="drawer" className="overflow-y-auto p-3" />

          <DialogPrimitive.Close className="absolute right-3 top-2.5 grid h-9 w-9 place-items-center rounded-full text-text-subtle opacity-100 transition hover:bg-surface-2 hover:text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none sm:top-3.5">
            <X className="h-4 w-4" />

            <span className="sr-only">{texts.accessibility.close}</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
