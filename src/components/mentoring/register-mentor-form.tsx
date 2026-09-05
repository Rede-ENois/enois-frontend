import { useState } from "react";

import { texts } from "@/texts";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterMentorForm({
  onSave,
  isPending,
}: {
  onSave: (data: { expertise: string[]; price: string }) => void;
  isPending: boolean;
}) {
  const [skillsText, setSkillsText] = useState("");
  const [price, setPrice] = useState(texts.mentoring.free);

  return (
    <div className="space-y-4 pt-2">
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.mentoring.expertise}</Label>
        <Input
          value={skillsText}
          onChange={(event) => setSkillsText(event.target.value)}
          placeholder={texts.mentoring.expertisePlaceholder}
          className="h-10 border-transparent bg-muted"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">{texts.mentoring.investment}</Label>
        <Input
          value={price}
          onChange={(event) => setPrice(event.target.value)}
          placeholder={texts.mentoring.free}
          className="h-10 border-transparent bg-muted"
        />
      </div>
      <Button
        className="w-full rounded-full"
        disabled={!skillsText.trim() || isPending}
        onClick={() => {
          const expertise = skillsText
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean);
          onSave({ expertise, price: price || texts.mentoring.free });
        }}
      >
        {isPending ? texts.common.saving : texts.common.save}
      </Button>
    </div>
  );
}
