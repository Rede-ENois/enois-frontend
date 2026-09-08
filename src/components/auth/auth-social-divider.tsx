import { texts } from "@/texts";

export function AuthSocialDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
      <div className="h-px flex-1 bg-border" />

      <>{texts.auth.social.divider}</>

      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
