import type { ComponentPropsWithRef } from "react";

import type * as AvatarPrimitive from "@radix-ui/react-avatar";

export type AvatarProps =
  | ({ type: "root" } & ComponentPropsWithRef<typeof AvatarPrimitive.Root>)
  | ({ type: "image" } & ComponentPropsWithRef<typeof AvatarPrimitive.Image>)
  | ({ type: "fallback" } & ComponentPropsWithRef<typeof AvatarPrimitive.Fallback>);
