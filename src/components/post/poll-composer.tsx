import { EnqueteComposer } from "@rede-enois/design-system/domain";

/**
 * Alternativas da enquete no composer do feed/comunidade: o desenho é do design system; este
 * wrapper só traduz os nomes que as rotas já usam para os do DS. Quem publica normaliza
 * (tira vazio, corta o excesso) e o backend valida de novo.
 */
export function PollComposer({
  options,
  onChange,
  multipleChoice,
  onMultipleChoiceChange,
  endsAt,
  onEndsAtChange,
}: {
  options: string[];
  onChange: (options: string[]) => void;
  multipleChoice?: boolean;
  onMultipleChoiceChange?: (value: boolean) => void;
  endsAt?: string;
  onEndsAtChange?: (value: string | undefined) => void;
}) {
  return (
    <EnqueteComposer
      opcoes={options}
      onOpcoesChange={onChange}
      multiplaEscolha={multipleChoice}
      onMultiplaEscolhaChange={onMultipleChoiceChange}
      terminaEm={endsAt}
      onTerminaEmChange={onEndsAtChange}
    />
  );
}
