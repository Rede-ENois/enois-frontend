import { Bookmark } from "lucide-react";

export function PostSaveAction({ saved, saves, onSave }: {
  saved: boolean;
  saves: number;
  onSave: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSave}
      className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${saved ? "text-primary" : ""}`}
    >
      <Bookmark className="h-4 w-4" /> {saves}
    </button>
  );
}
