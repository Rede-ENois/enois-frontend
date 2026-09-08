import { PROFILE_HEADER_METADATA_ITEMS } from "@/constants/profile-header-metadata-items";
import { texts } from "@/texts";
import { useProfilePageContext } from "@/utils/components/profile/use-profile-page-context";

export function useProfileHeaderMetadataController() {
  const { user } = useProfilePageContext();
  const reputation = user.reputation ?? 0;

  return {
    items: PROFILE_HEADER_METADATA_ITEMS.flatMap((item) => {
      const value = user[item.field];
      return value ? [{ ...item, value }] : [];
    }),
    connectionsLabel: texts.profile.connectionsMeta(user.connectionsCount ?? 0),
    reputationLabel: texts.profile.reputationMeta(reputation),
    showReputation: reputation > 0,
  };
}
