import { apiService } from './api';
import { API_ENDPOINTS } from '@/constants/api';
import { 
  LocationProvince, 
  LocationDistrict, 
  LocationNeighborhood,
  CreateProvinceRequest,
  UpdateProvinceRequest,
  CreateDistrictRequest,
  UpdateDistrictRequest,
  CreateNeighborhoodRequest,
  UpdateNeighborhoodRequest
} from '@/types';

export class LocationService {
  // Province methods
  async getProvinces(): Promise<LocationProvince[]> {
    try {
      const response = await apiService.get<any>(API_ENDPOINTS.PROVINCES);
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get provinces error:', error);
      return [];
    }
  }

  async getProvinceById(id: number): Promise<LocationProvince | null> {
    try {
      const response = await apiService.get<any>(API_ENDPOINTS.PROVINCE_BY_ID(id.toString()));
      if (response && response.success) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('Get province by id error:', error);
      return null;
    }
  }

  async createProvince(data: CreateProvinceRequest): Promise<LocationProvince> {
    const response = await apiService.post<any>(API_ENDPOINTS.PROVINCES, data);
    return response.data;
  }

  async updateProvince(data: UpdateProvinceRequest): Promise<LocationProvince> {
    const response = await apiService.put<any>(API_ENDPOINTS.PROVINCE_BY_ID(data.id.toString()), data);
    return response.data;
  }

  async deleteProvince(id: number): Promise<void> {
    await apiService.delete(API_ENDPOINTS.PROVINCE_BY_ID(id.toString()));
  }

  // District methods
  async getDistrictsByProvince(provinceId: number): Promise<LocationDistrict[]> {
    try {
      const response = await apiService.get<any>(API_ENDPOINTS.DISTRICTS_BY_PROVINCE(provinceId));
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get districts error:', error);
      return [];
    }
  }

  async getAllDistricts(): Promise<LocationDistrict[]> {
    try {
      const response = await apiService.get<any>(API_ENDPOINTS.DISTRICTS);
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get all districts error:', error);
      return [];
    }
  }

  async createDistrict(data: CreateDistrictRequest): Promise<LocationDistrict> {
    const response = await apiService.post<any>(API_ENDPOINTS.DISTRICTS, data);
    return response.data;
  }

  async updateDistrict(data: UpdateDistrictRequest): Promise<LocationDistrict> {
    const response = await apiService.put<any>(API_ENDPOINTS.DISTRICT_BY_ID(data.id.toString()), data);
    return response.data;
  }

  async deleteDistrict(id: number): Promise<void> {
    await apiService.delete(API_ENDPOINTS.DISTRICT_BY_ID(id.toString()));
  }

  // Neighborhood methods
  async getNeighborhoodsByDistrict(districtId: number): Promise<LocationNeighborhood[]> {
    try {
      const response = await apiService.get<any>(API_ENDPOINTS.NEIGHBORHOODS_BY_DISTRICT(districtId));
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get neighborhoods error:', error);
      return [];
    }
  }

  async getAllNeighborhoods(): Promise<LocationNeighborhood[]> {
    try {
      const response = await apiService.get<any>(API_ENDPOINTS.NEIGHBORHOODS);
      if (response && response.success && Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Get all neighborhoods error:', error);
      return [];
    }
  }

  async createNeighborhood(data: CreateNeighborhoodRequest): Promise<LocationNeighborhood> {
    const response = await apiService.post<any>(API_ENDPOINTS.NEIGHBORHOODS, data);
    return response.data;
  }

  async updateNeighborhood(data: UpdateNeighborhoodRequest): Promise<LocationNeighborhood> {
    const response = await apiService.put<any>(API_ENDPOINTS.NEIGHBORHOOD_BY_ID(data.id.toString()), data);
    return response.data;
  }

  async deleteNeighborhood(id: number): Promise<void> {
    await apiService.delete(API_ENDPOINTS.NEIGHBORHOOD_BY_ID(id.toString()));
  }
}

export const locationService = new LocationService(); 