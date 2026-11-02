import { useQuery } from "@tanstack/react-query";

import { ProfileExperiencesSection as ProfileExperiencesSectionView } from "@rede-enois/design-system/domain";

import { profileApi } from "@/lib/api";
import { monthsBetween, shortMonthYear } from "@/lib/date/format";

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
        startLabel: item.startDate ? shortMonthYear(item.startDate) : null,
        endLabel: item.endDate ? shortMonthYear(item.endDate) : null,
        months: item.startDate ? monthsBetween(item.startDate, item.endDate) : null,
      }))}
    />
  );
}
