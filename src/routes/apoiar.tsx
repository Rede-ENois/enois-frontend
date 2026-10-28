import { useEffect, useState } from "react";

import { Link, createFileRoute } from "@tanstack/react-router";

import { texts } from "@/texts";
import { PIX_KEY, pixCopiaECola } from "@rede-enois/design-system/domain";
import { Button, useToast } from "@rede-enois/design-system/ui";
import { GithubIcon } from "@rede-enois/design-system/ui";
import {
  Check,
  Copy,
  ExternalLink,
  Heart,
  MessageSquare,
  Server,
  Share2,
  ShieldCheck,
  Users,
} from "lucide-react";
import QRCode from "qrcode";

import { AppContainer } from "@/components/app-container";

export const Route = createFileRoute("/apoiar")({
  head: () => ({
    meta: [
      { title: "Apoie o Énóis" },
      {
        name: "description",
        content:
          "O Énóis é gratuito e livre. Quem puder, ajuda a manter a rede de pé com uma doação via Pix — qualquer valor, sem assinatura e sem contrapartida.",
      },
      { property: "og:title", content: "Apoie o Énóis" },
      {
        property: "og:description",
        content:
          "Uma internet mais humana não se constrói sozinha. Conheça o projeto e, se puder, ajude a manter o Énóis de pé.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${texts.siteUrl}/apoiar` },
    ],
  }),
  component: Apoiar,
});

const MOTIVOS = [
  {
    icon: ShieldCheck,
    titulo: "Não queremos transformar você em produto",
    texto:
      "Sem anúncios disputando sua atenção, sem patrocinador comprando espaço no feed e sem vender seus dados para fazer dinheiro. A ideia é que a rede seja sustentada pelas pessoas que acreditam nela, não pela exploração da atenção de quem a utiliza.",
  },
  {
    icon: Server,
    titulo: "A infraestrutura não funciona de graça",
    texto:
      "Nosso servidor foi uma doação que recebemos, e somos muito gratos por isso. Mas servidores, banco de dados, armazenamento de fotos, envio de e-mails e outros serviços geram custos recorrentes. Mesmo quando ninguém publica nada, as contas continuam chegando.",
  },
  {
    icon: Users,
    titulo: "Seu dinheiro não compra poder",
    texto:
      "O Énóis é um projeto comunitário. Apoiar financeiramente não dá poder sobre a moderação, não compra influência nas decisões e não garante privilégios na plataforma. Queremos discutir regras, funcionalidades e o futuro do projeto com a comunidade, de forma transparente. A contribuição ajuda a financiar esse trabalho, não a comprar o controle dele.",
  },
  {
    icon: Heart,
    titulo: "Qualquer valor ajuda. E não poder doar também não é problema.",
    texto:
      "Não existe valor mínimo, mensalidade ou obrigação de contribuir novamente. Se você doar uma vez, ótimo. Se puder doar outras vezes, ótimo também. E se sua contribuição for participar, compartilhar conhecimento, relatar um problema ou simplesmente estar aqui, isso também tem valor.",
  },
] as const;

const CARTA = [
  {
    titulo: "Vamos falar da realidade",
    paragrafos: [
      "O Énóis é um projeto comunitário. Nosso servidor foi uma doação que recebemos, e sou muito grata por isso. Somos meia dúzia de pessoas tentando construir alguma coisa sem objetivo de lucro, trabalhando de graça e colocando dinheiro do próprio bolso quando dá.",
      "Não tem uma empresa bilionária bancando a operação. Não tem uma sala cheia de executivos decidindo como extrair mais alguns centavos de cada usuário. Tem gente trabalhando porque acredita que a internet pode ser diferente.",
      "E sim, nosso orçamento é o de uma coxinha. Às vezes nem sei se com refrigerante. Kkkkk.",
      "Mas a gente está aqui. Fazendo o que consegue, melhorando o que dá e tentando construir algo que tenha um propósito além de gerar dinheiro.",
      "É por isso que resolvi abrir essa conversa sobre apoio financeiro. Não para cobrar de ninguém, mas porque manter um projeto no ar exige recursos, e fingir que os custos não existem não vai pagar servidor.",
    ],
  },
  {
    titulo: "A internet que prometeram pra gente",
    paragrafos: [
      "Vocês já perceberam quantos temas gráficos do Énóis remetem aos sistemas antigos?",
      "Aquilo não está ali só porque a gente gosta de computador velho. Embora eu goste mesmo. Tem um pouco de saudade de uma internet que parecia nossa: as pessoas criavam sites, montavam comunidades, compartilhavam conhecimento e faziam coisas simplesmente porque tinham vontade.",
      "Ninguém precisava transformar cada opinião em marca pessoal, cada conversa em funil de vendas ou cada hobby em uma oportunidade de engajamento.",
      "A gente cresceu ouvindo que o futuro seria incrível, que a tecnologia aproximaria as pessoas e que a internet daria espaço para todo mundo. Olha só onde fomos parar: algoritmos disputando nossa atenção, plataformas tratando usuários como números e pessoas precisando performar uma versão profissional de si mesmas até para falar que o café esfriou.",
      "Eu não quero passar o resto da vida reclamando da internet que perdemos. Quero ajudar a construir a internet que gostaria de ter.",
      "Foi por isso que decidimos colocar a mão na massa. Não porque achamos que somos melhores que todo mundo, nem porque temos a fórmula mágica para resolver os problemas da internet. Mas porque alguém precisa tentar.",
    ],
  },
  {
    titulo: "Sem vocês, isso aqui é só um site caro",
    paragrafos: [
      "Pode ter código bom, interface bonita, infraestrutura funcionando e um monte de funcionalidades. Sem pessoas, não existe comunidade. Existe só um site rodando num servidor e consumindo dinheiro.",
      "Por isso, peço um pouco de compreensão. Estamos fazendo isso com os recursos que temos. Vai ter coisa que quebra, funcionalidade que demora e decisão que a gente vai precisar rever.",
      "Não vou fingir que está tudo perfeito. O que posso prometer é que estamos trabalhando para melhorar e que queremos ouvir quem está aqui.",
      "A gente não precisa concordar em tudo, mas precisa conseguir conversar.",
      "Se algo não funciona, fale. Se uma decisão não faz sentido, questione. Se tiver uma ideia melhor, compartilhe. Não precisamos fingir que acertamos sempre para continuar construindo algo bom.",
    ],
  },
  {
    titulo: "Liberdade não é licença para estragar o espaço dos outros",
    paragrafos: [
      "Quero uma rede livre. Não quero um ambiente engessado, onde qualquer opinião diferente vira motivo para punição.",
      "Crítica faz parte. Discordar faz parte. Apontar nossos erros faz parte, e espero que vocês façam isso.",
      "Mas liberdade não é passe livre para assediar pessoas, fazer spam, tentar derrubar a plataforma ou prejudicar a experiência de quem está aqui.",
      "Se vocês virem algo assim, denunciem. Nossa moderação leva essas situações a sério e precisa da ajuda de vocês para identificar o que acontece na comunidade.",
      "Isso não significa que a responsabilidade da equipe seja de vocês. Significa que a comunidade pode ajudar a impedir que meia dúzia de pessoas estrague algo que centenas estão tentando construir.",
      "Não vamos tratar abuso como se fosse apenas mais uma opinião. E também não vamos tratar toda discordância como abuso. Existe uma diferença enorme entre as duas coisas.",
    ],
  },
  {
    titulo: "Eu não quero que ninguém aqui seja descartável",
    paragrafos: [
      "Quando minha conta do LinkedIn foi hackeada, o sujeito mudou a identidade do perfil para a identidade dele. E a resposta que recebi do suporte foi basicamente: “Que pena, crie outra conta”.",
      "Pensa nisso por um instante.",
      "Uma conta pode carregar anos de trabalho, contatos, conversas, oportunidades e uma parte enorme da história profissional de alguém. E a solução oferecida foi começar tudo de novo.",
      "É exatamente esse tipo de coisa que não quero reproduzir aqui.",
      "Não quero que alguém relate um problema e sinta que está falando com uma parede. Não quero que uma pessoa seja reduzida a um número de protocolo porque não vale o custo de atendimento de uma plataforma gigante.",
      "Talvez a gente não consiga resolver todos os problemas. Temos limitações reais. Mas podemos ouvir, investigar, dar retorno e tratar as pessoas com respeito.",
      "Cada usuário merece atenção. Cada desenvolvedor que compartilha seu trabalho merece reconhecimento. Cada pessoa merece ter espaço para se expressar sem ser tratada como descartável.",
      "Não quero prometer uma estrutura que ainda não temos. Quero construir uma que, mesmo pequena, não perca a humanidade.",
    ],
  },
  {
    titulo: "E ainda tem muita coisa vindo por aí",
    paragrafos: [
      "Estamos trabalhando em mais opções de personalização, inclusive na área de Uso saudável.",
      "A ideia é dar mais controle sobre a própria experiência. Quer escolher os assuntos que quer ver? Beleza. Quer evitar determinados conteúdos? Também. Quer desativar recursos que não fazem sentido para você? É esse tipo de controle que queremos oferecer.",
      "Não acho que todo mundo precise usar a rede do mesmo jeito.",
      "Uma pessoa pode amar comunidades enquanto outra só quer conversar com os amigos. Alguém pode querer acompanhar vagas e eventos, enquanto outra pessoa quer publicar textos e trocar ideia sobre tecnologia.",
      "A plataforma deve dar espaço para essas diferenças, não obrigar todo mundo a consumir a mesma coisa.",
      "Não quero decidir por você o que deve aparecer na sua tela. Quero que você tenha ferramentas para decidir isso por conta própria.",
    ],
  },
  {
    titulo: "Então, o que eu peço a vocês?",
    paragrafos: [
      "Participem. Falem o que está ruim. Sugiram melhorias. Denunciem problemas. Compartilhem o projeto.",
      "Se souberem programar, contribuam com o código. Se não souberem, participem mesmo assim. Uma comunidade não é feita só de quem programa, administra servidores ou desenha interfaces.",
      "Ela também é feita de quem publica uma ideia, responde alguém que acabou de chegar, escreve um artigo, organiza uma comunidade, encontra um erro ou simplesmente faz outra pessoa se sentir bem-vinda.",
      "Não quero que vocês estejam aqui só para consumir o que meia dúzia de pessoas publica. Quero que sintam que também podem ajudar a decidir os rumos desse espaço.",
    ],
  },
  {
    titulo: "Não temos dinheiro de big tech. Temos vontade de fazer diferente.",
    paragrafos: [
      "Temos um orçamento de coxinha e uma quantidade limitada de horas no dia. Temos contas para pagar, problemas para resolver e muita coisa que ainda precisa melhorar.",
      "Mas temos a oportunidade de construir algo sem precisar colocar o lucro acima das pessoas.",
      "E, sinceramente, acho que vale a pena tentar.",
      "Não quero que o Énóis dependa da boa vontade de uma única pessoa para sempre. Quero que ele tenha uma comunidade capaz de participar, colaborar e, para quem puder, ajudar a sustentar a infraestrutura.",
      "O apoio financeiro é uma parte disso. Não é a única, nem torna ninguém mais importante do que os outros.",
      "Se puder contribuir, agradeço de verdade. Se não puder, fique à vontade para continuar usando, participando e ajudando de outras formas.",
      "Você não precisa pagar para pertencer.",
    ],
  },
  {
    titulo: "Vamo nessa?",
    paragrafos: [
      "Não queremos mais uma big tech. Queremos humanidade.",
      "A internet não precisa ser só aquilo que fizeram dela. Ainda dá para criar, colaborar, conversar e construir alguma coisa que seja nossa.",
      "A gente começou o trabalho. Agora, quero ver o que conseguimos fazer juntos.",
      "Vamo nessa. Énóis. ❤️",
    ],
  },
] as const;

const OUTRAS_FORMAS = [
  {
    titulo: "Traga gente boa",
    texto: "Compartilhe o Énóis com quem também gostaria de fazer parte disso.",
  },
  {
    titulo: "Publique o que você sabe",
    texto: "Conhecimento guardado não constrói comunidade.",
  },
  {
    titulo: "Dê feedback",
    texto: "Encontrou um problema ou teve uma ideia? Conta pra gente.",
  },
  {
    titulo: "Ajude quem está chegando",
    texto: "Às vezes, uma resposta simpática vale mais do que uma funcionalidade nova.",
  },
  {
    titulo: "Contribua com o código",
    texto: "O projeto está aberto para quem quiser colaborar.",
  },
] as const;

function Apoiar() {
  const { toast } = useToast();
  const [qr, setQr] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    QRCode.toDataURL(pixCopiaECola(), {
      width: 360,
      margin: 1,
      color: { dark: "#0b0d12", light: "#ffffff" },
    })
      .then(setQr)
      .catch(() => setQr(null));
  }, []);

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopiado(true);
      toast(textsApoie.copiadoAviso, "success");
      setTimeout(() => setCopiado(false), 4000);
    } catch {
      toast(textsApoie.copiarErro, "error");
    }
  };

  const compartilhar = async () => {
    const url = `${texts.siteUrl}/apoiar`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: textsApoie.titulo, url });
        return;
      } catch (error) {
        // Cancelar a folha de compartilhamento não é erro.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast(textsApoie.compartilharCopiado, "success");
    } catch {
      toast(textsApoie.compartilharErro, "error");
    }
  };

  return (
    <AppContainer>
      <div className="mx-auto w-full max-w-2xl space-y-5">
        {/* Capa */}
        <section className="surface-card overflow-hidden">
          <div className="h-28 sm:h-36" style={{ background: "var(--gradient-primary)" }} />

          <div className="px-5 pb-6 sm:px-8">
            <p className="-mt-6 inline-flex items-center gap-2 rounded-full bg-surface-card px-3 py-1.5 text-sm font-semibold text-primary shadow-soft">
              <Heart className="h-4 w-4" />

              <>{textsApoie.badge}</>
            </p>

            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text-strong sm:text-3xl">
              {textsApoie.titulo}
            </h1>

            <p className="mt-2 text-base font-medium text-text-strong">{textsApoie.chamada}</p>

            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-subtle">
              {textsApoie.subtitulo}
            </p>
          </div>
        </section>

        {/* Pix */}
        <section id="pix" className="surface-card p-5 sm:p-6">
          <h2 className="text-base font-medium text-text-strong">{textsApoie.pixTitulo}</h2>

          <p className="mt-1 text-sm text-text-subtle">{textsApoie.pixDescricao}</p>

          <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="rounded-xl bg-white p-2 shadow-soft">
              {qr ? (
                <img
                  src={qr}
                  alt="QR Code Pix do Apoie o Énóis"
                  className="h-40 w-40 sm:h-44 sm:w-44"
                />
              ) : (
                <div className="h-40 w-40 animate-pulse rounded bg-muted sm:h-44 sm:w-44" />
              )}
            </div>

            <div className="w-full min-w-0 space-y-3 sm:flex-1">
              <div className="rounded-lg bg-muted px-3 py-2">
                <p className="text-[11px] font-medium uppercase tracking-wide text-text-subtle">
                  {textsApoie.chaveRotulo}
                </p>

                <p className="break-all font-mono text-sm text-text-strong">{PIX_KEY}</p>
              </div>

              <Button className="w-full gap-2 rounded-full sm:w-auto" onClick={copiar}>
                {copiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}

                <>{copiado ? textsApoie.copiado : textsApoie.copiar}</>
              </Button>

              <p className="text-xs text-text-subtle">{textsApoie.pixAviso}</p>
            </div>
          </div>

          <p className="mt-4 border-t border-border-soft pt-3 text-xs text-text-subtle">
            {textsApoie.pixSemObrigacao}
          </p>
        </section>

        {/* Por que apoiar */}
        <section className="space-y-3">
          <h2 className="text-base font-medium text-text-strong">{textsApoie.porQue}</h2>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {MOTIVOS.map((motivo) => (
              <article key={motivo.titulo} className="surface-card p-4">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary-soft text-primary">
                  <motivo.icon className="h-4 w-4" />
                </span>

                <h3 className="mt-2 text-sm font-medium text-text-strong">{motivo.titulo}</h3>

                <p className="mt-1 text-xs leading-relaxed text-text-subtle">{motivo.texto}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Carta aberta à comunidade */}
        <section className="surface-card space-y-4 p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            {textsApoie.cartaEyebrow}
          </p>

          <h2 className="text-xl font-semibold tracking-tight text-text-strong">
            {textsApoie.cartaTitulo}
          </h2>

          <p className="text-sm leading-relaxed text-text-subtle">{textsApoie.cartaIntro}</p>

          {CARTA.map((bloco) => (
            <div
              key={bloco.titulo}
              className="space-y-2 border-t border-border-soft pt-4 first:border-0 first:pt-0"
            >
              <h3 className="text-sm font-semibold text-text-strong">{bloco.titulo}</h3>

              {bloco.paragrafos.map((paragrafo) => (
                <p key={paragrafo} className="text-sm leading-relaxed text-text-subtle">
                  {paragrafo}
                </p>
              ))}
            </div>
          ))}

          <div className="space-y-2 border-t border-border-soft pt-4">
            <h3 className="text-sm font-semibold text-text-strong">{textsApoie.codigoTitulo}</h3>

            <p className="text-sm leading-relaxed text-text-subtle">{textsApoie.codigoTexto}</p>

            <a
              href="https://github.com/Rede-ENois"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between gap-3 rounded-xl border border-border-soft bg-surface-1 px-4 py-3 text-sm font-medium text-text-strong transition hover:border-primary hover:text-primary"
            >
              <span className="inline-flex min-w-0 items-center gap-2">
                <GithubIcon className="h-4 w-4 shrink-0 text-primary" />

                <span className="truncate">github.com/Rede-ENois</span>
              </span>

              <span className="inline-flex shrink-0 items-center gap-1 text-xs font-normal text-text-subtle">
                {textsApoie.abreNovaAba}

                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </span>
            </a>
          </div>
        </section>

        {/* Além do dinheiro */}
        <section className="surface-card p-5 sm:p-6">
          <h2 className="text-base font-medium text-text-strong">{textsApoie.alemTitulo}</h2>

          <ul className="mt-3 space-y-3">
            {OUTRAS_FORMAS.map((forma) => (
              <li key={forma.titulo} className="flex gap-2">
                <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />

                <p className="text-sm leading-relaxed text-text-subtle">
                  <span className="font-medium text-text-strong">{forma.titulo}.</span>{" "}
                  {forma.texto}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Ações finais */}
        <section className="surface-card p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            <Link
              to="/suporte"
              className="inline-flex items-center gap-2 rounded-full border border-border-soft px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
            >
              <MessageSquare className="h-4 w-4" />

              <>{textsApoie.suporte}</>
            </Link>

            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border-soft px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
              onClick={compartilhar}
            >
              <Share2 className="h-4 w-4" />

              <>{textsApoie.compartilhar}</>
            </button>
          </div>

          <p className="mt-4 text-sm font-medium text-text-strong">{textsApoie.encerramento}</p>

          <p className="mt-1 text-xs text-text-subtle">{textsApoie.rodape}</p>
        </section>
      </div>
    </AppContainer>
  );
}

const textsApoie = {
  badge: "Projeto comunitário",
  titulo: "Apoie o Énóis",
  chamada: "Uma internet mais humana não se constrói sozinha.",
  subtitulo:
    "O Énóis é gratuito e livre. Não tem anúncios, não vende dados e não cobra para você participar. A gente quer continuar assim — e, se você acredita que esse espaço vale a pena, pode ajudar a mantê-lo de pé. Qualquer valor ajuda. E, se não puder contribuir financeiramente, tudo bem: você continua sendo parte disso.",
  porQue: "Por que apoiar?",
  pixTitulo: "Ajude a manter o Énóis de pé",
  pixDescricao:
    "Escaneie o QR Code ou copie a chave e cole no aplicativo do seu banco. Você escolhe o valor.",
  chaveRotulo: "Chave Pix (CNPJ)",
  copiar: "Copiar chave Pix",
  copiado: "Copiado!",
  copiadoAviso: "Chave Pix copiada — cola no app do banco!",
  copiarErro: "Não deu para copiar — toque e segure na chave para copiar à mão.",
  pixAviso:
    "Essa é uma chave Pix estática, sem vencimento e sem valor fixo. Não é assinatura, não é mensalidade e não existe nenhuma contrapartida obrigatória.",
  pixSemObrigacao:
    "Você não precisa pagar para participar do Énóis. A contribuição é voluntária e ajuda a manter a rede funcionando para todo mundo.",
  cartaEyebrow: "Carta aberta à comunidade",
  cartaTitulo: "Um papo reto com a comunidade",
  cartaIntro:
    "Cara, vamo lá. Precisamos conversar sobre o Énóis, sobre o que estamos construindo e sobre o tipo de internet que a gente quer ter de volta. Não quero fazer um discurso bonito para pedir dinheiro. Quero explicar o que estamos tentando construir, quais são as nossas limitações e por que acredito que vale a pena continuar.",
  codigoTitulo: "O código é de todo mundo",
  codigoTexto:
    "O repositório do Énóis é aberto. Você pode conhecer o projeto, acompanhar o desenvolvimento, apontar problemas e contribuir com o código. A gente não quer construir uma caixa-preta e pedir que todo mundo confie cegamente. Queremos que as pessoas possam olhar, questionar, colaborar e entender o que estão ajudando a manter.",
  abreNovaAba: "abre em nova aba",
  alemTitulo: "Além do dinheiro, tem outras formas de ajudar",
  suporte: "Deixar um feedback",
  compartilhar: "Compartilhar esta página",
  compartilharCopiado: "Link copiado — manda para quem curte a ideia.",
  compartilharErro: "Não deu para copiar o link agora.",
  encerramento: "Feito por pessoas, para pessoas. Obrigado por manter o Énóis de pé. ❤️",
  rodape: "O Énóis não precisa de você pagando para pertencer. Precisa de você por aqui.",
};
