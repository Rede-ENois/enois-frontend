import { HeadContent, Scripts } from "@tanstack/react-router";

import type { RootShellProps } from "@/types/components/root/root-shell-props";

export function RootShell({ children }: RootShellProps) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
