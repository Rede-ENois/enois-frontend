import type { ReactNode } from "react";

import { AuthHeroPanel } from "./auth-hero-panel";
import { AuthMobileHeader } from "./auth-mobile-header";
import { AuthTabs } from "./auth-tabs";
import type { AuthTab } from "./auth-tab";
import { AuthTerms } from "./auth-terms";

type AuthPageLayoutProps = {
  tab: AuthTab;
  onTabChange: (tab: AuthTab) => void;
  children: ReactNode;
};

export function AuthPageLayout({ tab, onTabChange, children }: AuthPageLayoutProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <AuthHeroPanel />
      <section className="flex flex-col px-6 py-10 sm:px-12">
        <AuthMobileHeader />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <AuthTabs tab={tab} onTabChange={onTabChange} />
          <div className="mt-8">{children}</div>
          <AuthTerms />
        </div>
      </section>
    </div>
  );
}
