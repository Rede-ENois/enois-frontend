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
 *    - Baixa keypair do backend
 *    - Decifra chave privada com a senha
 *    - Armazena localmente
 *
 * 3. Troca de senha: reEncryptAndUpload(oldPassword, newPassword)
 *    - Decifra com senha antiga, re-cifra com nova, re-upload
 */
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

/** Gera keypair, cifra privada com senha, faz upload, armazena localmente. */
export async function generateAndUpload(password: string): Promise<void> {
  const keypair = await generateKeypair();
  const publicKeyBase64 = await exportPublicKey(keypair.publicKey);
  const privateKeyBase64 = await exportPrivateKey(keypair.privateKey);
  const encryptedPrivateKey = await encryptPrivateKey(privateKeyBase64, password);

  await e2eApi.uploadKeypair(publicKeyBase64, encryptedPrivateKey, "RSA-OAEP");

  await storeLocal(PRIVATE_KEY_ID, privateKeyBase64);
  await storeLocal(PUBLIC_KEY_ID, publicKeyBase64);
}

/** Baixa keypair do backend e decifra a privada com a senha. */
export async function restoreFromBackup(password: string): Promise<void> {
  const kp = await e2eApi.myKeypair();
  const privateKeyBase64 = await decryptPrivateKey(kp.encryptedPrivateKey, password);

  // Valida que a chave decifrada é importável (senha correta).
  await importPrivateKey(privateKeyBase64);

  await storeLocal(PRIVATE_KEY_ID, privateKeyBase64);
  await storeLocal(PUBLIC_KEY_ID, kp.publicKey);
}

/** Retorna a chave privada local (já decifrada). Null se não existe. */
export async function getLocalPrivateKey(): Promise<string | null> {
  return readLocal(PRIVATE_KEY_ID);
}

/** Retorna a chave pública local. Null se não existe. */
export async function getLocalPublicKey(): Promise<string | null> {
  return readLocal(PUBLIC_KEY_ID);
}

/** Verifica se o E2E está configurado localmente. */
export async function hasLocalKeys(): Promise<boolean> {
  const pk = await readLocal(PRIVATE_KEY_ID);
  return pk !== null;
}

/**
 * Sincroniza as chaves locais com o servidor: se a chave publica local difere da ativa no
 * servidor, restaura do backup. Chamado no login com a senha disponivel — garante que todos
 * os devices compartilhem o mesmo keypair sem forcar o usuario a configurar de novo.
 */
export async function syncKeysOnLogin(password: string): Promise<void> {
  try {
    const serverKeypair = await e2eApi.myKeypair();
    const localPub = await getLocalPublicKey();

    if (localPub === serverKeypair.publicKey) return; // já sincronizado

    // Chave diferente ou ausente: restaura do servidor com a senha do login.
    await restoreFromBackup(password);
  } catch {
    // Servidor sem keypair (primeiro setup): gera.
    if (!(await hasLocalKeys())) {
      await generateAndUpload(password);
    }
  }
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
