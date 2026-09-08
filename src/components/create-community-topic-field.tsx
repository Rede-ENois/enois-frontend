import { texts } from "@/texts";
import { useCreateCommunityFormContext } from "@/utils/components/communities/use-create-community-form-context";

import { FormField } from "@/components/form-field";

export function CreateCommunityTopicField() {
  const { form, setTopic, topicOptions } = useCreateCommunityFormContext();

  return (
    <FormField
      label={texts.communities.create.topic}
      labelClassName="text-xs text-muted-foreground"
    >
      <select
        value={form.topic}
        onChange={(event) => setTopic(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 border-transparent bg-muted"
      >
        {topicOptions.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </FormField>
  );
}
