import { texts } from "@/texts";

export function JobsEmpty({ visible }: { visible: boolean }) {
  return visible ? (
    <p className="py-12 text-center text-sm text-muted-foreground">{texts.jobs.empty}</p>
  ) : null;
}
