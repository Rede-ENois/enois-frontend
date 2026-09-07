import type { BadgeProps } from "@/types/components/ui/badge-props";

import { cn } from "@/lib/utils";

import { badgeVariants } from "./badge-variants";

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge };
