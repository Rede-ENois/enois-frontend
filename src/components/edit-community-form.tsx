import { texts } from "@/texts";
import type { EditCommunityFormProps } from "@/types/components/communities/edit-community-form-props";

import { useEditCommunityFormController } from "@/utils/components/communities/use-edit-community-form-controller";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { CommunityImageField } from "@/components/community-image-field";
import { ImageCropDialog } from "@/components/image-crop-dialog";

export function EditCommunityForm(props: EditCommunityFormProps) {
  const {
    form,
    setField,
    coverField,
    avatarField,
    cropDialog,
    savePending,
    saveDisabled,
    save,
  } = useEditCommunityFormController(props);

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.create.name}</Label>

        <Input value={form.name} onChange={(event) => setField("name", event.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">
          {texts.communities.create.description}
        </Label>

        <Textarea
          value={form.description}
          onChange={(event) => setField("description", event.target.value)}
          rows={3}
        />
      </div>

      <CommunityImageField {...coverField} />
      <CommunityImageField {...avatarField} />

      <Button className="w-full rounded-full" disabled={saveDisabled} onClick={save}>
        {savePending ? texts.common.saving : texts.common.save}
      </Button>

      {cropDialog && <ImageCropDialog {...cropDialog} />}
    </div>
  );
}
