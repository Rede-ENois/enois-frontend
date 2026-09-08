import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { ArrowLeft } from "lucide-react";

export function CommunityDetailBackLink() {
  return (
    <Link
      to="/comunidades"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />

      <>{texts.communities.title}</>
    </Link>
  );
}
