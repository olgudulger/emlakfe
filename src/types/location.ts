export interface Location {
  id: string;
  city: string;
  district: string;
  neighborhood: string;
  postalCode?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface City {
  id: string;
  name: string;
  districts: District[];
}

export interface District {
  id: string;
  name: string;
  cityId: string;
  neighborhoods: Neighborhood[];
}

export interface Neighborhood {
  id: string;
  name: string;
  districtId: string;
  postalCode?: string;
}

// Location Types
export interface LocationProvince {
  id: number;
  name: string;
  districts: LocationDistrict[];
  createdAt: string;
  updatedAt: string | null;
}

export interface LocationDistrict {
  id: number;
  name: string;
  provinceId: number;
  province: LocationProvince | null;
  neighborhoods: LocationNeighborhood[];
  customerDistrictPreferences: any[];
  createdAt: string;
  updatedAt: string | null;
}

export interface LocationNeighborhood {
  id: number;
  name: string;
  districtId: number;
  district: LocationDistrict | null;
  properties: any[];
  createdAt: string;
  updatedAt: string | null;
}

// Create/Update Request Types
export interface CreateProvinceRequest {
  name: string;
}

export interface UpdateProvinceRequest extends CreateProvinceRequest {
  id: number;
}

export interface CreateDistrictRequest {
  name: string;
  provinceId: number;
}

export interface UpdateDistrictRequest extends CreateDistrictRequest {
  id: number;
}

export interface CreateNeighborhoodRequest {
  name: string;
  districtId: number;
}

export interface UpdateNeighborhoodRequest extends CreateNeighborhoodRequest {
  id: number;
} 