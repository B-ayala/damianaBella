import { create } from 'zustand';
import { getCurrentUser, loginUser, logoutUser } from '../services/userService';

// ─── Authentication store ────────────────────────────────────────────────────
//
// Antes vivía dentro de `admin/store/adminStore.ts`, lo que forzaba a
// componentes públicos (NavBar, AuthModal) a importar desde el árbol admin
// — leak nominal entre capas. Acá queda en `src/store/` (compartido).
//
// Semántica de los dos flags (intencionalmente distintos):
//
//   `currentUser`     → cualquier usuario autenticado (admin o user).
//   `isAuthenticated` → SOLO admin validado. Es el gate de AdminProtectedRoute.
//
// Esto permite que un usuario regular se loguee desde la home sin pisar el
// panel admin: tiene `currentUser` pero `isAuthenticated = false`.

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  authInitialized: boolean;
  currentUser: AuthUser | null;
  initializeAuth: () => Promise<void>;
  login: (email: string, pass: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  authInitialized: false,
  currentUser: null,
  initializeAuth: async () => {
    const user = await getCurrentUser();
    set({
      currentUser: user
        ? { id: user.id || '', name: user.name, email: user.email, role: user.role }
        : null,
      isAuthenticated: user?.role === 'admin',
      authInitialized: true,
    });
  },
  login: async (email, pass) => {
    const response = await loginUser({ email, password: pass });
    if (response.success && response.data) {
      const userData: AuthUser = {
        id: response.data.id || '',
        name: response.data.name,
        email: response.data.email,
        role: response.data.role,
      };

      if (response.data.role === 'admin') {
        set({ isAuthenticated: true, authInitialized: true, currentUser: userData });
        return true;
      }
      // Usuario regular: sesión válida pero sin acceso al panel.
      set({ currentUser: userData, authInitialized: true });
      return false;
    }
    return false;
  },
  logout: async () => {
    await logoutUser();
    set({ isAuthenticated: false, currentUser: null, authInitialized: true });
  },
}));
