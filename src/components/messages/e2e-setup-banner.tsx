import { type FormEvent, useState } from "react";

import { Button, Input } from "@rede-enois/design-system/ui";
import { Loader2, Lock } from "lucide-react";

import { ativarE2eComNovaSenha } from "@/lib/e2e/ativar-e2e";
import { generateAndUpload, restoreFromBackup } from "@/lib/e2e/key-manager";

/**
 * Banner no topo do chat quando E2E não está configurado.
 * - Usuário com senha: pede a senha pra gerar/restaurar keypair.
 * - Usuário OAuth sem senha: pede pra definir uma senha primeiro.
 */
export function E2eSetupBanner({
  hasPassword,
  onSetupComplete,
}: {
  hasPassword: boolean;
  onSetupComplete: () => void;
}) {
  const [step, setStep] = useState<"idle" | "password" | "define" | "loading">("idle");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSetupWithPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setError(null);
    setStep("loading");
    try {
      await restoreFromBackup(password).catch(() => generateAndUpload(password));
      onSetupComplete();
    } catch {
      setError("Senha incorreta ou falha ao configurar. Tente de novo.");
      setStep("password");
    }
  };

  const handleDefinePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      setError("Mínimo de 8 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setError(null);
    setStep("loading");
    try {
      // A ordem (keypair ANTES da senha) mora em `ativar-e2e.ts`: trocar a senha encerra a
      // sessão, e o upload do keypair depois sairia com 401.
      await ativarE2eComNovaSenha(newPassword);
      onSetupComplete();
    } catch {
      setError("Não foi possível definir a senha. Tente de novo.");
      setStep("define");
    }
  };

  if (step === "idle") {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <Lock className="h-4 w-4 shrink-0 text-primary" />

        <p className="flex-1 text-xs text-text-subtle">
          Proteja suas mensagens com criptografia ponta a ponta.
        </p>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setStep(hasPassword ? "password" : "define")}
          className="shrink-0 text-xs"
        >
          Ativar
        </Button>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />

        <span className="text-xs text-text-subtle">Configurando criptografia...</span>
      </div>
    );
  }

  if (step === "password") {
    return (
      <form
        onSubmit={handleSetupWithPassword}
        className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
      >
        <p className="mb-2 text-xs text-text-subtle">
          Digite sua senha para ativar a criptografia:
        </p>

        <div className="flex gap-2">
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Sua senha"
            className="h-8 text-xs"
            autoFocus
          />

          <Button type="submit" size="sm" className="shrink-0 text-xs">
            Ativar
          </Button>
        </div>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </form>
    );
  }

  // step === "define"
  return (
    <form
      onSubmit={handleDefinePassword}
      className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3"
    >
      <p className="mb-2 text-xs text-text-subtle">
        Defina uma senha para proteger suas mensagens:
      </p>

      <div className="space-y-2">
        <Input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Nova senha"
          className="h-8 text-xs"
          minLength={8}
          autoFocus
        />
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirmar senha"
          className="h-8 text-xs"
          minLength={8}
        />

        <Button type="submit" size="sm" className="w-full text-xs">
          Definir senha e ativar
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </form>
  );
}
