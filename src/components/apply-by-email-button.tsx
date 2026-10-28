import { useState } from "react";

import { texts } from "@/texts";
import type { ApplyByEmailButtonProps } from "@/types/components/job/apply-by-email-button-props";
import { ApplyByEmailButton as ApplyByEmailButtonView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { resolveCdnUrl } from "@/lib/api/media";
import {
  applyEmailFromText,
  buildApplicationEmail,
  downloadResume,
  shareResume,
} from "@/lib/apply-email";
import { useCurrentUser } from "@/lib/current-user";

/**
 * "Agilizar envio": escreve o e-mail de candidatura e abre o app de e-mail da pessoa.
 *
 * Existe porque a alternativa é pior: o anúncio diz "mande seu currículo para vagas@empresa.com" e a
 * pessoa tem de abrir o e-mail, lembrar o endereço, escrever um texto do zero e achar o PDF no
 * computador. Aqui o texto sai pronto (nome, vaga, habilidades — ver `buildApplicationEmail`) e o
 * currículo do perfil vai junto quando o sistema sabe compartilhar arquivo; quando não sabe, ele é
 * baixado e o `mailto:` abre com o texto — o anexo fica a um arrastar de distância.
 *
 * O botão só existe quando há um endereço: sem ele, não há o que agilizar.
 */
export function ApplyByEmailButton({ job, email }: ApplyByEmailButtonProps) {
  const { data: me } = useCurrentUser();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const target = email?.trim() || applyEmailFromText(job.description);
  if (!target) return null;

  const start = async () => {
    if (!me) {
      toast(texts.jobs.applyByEmail.noProfile, "error");
      return;
    }
    setBusy(true);
    try {
      const resumeUrl = resolveCdnUrl(me.resumeUrl);
      const { subject, body } = buildApplicationEmail({
        jobTitle: job.title,
        company: job.company,
        name: me.name,
        headline: me.headline,
        skills: me.skills,
        portfolio: me.portfolio,
        hasResume: Boolean(resumeUrl),
      });

      // 1) Compartilhar arquivo: o app escolhido recebe o texto E o PDF (o único caminho com anexo).
      if (
        resumeUrl &&
        (await shareResume(resumeUrl, me.resumeName || "curriculo.pdf", subject, body))
      ) {
        return;
      }

      // 2) Sem compartilhamento: baixa o currículo e abre o e-mail com o texto pronto.
      if (resumeUrl) {
        await downloadResume(resumeUrl, me.resumeName);
        toast(texts.jobs.applyByEmail.resumeHint);
      }
      window.location.href = `mailto:${target}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    } finally {
      setBusy(false);
    }
  };

  return <ApplyByEmailButtonView busy={busy} onClick={() => void start()} />;
}
