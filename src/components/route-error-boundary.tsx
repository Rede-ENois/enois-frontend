import { Component, type ErrorInfo } from "react";

import { texts } from "@/texts";
import type { RouteErrorBoundaryProps } from "@/types/components/route-error-boundary-props";
import type { RouteErrorBoundaryState } from "@/types/components/route-error-boundary-state";

/**
 * Error boundary que envolve o conteúdo da rota. Captura erros de render em qualquer
 * componente filho sem derrubar o shell (header, sidebar, chat dock continuam funcionando).
 */
export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  constructor(props: RouteErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): RouteErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[RouteErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="max-w-md text-center">
            <h2 className="text-lg font-semibold text-text-strong">{texts.root.error.title}</h2>

            <p className="mt-2 text-sm text-text-subtle">{texts.root.error.description}</p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <button
                onClick={() => {
                  this.props.onReset?.();
                  this.setState({ hasError: false });
                }}
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                {texts.root.error.retry}
              </button>

              <a
                href="/feed"
                className="rounded-full border border-border-soft px-4 py-2 text-sm font-medium text-text-strong transition hover:bg-surface-2"
              >
                {texts.root.error.home}
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
