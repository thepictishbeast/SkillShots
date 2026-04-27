import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import type { AuthTokens, SignupDto, LoginDto, Challenge } from '@skill-shots/shared-types';

// SECURITY: tokens stored via expo-secure-store (Keychain on iOS, Keystore on
// Android), NEVER AsyncStorage. AsyncStorage is plain text on disk.
const ACCESS_KEY = 'skillshots.access';
const REFRESH_KEY = 'skillshots.refresh';

const baseUrl = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl
  ?? 'http://localhost:4000';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly details: unknown,
  ) {
    super(`api ${status} ${code}`);
  }
}

async function request<T>(
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
  path: string,
  body?: unknown,
  authed = false,
): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (authed) {
    const access = await SecureStore.getItemAsync(ACCESS_KEY);
    if (access) headers['authorization'] = `Bearer ${access}`;
  }
  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : null,
  });
  const text = await res.text();
  const parsed = text ? safeJson(text) : null;
  if (!res.ok) {
    const err = parsed as { error?: string } | null;
    throw new ApiError(res.status, err?.error ?? `http_${res.status}`, parsed);
  }
  return parsed as T;
}

function safeJson(s: string): unknown {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export const api = {
  async signup(dto: SignupDto): Promise<AuthTokens> {
    const tokens = await request<AuthTokens>('POST', '/auth/signup', dto, false);
    await persistTokens(tokens);
    return tokens;
  },
  async login(dto: LoginDto): Promise<AuthTokens> {
    const tokens = await request<AuthTokens>('POST', '/auth/login', dto, false);
    await persistTokens(tokens);
    return tokens;
  },
  async logout(): Promise<void> {
    const refresh = await SecureStore.getItemAsync(REFRESH_KEY);
    if (refresh) {
      try {
        await request('POST', '/auth/logout', { refreshToken: refresh }, true);
      } catch {
        // Logout failures are best-effort.
      }
    }
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
  listChallenges(): Promise<{ items: Challenge[]; nextCursor: string | null }> {
    return request('GET', '/challenges', undefined, false);
  },
  getChallenge(id: string): Promise<Challenge> {
    return request('GET', `/challenges/${id}`, undefined, false);
  },
};

async function persistTokens(t: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_KEY, t.accessToken);
  await SecureStore.setItemAsync(REFRESH_KEY, t.refreshToken);
}

export { ApiError };
