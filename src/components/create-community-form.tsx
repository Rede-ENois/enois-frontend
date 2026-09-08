import { texts } from "@/texts";
import { useCreateCommunityFormContext } from "@/utils/components/communities/use-create-community-form-context";

import { Button } from "@/components/ui/button";

import { CreateCommunityFields } from "@/components/create-community-fields";
import { CreateCommunityTopicField } from "@/components/create-community-topic-field";

export function CreateCommunityForm() {
  const controller = useCreateCommunityFormContext();

  return (
    <div className="space-y-4">
      <CreateCommunityFields form={controller.form} setField={controller.setField} />
      <CreateCommunityTopicField
        form={controller.form}
        setTopic={controller.setTopic}
        topicOptions={controller.topicOptions}
      />

      <Button
        className="w-full rounded-full"
        disabled={controller.createDisabled}
        onClick={controller.createCommunity}
      >
        {controller.createPending ? texts.common.creating : texts.common.create}
      </Button>
    </div>
  );
}
