// @vitest-environment jsdom
import { afterEach, expect, it } from "vitest";

import { SESSION_FLAG_KEY } from "@/lib/session-key";

import {
  getSanctionSessionGeneration,
  invalidateSanctionSession,
  markSanctionAccess,
} from "./sanction-access.store";

afterEach(() => localStorage.clear());

it("invalida a geração de apresentação sem criar acesso normal", () => {
  localStorage.clear();
  markSanctionAccess();
  const first = getSanctionSessionGeneration();
  invalidateSanctionSession();
  expect(getSanctionSessionGeneration()).not.toBe(first);
  expect(localStorage.getItem(SESSION_FLAG_KEY)).toBeNull();
  expect(localStorage.getItem("session_id")).toBeNull();
});

it("mantém a geração ao reafirmar o mesmo acesso limitado", () => {
  localStorage.clear();
  markSanctionAccess();
  const first = getSanctionSessionGeneration();
  markSanctionAccess();
  expect(getSanctionSessionGeneration()).toBe(first);
});
