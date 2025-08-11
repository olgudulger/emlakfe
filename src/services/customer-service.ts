import { apiService } from './api';
import { API_ENDPOINTS } from '@/constants/api';
import { Customer, CreateCustomerRequest, UpdateCustomerRequest, ApiResponse, PaginatedResponse } from '@/types';

export interface CustomerFilters {
  search?: string;
  customerType?: number;
  interestType?: number;
  minBudget?: number;
  maxBudget?: number;
  page?: number;
  limit?: number;
}

export class CustomerService {
  async getCustomers(): Promise<Customer[]> {
    try {
      console.log('Making request to:', API_ENDPOINTS.CUSTOMERS);
      const response = await apiService.get<any>(API_ENDPOINTS.CUSTOMERS);
      console.log('Customers API Response:', response);
      console.log('Response type:', typeof response);
      
      // Backend'ten dönen format: { success: true, data: [...] }
      if (response && response.success && Array.isArray(response.data)) {
        console.log('Found success response with data array');
        return response.data;
      }
      
      // Eğer direkt array dönerse
      if (Array.isArray(response)) {
        console.log('Direct array response');
        return response;
      }
      
      // Check if response has a data property
      if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
        console.log('Found data property, using response.data');
        return (response as any).data;
      }
      
      console.warn('Returning empty array due to invalid response format');
      return [];
    } catch (error: any) {
      console.error('Customer API Error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Return empty array instead of throwing to prevent app crash
      if (error.response?.status === 404) {
        console.warn('Customer endpoint not found, returning empty array');
        return [];
      }
      
      // For other errors, still return empty array to prevent crash
      console.warn('Returning empty array due to API error');
      return [];
    }
  }

  // Client-side filtering function
  filterCustomers(customers: Customer[], filters?: CustomerFilters, allProvinces?: any[], allDistricts?: any[], allNeighborhoods?: any[]): { data: Customer[], total: number, totalPages: number } {
    if (!customers.length) return { data: [], total: 0, totalPages: 0 };

    let filteredCustomers = customers;

    if (filters) {
      filteredCustomers = customers.filter(customer => {
        // Search filter - search in name, phone
        if (filters.search) {
          const searchLower = filters.search.toLowerCase().trim();
          if (searchLower) {
            const matchesName = customer.fullName.toLowerCase().includes(searchLower);
            const matchesPhone = customer.phone.includes(filters.search.trim());
            const matchesNotes = customer.notes?.toLowerCase().includes(searchLower);
            
            if (!matchesName && !matchesPhone && !matchesNotes) {
              return false;
            }
          }
        }

        // Customer type filter
        if (filters.customerType !== undefined && customer.customerType !== filters.customerType) {
          return false;
        }

        // Interest type filter
        if (filters.interestType !== undefined && customer.interestType !== filters.interestType) {
          return false;
        }

        // Budget filters
        if (filters.minBudget && customer.budget < filters.minBudget) {
          return false;
        }
        
        if (filters.maxBudget && customer.budget > filters.maxBudget) {
          return false;
        }

        return true;
      });
    }

    const total = filteredCustomers.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const totalPages = Math.ceil(total / limit);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredCustomers.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total,
      totalPages
    };
  }

  async getCustomerById(id: number): Promise<Customer> {
    const response = await apiService.get<Customer>(
      API_ENDPOINTS.CUSTOMER_BY_ID(id.toString())
    );
    return response;
  }

  async createCustomer(customerData: CreateCustomerRequest): Promise<Customer> {
    const response = await apiService.post<Customer>(
      API_ENDPOINTS.CUSTOMERS,
      customerData
    );
    return response;
  }

  async updateCustomer(customerData: UpdateCustomerRequest): Promise<Customer> {
    const response = await apiService.put<Customer>(
      API_ENDPOINTS.CUSTOMER_BY_ID(customerData.id.toString()),
      customerData
    );
    return response;
  }

  async deleteCustomer(id: number): Promise<void> {
    await apiService.delete(API_ENDPOINTS.CUSTOMER_BY_ID(id.toString()));
  }
}

export const customerService = new CustomerService(); 