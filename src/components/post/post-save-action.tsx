import { Bookmark } from "lucide-react";

type PostSaveActionProps = {
  isSaved: boolean;
  saves: number;
  onSave: () => void;
};

export function PostSaveAction({ isSaved, saves, onSave }: PostSaveActionProps) {
  return (
    <button
      type="button"
      onClick={onSave}
      className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${isSaved ? "text-primary" : ""}`}
    >
      <Bookmark className="h-4 w-4" /> {saves}
    </button>
  );
}
