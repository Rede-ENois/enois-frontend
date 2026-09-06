import { useEffect } from "react";

import { useRouter } from "@tanstack/react-router";

import { reportLovableError } from "@/lib/lovable-error-reporting";
import { texts } from "@/texts";

type RootErrorProps = {
  error: Error;
  reset: () => void;
};

export function RootError({ error, reset }: RootErrorProps) {
  console.error(error);
  const router = useRouter();

  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{texts.root.error.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{texts.root.error.description}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => { router.invalidate(); reset(); }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {texts.root.error.retry}
          </button>
          <a href="/" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent">
            {texts.root.error.home}
          </a>
        </div>
      </div>
    </div>
  );
}
