import { useState } from "react";

import { texts } from "@/texts";
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@rede-enois/design-system/ui";
import { CalendarDays } from "lucide-react";

import { MentorSessionsList } from "@/components/mentoring/mentor-sessions-list";

/**
 * Atalho do card do mentor para a agenda de inscrições. A lista em si vive em
 * `MentorSessionsList`, compartilhada com a aba "Como mentor" da seção de sessões.
 */
export function MentorAgendaDialog({ mentorId }: { mentorId: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="shrink-0 self-center rounded-lg px-[14px] py-2">
          <CalendarDays className="mr-1.5 h-4 w-4" />
          {texts.mentoring.agendaButton}
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.mentoring.agendaTitle}</DialogTitle>
        </DialogHeader>

        <div className="pt-2">
          <MentorSessionsList mentorId={mentorId} maxHeight="max-h-[60vh] overflow-y-auto pr-1" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
