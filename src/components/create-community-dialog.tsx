import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { COMMUNITY_TOPICS } from "@/constants/community-topics";
import { useCreateCommunityDialogController } from "@/lib/use-create-community-dialog-controller";
import { texts } from "@/texts";
import type { CommunityTopic } from "@/types/application/community/community-topic";
import type { CreateCommunityDialogProps } from "@/types/components/communities/create-community-dialog-props";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export function CreateCommunityDialog({ children }: CreateCommunityDialogProps) {
  const { open, setOpen, form, setField, createPending, createCommunity } =
    useCreateCommunityDialogController();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              className="h-10 border-transparent bg-muted"
            />
          </FormField>
          <FormField
            label={texts.communities.create.description}
            labelClassName="text-xs text-muted-foreground"
          >
            <Textarea
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              rows={3}
              className="h-10 border-transparent bg-muted"
            />
          </FormField>
          <FormField
            label={texts.communities.create.topic}
            labelClassName="text-xs text-muted-foreground"
          >
            <select
              value={form.topic}
              onChange={(event) => setField("topic", event.target.value as CommunityTopic)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-10 border-transparent bg-muted"
            >
              {COMMUNITY_TOPICS.filter(({ value }) => value !== "Todas").map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>
          <Button
            className="w-full rounded-full"
            disabled={!form.name.trim() || !form.description.trim() || createPending}
            onClick={createCommunity}
          >
            {createPending ? texts.common.creating : texts.common.create}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
