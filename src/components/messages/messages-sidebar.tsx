import { useMessagesSidebarController } from "@/utils/components/messages/use-messages-sidebar-controller";

import { MessagesSidebarHeader } from "@/components/messages/messages-sidebar-header";
import { MessagesSidebarList } from "@/components/messages/messages-sidebar-list";

export function MessagesSidebar() {
  const { sidebarClassName } = useMessagesSidebarController();

  return (
    <div className={`flex flex-col border-r border-border ${sidebarClassName}`}>
      <MessagesSidebarHeader />
      <MessagesSidebarList />
    </div>
  );
}
