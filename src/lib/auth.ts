import { NextRequest } from 'next/server';

const TOKEN_SECRET = 'cl-wms-secret-key-2024';

// ==================== Password Hashing (SHA-256 with salt) ====================

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function generateSalt(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = generateSalt(32);
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = bufferToHex(hashBuffer);
  return `${salt}:${hash}`;
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, expectedHash] = storedHash.split(':');
  if (!salt || !expectedHash) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hash = bufferToHex(hashBuffer);
  return hash === expectedHash;
}

// ==================== Token Management (SHA-256 signed) ====================

function base64urlEncode(data: string): string {
  return btoa(data).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64urlDecode(data: string): string {
  let base64 = data.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return atob(base64);
}

export async function generateToken(payload: object): Promise<string> {
  const payloadWithExp = { ...payload, exp: Date.now() + 86400000 };
  const payloadStr = JSON.stringify(payloadWithExp);
  const payloadB64 = base64urlEncode(payloadStr);

  const encoder = new TextEncoder();
  const data = encoder.encode(payloadB64 + '.' + TOKEN_SECRET);
  const sigBuffer = await crypto.subtle.digest('SHA-256', data);
  const signature = bufferToHex(sigBuffer);

  return `${payloadB64}.${signature}`;
}

export async function verifyToken(token: string): Promise<object | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;

    // Re-compute signature
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadB64 + '.' + TOKEN_SECRET);
    const sigBuffer = await crypto.subtle.digest('SHA-256', data);
    const expectedSig = bufferToHex(sigBuffer);

    if (signature !== expectedSig) return null;

    const payloadStr = base64urlDecode(payloadB64);
    const payload = JSON.parse(payloadStr);

    // Check expiry
    if (payload.exp && Date.now() > payload.exp) return null;

    return payload;
  } catch {
    return null;
  }
}

// ==================== Auth User from Request ====================

export async function getAuthUser(request: NextRequest): Promise<object | null> {
  const token = request.cookies.get('token')?.value;
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  return payload;
}
