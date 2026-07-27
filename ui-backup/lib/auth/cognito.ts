const REGION = process.env.NEXT_PUBLIC_AWS_REGION || 'eu-west-2';
const CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID || '';
const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN || '';

const AUTH_BASE_URL = `https://${COGNITO_DOMAIN}.auth.${REGION}.amazoncognito.com`;

const PKCE_VERIFIER_KEY = 'faststart_pkce_verifier';

type AuthResult = {
  idToken: string;
  accessToken: string;
  refreshToken: string;
};

type CognitoTokenPayload = {
  sub: string;
  email?: string;
  name?: string;
  'cognito:groups'?: string[];
  'custom:role'?: string;
  [key: string]: unknown;
};

// ─── PKCE helpers ────────────────────────────────────────────────────────────

function generateRandomBytes(length: number): Uint8Array {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
}

function base64UrlEncode(bytes: Uint8Array): string {
  const binStr = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
  return btoa(binStr).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(plain: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash);
}

function generateCodeVerifier(): string {
  return base64UrlEncode(generateRandomBytes(32));
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const hashed = await sha256(verifier);
  return base64UrlEncode(hashed);
}

// ─── Hosted UI redirect ─────────────────────────────────────────────────────

function getCallbackUrl(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.origin}/api/auth/callback`;
}

export async function buildAuthorizeUrl(): Promise<string> {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  sessionStorage.setItem(PKCE_VERIFIER_KEY, codeVerifier);

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID,
    redirect_uri: getCallbackUrl(),
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${AUTH_BASE_URL}/oauth2/authorize?${params.toString()}`;
}

// ─── Token exchange ─────────────────────────────────────────────────────────

export async function exchangeCodeForTokens(code: string): Promise<AuthResult> {
  const codeVerifier = sessionStorage.getItem(PKCE_VERIFIER_KEY) || '';
  sessionStorage.removeItem(PKCE_VERIFIER_KEY);

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: CLIENT_ID,
    redirect_uri: getCallbackUrl(),
    code,
    code_verifier: codeVerifier,
  });

  const res = await fetch(`${AUTH_BASE_URL}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || 'Token exchange failed');
  }

  return {
    idToken: data.id_token,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
  };
}

// ─── Logout URL ─────────────────────────────────────────────────────────────

export function buildLogoutUrl(): string {
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    logout_uri: typeof window !== 'undefined' ? window.location.origin : '',
  });
  return `${AUTH_BASE_URL}/logout?${params.toString()}`;
}

// ─── JWT parsing ────────────────────────────────────────────────────────────

function decodeJwtPayload(token: string): CognitoTokenPayload {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

export function parseUserFromTokens(idToken: string): {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CASEWORKER' | 'MANAGER';
} {
  const payload = decodeJwtPayload(idToken);
  const groups = payload['cognito:groups'] ?? [];

  let role: 'ADMIN' | 'CASEWORKER' | 'MANAGER' = 'CASEWORKER';
  if (groups.includes('ADMIN')) role = 'ADMIN';
  else if (groups.includes('MANAGER')) role = 'MANAGER';
  else if (groups.includes('CASEWORKER')) role = 'CASEWORKER';

  return {
    id: payload.sub,
    email: payload.email ?? '',
    name: payload.name ?? payload.email ?? '',
    role,
  };
}
