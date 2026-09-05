import { Link } from "@tanstack/react-router";

import { texts } from "@/texts";
import { AppContainer } from "@/components/app-container";

export function ProfileNotFound() {
  return (
    <AppContainer>
      <div className="rounded-2xl border border-border-soft bg-surface-card p-10 text-center">
        <p className="text-[16px] font-light text-text-strong">{texts.profile.notFound}</p>
        <Link to="/" className="mt-2 inline-block text-[13px] font-light text-primary hover:underline">
          {texts.profile.backHome}
        </Link>
      </div>
    </AppContainer>
  );
}
