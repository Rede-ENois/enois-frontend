import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { CompanyDetail } from "@/types/application/companies/company-detail";
import type { CompanyMember } from "@/types/application/companies/company-member";
import { ImagePlus, Loader2, UserPlus } from "lucide-react";

import { companiesApi, searchApi } from "@/lib/api";
import { useMediaUpload } from "@/lib/use-media-upload";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

/**
 * O painel de edição da página empresarial: os campos do cadastro + logo/capa (upload pela
 * mídia do app) e a equipe (membros com papel, para OWNER/ADMIN). O backend já expõe
 * `myRole` no detalhe e o PATCH aceita EDITOR — esta é a porta que faltava no front.
 */
export function CompanyEditDialog({
  company,
  open,
  onOpenChange,
  canManageTeam,
}: {
  company: CompanyDetail;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManageTeam: boolean;
}) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const logoUpload = useMediaUpload();
  const coverUpload = useMediaUpload();

  const [form, setForm] = useState({
    name: company.name ?? "",
    description: company.description ?? "",
    sector: company.sector ?? "",
    size: company.size ?? "",
    location: company.location ?? "",
    website: company.website ?? "",
    logo: company.logo ?? "",
    cover: company.cover ?? "",
  });

  const salvar = useMutation({
    mutationFn: () =>
      companiesApi.update(company.id, {
        name: form.name,
        description: form.description,
        sector: form.sector,
        size: form.size,
        location: form.location,
        website: form.website,
        logo: form.logo,
        cover: form.cover,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", company.slug] });
      queryClient.invalidateQueries({ queryKey: ["empresas"] });
      toast(texts.empresa.editPanel.saved, "success");
      onOpenChange(false);
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.empresa.editPanel.error, "error"),
  });

  const enviarImagem = async (file: File, campo: "logo" | "cover") => {
    try {
      const result = await (campo === "logo" ? logoUpload : coverUpload).upload(
        file,
        campo === "logo" ? "AVATAR" : "BANNER",
      );
      setForm((atual) => ({ ...atual, [campo]: result.cdnUrl }));
    } catch {
      toast(texts.empresa.editPanel.uploadError, "error");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-normal">{texts.empresa.editPanel.title}</DialogTitle>

          <DialogDescription>{texts.empresa.editPanel.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="block space-y-1 text-sm">
            <span className="text-xs text-text-subtle">{texts.empresa.editPanel.nameLabel}</span>

            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>

          <div className="grid grid-cols-2 gap-2">
            {(["logo", "cover"] as const).map((campo) => (
              <div key={campo} className="flex flex-col items-center gap-1">
                <label className="relative flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-soft p-3 text-xs text-text-subtle transition hover:border-primary hover:text-primary">
                  {form[campo] ? (
                    <img
                      src={form[campo]}
                      alt=""
                      className={
                        campo === "logo"
                          ? "h-16 w-16 rounded-xl object-cover"
                          : "h-16 w-full rounded-lg object-cover"
                      }
                    />
                  ) : (
                    <ImagePlus className="h-5 w-5" />
                  )}
                  <span>
                    {campo === "logo"
                      ? texts.empresa.editPanel.logo
                      : texts.empresa.editPanel.cover}
                  </span>

                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) void enviarImagem(file, campo);
                      e.target.value = "";
                    }}
                  />
                  {form[campo] && (
                    <button
                      type="button"
                      aria-label={`Remover ${campo === "logo" ? "logo" : "capa"}`}
                      className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-destructive/90 text-white transition hover:bg-destructive"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setForm((atual) => ({ ...atual, [campo]: "" }));
                      }}
                    >
                      ×
                    </button>
                  )}
                </label>
              </div>
            ))}
          </div>

          <label className="block space-y-1 text-sm">
            <span className="text-xs text-text-subtle">
              {texts.empresa.editPanel.descriptionLabel}
            </span>

            <Textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={4000}
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["sector", texts.empresa.editPanel.sector],
                ["size", texts.empresa.editPanel.size],
                ["location", texts.empresa.editPanel.location],
                ["website", texts.empresa.editPanel.website],
              ] as const
            ).map(([campo, label]) => (
              <label key={campo} className="block space-y-1 text-sm">
                <span className="text-xs text-text-subtle">{label}</span>

                <Input
                  value={form[campo]}
                  onChange={(e) => setForm({ ...form, [campo]: e.target.value })}
                />
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" className="rounded-full" onClick={() => onOpenChange(false)}>
              {texts.common.cancel}
            </Button>

            <Button
              className="rounded-full"
              disabled={
                salvar.isPending ||
                logoUpload.status === "uploading" ||
                coverUpload.status === "uploading"
              }
              onClick={() => salvar.mutate()}
            >
              {salvar.isPending ? texts.common.saving : texts.common.save}
            </Button>
          </div>

          {canManageTeam && <TeamSection companyId={company.id} />}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/** A equipe da empresa: quem tem qual papel, e o convite por usuário (busca) para OWNER/ADMIN. */
function TeamSection({ companyId }: { companyId: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: members } = useQuery({
    queryKey: ["empresa", companyId, "members"],
    queryFn: () => companiesApi.members(companyId),
  });

  const [busca, setBusca] = useState("");
  const [escolhido, setEscolhido] = useState<{ id: string; nome: string; username: string } | null>(
    null,
  );
  const [papel, setPapel] = useState<CompanyMember["role"]>("EDITOR");

  const resultados = useQuery({
    queryKey: ["empresa-membro-busca", busca],
    queryFn: () => searchApi.search(busca, ["users"], 5),
    enabled: busca.trim().length >= 2 && !escolhido,
  });

  const adicionar = useMutation({
    mutationFn: () => companiesApi.addMember(companyId, escolhido!.id, papel),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresa", companyId, "members"] });
      toast(texts.empresa.editPanel.memberAdded, "success");
      setEscolhido(null);
      setBusca("");
    },
    onError: (error) =>
      toast(error instanceof Error ? error.message : texts.empresa.editPanel.memberError, "error"),
  });

  return (
    <div className="space-y-2 border-t border-border-soft pt-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-text-subtle">
        {texts.empresa.editPanel.team}
      </p>

      <ul className="space-y-1">
        {(members ?? []).map((member) => (
          <li
            key={member.userId}
            className="flex items-center justify-between text-xs text-text-strong"
          >
            <span className="truncate font-mono">{member.userId.slice(0, 18)}…</span>

            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-text-subtle">
              {member.role}
            </span>
          </li>
        ))}
        {(members?.length ?? 0) === 0 && (
          <li className="text-xs text-text-subtle">{texts.empresa.editPanel.noMembers}</li>
        )}
      </ul>

      {!escolhido ? (
        <div className="relative">
          <Input
            placeholder={texts.empresa.editPanel.memberSearch}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          {busca.trim().length >= 2 && (resultados.data?.items?.length ?? 0) > 0 && (
            <ul className="absolute z-20 mt-1 max-h-40 w-full overflow-y-auto rounded-xl border border-border-soft bg-surface-card p-1 shadow-lg">
              {resultados.data!.items.map((item) => {
                const username = item.href.split("/").pop() ?? "";
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-lg p-2 text-left text-sm transition hover:bg-surface-2"
                      onClick={() => setEscolhido({ id: item.id, nome: item.title, username })}
                    >
                      <span className="truncate">{item.title}</span>

                      <span className="truncate text-xs text-text-subtle">@{username}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm">
            {escolhido.nome} <span className="text-xs text-text-subtle">@{escolhido.username}</span>
          </span>

          <select
            className="h-9 rounded-lg border border-border-soft bg-transparent px-2 text-sm"
            value={papel}
            onChange={(e) => setPapel(e.target.value as CompanyMember["role"])}
          >
            <option value="EDITOR">EDITOR</option>

            <option value="ADMIN">ADMIN</option>

            <option value="RECRUITER">RECRUITER</option>
          </select>

          <Button
            size="sm"
            className="rounded-full gap-1"
            disabled={adicionar.isPending}
            onClick={() => adicionar.mutate()}
          >
            {adicionar.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserPlus className="h-3.5 w-3.5" />
            )}
            {texts.empresa.editPanel.memberAdd}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="rounded-full"
            onClick={() => setEscolhido(null)}
          >
            {texts.common.cancel}
          </Button>
        </div>
      )}
    </div>
  );
}
