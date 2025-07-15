'use server';

import { scrypt, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

// Use a fixed salt for key derivation. A unique IV per encryption is sufficient for security.
const SALT = process.env.ENCRYPTION_SALT || 'a-secure-static-salt-for-everyone';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

// Derive a key from the master key in environment variables.
async function getKey() {
  const masterKey = process.env.ENCRYPTION_KEY;
  if (!masterKey) {
    throw new Error('ENCRYPTION_KEY environment variable is not set.');
  }
  return (await scryptAsync(masterKey, SALT, KEY_LENGTH)) as Buffer;
}

/**
 * Encrypts a plaintext string (e.g., an API key).
 * @param text The plaintext to encrypt.
 * @returns A promise that resolves to the encrypted string, formatted as "iv:authtag:ciphertext".
 */
export async function encrypt(text: string): Promise<string> {
  const key = await getKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts an encrypted string.
 * @param encryptedText The encrypted string, formatted as "iv:authtag:ciphertext".
 * @returns A promise that resolves to the decrypted plaintext string.
 */
export async function decrypt(encryptedText: string): Promise<string> {
  const key = await getKey();
  const parts = encryptedText.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted text format.');
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString('utf8');
}