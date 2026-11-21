import type {
  GroupAdminCandidate,
  GroupAdminParticipantData,
} from "@rede-enois/design-system/domain";

import type { GroupPanelView } from "./group-panel-view";

export type GroupAdmin = {
  panel: GroupPanelView | undefined;
  participants: GroupAdminParticipantData[];
  loading: boolean;
  myRole: "OWNER" | "ADMIN" | "MEMBER" | null;
  canManage: boolean;
  isOwner: boolean;
  candidates: GroupAdminCandidate[];
  candidatesLoading: boolean;
  pending: boolean;
  error: string | null;
  onSearchCandidates: (query: string) => void;
  onAddMembers: (userIds: string[]) => Promise<void>;
  onPromote: (userId: string) => Promise<void>;
  onDemote: (userId: string) => Promise<void>;
  onRemove: (userId: string) => Promise<void>;
};
