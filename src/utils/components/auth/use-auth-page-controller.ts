import { useState } from "react";

import { useNavigate, useSearch } from "@tanstack/react-router";

export function useAuthPageController() {
  const initialTab = useSearch({ from: "/entrar" }).tab;
  const navigate = useNavigate();
  const [tab, setTab] = useState(initialTab);
  const [forgotOpen, setForgotOpen] = useState(false);

  return {
    tab,
    signupTabActive: tab === "signup",
    loginTabActive: tab === "login",
    showSignup: tab === "signup",
    selectSignup: () => setTab("signup"),
    selectLogin: () => setTab("login"),
    forgotOpen,
    setForgotOpen,
    openForgot: () => setForgotOpen(true),
    finishAuth: () => navigate({ to: "/feed" }),
  };
}
