import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { Profile } from "@/types/application/profile/profile";
import type { ProfileCityDialogProps } from "@/types/components/profile/profile-city-dialog-props";
import { ProfileCityPrivacy } from "@rede-enois/design-system/domain";
import { CityStateField } from "@rede-enois/design-system/patterns";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  useToast,
} from "@rede-enois/design-system/ui";

import { ApiError, profileApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";
import { cityStateErrorCode, useCityState } from "@/lib/use-city-state";

/**
 * The owner's structured city (separate from the free-text `location` of the profile edit) and
 * whether it shows on the public profile. Opened from the profile header and from "Perto de você".
 */
export function ProfileCityDialog({ open, onOpenChange }: ProfileCityDialogProps) {
  const { data: me } = useCurrentUser();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.profile.city.title}</DialogTitle>

          <DialogDescription>{texts.profile.city.description}</DialogDescription>
        </DialogHeader>

        {/* Mounted per opening: the form starts from the current `/me` every time. */}
        {me && <ProfileCityForm me={me} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function ProfileCityForm({ me, onDone }: { me: Profile; onDone: () => void }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showCity, setShowCity] = useState(me.showCity ?? false);

  const save = useMutation({
    mutationFn: (payload: { city: string; state: string }) =>
      profileApi.update({ ...payload, showCity }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      void queryClient.invalidateQueries({ queryKey: ["profile", me.username] });
      void queryClient.invalidateQueries({ queryKey: ["communities", "local"] });
      toast(texts.profile.city.saved, "success");
      onDone();
    },
  });
  const place = useCityState(me, save.error);
  // Location codes show under the field; anything else reads above the button.
  const generalError =
    save.error && !cityStateErrorCode(save.error)
      ? save.error instanceof ApiError
        ? save.error.message
        : texts.errors.unexpected
      : null;

  return (
    <form
      className="space-y-5 pt-2"
      onSubmit={(event) => {
        event.preventDefault();
        if (place.validate()) save.mutate(place.payload);
      }}
    >
      <CityStateField idPrefix="profile-city" disabled={save.isPending} {...place.field} />
      <ProfileCityPrivacy value={showCity} onChange={setShowCity} pending={save.isPending} />

      <p role="alert" aria-live="polite" className="text-sm text-destructive empty:hidden">
        {generalError}
      </p>

      <Button type="submit" size="sm" className="w-full rounded-full" disabled={save.isPending}>
        {save.isPending ? texts.common.saving : texts.common.save}
      </Button>
    </form>
  );
}
