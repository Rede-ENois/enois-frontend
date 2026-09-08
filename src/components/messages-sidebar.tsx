import { useMessagesSidebarController } from "@/utils/components/messages/use-messages-sidebar-controller";

import { MessagesSidebarHeader } from "@/components/messages-sidebar-header";
import { MessagesSidebarList } from "@/components/messages-sidebar-list";

export function MessagesSidebar() {
  const controller = useMessagesSidebarController();

  return (
    <div className={`flex flex-col border-r border-border ${controller.sidebarClassName}`}>
      <MessagesSidebarHeader />
      <MessagesSidebarList
        items={controller.conversations}
        showEmptyState={controller.showEmptyState}
      />
    </div>
  );
}
