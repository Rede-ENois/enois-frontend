import { useState } from "react";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { mentorsApi } from "@/lib/api/mentors";
import { texts } from "@/texts";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function RegisterMentorDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [skillsText, setSkillsText] = useState("");
  const [price, setPrice] = useState(texts.mentoring.free);

  const createMentor = useMutation({
    mutationFn: () => {
      const expertise = skillsText
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      return mentorsApi.create({ expertise, price: price || texts.mentoring.free });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mentors"] });
      setOpen(false);
      setSkillsText("");
      setPrice(texts.mentoring.free);
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-full">
          {texts.mentoring.becomeMentor}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{texts.mentoring.becomeMentorTitle}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <FormField
            label={texts.mentoring.expertise}
            labelClassName="text-xs text-muted-foreground"
          >
            <Input
              value={skillsText}
              onChange={(event) => setSkillsText(event.target.value)}
              placeholder={texts.mentoring.expertisePlaceholder}
              className="h-10 border-transparent bg-muted"
            />
          </FormField>
          <FormField
            label={texts.mentoring.investment}
            labelClassName="text-xs text-muted-foreground"
          >
            <Input
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder={texts.mentoring.free}
              className="h-10 border-transparent bg-muted"
            />
          </FormField>
          <Button
            className="w-full rounded-full"
            disabled={!skillsText.trim() || createMentor.isPending}
            onClick={() => createMentor.mutate()}
          >
            {createMentor.isPending ? texts.common.saving : texts.common.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
