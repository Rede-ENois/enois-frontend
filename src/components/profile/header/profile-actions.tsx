import { MessageCircle, Settings } from "lucide-react";

import type { Profile } from "@/lib/api";
import { texts } from "@/texts";

import { EditProfileDialog } from "@/components/edit-profile-dialog";
import { Button } from "@/components/ui/button";

export function ProfileActions({ user, isOwnProfile, connectionLabel, connectionDisabled, onMessage, onConnect }: {
  user: Profile;
  isOwnProfile: boolean;
  connectionLabel: string;
  connectionDisabled: boolean;
  onMessage: () => void;
  onConnect: () => void;
}) {
  if (isOwnProfile) {
    return (
      <EditProfileDialog profile={user}>
        <Button variant="outline" size="sm" className="rounded-full gap-1.5">
          <Settings className="h-4 w-4" /> {texts.profile.editProfile}
        </Button>
      </EditProfileDialog>
    );
  }

  return (
    <>
      <Button variant="outline" size="sm" className="rounded-full gap-1.5" onClick={onMessage}>
        <MessageCircle className="h-4 w-4" /> {texts.profile.message}
      </Button>
      <Button size="sm" className="rounded-full gap-1.5" onClick={onConnect} disabled={connectionDisabled}>
        {connectionLabel}
      </Button>
    </>
  );
}
