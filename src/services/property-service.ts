import { apiService } from './api';
import { API_ENDPOINTS } from '@/constants/api';
import { Property, CreatePropertyRequest, UpdatePropertyRequest, PropertyFilters, PriceHistoryEntry, PropertyStatus, PropertyType } from '@/types';

// Status'a göre sıralama önceliği belirleme fonksiyonu
const getStatusPriority = (status: any): number => {
  const stringStatus = convertNumericStatusToString(status);
  switch (stringStatus) {
    case 'Rezerv': return 1;
    case 'Satılık': return 2;
    case 'Kiralık': return 3;
    case 'SatılıkKiralık': return 4;
    case 'Satıldı': return 5;
    case 'Kiralandı': return 6;
    default: return 7;
  }
};

// Backend'den gelen sayısal enum değerlerini string'e çeviren fonksiyon
const convertNumericStatusToString = (status: any): PropertyStatus => {
  if (typeof status === 'string') {
    return status as PropertyStatus;
  }
  
  // Sayısal değerleri string'e çevir
  switch (Number(status)) {
    case 0: return 'Satılık';
    case 1: return 'Kiralık';  
    case 2: return 'SatılıkKiralık';
    case 3: return 'Rezerv';
    case 4: return 'Satıldı';
    case 5: return 'Kiralandı';
    default: return 'Satılık'; // Varsayılan değer
  }
};

// Frontend'den backend'e gönderilecek status'u sayısal enum'a çeviren fonksiyon
const convertStatusToBackendFormat = (status: PropertyStatus): number => {
  switch (status) {
    case 'Satılık': return 0;
    case 'Kiralık': return 1;
    case 'SatılıkKiralık': return 2;
    case 'Rezerv': return 3;
    case 'Satıldı': return 4;
    case 'Kiralandı': return 5;
    default: return 0; // Varsayılan değer
  }
};

// Frontend property data'sını backend'in beklediği format'a çevir
const convertPropertyToBackendFormat = (propertyData: CreatePropertyRequest | UpdatePropertyRequest): any => {
  return {
    // Ana alanlar camelCase olarak kalır (backend örneklerine göre)
    title: propertyData.title,
    propertyType: propertyData.propertyType,
    provinceId: propertyData.provinceId,
    districtId: propertyData.districtId,
    neighborhoodId: propertyData.neighborhoodId,
    intermediaryFullName: propertyData.intermediaryFullName,
    intermediaryPhone: propertyData.intermediaryPhone,
    status: convertStatusToBackendFormat(propertyData.status),
    notes: propertyData.notes,
    customerId: propertyData.customerId,
    typeSpecificProperties: propertyData.typeSpecificProperties, // Zaten PascalCase
    // Update request için id varsa ekle
    ...('id' in propertyData ? { id: propertyData.id } : {})
  };
};

export class PropertyService {
  async getProperties(): Promise<Property[]> {
    try {
      console.log('Making request to:', API_ENDPOINTS.PROPERTIES);
      
      // Debug auth token
      const token = localStorage.getItem('auth_token');
      console.log('🔑 Auth token exists:', !!token);
      console.log('🔑 Token length:', token?.length || 0);
      console.log('🔑 Token prefix:', token ? token.substring(0, 20) + '...' : 'N/A');
      
      // Explicitly create a config object to avoid any automatic serialization of query params
      const config = {
        headers: {
          'Content-Type': 'application/json'
        },
        // Explicitly set params to empty to avoid any automatic serialization
        params: {}
      };
      
      const response = await apiService.get<any>(API_ENDPOINTS.PROPERTIES, config);
      console.log('Properties API Response:', response);
      console.log('Response type:', typeof response);
      
      // Backend'ten dönen format: { success: true, data: [...] }
      if (response && response.success && Array.isArray(response.data)) {
        console.log('Found success response with data array');
        // Status değerlerini string'e çevir
        const properties = response.data.map((property: any) => ({
          ...property,
          status: convertNumericStatusToString(property.status)
        }));
        return properties;
      }
      
      // Eğer direkt array dönerse
      if (Array.isArray(response)) {
        console.log('Direct array response');
        // Status değerlerini string'e çevir
        const properties = response.map((property: any) => ({
          ...property,
          status: convertNumericStatusToString(property.status)
        }));
        return properties;
      }
      
      // Check if response has a data property
      if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
        console.log('Found data property, using response.data');
        // Status değerlerini string'e çevir
        const properties = (response as any).data.map((property: any) => ({
          ...property,
          status: convertNumericStatusToString(property.status)
        }));
        return properties;
      }
      
      console.warn('Returning empty array due to invalid response format');
      return [];
    } catch (error: any) {
      console.error('🚨 Property API Error:', error);
      console.error('🚨 Error Message:', error.message);
      console.error('🚨 Error Status:', error.response?.status);
      console.error('🚨 Error Status Text:', error.response?.statusText);
      console.error('🚨 Error Response Data:', error.response?.data);
      console.error('🚨 Error Response Data Stringified:', JSON.stringify(error.response?.data, null, 2));
      console.error('🚨 Error Response Headers:', error.response?.headers);
      console.error('🚨 Error Config URL:', error.config?.url);
      console.error('🚨 Error Config Method:', error.config?.method);
      console.error('🚨 Error Config Headers:', error.config?.headers);
      console.error('🚨 Full Error Object:', JSON.stringify(error, null, 2));
      
      // Return empty array instead of throwing to prevent app crash
      if (error.response?.status === 404) {
        console.warn('Property endpoint not found, returning empty array');
        return [];
      }
      
      if (error.response?.status === 400) {
        console.error('🚨 400 Bad Request - Possible causes:');
        console.error('   - Invalid query parameters');
        console.error('   - Enum mismatch between frontend and backend');
        console.error('   - Missing required headers');
        console.error('   - Invalid request format');
        
        // Log specific error for HasShareholder issue
        if (error.response?.data && error.response.data.includes('HasShareholder')) {
          console.error('🚨 HasShareholder field error detected. This is likely due to the backend not supporting this field in GET requests yet.');
        }
      }
      
      // For other errors, still return empty array to prevent crash
      console.warn('Returning empty array due to API error');
      return [];
    }
  }

  // Client-side filtering function
  filterProperties(
    properties: Property[], 
    filters?: PropertyFilters, 
    customers?: Array<{id: number, fullName: string}>
  ): { data: Property[], total: number, totalPages: number } {
    if (!properties.length) return { data: [], total: 0, totalPages: 0 };

    let filteredProperties = properties;

    if (filters) {
      filteredProperties = properties.filter(property => {
        // Search filter - search in title, intermediary name, notes, customer name
        if (filters.search) {
          const searchLower = filters.search.toLowerCase().trim();
          if (searchLower) {
            const matchesTitle = property.title.toLowerCase().includes(searchLower);
            const matchesIntermediary = property.intermediaryFullName.toLowerCase().includes(searchLower);
            const matchesNotes = property.notes?.toLowerCase().includes(searchLower);
            
            // Search in customer name
            let matchesCustomer = false;
            if (customers) {
              const customer = customers.find(c => c.id === property.customerId);
              if (customer) {
                matchesCustomer = customer.fullName.toLowerCase().includes(searchLower);
              }
            }
            
            if (!matchesTitle && !matchesIntermediary && !matchesNotes && !matchesCustomer) {
              return false;
            }
          }
        }

        // Property type filter
        if (filters.propertyType !== undefined && property.propertyType !== filters.propertyType) {
          return false;
        }

        // Status filter
        if (filters.status !== undefined) {
          const propertyStatus = convertNumericStatusToString(property.status);
          const filterStatus = convertNumericStatusToString(filters.status);
          if (propertyStatus !== filterStatus) {
            return false;
          }
        }

        // Location filters
        if (filters.provinceId !== undefined && property.provinceId !== filters.provinceId) {
          return false;
        }

        if (filters.districtId !== undefined && property.districtId !== filters.districtId) {
          return false;
        }

        if (filters.neighborhoodId !== undefined && property.neighborhoodId !== filters.neighborhoodId) {
          return false;
        }

        // Price filters (based on TotalPrice in typeSpecificProperties)
        const totalPrice = property.typeSpecificProperties?.TotalPrice;
        if (totalPrice) {
          if (filters.minPrice && totalPrice < filters.minPrice) {
            return false;
          }
          
          if (filters.maxPrice && totalPrice > filters.maxPrice) {
            return false;
          }
        }

        // HasShareholder filter for Field type properties
        if (filters.propertyType === PropertyType.Field && 
            filters.hasShareholder !== undefined && 
            property.typeSpecificProperties?.HasShareholder !== undefined) {
          // Only filter if both the filter value and property value are defined
          if (property.typeSpecificProperties.HasShareholder !== filters.hasShareholder) {
            return false;
          }
        }

        return true;
      });
    }

    // Status'a göre tüm filtrelenmiş veriyi sırala (sayfalama öncesi)
    const sortedProperties = filteredProperties.sort((a, b) => {
      const priorityA = getStatusPriority(a.status);
      const priorityB = getStatusPriority(b.status);
      return priorityA - priorityB;
    });

    const total = sortedProperties.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const totalPages = Math.ceil(total / limit);
    
    // Apply pagination to sorted data
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = sortedProperties.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total,
      totalPages
    };
  }

  async getPropertyById(id: number): Promise<Property> {
    const response = await apiService.get<Property>(
      API_ENDPOINTS.PROPERTY_BY_ID(id.toString())
    );
    return response;
  }

  async createProperty(propertyData: CreatePropertyRequest): Promise<Property> {
    // Property data'sını backend formatına çevir
    const backendData = convertPropertyToBackendFormat(propertyData);
    
    console.log('=== CREATE PROPERTY API CALL ===');
    console.log('Original property data:', JSON.stringify(propertyData, null, 2));
    console.log('Backend format data (direct):', JSON.stringify(backendData, null, 2));
    
    try {
      const response = await apiService.post<Property>(
        API_ENDPOINTS.PROPERTIES,
        backendData
      );
      console.log('✅ Create property success:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Create property API error:', error);
      console.error('Error response data:', error.response?.data);
      
      // Validation hatalarını logla
      if (error.response?.data?.errors) {
        console.error('🚨 CREATE VALIDATION ERRORS:');
        Object.entries(error.response.data.errors).forEach(([field, messages]: [string, any]) => {
          console.error(`   ${field}:`, messages);
        });
      }
      
      throw error;
    }
  }

  async updateProperty(propertyData: UpdatePropertyRequest): Promise<Property> {
    // Property data'sını backend formatına çevir
    const backendData = convertPropertyToBackendFormat(propertyData);
    
    console.log('=== UPDATE PROPERTY API CALL ===');
    console.log('Original property data:', JSON.stringify(propertyData, null, 2));
    console.log('Backend format data (direct):', JSON.stringify(backendData, null, 2));
    
    try {
      const response = await apiService.put<Property>(
        API_ENDPOINTS.PROPERTY_BY_ID(propertyData.id.toString()),
        backendData
      );
      console.log('✅ Update property success:', response);
      return response;
    } catch (error: any) {
      console.error('❌ Update property API error:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Validation hatalarını detaylı logla
      if (error.response?.data?.errors) {
        console.error('🚨 VALIDATION ERRORS:');
        Object.entries(error.response.data.errors).forEach(([field, messages]: [string, any]) => {
          console.error(`   ${field}:`, messages);
        });
      }
      
      throw error;
    }
  }

  async deleteProperty(id: number): Promise<void> {
    await apiService.delete(API_ENDPOINTS.PROPERTY_BY_ID(id.toString()));
  }

  async getPriceHistory(propertyId: number): Promise<PriceHistoryEntry[]> {
    try {
      console.log('Fetching price history for property:', propertyId);
      const response = await apiService.get<any>(API_ENDPOINTS.PROPERTY_PRICE_HISTORY(propertyId.toString()));
      console.log('Price history response:', response);
      
      // Backend'ten dönen format: { success: true, data: [...] } veya direkt array
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }
      
      if (Array.isArray(response)) {
        return response;
      }
      
      if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
        return (response as any).data;
      }
      
      console.warn('Invalid price history response format, returning empty array');
      return [];
    } catch (error: any) {
      console.error('Price history API Error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 404) {
        console.warn('Price history not found, returning empty array');
        return [];
      }
      
      console.warn('Returning empty array due to API error');
      return [];
    }
  }

  async updatePropertyStatus(propertyId: number, newStatus: PropertyStatus): Promise<Property> {
    try {
      console.log(`Updating property ${propertyId} status to ${newStatus}`);
      
      // Backend status update için özel endpoint varsa kullan, yoksa mevcut property'yi al ve status'unu değiştir
      const statusUpdateData = {
        status: convertStatusToBackendFormat(newStatus)
      };
      
      const response = await apiService.patch<Property>(
        `${API_ENDPOINTS.PROPERTY_BY_ID(propertyId.toString())}/status`,
        statusUpdateData
      );
      
      console.log('✅ Property status update success:', response);
      return response;
      
    } catch (error: any) {
      // Eğer özel status endpoint yoksa, property'nin tüm bilgilerini al ve status'unu güncelle
      console.log('Patch endpoint failed, trying full property update');
      
      try {
        const currentProperty = await this.getPropertyById(propertyId);
        const updateData: UpdatePropertyRequest = {
          id: propertyId,
          title: currentProperty.title,
          propertyType: currentProperty.propertyType,
          provinceId: currentProperty.provinceId,
          districtId: currentProperty.districtId,
          neighborhoodId: currentProperty.neighborhoodId,
          intermediaryFullName: currentProperty.intermediaryFullName,
          intermediaryPhone: currentProperty.intermediaryPhone,
          status: newStatus, // Sadece status'u değiştir
          notes: currentProperty.notes,
          customerId: currentProperty.customerId,
          typeSpecificProperties: currentProperty.typeSpecificProperties
        };
        
        return await this.updateProperty(updateData);
        
      } catch (updateError: any) {
        console.error('❌ Property status update failed:', updateError);
        throw updateError;
      }
    }
  }
}

export const propertyService = new PropertyService(); 