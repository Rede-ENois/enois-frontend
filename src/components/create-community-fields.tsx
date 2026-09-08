import { texts } from "@/texts";
import type { CreateCommunityFormProps } from "@/types/components/communities/create-community-form-props";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { FormField } from "@/components/form-field";

export function CreateCommunityFields({
  form,
  setField,
}: Pick<CreateCommunityFormProps, "form" | "setField">) {
  const fields = [
    {
      key: "name",
      label: texts.communities.create.name,
      control: (
        <Input
          value={form.name}
          onChange={(event) => setField("name", event.target.value)}
          className="h-10 border-transparent bg-muted"
        />
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
          className="h-10 border-transparent bg-muted"
        />
      ),
    },
  ];

  return (
    <>
      {fields.map((field) => (
        <FormField
          key={field.key}
          label={field.label}
          labelClassName="text-xs text-muted-foreground"
        >
          {field.control}
        </FormField>
      ))}
    </>
  );
}
