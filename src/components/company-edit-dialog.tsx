import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import type { CompanyDetail } from "@/types/application/companies/company-detail";
import type { CompanyMember } from "@/types/application/companies/company-member";
import {
  CompanyEditDialog as CompanyEditDialogView,
  type CompanyEditValues,
  type CompanyImageKind,
  type CompanyMemberCandidate,
  CompanyTeamSection as CompanyTeamSectionView,
} from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { companiesApi, searchApi } from "@/lib/api";
import { useMediaUpload } from "@/lib/use-media-upload";

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

  const salvar = useMutation({
    mutationFn: (form: CompanyEditValues) =>
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

  const enviarImagem = async (campo: CompanyImageKind, file: File): Promise<string | null> => {
    try {
      const result = await (campo === "logo" ? logoUpload : coverUpload).upload(
        file,
        campo === "logo" ? "AVATAR" : "BANNER",
      );
      return result.cdnUrl;
    } catch {
      toast(texts.empresa.editPanel.uploadError, "error");
      return null;
    }
  };

  return (
    <CompanyEditDialogView
      company={company}
      open={open}
      onOpenChange={onOpenChange}
      savePending={salvar.isPending}
      uploading={logoUpload.status === "uploading" || coverUpload.status === "uploading"}
      onSave={(form) => salvar.mutate(form)}
      onUploadImage={enviarImagem}
      teamSection={canManageTeam && <TeamSection companyId={company.id} />}
    />
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
  const [escolhido, setEscolhido] = useState<CompanyMemberCandidate | null>(null);
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
    <CompanyTeamSectionView
      members={members ?? []}
      search={busca}
      onSearchChange={setBusca}
      results={(resultados.data?.items ?? []).map((item) => ({
        id: item.id,
        name: item.title,
        username: item.href.split("/").pop() ?? "",
      }))}
      selected={escolhido}
      onSelectedChange={setEscolhido}
      role={papel}
      onRoleChange={(role) => setPapel(role as CompanyMember["role"])}
      addPending={adicionar.isPending}
      onAdd={() => adicionar.mutate()}
    />
  );
}
