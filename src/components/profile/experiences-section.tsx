import { useQuery } from "@tanstack/react-query";

import { ProfileExperiencesSection as ProfileExperiencesSectionView } from "@rede-enois/design-system/domain";

import { profileApi } from "@/lib/api";
import { mesAno, partesDaData } from "@/lib/date/format";

/** "jan. de 2023" → "jan. 2023" (o LinkedIn mostra assim, sem o "de"). */
const monthYear = (iso: string) => mesAno(iso).replace(" de ", " ");

/** Meses inclusivos entre início e fim (mês de entrada conta), como no LinkedIn. */
function monthsBetween(start: string, end: string | null): number {
  // Ano e mês lidos no fuso do app: `getMonth()` usa o fuso do runtime e o servidor (UTC) e o
  // navegador contariam meses diferentes na virada do mês — o HTML do servidor pararia de bater
  // com o do cliente.
  const from = partesDaData(start);
  const to = partesDaData(end ?? new Date());
  if (!from || !to) return 1;
  const months = (to.ano - from.ano) * 12 + (to.mes - from.mes) + 1;
  return Math.max(1, months);
}

/**
 * Trajetória profissional abaixo dos projetos: cargo, empresa, local, período (com "atual" para
 * quem está lá) e a descrição de cada posição — o que o LinkedIn mostra, no perfil do Énóis.
 */
export function ProfileExperiencesSection({ username }: { username: string }) {
  const { data: experiences = [] } = useQuery({
    queryKey: ["experiences", username],
    queryFn: () => profileApi.experiences.byUser(username),
  });

  // "Atualmente aqui" primeiro; depois as mais recentes pela data de início.
  const sorted = [...experiences].sort((a, b) => {
    if (a.currentlyHere !== b.currentlyHere) return a.currentlyHere ? -1 : 1;
    const da = a.startDate ?? "";
    const db = b.startDate ?? "";
    return da > db ? -1 : da < db ? 1 : 0;
  });

  return (
    <ProfileExperiencesSectionView
      experiences={sorted.map((item) => ({
        ...item,
        startLabel: item.startDate ? monthYear(item.startDate) : null,
        endLabel: item.endDate ? monthYear(item.endDate) : null,
        months: item.startDate ? monthsBetween(item.startDate, item.endDate) : null,
      }))}
    />
  );
}
