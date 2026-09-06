import { HeadContent, Scripts } from "@tanstack/react-router";

import type { WithRequiredChildren } from "@/types/components/with-required-children";

export function RootShell({ children }: WithRequiredChildren) {
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
