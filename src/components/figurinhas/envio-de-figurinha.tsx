import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { texts } from "@/texts";
import type { FigurinhaComunidade } from "@/types/application/figurinhas/figurinha-comunidade";
import { FigurinhaComunidadeEnvio, FigurinhaComunidadeRow } from "@rede-enois/design-system/domain";
import { useToast } from "@rede-enois/design-system/ui";

import { CODIGO_COMUNIDADE, publicarFigurinha } from "@/lib/figurinhas/load";

/** O que dizer para cada recusa: a local (`sintomaDoArquivo`) e a do servidor, pelo código. */
const MENSAGENS: Record<string, string> = {
  FIGURINHA_ARQUIVO_GRANDE: texts.figurinhas.envio.arquivoGrande,
  FIGURINHA_FORMATO: texts.figurinhas.envio.formato,
  FIGURINHA_DIMENSOES: texts.figurinhas.envio.dimensoes,
  FIGURINHA_CODIGO_INVALIDO: texts.figurinhas.envio.codigoInvalido,
  FIGURINHA_CODIGO_RESERVADO: texts.figurinhas.envio.codigoReservadoErro,
  FIGURINHA_CODIGO_EM_USO: texts.figurinhas.envio.codigoEmUso,
};

/**
 * Envio de uma figurinha para o catálogo da comunidade.
 *
 * O botão só libera com imagem, código no formato e nome. A checagem da imagem acontece duas
 * vezes: aqui, para dizer o que corrigir antes de subir, e no servidor, que é quem decide. A
 * figurinha publicada aparece na hora abaixo do formulário com o código para copiar.
 */
export function EnvioDeFigurinha({ logado }: { logado: boolean }) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [publicada, setPublicada] = useState<FigurinhaComunidade | null>(null);
  const [seletor, setSeletor] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const codigoLimpo = codigo
    .trim()
    .replace(/^:+|:+$/g, "")
    .toLowerCase();

  const enviar = async () => {
    if (!arquivo) return;
    setEnviando(true);
    setErro(null);
    const resultado = await publicarFigurinha(arquivo, codigo, nome);
    setEnviando(false);
    if (!resultado.ok) {
      setErro(MENSAGENS[resultado.erro] ?? texts.figurinhas.envio.falhou);
      return;
    }
    setPublicada(resultado.figurinha);
    toast(texts.figurinhas.envio.publicado, "success");
    setArquivo(null);
    setCodigo("");
    setNome("");
    setSeletor((atual) => atual + 1);
    void queryClient.invalidateQueries({ queryKey: ["figurinhas"] });
  };

  return (
    <FigurinhaComunidadeEnvio
      logado={logado}
      codigo={codigo}
      onCodigoChange={setCodigo}
      nome={nome}
      onNomeChange={setNome}
      onArquivo={(escolhido) => {
        setErro(null);
        setArquivo(escolhido);
      }}
      arquivoReset={seletor}
      enviando={enviando}
      podeEnviar={!!arquivo && CODIGO_COMUNIDADE.test(codigoLimpo) && !!nome.trim()}
      onEnviar={() => void enviar()}
      erro={erro}
      labels={{
        titulo: texts.figurinhas.envio.titulo,
        intro: texts.figurinhas.envio.intro,
        arquivo: texts.figurinhas.envio.arquivo,
        ajudaArquivo: texts.figurinhas.envio.arquivoAjuda,
        codigo: texts.figurinhas.envio.codigo,
        codigoExemplo: texts.figurinhas.envio.codigoExemplo,
        codigoAjuda: texts.figurinhas.envio.codigoAjuda,
        codigoReservado: texts.figurinhas.envio.codigoReservado,
        nome: texts.figurinhas.envio.nome,
        nomeAjuda: texts.figurinhas.envio.nomeAjuda,
        dica: texts.figurinhas.envio.dica,
        enviar: texts.figurinhas.envio.enviar,
        enviando: texts.figurinhas.envio.enviando,
        diretrizes: texts.figurinhas.envio.diretrizes,
        entrar: texts.figurinhas.envio.entrar,
        login: texts.figurinhas.envio.login,
      }}
      onAbrirDiretrizes={() => void navigate({ to: "/diretrizes" })}
      onEntrar={() => void navigate({ to: "/entrar", search: { tab: "login" } })}
    >
      {publicada && (
        <FigurinhaComunidadeRow
          codigo={publicada.codigo}
          nome={publicada.nome}
          imagem={publicada.imagem}
        />
      )}
    </FigurinhaComunidadeEnvio>
  );
}
