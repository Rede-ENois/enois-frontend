import { AppLayoutContent } from "./app-layout-content";
import { AppLayoutMain } from "./app-layout-main";
import { AppLayoutRoot } from "./app-layout-root";
import { AppLayoutSlot } from "./app-layout-slot";

export const AppLayout = Object.assign(AppLayoutRoot, {
  Header: AppLayoutSlot,
  Content: AppLayoutContent,
  Sidebar: AppLayoutSlot,
  Main: AppLayoutMain,
  Navigation: AppLayoutSlot,
});
