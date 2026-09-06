import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { communityApi } from "@/lib/api";
import { texts } from "@/texts";
import type { CommunityTopic } from "@/types/components/community/community-topic";
import type { ControlledDialogProps } from "@/types/components/shared/controlled-dialog-props";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CreateCommunityForm } from "./create-community-form";

export function CreateCommunityDialog({ isOpen, onOpenChange }: ControlledDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topic, setTopic] = useState<CommunityTopic>("TECNOLOGIA");
  const createCommunityMutation = useMutation({ mutationFn: () => communityApi.create({ name, description, topic }), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["communities"] }); onOpenChange(false); setName(""); setDescription(""); setTopic("TECNOLOGIA"); } });
  return <Dialog open={isOpen} onOpenChange={onOpenChange}><DialogTrigger asChild><Button className="rounded-full gap-1.5"><Plus className="h-4 w-4" /> {texts.communities.createCommunity}</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>{texts.communities.create.title}</DialogTitle></DialogHeader><CreateCommunityForm name={name} description={description} topic={topic} isPending={createCommunityMutation.isPending} onNameChange={setName} onDescriptionChange={setDescription} onTopicChange={setTopic} onSubmit={() => createCommunityMutation.mutate()} /></DialogContent></Dialog>;
}
