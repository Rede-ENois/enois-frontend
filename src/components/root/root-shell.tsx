import type { PropsWithChildren } from "react";

import { HeadContent, Scripts } from "@tanstack/react-router";

export function RootShell({ children }: PropsWithChildren) {
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
