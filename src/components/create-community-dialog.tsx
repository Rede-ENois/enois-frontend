import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { TOPICS, TOPIC_LABELS } from "@/constants/community-topics";
import { communitiesApi } from "@/lib/api/communities";
import { texts } from "@/texts";
import type { CommunityTopic } from "@/types/application/community/community-topic";
import type { CreateCommunityDialogProps } from "@/types/components/communities/create-community-dialog-props";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreateCommunityDialog({
  children,
  open,
  onOpenChange,
}: CreateCommunityDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState<CommunityTopic>("TECNOLOGIA");

  const create = useMutation({
    mutationFn: () => communitiesApi.create({ name, description, topic }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["communities"] });
      onOpenChange(false);
      setName("");
      setDescription("");
      setTopic("TECNOLOGIA");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.communities.create.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            label={texts.communities.create.name}
            labelClassName="text-xs text-muted-foreground"
          >
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-10 border-transparent bg-muted"
            />
          </FormField>
          <FormField
            label={texts.communities.create.description}
            labelClassName="text-xs text-muted-foreground"
          >
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              className="h-10 border-transparent bg-muted"
            />
          </FormField>
          <FormField
            label={texts.communities.create.topic}
            labelClassName="text-xs text-muted-foreground"
          >
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value as CommunityTopic)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 border-transparent bg-muted"
            >
              {TOPICS.filter((item) => item !== "Todas").map((item) => (
                <option key={item} value={item}>
                  {TOPIC_LABELS[item]}
                </option>
              ))}
            </select>
          </FormField>
          <Button
            className="w-full rounded-full"
            disabled={!name.trim() || !description.trim() || create.isPending}
            onClick={() => create.mutate()}
          >
            {create.isPending ? texts.common.creating : texts.common.create}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
