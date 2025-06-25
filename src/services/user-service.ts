import { apiService } from './api';
import { API_ENDPOINTS } from '@/constants/api';
import { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  ChangePasswordRequest,
  UserFilters 
} from '@/types';

export class UserService {
  async getUsers(): Promise<User[]> {
    try {
      console.log('Making request to:', API_ENDPOINTS.ADMIN_USERS);
      const response = await apiService.get<any>(API_ENDPOINTS.ADMIN_USERS);
      console.log('Users API Response:', response);
      
      // Backend'ten dönen format: { success: true, data: [...] }
      if (response && response.success && Array.isArray(response.data)) {
        console.log('Found success response with data array');
        // Backend data'sını frontend formatına çevir
        const users = response.data.map((user: any) => ({
          ...user,
          // lockoutEnd doluysa pasif, boşsa aktif
          isActive: !user.lockoutEnd || user.lockoutEnd === null
        }));
        console.log('Processed users with isActive:', users);
        return users;
      }
      
      // Eğer direkt array dönerse
      if (Array.isArray(response)) {
        console.log('Direct array response');
        const users = response.map((user: any) => ({
          ...user,
          isActive: !user.lockoutEnd || user.lockoutEnd === null
        }));
        return users;
      }
      
      // Check if response has a data property
      if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
        console.log('Found data property, using response.data');
        const users = (response as any).data.map((user: any) => ({
          ...user,
          isActive: !user.lockoutEnd || user.lockoutEnd === null
        }));
        return users;
      }
      
      console.warn('Returning empty array due to invalid response format');
      return [];
    } catch (error: any) {
      console.error('Users API Error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Return empty array instead of throwing to prevent app crash
      if (error.response?.status === 404) {
        console.warn('Users endpoint not found, returning empty array');
        return [];
      }
      
      // For other errors, still return empty array to prevent crash
      console.warn('Returning empty array due to API error');
      return [];
    }
  }

  // Client-side filtering function
  filterUsers(
    users: User[], 
    filters?: UserFilters
  ): { data: User[], total: number, totalPages: number } {
    if (!users.length) return { data: [], total: 0, totalPages: 0 };

    let filteredUsers = users;

    if (filters) {
      filteredUsers = users.filter(user => {
        // Search filter - search in username, email
        if (filters.search) {
          const searchLower = filters.search.toLowerCase().trim();
          if (searchLower) {
            const matchesUsername = user.username.toLowerCase().includes(searchLower);
            const matchesEmail = user.email.toLowerCase().includes(searchLower);
            
            if (!matchesUsername && !matchesEmail) {
              return false;
            }
          }
        }

        // Role filter
        if (filters.role && user.role !== filters.role) {
          return false;
        }

        // Active status filter
        if (filters.isActive !== undefined && user.isActive !== filters.isActive) {
          return false;
        }

        return true;
      });
    }

    const total = filteredUsers.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const totalPages = Math.ceil(total / limit);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredUsers.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total,
      totalPages
    };
  }

  async getUserById(id: string): Promise<User> {
    const response = await apiService.get<any>(API_ENDPOINTS.ADMIN_USER_BY_ID(id));
    if (response && response.success) {
      return response.data;
    }
    return response;
  }

  async createUser(userData: CreateUserRequest): Promise<User> {
    console.log('Sending create user request:', userData);
    
    // Backend'in beklediği format: confirmPassword eklenmeli
    const createUserPayload = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      confirmPassword: userData.password, // Password ile aynı olacak
      role: userData.role
    };
    
    console.log('Create user payload:', createUserPayload);
    
    const response = await apiService.post<any>(API_ENDPOINTS.ADMIN_USERS, createUserPayload);
    
    console.log('Create user API response:', response);
    
    let responseData;
    if (response && response.success && response.data) {
      responseData = response.data;
    } else {
      responseData = response.data || response;
    }
    
    // Backend data'sını frontend formatına çevir
    const processedUser = {
      ...responseData,
      isActive: !responseData.lockoutEnd || responseData.lockoutEnd === null
    };
    
    console.log('Processed create response user:', processedUser);
    return processedUser;
  }

  async updateUser(userData: UpdateUserRequest): Promise<User> {
    // Backend expects only the fields to update, not the full object
    const updatePayload = {
      username: userData.username,
      email: userData.email,
      role: userData.role
    };
    
    console.log('Sending update user request:', { id: userData.id, payload: updatePayload });
    
    const response = await apiService.put<any>(
      API_ENDPOINTS.ADMIN_USER_BY_ID(userData.id),
      updatePayload
    );
    
    console.log('Update user API response:', response);
    
    let responseData;
    if (response && response.success && response.data) {
      responseData = response.data;
    } else {
      responseData = response.data || response;
    }
    
    // Backend data'sını frontend formatına çevir
    const processedUser = {
      ...responseData,
      isActive: !responseData.lockoutEnd || responseData.lockoutEnd === null
    };
    
    console.log('Processed update response user:', processedUser);
    return processedUser;
  }

  async changeUserPassword(id: string, newPassword: string): Promise<void> {
    console.log('Sending change password request:', { id, newPassword });
    
    // Backend'in beklediği doğru format: passwordChangeDto
    const passwordChangeDto = {
      newPassword: newPassword,
      confirmPassword: newPassword // Admin değiştirirken confirmation aynı olacak
    };
    
    console.log('Password change payload:', passwordChangeDto);
    
    const response = await apiService.put<any>(
      API_ENDPOINTS.ADMIN_USER_CHANGE_PASSWORD(id),
      passwordChangeDto,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Change password API response:', response);
  }

  async changeUserRole(id: string, role: string): Promise<User> {
    const response = await apiService.put<any>(
      API_ENDPOINTS.ADMIN_USER_CHANGE_ROLE(id),
      role,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data || response;
  }

  async toggleUserStatus(id: string, isLocked: boolean = true): Promise<User> {
    console.log('Sending toggle request:', { id, isLocked });
    
    const response = await apiService.put<any>(
      API_ENDPOINTS.ADMIN_USER_TOGGLE_LOCK(id),
      isLocked,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Toggle status API response:', response);
    
    let userData;
    if (response && response.success && response.data) {
      userData = response.data;
    } else {
      userData = response.data || response;
    }
    
    // Backend data'sını frontend formatına çevir
    const processedUser = {
      ...userData,
      isActive: !userData.lockoutEnd || userData.lockoutEnd === null
    };
    
    console.log('Processed toggle response user:', processedUser);
    return processedUser;
  }

  async deleteUser(id: string): Promise<void> {
    await apiService.delete(API_ENDPOINTS.ADMIN_USER_BY_ID(id));
  }

  // User's own password change
  async changeOwnPassword(data: ChangePasswordRequest): Promise<void> {
    await apiService.post<any>(
      API_ENDPOINTS.CHANGE_PASSWORD,
      { 
        currentPassword: data.newPassword, // API'ye göre düzenle
        newPassword: data.newPassword 
      }
    );
  }

  // Get online users
  async getOnlineUsers(): Promise<User[]> {
    try {
      console.log('Making request to:', API_ENDPOINTS.ONLINE_USERS);
      const response = await apiService.get<any>(API_ENDPOINTS.ONLINE_USERS);
      console.log('Online Users API Response:', response);
      
      // Backend'ten dönen format: { success: true, data: [...] }
      if (response && response.success && Array.isArray(response.data)) {
        console.log('Found online users success response');
        // Backend data'sını frontend formatına çevir
        const onlineUsers = response.data.map((user: any) => ({
          id: user.id,
          username: user.userName,
          email: user.email,
          role: user.role,
          lastLoginAt: user.lastLoginDate,
          lastActivityAt: user.lastActivityDate,
          lastLoginIp: user.lastLoginIp,
          isOnline: user.isOnline,
          isActive: true // Online users are always active
        }));
        console.log('Processed online users:', onlineUsers);
        return onlineUsers;
      }
      
      console.warn('Invalid online users response format');
      return [];
    } catch (error: any) {
      console.error('Online Users API Error:', error);
      return [];
    }
  }
}

export const userService = new UserService(); 