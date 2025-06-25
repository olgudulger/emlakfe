import { apiService } from './api';
import { API_ENDPOINTS } from '@/constants/api';
import { LoginRequest, LoginResponse, RegisterRequest, User, ApiResponse } from '@/types';

export class AuthService {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(
      API_ENDPOINTS.LOGIN,
      credentials
    );
    return response;
  }

  async logout(): Promise<void> {
    // Geçici olarak backend logout API çağrısını devre dışı bırakıyoruz
    // Backend logout endpoint'i 400 hatası döndürüyor
    console.log('Logout: Skipping backend API call due to endpoint issues');
    console.log('Logout: Proceeding with client-side logout only');
    
    /* Backend düzeltilene kadar kapalı
    try {
      console.log('Calling logout API...');
      await apiService.post<any>(API_ENDPOINTS.LOGOUT, {});
      console.log('Logout API call successful');
    } catch (error: any) {
      // Logout API call failed, but we still want to clear local state
      console.error('Logout API call failed:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });
      
      // Check if it's a 400 Bad Request (possibly method not allowed or endpoint issue)
      if (error.response?.status === 400) {
        console.warn('Backend logout endpoint returned 400 - continuing with client-side logout');
      } else if (error.response?.status === 404) {
        console.warn('Backend logout endpoint not found - continuing with client-side logout');
      } else if (error.response?.status === 405) {
        console.warn('Backend logout endpoint method not allowed - continuing with client-side logout');
      }
      
      // Don't throw error, continue with local logout regardless of backend response
      // This ensures the user can always logout from the frontend
    }
    */
  }

  async register(userData: RegisterRequest): Promise<User> {
    const response = await apiService.post<ApiResponse<User>>(
      API_ENDPOINTS.REGISTER,
      userData
    );
    return response.data;
  }

  async refreshToken(refreshToken: string): Promise<LoginResponse> {
    const response = await apiService.post<LoginResponse>(
      API_ENDPOINTS.REFRESH_TOKEN,
      { refreshToken }
    );
    return response;
  }
}

export const authService = new AuthService(); 