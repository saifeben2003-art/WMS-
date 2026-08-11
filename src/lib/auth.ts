import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';

const TOKEN_SECRET = 'cl-wms-secret-key-2024';

// ==================== Password Hashing (bcryptjs) ====================
// bcrypt is the industry standard for password hashing.
// It uses Blowfish cipher with a cost factor (work factor) that makes it
// computationally expensive and resistant to brute-force / GPU attacks.
// saltRounds=12 means ~4096 iterations — recommended minimum for 2024+.

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  // bcryptjs.genSalt internally generates a cryptographically secure
  // random 128-bit salt and embeds it into the resulting hash string.
  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  return hash; // Format: $2a$12$<22-char-salt><31-char-hash>
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, storedHash);
  } catch {
    return false;
  }
}

// ==================== Token Management (SHA-256 HMAC-style signed) ====================

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
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const signature = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${payloadB64}.${signature}`;
}

export async function verifyToken(token: string): Promise<object | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;

    const encoder = new TextEncoder();
    const data = encoder.encode(payloadB64 + '.' + TOKEN_SECRET);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const expectedSig = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

    if (signature !== expectedSig) return null;

    const payloadStr = base64urlDecode(payloadB64);
    const payload = JSON.parse(payloadStr);

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
