import type { ProfileMetadataItemProps } from "@/types/components/profile/profile-metadata-item-props";

export function ProfileMetadataItem({ icon: Icon, value }: ProfileMetadataItemProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-4 w-4" />

      <>{value}</>
    </span>
  );
}
