import { useMutation, useQueryClient } from "@tanstack/react-query";

import { texts } from "@/texts";
import { RecruiterModeSwitch as RecruiterModeSwitchView } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { profileApi } from "@/lib/api";
import { useCurrentUser } from "@/lib/current-user";

/**
 * "Sou recrutador": a declaração mora na conta (`isRecruiter` em `/me`) e abre a central de
 * recrutamento e o banco de talentos. Fica fora do diálogo de editar perfil porque liga/desliga
 * na hora — e porque, lá dentro, salvar outro campo levava o valor que a tela carregou junto.
 */
export function RecruiterModeSwitch() {
  const { data: me } = useCurrentUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const save = useMutation({
    mutationFn: (isRecruiter: boolean) => profileApi.update({ isRecruiter }),
    onSuccess: (_saved, isRecruiter) => {
      // O banco de talentos decide o acesso por esta marca: sem atualizar, a tela vizinha
      // continuaria dizendo "ative o modo recrutador" até a próxima visita.
      void queryClient.invalidateQueries({ queryKey: ["me"] });
      toast(
        isRecruiter ? texts.profile.recruiterMode.on : texts.profile.recruiterMode.off,
        "success",
      );
    },
    onError: () => toast(texts.profile.recruiterMode.error, "error"),
  });

  return (
    <RecruiterModeSwitchView
      // Sem a resposta de `/me` a chave fica desligada e parada: um clique antes dela gravaria o
      // oposto do que está na conta.
      value={me?.isRecruiter === true}
      pending={save.isPending || me === undefined}
      onChange={(checked) => save.mutate(checked)}
    />
  );
}
