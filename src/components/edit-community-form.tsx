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
  const fields = [
    {
      key: "name",
      label: texts.communities.create.name,
      control: (
        <Input value={form.name} onChange={(event) => setField("name", event.target.value)} />
      ),
    },
    {
      key: "description",
      label: texts.communities.create.description,
      control: (
        <Textarea
          value={form.description}
          onChange={(event) => setField("description", event.target.value)}
          rows={3}
        />
      ),
    },
  ];
  const imageFields = [
    { key: "cover", props: coverField },
    { key: "avatar", props: avatarField },
  ];

  return (
    <div className="space-y-4 pt-2">
      {fields.map((field) => (
        <div key={field.key} className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{field.label}</Label>

          {field.control}
        </div>
      ))}

      {imageFields.map((field) => (
        <CommunityImageField key={field.key} {...field.props} />
      ))}

      <Button className="w-full rounded-full" disabled={saveDisabled} onClick={save}>
        {savePending ? texts.common.saving : texts.common.save}
      </Button>

      {cropDialog && <ImageCropDialog {...cropDialog} />}
    </div>
  );
}
