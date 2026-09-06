import { texts } from "@/texts";

import { AppContainer } from "@/components/app-container";

export function ProfileError() {
  return (
    <AppContainer>
      <div className="rounded-2xl border border-border-soft bg-surface-card p-10 text-center">
        <p className="text-[13px] font-light text-text-subtle">{texts.profile.loadError}</p>
      </div>
    </AppContainer>
  );
}
