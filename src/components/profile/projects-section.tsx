import { useState } from "react";

import { useQuery } from "@tanstack/react-query";

import type { ProjectsSectionProps } from "@/types/components/profile/projects-section-props";
import { ProfileProjectsSection as ProfileProjectsSectionView } from "@rede-enois/design-system/domain";

import { projectsApi } from "@/lib/api";

import { SandboxedHtmlFrame } from "@/components/post/sandboxed-html-frame";
import { GithubImportDialog } from "@/components/profile/github-import-dialog";
import { ProjectsManager } from "@/components/profile/projects-manager";

/**
 * Seção "Projetos" do perfil, abaixo da bio: os cards do autor — estruturados
 * (título, status, stack, repositório e o diário de evolução) ou, quando o autor
 * preferiu, o HTML próprio dentro do quadro isolado. O dono gerencia por aqui.
 */
export function ProfileProjectsSection({ username, isOwner }: ProjectsSectionProps) {
  const [managing, setManaging] = useState(false);
  const [importing, setImporting] = useState(false);

  const { data: projects = [] } = useQuery({
    queryKey: ["projects", username],
    queryFn: () => projectsApi.byUser(username),
  });

  return (
    <ProfileProjectsSectionView
      projects={projects}
      isOwner={isOwner}
      onManage={() => setManaging(true)}
      onImport={() => setImporting(true)}
      renderHtmlFrame={(props) => <SandboxedHtmlFrame {...props} />}
      manager={
        <>
          <ProjectsManager
            open={managing}
            onOpenChange={setManaging}
            username={username}
            onSaved={() => {
              /* a invalidação do query já re-renderiza a seção */
            }}
          />
          <GithubImportDialog open={importing} onOpenChange={setImporting} username={username} />
        </>
      }
    />
  );
}
