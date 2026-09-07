import type { MessagesSidebarProps } from "@/types/components/messages/messages-sidebar-props";

import { useMessagesSidebarController } from "@/utils/components/messages/use-messages-sidebar-controller";

import { MessagesSidebarHeader } from "@/components/messages-sidebar-header";
import { MessagesSidebarList } from "@/components/messages-sidebar-list";

export function MessagesSidebar(props: MessagesSidebarProps) {
  const { onSelect } = props;
  const controller = useMessagesSidebarController(props);

  return (
    <div className={`flex flex-col border-r border-border ${controller.sidebarClassName}`}>
      <MessagesSidebarHeader
        showSearch={controller.showSearch}
        searchToggleLabel={controller.searchToggleLabel}
        onToggleSearch={controller.toggleSearch}
        onSelect={onSelect}
        onCloseSearch={controller.closeSearch}
      />
      <MessagesSidebarList
        items={controller.conversations}
        showEmptyState={controller.showEmptyState}
      />
    </div>
  );
}
