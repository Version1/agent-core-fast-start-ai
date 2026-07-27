import type { AuthUser } from '@/types';

const SESSION_KEY = 'faststart_user';

export type { AuthUser };

export function getCurrentUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.id !== 'string' || !parsed.id) return null;
    const VALID_ROLES = ['ADMIN', 'CASEWORKER', 'MANAGER'];
    return {
      id: parsed.id,
      email: typeof parsed.email === 'string' ? parsed.email : '',
      name: typeof parsed.name === 'string' && parsed.name ? parsed.name : (parsed.email || 'User'),
      role: VALID_ROLES.includes(parsed.role) ? parsed.role : 'CASEWORKER',
    };
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const cognitoKeys = Object.keys(localStorage).filter(k =>
      k.includes('CognitoIdentityServiceProvider') && k.endsWith('.accessToken')
    );
    if (cognitoKeys.length > 0) {
      return localStorage.getItem(cognitoKeys[0]);
    }
    const token = localStorage.getItem('faststart_access_token');
    return token;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('faststart_access_token', token);
}

export async function signOut(): Promise<void> {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('faststart_access_token');

  const { buildLogoutUrl } = await import('./cognito');
  const logoutUrl = buildLogoutUrl();

  if (logoutUrl && logoutUrl.includes('.amazoncognito.com')) {
    window.location.href = logoutUrl;
  } else {
    window.location.href = '/login';
  }
}
