import type { Conversation } from "@/types/application/message/conversation";
import type { Profile } from "@/types/application/profile/profile";
import type { ConversationPeerData } from "@rede-enois/design-system/domain";

import { authorNameStyle } from "@/lib/profile-name-style";

/**
 * Who the other participant is IN THIS conversation. A professional thread (application,
 * proposal, hiring) shows their active professional identity and links to the professional page,
 * never the social profile; any other thread shows the account profile.
 */
export function conversationPeer(
  conversation: Pick<Conversation, "identities">,
  otherId: string | undefined,
  otherUser: Profile | undefined,
): { peer: ConversationPeerData | undefined; profileHref: string } {
  const professional = otherId ? conversation.identities?.[otherId] : undefined;
  if (professional) {
    return {
      peer: { name: professional.name, avatar: professional.avatar || null },
      profileHref: `/profissional/${professional.username}`,
    };
  }
  return {
    peer: otherUser && { ...otherUser, nameStyle: authorNameStyle(otherUser) },
    profileHref: `/perfil/${otherUser?.username ?? otherId ?? ""}`,
  };
}
