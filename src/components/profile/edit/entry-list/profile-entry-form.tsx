import { texts } from "@/texts";
import type { ProfileEntryFormProps } from "@/types/components/profile/edit/entry-list/profile-entry-form-props";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ProfileEntryFormField } from "./profile-entry-form-field";

export function ProfileEntryForm({
  fields,
  formValues,
  currentlyHereKey,
  isCurrentlyHere,
  isPending,
  onFieldChange,
  onCurrentlyHereChange,
  onSubmit,
  onCancel,
}: ProfileEntryFormProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border-soft p-4">
      {fields.map((field) => (
        <ProfileEntryFormField key={field.key} label={field.label}>
          {field.multiline ? (
            <Textarea
              value={formValues[field.key] ?? ""}
              onChange={(event) => onFieldChange(field.key, event.target.value)}
              rows={2}
              className="h-10 border-border-soft bg-surface-1"
            />
          ) : (
            <Input
              type={field.type ?? "text"}
              value={formValues[field.key] ?? ""}
              onChange={(event) => onFieldChange(field.key, event.target.value)}
              className="h-10 border-border-soft bg-surface-1"
            />
          )}
        </ProfileEntryFormField>
      ))}
      {currentlyHereKey && (
        <label className="flex items-center gap-2 text-[13px] font-light text-text-strong">
          <Switch checked={isCurrentlyHere} onCheckedChange={onCurrentlyHereChange} />
          {texts.profile.edit.currentlyHere}
        </label>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit} disabled={isPending}>
          {isPending ? texts.common.saving : texts.common.save}
        </Button>
        <Button size="sm" variant="outline" onClick={onCancel}>
          {texts.common.cancel}
        </Button>
      </div>
    </div>
  );
}
