import { texts } from "@/texts";
import { useCreateCommunityFormContext } from "@/utils/communities/use-create-community-form-context";

import { Button } from "@/components/ui/button";

import { CreateCommunityFields } from "@/components/communities/create-community-fields";
import { CreateCommunityTopicField } from "@/components/communities/create-community-topic-field";

export function CreateCommunityForm() {
  const { createDisabled, createCommunity, createPending } = useCreateCommunityFormContext();

  return (
    <div className="space-y-4">
      <CreateCommunityFields />
      <CreateCommunityTopicField />

      <Button className="w-full rounded-full" disabled={createDisabled} onClick={createCommunity}>
        {createPending ? texts.common.creating : texts.common.create}
      </Button>
    </div>
  );
}
