import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'banned';
  storage_used: number;
  warning_count: number;
  created_at: string;
}

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  accessToken: Cookies.get('accessToken') || null,
  isAuthenticated: !!Cookies.get('accessToken'),
  isLoading: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (token) => {
    if (token) {
      Cookies.set('accessToken', token, { secure: true, sameSite: 'Strict' });
      set({ accessToken: token, isAuthenticated: true });
    } else {
      Cookies.remove('accessToken');
      set({ accessToken: null, isAuthenticated: false });
    }
  },
  setLoading: (loading) => set({ isLoading: loading }),
  logout: () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    set({ user: null, accessToken: null, isAuthenticated: false });
  },
}));
