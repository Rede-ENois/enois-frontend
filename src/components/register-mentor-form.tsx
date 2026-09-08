import { texts } from "@/texts";
import type { RegisterMentorFormProps } from "@/types/components/mentoring/register-mentor-form-props";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FormField } from "@/components/form-field";

export function RegisterMentorForm({
  skillsText,
  setSkillsText,
  price,
  setPrice,
  saving,
  saveDisabled,
  save,
}: RegisterMentorFormProps) {
  const fields = [
    {
      key: "skills",
      label: texts.mentoring.expertise,
      value: skillsText,
      onChange: setSkillsText,
      placeholder: texts.mentoring.expertisePlaceholder,
    },
    {
      key: "price",
      label: texts.mentoring.investment,
      value: price,
      onChange: setPrice,
      placeholder: texts.mentoring.free,
    },
  ];

  return (
    <div className="space-y-4 pt-2">
      {fields.map((field) => (
        <FormField
          key={field.key}
          label={field.label}
          labelClassName="text-xs text-muted-foreground"
        >
          <Input
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
            placeholder={field.placeholder}
            className="h-10 border-transparent bg-muted"
          />
        </FormField>
      ))}

      <Button className="w-full rounded-full" disabled={saveDisabled} onClick={save}>
        {saving ? texts.common.saving : texts.common.save}
      </Button>
    </div>
  );
}
