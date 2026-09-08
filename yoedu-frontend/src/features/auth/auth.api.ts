import { api } from '../../lib/api';
import type { AuthResponse, CurrentUser } from '../../types/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // Post to /api/auth/login. Since our api interceptor unwraps, this directly returns AuthResponse
    return api.post('/api/auth/login', credentials);
  },

  me: async (): Promise<CurrentUser> => {
    // Get from /api/auth/me
    return api.get('/api/auth/me');
  },
  
  logout: async (refreshToken: string): Promise<void> => {
    return api.post('/api/auth/logout', { refreshToken });
  }
};
