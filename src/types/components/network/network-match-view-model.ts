import type { ElementType } from "react";

import type { NetworkUser } from "@/types/application/network/network-user";
import type { ButtonProps } from "@/types/components/ui/button-props";

export type NetworkMatchViewModel = NetworkUser & {
  statusLabel: string;
  connectionAction: {
    icon: ElementType;
    label: string;
    variant: ButtonProps["variant"];
    className: string;
    disabled: boolean;
    run: () => void;
  };
};
