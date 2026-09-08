import { EDIT_COMMUNITY_FIELDS } from "@/constants/edit-community-fields";
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
  const controller = useEditCommunityFormController(props);

  return (
    <div className="space-y-4 pt-2">
      {EDIT_COMMUNITY_FIELDS.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{field.label}</Label>

          {field.control === "textarea" ? (
            <Textarea
              value={controller.form[field.key]}
              onChange={(event) => controller.setField(field.key, event.target.value)}
              rows={field.rows}
            />
          ) : (
            <Input
              value={controller.form[field.key]}
              onChange={(event) => controller.setField(field.key, event.target.value)}
            />
          )}
        </div>
      ))}

      {controller.imageFields.map((field) => (
        <CommunityImageField key={field.key} {...field.props} />
      ))}

      <Button
        className="w-full rounded-full"
        disabled={controller.saveDisabled}
        onClick={controller.save}
      >
        {controller.savePending ? texts.common.saving : texts.common.save}
      </Button>

      {controller.cropDialog && <ImageCropDialog {...controller.cropDialog} />}
    </div>
  );
}
