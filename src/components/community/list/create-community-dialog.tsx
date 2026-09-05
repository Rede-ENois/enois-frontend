import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { communitiesApi } from "@/lib/api";
import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateCommunityForm } from "./create-community-form";
import type { CommunityTopic } from "./community-topics";

export function CreateCommunityDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (value: boolean) => void }) {
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
      <DialogTrigger asChild>
        <Button className="rounded-full gap-1.5">
          <Plus className="h-4 w-4" /> {texts.communities.createCommunity}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{texts.communities.create.title}</DialogTitle></DialogHeader>
        <CreateCommunityForm
          name={name}
          description={description}
          topic={topic}
          pending={create.isPending}
          onNameChange={setName}
          onDescriptionChange={setDescription}
          onTopicChange={setTopic}
          onSubmit={() => create.mutate()}
        />
      </DialogContent>
    </Dialog>
  );
}
