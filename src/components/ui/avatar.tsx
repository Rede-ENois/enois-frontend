"use client";

import type { ElementType } from "react";

import type { AvatarProps } from "@/types/components/ui/avatar-props";
import * as AvatarPrimitive from "@radix-ui/react-avatar";

import { cn } from "@/lib/utils";

const avatarPrimitives = {
  root: AvatarPrimitive.Root,
  image: AvatarPrimitive.Image,
  fallback: AvatarPrimitive.Fallback,
} as const;

const avatarClassNames = {
  root: "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
  image: "aspect-square h-full w-full",
  fallback: "flex h-full w-full items-center justify-center rounded-full bg-muted",
} as const;

export function Avatar({ type, className, ...props }: AvatarProps) {
  const Primitive = avatarPrimitives[type] as ElementType;

  return <Primitive className={cn(avatarClassNames[type], className)} {...props} />;
}
