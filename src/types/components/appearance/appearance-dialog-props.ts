export type AppearanceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileName?: string;
  profileNameFont?: "SYSTEM" | "SERIF" | "MONO" | "ROUNDED" | "DISPLAY";
  profileNameColor?: string | null;
  profileNameTheme?: "DEFAULT" | "PIXEL" | "GOTHIC" | "NEON" | "GLITCH" | "CANDY";
};
