import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { useRegisterMentorDialogController } from "@/lib/use-register-mentor-dialog-controller";
import { texts } from "@/texts";

import { FormField } from "@/components/form-field";
import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Input } from "@/components/ui/input";

export function RegisterMentorDialog() {
  const { open, setOpen, skillsText, setSkillsText, price, setPrice, saving, save } =
    useRegisterMentorDialogController();

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
          <Button className="w-full rounded-full" disabled={!skillsText.trim() || saving} onClick={save}>
            {saving ? texts.common.saving : texts.common.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
