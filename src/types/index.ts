// Re-export all types
export * from './auth';
export * from './property';
export * from './location';

// PropertyStatus'u ayrıca export et
export type { PropertyStatus } from './property';

// Common types
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

export interface SelectOption {
  value: string;
  label: string;
}

// Customer types
export enum CustomerType {
  Alıcı = 0,
  Satıcı = 1,
  AlıcıSatıcı = 2,
}

export enum InterestType {
  // Arsa kategorisi
  Arsa = 0,
  SanayiArsası = 1,
  ÇiftlikArsası = 2,
  ArsadanHisse = 3,
  
  // Tarla kategorisi  
  Tarla = 4,
  Bağ = 5,
  Bahçe = 6,
  TarladanHisse = 7,
  
  // Daire kategorisi
  Daire = 8,
  KiralıkDaire = 9,
  
  // İşyeri kategorisi
  İşyeri = 10,
  Kiralıkİşyeri = 11,
  
  // Genel
  Tümü = 12
}

export interface ProvincePreference {
  provinceId: number;
  districtIds: number[];
}

export interface Customer {
  id: number;
  fullName: string;
  phone: string;
  budget: number;
  notes?: string;
  interestType: InterestType;
  customerType: CustomerType;
  provincePreferencesCount: number;
  createdAt: string;
}

export interface CreateCustomerRequest {
  fullName: string;
  phone: string;
  budget: number;
  notes?: string;
  interestType: InterestType;
  customerType: CustomerType;
  provincePreferences: ProvincePreference[];
}

export interface UpdateCustomerRequest extends CreateCustomerRequest {
  id: number;
}

// Sale types
export enum SaleStatus {
  Completed = 1,    // Tamamlandı
  Pending = 2,      // Beklemede
  Cancelled = 3,    // İptal Edildi
  Postponed = 4     // Ertelendi
}

export interface Sale {
  id: number;
  propertyId: number;
  propertyTitle?: string;
  propertyType?: string;
  buyerCustomerId: number;
  sellerCustomerName?: string;
  buyerCustomerName?: string;
  salePrice: number;
  commission: number;
  expenses: number;
  commissionRate: number;
  netProfit: number;
  saleDate: string;
  notes?: string;
  status: SaleStatus;
  statusText?: string;
  userName?: string;
  createdBy: string;
  createdAt: string;
  property?: {
    id: number;
    title: string;
    propertyType: number;
  };
  sellerCustomer?: {
    id: number;
    fullName: string;
    phone: string;
  };
  buyerCustomer?: {
    id: number;
    fullName: string;
    phone: string;
  };
}

export interface CreateSaleRequest {
  propertyId: number;
  buyerCustomerId: number;
  salePrice: number;  
  commission: number;
  expenses?: number;
  commissionRate: number;
  saleDate: string;
  notes?: string;
  status: SaleStatus;
}

export interface UpdateSaleRequest extends CreateSaleRequest {
  id: number;
}

export interface SaleStatistics {
  totalSales: number;
  totalRevenue: number;
  totalCommission: number;
  totalExpenses: number;
  totalNetProfit: number;
  averageSalePrice: number;
  salesThisMonth: number;
  revenueThisMonth: number;
}

export interface SaleFilters {
  search?: string;
  status?: SaleStatus;
  propertyType?: number;
  dateFrom?: string;
  dateTo?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
} 