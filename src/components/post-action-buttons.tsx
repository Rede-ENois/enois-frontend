import { usePostActionButtonsController } from "@/utils/components/post/use-post-action-buttons-controller";

export function PostActionButtons() {
  const { primaryActions, saveAction } = usePostActionButtonsController();

  return (
    <>
      <div className="flex">
        {primaryActions.map((action) => (
          <button
            key={action.key}
            onClick={action.onClick}
            className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
              action.muted ? "text-muted-foreground" : ""
            }`}
          >
            <action.icon className="h-4 w-4" />

            {action.label !== null && <>{action.label}</>}
          </button>
        ))}
      </div>

      <button
        onClick={saveAction.onClick}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition hover:bg-muted hover:text-foreground ${
          saveAction.active ? "text-primary" : ""
        }`}
      >
        <saveAction.icon className="h-4 w-4" />

        <>{saveAction.label}</>
      </button>
    </>
  );
}
