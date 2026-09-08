import { useCommunityCardContext } from "@/utils/components/communities/use-community-card-context";

export function CommunityCardIdentity() {
  const { community, avatarUrl } = useCommunityCardContext();

  return (
    <div className="mb-3 flex items-center gap-3">
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt=""
          className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
        />
      )}
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">
          {community.topic}
        </p>

        <h3 className="truncate font-semibold">{community.name}</h3>
      </div>
    </div>
  );
}
