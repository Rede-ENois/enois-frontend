import { texts } from "@/texts";
import type { CreateCommunityFormProps } from "@/types/components/communities/create-community-form-props";

import { Button } from "@/components/ui/button";

import { CreateCommunityFields } from "@/components/create-community-fields";
import { CreateCommunityTopicField } from "@/components/create-community-topic-field";

export function CreateCommunityForm(props: CreateCommunityFormProps) {
  return (
    <div className="space-y-4">
      <CreateCommunityFields form={props.form} setField={props.setField} />
      <CreateCommunityTopicField
        form={props.form}
        setTopic={props.setTopic}
        topicOptions={props.topicOptions}
      />

      <Button
        className="w-full rounded-full"
        disabled={props.createDisabled}
        onClick={props.createCommunity}
      >
        {props.createPending ? texts.common.creating : texts.common.create}
      </Button>
    </div>
  );
}
