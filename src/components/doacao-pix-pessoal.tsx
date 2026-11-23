import { useEffect, useRef, useState } from "react";

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

/**
 * O QR é dado desenhado no canvas, não estilo de tela: o leitor de banco não segue o tema da
 * página. Preto sobre branco é o par que todo leitor reconhece, e os nomes de cor CSS evitam o
 * literal hexadecimal que a regra de token do app recusa.
 */
const CORES_DO_QR = { dark: "black", light: "white" };

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
  // O QR é do pedido vivo, não do último `onSuccess`: sem esta marca, a resposta de um valor que o
  // usuário já trocou chega depois do reset e desenha um QR de doação que ele não quer mais.
  const pedidoDe = useRef<number | null>(null);
  const tempoCopiado = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A doação aberta que ainda espera pagamento. Sem ela, recarregar `/apoiar` apagava o QR da tela
  // e o usuário abria outra — que aposenta a anterior, que ele talvez já estivesse pagando.
  const aberta = useQuery({
    queryKey: ["doacoes", "aberta"],
    queryFn: () => doacoesApi.current(),
    // `retry: false`: 404 aqui é "não há doação aberta", o estado normal de quem nunca abriu uma.
    enabled: !!conta,
    retry: false,
  });

  const minhas = useQuery({
    queryKey: ["doacoes", "minhas"],
    queryFn: () => doacoesApi.mine(),
    enabled: !!conta,
    staleTime: 5 * 60_000,
  });

  const abrir = useMutation({
    mutationFn: (centavos: number) => {
      pedidoDe.current = centavos;
      return doacoesApi.open(centavos);
    },
    onSuccess: async (doacao) => {
      // Só aceita a resposta se o valor pedido ainda é o escolhido. Trocar de valor enquanto o
      // pedido está em voo descarta a resposta: o servidor aposenta a doação anterior a cada
      // abertura, e desenhar o QR dela seria mostrar um código que não paga o que a tela diz.
      if (pedidoDe.current !== doacao.amountCents) return;
      setConfirmada(false);
      const desenho = await QRCode.toDataURL(doacao.pixCopyAndPaste, {
        width: 360,
        margin: 1,
        color: CORES_DO_QR,
      }).catch(() => null);
      if (pedidoDe.current !== doacao.amountCents) return;
      setQrCodeDataUrl(desenho);
      // A doação anterior foi aposentada ao abrir esta: a retomada não pode ressuscitá-la.
      void queryClient.invalidateQueries({ queryKey: ["doacoes", "aberta"] });
    },
    onError: () => {
      // Abrir falhou: a doação que a tela mostrava foi aposentada pelo servidor ao tentar abrir a
      // nova. Desenhar o QR e o código da anterior com a faixa de erro seria oferecer um código
      // que não paga mais nada; limpa para a tela não mentir sobre o que ainda vale.
      setQrCodeDataUrl(null);
    },
  });

  useEffect(() => {
    if (abrir.data || !aberta.data) return;
    let vivo = true;
    void QRCode.toDataURL(aberta.data.pixCopyAndPaste, {
      width: 360,
      margin: 1,
      color: CORES_DO_QR,
    })
      .then((desenho) => {
        if (vivo) setQrCodeDataUrl(desenho);
      })
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [abrir.data, aberta.data]);

  useEffect(
    () => () => {
      if (tempoCopiado.current) clearTimeout(tempoCopiado.current);
    },
    [],
  );

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
      void queryClient.invalidateQueries({ queryKey: ["doacoes", "aberta"] });
      void queryClient.invalidateQueries({ queryKey: ["apoiador-selo"] });
    },
  });

  if (!conta) return null;

  const erroDe = (erro: unknown, padrao: string) =>
    erro instanceof ApiError && erro.message ? erro.message : padrao;

  // Quando abrir a doação falha, `abrir.data` guarda o último sucesso — uma doação que o servidor
  // já aposentou. Com erro na tela, não mostra código nenhum: o antigo não paga mais o valor atual.
  const codigo = abrir.isError
    ? null
    : abrir.data
      ? paraCodigo(abrir.data)
      : aberta.data
        ? paraCodigo(aberta.data)
        : null;

  const copiar = async () => {
    if (!codigo) return;
    try {
      await navigator.clipboard.writeText(codigo.pixCopyAndPaste);
      setCopiado(true);
      if (tempoCopiado.current) clearTimeout(tempoCopiado.current);
      tempoCopiado.current = setTimeout(() => setCopiado(false), 4000);
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
        // O valor escolhido deixa de ser o do pedido em voo; a resposta dele será descartada.
        pedidoDe.current = centavos;
        abrir.reset();
        setQrCodeDataUrl(null);
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
        pedidoDe.current = null;
        abrir.reset();
        setQrCodeDataUrl(null);
      }}
    />
  );
}
