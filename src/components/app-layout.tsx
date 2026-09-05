import { AppLayoutContent } from "@/components/app-layout/app-layout-content";
import { AppLayoutHeader } from "@/components/app-layout/app-layout-header";
import { AppLayoutMain } from "@/components/app-layout/app-layout-main";
import { AppLayoutNavigation } from "@/components/app-layout/app-layout-navigation";
import { AppLayoutRoot } from "@/components/app-layout/app-layout-root";
import { AppLayoutSidebar } from "@/components/app-layout/app-layout-sidebar";

export const AppLayout = Object.assign(AppLayoutRoot, {
  Header: AppLayoutHeader,
  Content: AppLayoutContent,
  Sidebar: AppLayoutSidebar,
  Main: AppLayoutMain,
  Navigation: AppLayoutNavigation,
});
