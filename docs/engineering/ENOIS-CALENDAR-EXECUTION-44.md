# Execução 44 — ÉNÓIS CALENDAR

## Bloco

Front (enois-frontend), unidade única executável desta rodada: a `/mentoria` consome o
`CalendarSlotPicker` (shipped 0.34.0, DS #224). As outras frentes do calendário continuam nas
decisões externas já registradas (fase 7 Épapo/Tamo Junto, fase 10 credenciais OAuth).

## Unidades

- **(A) front** — a `/mentoria` consome o `CalendarSlotPicker` do design system em vez de desenhar
  botões crus; PR #874.

## Quais horários são oferecidos

Só os `available` **e** com `startsAt` não nulo (`bookableSlots`, `src/lib/mentoring/bookable-slots.ts`).
O `startsAt` é anulável no contrato do `TimeSlot`; um horário sem data não tem como ser mostrado nem
reservado — oferecê-lo colocaria na tela uma opção que quebra no clique.

## Prova

| Porta | Resultado |
|---|---|
| `npx tsc --noEmit` | verde |
| `npm run lint` | 0 erros (14 warnings pré-existentes, fora deste diff) |
| `npm run test:eslint-rules` | verde |
| `node scripts/check-lint-suppressions.mjs origin/qa` | "did not grow" |
| `npx vitest run` | 237 arquivos / 1388 testes, todos verdes |
| `npx vite build` | verde (1m01s) |

Supressões de `local/no-front-markup` da rota: **241 → 234**.

## Dependências

- design system ≥ 0.34.0 (DS #229, publicado).
- `@rede-enois/design-system` já apontava `^0.34.0` na `qa` do front.
