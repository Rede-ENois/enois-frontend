import { texts } from "@/texts";
import type { ErrorComponentProps } from "@/types/components/root/error-component-props";
import { useRootErrorController } from "@/utils/components/root/use-root-error-controller";

export function RootError(props: ErrorComponentProps) {
  const { retry } = useRootErrorController(props);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {texts.root.error.title}
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">{texts.root.error.description}</p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={retry}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {texts.root.error.retry}
          </button>

          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {texts.root.error.home}
          </a>
        </div>
      </div>
    </div>
  );
}
