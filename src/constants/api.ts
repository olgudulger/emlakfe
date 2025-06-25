export const API_BASE_URL = 'https://emlakapi.onrender.com/api';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/Auth/login',
  LOGOUT: '/Auth/logout',
  REGISTER: '/auth/register',
  REFRESH_TOKEN: '/Auth/refresh-token',
  CHANGE_PASSWORD: '/auth/change-password',
  
  // Customers
  CUSTOMERS: '/Customer',
  CUSTOMER_BY_ID: (id: string) => `/Customer/${id}`,
  
  // Properties
  PROPERTIES: '/Property',
  PROPERTY_BY_ID: (id: string) => `/Property/${id}`,
  PROPERTY_IMAGES: (id: string) => `/properties/${id}/images`,
  PROPERTY_PRICE_HISTORY: (id: string) => `/Property/${id}/price-history`,
  
  // Locations
  PROVINCES: '/Province',
  PROVINCE_BY_ID: (id: string) => `/Province/${id}`,
  DISTRICTS: '/District',
  DISTRICTS_BY_PROVINCE: (provinceId: number) => `/District?provinceId=${provinceId}`,
  DISTRICT_BY_ID: (id: string) => `/District/${id}`,
  NEIGHBORHOODS: '/Neighborhood',
  NEIGHBORHOODS_BY_DISTRICT: (districtId: number) => `/Neighborhood?districtId=${districtId}`,
  NEIGHBORHOOD_BY_ID: (id: string) => `/Neighborhood/${id}`,

  // Sales
  SALES: '/sale',
  SALE_BY_ID: (id: string) => `/sale/${id}`,
  SALE_BY_PROPERTY: (propertyId: string) => `/sale/property/${propertyId}`,
  SALE_BY_BUYER: (customerId: string) => `/sale/buyer-customer/${customerId}`,
  MY_SALES: '/sale/my-sales',
  SALES_DATE_RANGE: '/sale/date-range',
  SALES_BY_STATUS: (status: string) => `/sale/status/${status}`,
  RECENT_SALES: '/sale/recent',
  SALE_STATISTICS: '/sale/statistics',
  MY_SALE_STATISTICS: '/sale/my-statistics', 
  MY_SALE_PROFIT: '/sale/my-profit',
  CALCULATE_COMMISSION: '/sale/calculate-commission',
  CAN_SELL_PROPERTY: (propertyId: string) => `/sale/can-sell/${propertyId}`,

  // User Management (Admin)
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_BY_ID: (id: string) => `/admin/users/${id}`,
  ADMIN_USER_CHANGE_PASSWORD: (id: string) => `/admin/users/${id}/password`,
  ADMIN_USER_CHANGE_ROLE: (id: string) => `/admin/users/${id}/role`,
  ADMIN_USER_TOGGLE_LOCK: (id: string) => `/admin/users/${id}/lock`,
  
  // User Activity
  ONLINE_USERS: '/UserActivity/online-users',
} as const;

export const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  TOKEN_EXPIRES_AT: 'auth_token_expires_at',
  USER: 'auth_user',
  THEME: 'theme_preference',
} as const; 