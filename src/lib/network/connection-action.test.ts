import { describe, expect, it } from "vitest";

import { connectionAction } from "./connection-action";

describe("connectionAction", () => {
  it("pedido recebido oferece resposta, não cancelamento (o botão recusava sem dizer)", () => {
    expect(connectionAction({ status: "PENDING", requestedByMe: false })).toBe("respond");
  });

  it("pedido enviado oferece cancelamento", () => {
    expect(connectionAction({ status: "PENDING", requestedByMe: true })).toBe("cancel");
  });

  it("backend ainda sem o campo mantém o cancelamento: o aceite seria recusado a quem pediu", () => {
    expect(connectionAction({ status: "PENDING" })).toBe("cancel");
  });

  it("conexão aceita oferece remoção", () => {
    expect(connectionAction({ status: "ACCEPTED", requestedByMe: false })).toBe("disconnect");
  });

  it.each(["NONE", "REMOVED", "BLOCKED"] as const)("%s oferece conectar", (status) => {
    expect(connectionAction({ status, requestedByMe: false })).toBe("connect");
  });

  it("status ainda não carregado oferece conectar, como antes", () => {
    expect(connectionAction(undefined)).toBe("connect");
  });
});
