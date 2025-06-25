export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  isSuccess: boolean;
  message: string;
  token: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  roles?: string[];
  firstName?: string;
  lastName?: string;
  createdAt?: string;
  isActive?: boolean;
  lastLoginAt?: string;
  lastActivityAt?: string;
  lastLoginIp?: string;
  isOnline?: boolean;
  emailConfirmed?: boolean;
  lockoutEnabled?: boolean;
  lockoutEnd?: string | null;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// User Management Types
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface UpdateUserRequest {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
}

export interface ChangePasswordRequest {
  id: string;
  newPassword: string;
}

export interface AdminChangePasswordRequest {
  userId: string;
  newPassword: string;
}

export interface OwnPasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserFilters {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
} 