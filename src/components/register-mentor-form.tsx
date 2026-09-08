import { useRegisterMentorFormContext } from "@/utils/components/mentoring/use-register-mentor-form-context";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { FormField } from "@/components/form-field";

export function RegisterMentorForm() {
  const controller = useRegisterMentorFormContext();

  return (
    <div className="space-y-4 pt-2">
      {controller.fields.map((field) => (
        <FormField
          key={field.key}
          label={field.label}
          labelClassName="text-xs text-muted-foreground"
        >
          <Input
            value={field.value}
            onChange={field.onChange}
            placeholder={field.placeholder}
            className="h-10 border-transparent bg-muted"
          />
        </FormField>
      ))}

      <Button
        className="w-full rounded-full"
        disabled={controller.saveDisabled}
        onClick={controller.save}
      >
        {controller.saveLabel}
      </Button>
    </div>
  );
}
