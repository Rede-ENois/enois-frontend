/**
 * Gerenciamento de chaves E2E: gera, cifra com senha, faz backup no servidor, restaura.
 *
 * Fluxo:
 * 1. Primeiro login ou setup: generateAndUpload(password)
 *    - Gera keypair RSA-OAEP
 *    - Cifra chave privada com derivação da senha (PBKDF2 → AES-256-GCM)
 *    - Upload pro backend (publica em claro + privada cifrada)
 *    - Armazena privada em claro no IndexedDB local (acesso rápido)
 *
 * 2. Novo dispositivo: restoreFromBackup(password)
 *    - Baixa keypairs do backend (o ativo e o histórico)
 *    - Decifra a privada ativa com a senha
 *    - Armazena a ativa e também as antigas que a senha abrir
 *
 * 3. Troca de senha: reEncryptAndUpload(oldPassword, newPassword)
 *    - Decifra com senha antiga, re-cifra com nova, re-upload
 *
 * Chaves antigas moram em `priv:<publicKey>` com índice em `my-history-keys`: mensagens
 * recebidas enquanto um keypair anterior era o ativo só abrem com a privada DAQUELE par.
 */
import type { KeypairHistoryView } from "@/types/application/e2e/keypair-history-view";

import { e2eApi } from "@/lib/api/e2e";

import {
  decryptPrivateKey,
  encryptPrivateKey,
  exportPrivateKey,
  exportPublicKey,
  generateKeypair,
  importPrivateKey,
} from "./crypto";

const DB_NAME = "enois-e2e";
const STORE_NAME = "keys";
const PRIVATE_KEY_ID = "my-private-key";
const PUBLIC_KEY_ID = "my-public-key";
const HISTORY_INDEX_ID = "my-history-keys";

/** Abre (ou cria) o IndexedDB de chaves E2E. */
function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function storeLocal(key: string, value: string): Promise<void> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function readLocal(key: string): Promise<string | null> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

/** Slot do histórico local onde a privada de um keypair anterior fica, indexado pela pública. */
function historyKeyId(publicKeyBase64: string): string {
  return `priv:${publicKeyBase64}`;
}

function readHistoryIndex(): Promise<string[]> {
  return (async () => {
    const raw = await readLocal(HISTORY_INDEX_ID);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      // Índice corrompido: o histórico local começa vazio em vez de derrubar a leitura.
      return [];
    }
  })();
}

async function addToHistoryIndex(publicKeyBase64: string): Promise<void> {
  const current = await readHistoryIndex();
  if (!current.includes(publicKeyBase64)) {
    await storeLocal(HISTORY_INDEX_ID, JSON.stringify([...current, publicKeyBase64]));
  }
}

/**
 * Guarda o keypair local atual no histórico (`priv:<publicKey>` + índice). Chame ANTES de
 * sobrescrever o par principal: sem isso, gerar ou restaurar um par novo jogava fora a privada
 * que abre as mensagens recebidas na época do par anterior neste aparelho.
 */
async function archiveLocalKeypair(): Promise<void> {
  const publicKey = await readLocal(PUBLIC_KEY_ID);
  const privateKey = await readLocal(PRIVATE_KEY_ID);
  if (!publicKey || !privateKey) return;
  const slot = historyKeyId(publicKey);
  if ((await readLocal(slot)) === null) {
    await storeLocal(slot, privateKey);
    await addToHistoryIndex(publicKey);
  }
}

/** Gera keypair, cifra privada com senha, faz upload, armazena localmente. */
export async function generateAndUpload(password: string): Promise<void> {
  await archiveLocalKeypair();

  const keypair = await generateKeypair();
  const publicKeyBase64 = await exportPublicKey(keypair.publicKey);
  const privateKeyBase64 = await exportPrivateKey(keypair.privateKey);
  const encryptedPrivateKey = await encryptPrivateKey(privateKeyBase64, password);

  await e2eApi.uploadKeypair(publicKeyBase64, encryptedPrivateKey, "RSA-OAEP");

  await storeLocal(PRIVATE_KEY_ID, privateKeyBase64);
  await storeLocal(PUBLIC_KEY_ID, publicKeyBase64);
}

/**
 * Baixa os keypairs do backend, decifra a privada ATIVA com a senha e guarda as antigas também.
 *
 * Mensagens antigas foram cifradas para a pública de um keypair que pode já estar inativo
 * (novo aparelho, nova ativação que gerou par em cima do anterior): sem o histórico, só o par
 * atual voltava e todo o passado ficava como "não foi possível decifrar". Cada privada antiga
 * que a senha abre vai para o histórico local; a que a senha NÃO abre (backup cifrado com a
 * senha de antes da troca) fica pra tentativa futura e não derruba a restauração do par ativo.
 */
export async function restoreFromBackup(password: string): Promise<void> {
  const history = await loadKeypairHistory();
  const active = history.find((kp) => kp.active) ?? history[0];
  if (!active) {
    throw new Error("Servidor não tem keypair E2E para restaurar.");
  }

  const privateKeyBase64 = await decryptPrivateKey(active.encryptedPrivateKey, password);

  // Valida que a chave decifrada é importável (senha correta).
  await importPrivateKey(privateKeyBase64);

  await storeLocal(PRIVATE_KEY_ID, privateKeyBase64);
  await storeLocal(PUBLIC_KEY_ID, active.publicKey);

  const oldKeypairs = history.filter((kp) => kp.publicKey !== active.publicKey);
  for (const kp of oldKeypairs) {
    const slot = historyKeyId(kp.publicKey);
    if ((await readLocal(slot)) !== null) continue;
    try {
      const oldPrivateKeyBase64 = await decryptPrivateKey(kp.encryptedPrivateKey, password);
      await importPrivateKey(oldPrivateKeyBase64);
      await storeLocal(slot, oldPrivateKeyBase64);
      await addToHistoryIndex(kp.publicKey);
    } catch {
      // Esta geração foi cifrada com outra senha (ex.: backup de antes da troca): fica pra
      // depois, sem atrapalhar a restauração que importa — a do par ativo.
    }
  }
}

/** Histórico de keypairs no servidor; sem o endpoint disponível, cai no par ativo só. */
async function loadKeypairHistory(): Promise<KeypairHistoryView[]> {
  try {
    const history = await e2eApi.keypairHistory();
    if (history.length > 0) return history;
  } catch {
    // Backend sem /e2e/keypair/history acessível: segue com o comportamento de antes.
  }
  const kp = await e2eApi.myKeypair();
  return [
    {
      id: "",
      publicKey: kp.publicKey,
      encryptedPrivateKey: kp.encryptedPrivateKey,
      algorithm: kp.algorithm,
      active: true,
      createdAt: "",
    },
  ];
}

/** Retorna a chave privada local (já decifrada). Null se não existe. */
export async function getLocalPrivateKey(): Promise<string | null> {
  return readLocal(PRIVATE_KEY_ID);
}

/** Retorna a chave pública local. Null se não existe. */
export async function getLocalPublicKey(): Promise<string | null> {
  return readLocal(PUBLIC_KEY_ID);
}

/**
 * Todas as privadas disponíveis neste aparelho: a principal primeiro, depois as antigas do
 * histórico local. Uma mensagem recebida na época de um par anterior só abre com a privada
 * daquele par — decifrar olhando só para a principal era deixar texto legível para trás.
 */
export async function getAllPrivateKeys(): Promise<string[]> {
  const primary = await readLocal(PRIVATE_KEY_ID);
  const oldKeys: string[] = [];
  for (const publicKey of await readHistoryIndex()) {
    const stored = await readLocal(historyKeyId(publicKey));
    if (stored && stored !== primary) oldKeys.push(stored);
  }
  return primary ? [primary, ...oldKeys] : oldKeys;
}

/** Verifica se o E2E está configurado localmente. */
export async function hasLocalKeys(): Promise<boolean> {
  const pk = await readLocal(PRIVATE_KEY_ID);
  return pk !== null;
}

/**
 * Verifica se o E2E esta pronto de verdade: chaves locais E keypair no servidor E a publica
 * local igual à ativa. Cobre o caso de chave local orfã (IndexedDB sobreviveu mas o servidor
 * nao tem o keypair) e o de chave velha (o servidor tem par mais novo, então a privada local
 * não abre as mensagens novas, que chegam cifradas para a pública atual) — sem a comparação
 * o gate achava que tava tudo certo com uma chave que já não é a da conta.
 */
export async function isE2eReady(): Promise<boolean> {
  const localPublicKey = await readLocal(PUBLIC_KEY_ID);
  if (!localPublicKey || !(await hasLocalKeys())) return false;
  try {
    const serverKeypair = await e2eApi.myKeypair();
    return serverKeypair.publicKey === localPublicKey;
  } catch {
    return false;
  }
}

/** Retorna true se o servidor tem keypair ativo pra este usuario. */
export async function serverHasKeypair(): Promise<boolean> {
  try {
    await e2eApi.myKeypair();
    return true;
  } catch {
    return false;
  }
}

/**
 * Sincroniza as chaves locais com o servidor: se a chave publica local difere da ativa no
 * servidor, restaura do backup. Chamado no login com a senha disponivel — garante que todos
 * os devices compartilhem o mesmo keypair sem forcar o usuario a configurar de novo.
 *
 * NUNCA gera keypair novo se o servidor ja tem um: se a restauracao falha com o servidor
 * tendo keypair, a senha esta errada e gerar novo destruiria as conversation keys antigas.
 */
export async function syncKeysOnLogin(password: string): Promise<void> {
  let serverKeypair: Awaited<ReturnType<typeof e2eApi.myKeypair>> | null = null;
  try {
    serverKeypair = await e2eApi.myKeypair();
  } catch {
    // 404: servidor sem keypair.
  }

  if (serverKeypair) {
    const localPub = await getLocalPublicKey();
    if (localPub === serverKeypair.publicKey) return;
    // Restaura do servidor. Se falhar (senha errada), NAO gera novo.
    await restoreFromBackup(password);
    return;
  }

  // Servidor sem keypair: primeiro setup.
  await generateAndUpload(password);
}

/** Re-cifra a chave privada com nova senha e re-upload (pra troca de senha). */
export async function reEncryptAndUpload(newPassword: string): Promise<void> {
  const privateKeyBase64 = await readLocal(PRIVATE_KEY_ID);
  const publicKeyBase64 = await readLocal(PUBLIC_KEY_ID);
  if (!privateKeyBase64 || !publicKeyBase64) {
    throw new Error("Chaves E2E não encontradas localmente.");
  }
  const encryptedPrivateKey = await encryptPrivateKey(privateKeyBase64, newPassword);
  await e2eApi.uploadKeypair(publicKeyBase64, encryptedPrivateKey, "RSA-OAEP");
}

/** Limpa chaves locais (logout). */
export async function clearLocalKeys(): Promise<void> {
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
