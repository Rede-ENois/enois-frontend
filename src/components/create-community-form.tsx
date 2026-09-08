import { texts } from "@/texts";
import type { CreateCommunityFormProps } from "@/types/components/communities/create-community-form-props";
import { useCreateCommunityFormController } from "@/utils/components/communities/use-create-community-form-controller";

import { Button } from "@/components/ui/button";

import { CreateCommunityFields } from "@/components/create-community-fields";
import { CreateCommunityTopicField } from "@/components/create-community-topic-field";

export function CreateCommunityForm({ onCreated }: CreateCommunityFormProps) {
  const controller = useCreateCommunityFormController(onCreated);

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
