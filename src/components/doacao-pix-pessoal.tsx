import { useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { DoacaoCopiaECola } from "@/types/application/doacoes/doacao-copia-e-cola";
import type { DoacaoPixView } from "@/types/application/doacoes/doacao-pix-view";
import type { ResultadoDoacao } from "@/types/application/doacoes/resultado-doacao";
import { DoacaoPessoalCard } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";
import QRCode from "qrcode";

import { doacoesApi } from "@/lib/api";
import { ApiError } from "@/lib/api-client";
import { useCurrentUser } from "@/lib/current-user";

const paraCodigo = (doacao: DoacaoCopiaECola): DoacaoPixView => ({
  id: doacao.id,
  pixCopyAndPaste: doacao.pixCopyAndPaste,
  amountCents: doacao.amountCents,
});

/**
 * A doação com QR Code próprio de quem está logado: o card desenha, este componente faz a
 * requisição, desenha o QR e copia o código. Sem sessão devolve `null` e a página mostra a chave
 * estática de sempre.
 */
export function DoacaoPixPessoal() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: conta } = useCurrentUser();

  const [valorCents, setValorCents] = useState<number | null>(null);
  const [comprovante, setComprovante] = useState("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const minhas = useQuery({
    queryKey: ["doacoes", "minhas"],
    queryFn: () => doacoesApi.mine(),
    enabled: !!conta,
    staleTime: 5 * 60_000,
  });

  const abrir = useMutation({
    mutationFn: (centavos: number) => doacoesApi.open(centavos),
    onSuccess: async (doacao) => {
      setConfirmada(false);
      setQrCodeDataUrl(
        await QRCode.toDataURL(doacao.pixCopyAndPaste, {
          width: 360,
          margin: 1,
        }).catch(() => null),
      );
    },
  });

  const confirmar = useMutation({
    mutationFn: (dados: { id: string; comprovante: string }) =>
      doacoesApi.confirm(dados.id, dados.comprovante),
    onSuccess: (resultado: ResultadoDoacao) => {
      setConfirmada(true);
      setComprovante("");
      setValorCents(null);
      setQrCodeDataUrl(null);
      toast(
        resultado.situacao === "CONFIRMADA"
          ? "Doação confirmada. Obrigado por manter o Énóis de pé!"
          : "Comprovante recebido. A doação entra na fila do extrato e o selo aparece quando ela for confirmada.",
        "success",
      );
      void queryClient.invalidateQueries({ queryKey: ["doacoes", "minhas"] });
      void queryClient.invalidateQueries({ queryKey: ["apoiador-selo"] });
    },
  });

  if (!conta) return null;

  const erroDe = (erro: unknown, padrao: string) =>
    erro instanceof ApiError && erro.message ? erro.message : padrao;

  const codigo = abrir.data ? paraCodigo(abrir.data) : null;

  const copiar = async () => {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo.pixCopyAndPaste);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 4000);
    } catch {
      toast("Não deu para copiar — toque e segure no código para copiar à mão.", "error");
    }
  };

  return (
    <DoacaoPessoalCard
      apoiador={minhas.data ? minhas.data.selo.apoiador : null}
      codigo={codigo}
      qrCodeDataUrl={qrCodeDataUrl}
      valorCents={valorCents}
      comprovante={comprovante}
      erro={abrir.isError ? erroDe(abrir.error, "Não deu para gerar o QR Code agora.") : null}
      erroConfirmar={
        confirmar.isError
          ? erroDe(confirmar.error, "Não foi possível confirmar o comprovante.")
          : null
      }
      abrindo={abrir.isPending}
      confirmando={confirmar.isPending}
      confirmada={confirmada}
      copiado={copiado}
      onValorChange={(centavos) => {
        setValorCents(centavos);
        abrir.reset();
      }}
      onAbrir={() => {
        if (valorCents) abrir.mutate(valorCents);
      }}
      onComprovanteChange={(texto) => {
        setComprovante(texto);
        confirmar.reset();
      }}
      onConfirmar={() => {
        if (codigo && comprovante.trim()) {
          confirmar.mutate({ id: codigo.id, comprovante });
        }
      }}
      onCopiar={() => void copiar()}
      onMudarValor={() => {
        abrir.reset();
        setQrCodeDataUrl(null);
      }}
    />
  );
}
