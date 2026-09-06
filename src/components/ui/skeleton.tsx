import { cn } from "@/lib/utils";
import type { SkeletonProps } from "@/types/components/ui/skeleton/skeleton-props";

function Skeleton({ className, ...props }: SkeletonProps) {
  return <div className={cn("animate-pulse rounded-md bg-primary/10", className)} {...props} />;
}

export { Skeleton };
