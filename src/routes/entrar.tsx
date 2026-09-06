import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { z } from "zod";

import { texts } from "@/texts";

import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
import { SignInForm } from "@/components/auth/sign-in-form";
import { AuthPageLayout } from "@/components/auth/layout/auth-page-layout";
import type { AuthTab } from "@/components/auth/layout/auth-tab";
import { SignUpForm } from "@/components/auth/sign-up-form";

const searchSchema = z.object({
  tab: z.enum(["login", "signup"]).optional().default("signup"),
});

export const Route = createFileRoute("/entrar")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: texts.auth.seo.authTitle },
      { name: "description", content: texts.auth.seo.authDescription },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const initialTab = Route.useSearch().tab as AuthTab;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleAuthenticated = () => navigate({ to: "/feed" });
  const formByTab: Record<AuthTab, React.ReactNode> = {
    signup: <SignUpForm onAuthenticated={handleAuthenticated} />,
    login: (
      <SignInForm
        onAuthenticated={handleAuthenticated}
        onForgotPassword={() => setIsForgotPasswordOpen(true)}
      />
    ),
  };

  return (
    <AuthPageLayout tab={activeTab} onTabChange={setActiveTab}>
      {formByTab[activeTab]}
      <ForgotPasswordDialog
        isOpen={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      />
    </AuthPageLayout>
  );
}
