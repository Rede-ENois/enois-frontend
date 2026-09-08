import type { CommunityImageInputProps } from "@/types/communities/community-image-input-props";

export function CommunityImageInput({ inputRef, onChange }: CommunityImageInputProps) {
  return (
    <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
  );
}
