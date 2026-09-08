import { CREATE_COMMUNITY_FIELDS } from "@/constants/create-community-fields";
import type { CreateCommunityFormProps } from "@/types/components/communities/create-community-form-props";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { FormField } from "@/components/form-field";

export function CreateCommunityFields({
  form,
  setField,
}: Pick<CreateCommunityFormProps, "form" | "setField">) {
  return (
    <>
      {CREATE_COMMUNITY_FIELDS.map((field) => (
        <FormField
          key={field.key}
          label={field.label}
          labelClassName="text-xs text-muted-foreground"
        >
          {field.control === "textarea" ? (
            <Textarea
              value={form[field.key]}
              onChange={(event) => setField(field.key, event.target.value)}
              rows={field.rows}
              className="h-10 border-transparent bg-muted"
            />
          ) : (
            <Input
              value={form[field.key]}
              onChange={(event) => setField(field.key, event.target.value)}
              className="h-10 border-transparent bg-muted"
            />
          )}
        </FormField>
      ))}
    </>
  );
}
