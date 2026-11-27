/**
 * PENDENTE DE VIEW — bloqueado em `Rede-ENois/enois-design-system#459`.
 *
 * O selo de apoiador registrado à mão precisa de uma view (botão + confirmação + motivo), no
 * padrão de `AdminRemovePostAction`. Este repositório recusa markup no app (`no-front-markup`), e o
 * design system instalado não tem o componente nem um slot na seção do perfil — então o botão não é
 * montado até a view existir. O backend e a chamada de API já estão prontos abaixo para o container.
 */
export function AdminSupporterSealButton(_props: { username: string }) {
  return null;
}
