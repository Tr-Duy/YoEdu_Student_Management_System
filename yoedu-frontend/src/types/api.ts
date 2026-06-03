export type UserRole = 'ADMIN' | 'ACADEMIC_STAFF' | 'CASHIER' | 'PARENT';

export interface CurrentUser {
  id: number;
  username: string;
  fullname: string;
  role: UserRole;
  parentId: number | null;
  teacherId: number | null;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string; // ISO string
  refeshExpiresAt: string; // ISO string
  user: CurrentUser;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface LoginResponse extends ApiResponse<AuthResponse> {}
export interface CurrentUserResponse extends ApiResponse<CurrentUser> {}
export interface VoidResponse extends ApiResponse<null> {}
