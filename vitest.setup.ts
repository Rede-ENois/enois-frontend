// O jsdom não implementa rolagem: `window.scrollTo` lança "Not implemented" e o react-virtual
// chama ele ao montar listas, sujando a saída dos testes. Um teste que precise conferir a rolagem
// continua podendo substituir por um vi.fn() próprio.
if (typeof window !== "undefined") {
  window.scrollTo = () => {};
}
