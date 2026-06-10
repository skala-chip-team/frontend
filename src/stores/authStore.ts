import { create } from 'zustand';

export const AUTH_TOKEN_KEY = 'auth.accessToken';
const AUTH_USER_KEY = 'auth.user';

export interface AuthUser {
  username: string;
  role: string;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
}

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

const initialToken = localStorage.getItem(AUTH_TOKEN_KEY);

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialToken,
  user: loadUser(),
  isAuthenticated: Boolean(initialToken),
  setAuth: (token, user) => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    set({ accessToken: token, user, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    set({ accessToken: null, user: null, isAuthenticated: false });
  },
}));
