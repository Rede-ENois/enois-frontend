import { texts } from "@/texts";
import { Root as Dialog, Trigger as DialogTrigger } from "@radix-ui/react-dialog";

import { useRegisterMentorDialogController } from "@/utils/components/mentoring/use-register-mentor-dialog-controller";

import { Button } from "@/components/ui/button";
import { DialogContent } from "@/components/ui/dialog-content";
import { DialogHeader } from "@/components/ui/dialog-header";
import { DialogTitle } from "@/components/ui/dialog-title";
import { Input } from "@/components/ui/input";

import { FormField } from "@/components/form-field";

export function RegisterMentorDialog() {
  const { open, setOpen, skillsText, setSkillsText, price, setPrice, saving, saveDisabled, save } =
    useRegisterMentorDialogController();
  const fields = [
    {
      key: "skills",
      label: texts.mentoring.expertise,
      value: skillsText,
      onChange: setSkillsText,
      placeholder: texts.mentoring.expertisePlaceholder,
    },
    {
      key: "price",
      label: texts.mentoring.investment,
      value: price,
      onChange: setPrice,
      placeholder: texts.mentoring.free,
    },
  ];

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
          {fields.map((field) => (
            <FormField
              key={field.key}
              label={field.label}
              labelClassName="text-xs text-muted-foreground"
            >
              <Input
                value={field.value}
                onChange={(event) => field.onChange(event.target.value)}
                placeholder={field.placeholder}
                className="h-10 border-transparent bg-muted"
              />
            </FormField>
          ))}

          <Button className="w-full rounded-full" disabled={saveDisabled} onClick={save}>
            {saving ? texts.common.saving : texts.common.save}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
