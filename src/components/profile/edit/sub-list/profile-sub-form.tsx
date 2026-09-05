import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ProfileSubFormField } from "./profile-sub-form-field";
import type { ProfileSubField } from "./profile-sub-list.types";

export function ProfileSubForm({ fields, form, currentlyHereKey, currentlyHere, pending, onFieldChange, onCurrentlyHereChange, onSubmit, onCancel }: {
  fields: ProfileSubField[];
  form: Record<string, string>;
  currentlyHereKey?: string;
  currentlyHere: boolean;
  pending: boolean;
  onFieldChange: (key: string, value: string) => void;
  onCurrentlyHereChange: (value: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-border-soft p-4">
      {fields.map((field) => (
        <ProfileSubFormField key={field.key} label={field.label}>
          {field.multiline ? (
            <Textarea value={form[field.key] ?? ""} onChange={(event) => onFieldChange(field.key, event.target.value)} rows={2} className="h-10 border-border-soft bg-surface-1" />
          ) : (
            <Input type={field.type ?? "text"} value={form[field.key] ?? ""} onChange={(event) => onFieldChange(field.key, event.target.value)} className="h-10 border-border-soft bg-surface-1" />
          )}
        </ProfileSubFormField>
      ))}
      {currentlyHereKey && (
        <label className="flex items-center gap-2 text-[13px] font-light text-text-strong">
          <Switch checked={currentlyHere} onCheckedChange={onCurrentlyHereChange} />
          {texts.profile.edit.currentlyHere}
        </label>
      )}
      <div className="flex gap-2">
        <Button size="sm" onClick={onSubmit} disabled={pending}>{pending ? texts.common.saving : texts.common.save}</Button>
        <Button size="sm" variant="outline" onClick={onCancel}>{texts.common.cancel}</Button>
      </div>
    </div>
  );
}
