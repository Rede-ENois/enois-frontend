import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COMMUNITY_TOPICS, type CommunityTopic } from "./community-topics";

export function CreateCommunityForm({
  name,
  description,
  topic,
  pending,
  onNameChange,
  onDescriptionChange,
  onTopicChange,
  onSubmit,
}: {
  name: string;
  description: string;
  topic: CommunityTopic;
  pending: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onTopicChange: (value: CommunityTopic) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.create.name}</Label>
        <Input value={name} onChange={(event) => onNameChange(event.target.value)} className="h-10 border-transparent bg-muted" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.create.description}</Label>
        <Textarea value={description} onChange={(event) => onDescriptionChange(event.target.value)} rows={3} className="h-10 border-transparent bg-muted" />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.communities.create.topic}</Label>
        <select
          value={topic}
          onChange={(event) => onTopicChange(event.target.value as CommunityTopic)}
          className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {COMMUNITY_TOPICS.map((value) => (
            <option key={value} value={value}>{texts.communities.topics[value]}</option>
          ))}
        </select>
      </div>
      <Button className="w-full rounded-full" disabled={!name.trim() || !description.trim() || pending} onClick={onSubmit}>
        {pending ? texts.common.creating : texts.common.create}
      </Button>
    </div>
  );
}
