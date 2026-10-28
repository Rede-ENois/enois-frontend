import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { TOPICS, TOPIC_LABELS } from "@/constants/community-topics";
import { texts } from "@/texts";
import {
  type CommunityChannelValues,
  CommunityChannels as CommunityChannelsView,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { communitiesApi } from "@/lib/api";

const TOPIC_OPTIONS = TOPICS.filter((option) => option !== "Todas").map((option) => ({
  value: option,
  label: TOPIC_LABELS[option],
}));

/**
 * Canais privados por tema da comunidade.
 *
 * A lista só é pedida quando a pessoa participa (o backend responde 403 para quem não é membro) e
 * o conteúdo de cada canal vive numa rota própria, fora dos feeds.
 */
export function CommunityChannels({
  communityId,
  joined,
}: {
  communityId: string;
  joined: boolean;
}) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const channels = useQuery({
    queryKey: ["community", communityId, "channels"],
    queryFn: () => communitiesApi.channels(communityId),
    enabled: joined,
    retry: false,
  });

  const create = useMutation({
    mutationFn: ({ name, topic, description }: CommunityChannelValues) =>
      communitiesApi.createChannel(communityId, {
        name: name.trim(),
        ...(topic ? { topic } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["community", communityId, "channels"] });
      toast(texts.communityChannels.created, "success");
    },
  });

  const items = (channels.data ?? []).map((channel) => ({
    id: channel.id,
    name: channel.name,
    href: `/comunidades/${communityId}/canais/${channel.id}`,
    topicLabel: channel.topic ? TOPIC_LABELS[channel.topic as keyof typeof TOPIC_LABELS] : null,
    description: channel.description,
  }));

  return (
    <CommunityChannelsView
      joined={joined}
      loading={channels.isLoading}
      channels={items}
      topics={TOPIC_OPTIONS}
      createPending={create.isPending}
      onCreate={(values) =>
        create.mutateAsync(values).then(
          () => null,
          (err: unknown) => (err instanceof Error ? err.message : texts.communityChannels.error),
        )
      }
    />
  );
}
