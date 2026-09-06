import { Link as LinkIcon } from "lucide-react";

import { texts } from "@/texts";

import { ProfileSection } from "../profile-section";

type ProfileLinksSectionProps = {
  links: string[];
};

export function ProfileLinksSection({ links }: ProfileLinksSectionProps) {
  if (links.length === 0) return null;

  return (
    <ProfileSection title={texts.profile.sections.links}>
      <ul className="space-y-2 text-[13px] font-light">
        {links.map((link) => (
          <li key={link} className="flex items-center gap-2 text-text-subtle">
            <LinkIcon className="h-4 w-4" />
            <span className="truncate text-text-strong">{link}</span>
          </li>
        ))}
      </ul>
    </ProfileSection>
  );
}
