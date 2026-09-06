export type NetworkUserCardAction = {
  Icon: React.ElementType;
  label: string;
  variant: "default" | "outline";
  className: string;
  run: () => void;
};
