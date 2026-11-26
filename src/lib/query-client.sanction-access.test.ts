// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";

import { createAppQueryClient, registerBrowserQueryClient } from "./query-client";

afterEach(() => localStorage.clear());
it("remove a decisão da conta anterior quando outra aba troca uma sessão limitada", async () => {
  const client = createAppQueryClient();
  registerBrowserQueryClient(client);
  localStorage.setItem("sanction_access", "1");
  client.setQueryData(["my-sanctions"], { sanctions: [{ id: "sanc_sintetica_A" }], appeals: [] });
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "sanction_access",
      oldValue: "1",
      newValue: null,
      storageArea: localStorage,
    }),
  );
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "sanction_access",
      oldValue: null,
      newValue: "1",
      storageArea: localStorage,
    }),
  );
  expect(client.getQueryData(["my-sanctions"])).toBeUndefined();
  client.clear();
});
it("não limpa a decisão por uma preferência sem relação com a identidade", () => {
  const client = createAppQueryClient();
  registerBrowserQueryClient(client);
  const data = { sanctions: [{ id: "sanc_sintetica_A" }], appeals: [] };
  client.setQueryData(["my-sanctions"], data);
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: "theme",
      oldValue: "light",
      newValue: "dark",
      storageArea: localStorage,
    }),
  );
  expect(client.getQueryData(["my-sanctions"])).toEqual(data);
  client.clear();
});
