import { texts } from "@/texts";
import { Button } from "@rede-enois/design-system/ui";

export function NewGroupButton({ onClick }: { onClick: () => void }) {
  return (
    <Button size="sm" variant="outline" onClick={onClick} data-new-group="">
      {texts.messages.newGroup}
    </Button>
  );
}
