import { useState } from "react";

import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { z } from "zod";

import { texts } from "@/texts";

import { ForgotPasswordDialog } from "@/components/auth/forgot-password-dialog";
import { LoginForm } from "@/components/auth/login-form";
import { AuthPageLayout, type AuthTab } from "@/components/auth/auth-page-layout";
import { SignupForm } from "@/components/auth/signup-form";

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
  component: AuthRoute,
});

function AuthRoute() {
  const initialTab = Route.useSearch().tab as AuthTab;
  const navigate = useNavigate();
  const [tab, setTab] = useState<AuthTab>(initialTab);
  const [forgotOpen, setForgotOpen] = useState(false);

  const handleDone = () => navigate({ to: "/feed" });
  const forms: Record<AuthTab, React.ReactNode> = {
    signup: <SignupForm onDone={handleDone} />,
    login: <LoginForm onDone={handleDone} onForgot={() => setForgotOpen(true)} />,
  };

  return (
    <AuthPageLayout tab={tab} onTabChange={setTab}>
      {forms[tab]}
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </AuthPageLayout>
  );
}
