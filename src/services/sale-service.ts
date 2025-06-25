import { apiService } from './api';
import { API_ENDPOINTS } from '@/constants/api';
import { Sale, CreateSaleRequest, UpdateSaleRequest, SaleStatistics, SaleFilters, SaleStatus } from '@/types';
import { propertyService } from './property-service';

export class SaleService {
  async getSales(): Promise<Sale[]> {
    try {
      console.log('Making request to:', API_ENDPOINTS.SALES);
      const response = await apiService.get<any>(API_ENDPOINTS.SALES);
      console.log('Sales API Response:', response);
      
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
      console.error('Sales API Error:', error);
      console.error('Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      // Return empty array instead of throwing to prevent app crash
      if (error.response?.status === 404) {
        console.warn('Sales endpoint not found, returning empty array');
        return [];
      }
      
      // For other errors, still return empty array to prevent crash
      console.warn('Returning empty array due to API error');
      return [];
    }
  }

  // Client-side filtering function
  filterSales(sales: Sale[], filters?: SaleFilters): { data: Sale[], total: number, totalPages: number } {
    if (!sales.length) return { data: [], total: 0, totalPages: 0 };

    let filteredSales = sales;

    if (filters) {
      filteredSales = sales.filter(sale => {
        // Search filter - search in property title, buyer customer name, seller customer name
        if (filters.search) {
          const searchLower = filters.search.toLowerCase().trim();
          if (searchLower) {
            const matchesTitle = sale.propertyTitle?.toLowerCase().includes(searchLower) || false;
            const matchesBuyer = sale.buyerCustomerName?.toLowerCase().includes(searchLower) || false;
            const matchesSeller = sale.sellerCustomerName?.toLowerCase().includes(searchLower) || false;
            
            if (!matchesTitle && !matchesBuyer && !matchesSeller) {
              return false;
            }
          }
        }

        // Status filter
        if (filters.status !== undefined && sale.status !== filters.status) {
          return false;
        }

        // Property type filter
        if (filters.propertyType !== undefined && sale.property?.propertyType !== filters.propertyType) {
          return false;
        }

        // Date filters
        if (filters.dateFrom) {
          const saleDate = new Date(sale.saleDate);
          const fromDate = new Date(filters.dateFrom);
          if (saleDate < fromDate) {
            return false;
          }
        }

        if (filters.dateTo) {
          const saleDate = new Date(sale.saleDate);
          const toDate = new Date(filters.dateTo);
          if (saleDate > toDate) {
            return false;
          }
        }

        // Price filters
        if (filters.minPrice && sale.salePrice < filters.minPrice) {
          return false;
        }
        
        if (filters.maxPrice && sale.salePrice > filters.maxPrice) {
          return false;
        }

        return true;
      });
    }

    const total = filteredSales.length;
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const totalPages = Math.ceil(total / limit);
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = filteredSales.slice(startIndex, endIndex);

    return {
      data: paginatedData,
      total,
      totalPages
    };
  }

  async getSaleById(id: number): Promise<Sale> {
    const response = await apiService.get<Sale>(
      API_ENDPOINTS.SALE_BY_ID(id.toString())
    );
    return response;
  }

  async createSale(saleData: CreateSaleRequest): Promise<Sale> {
    console.log('Creating sale:', saleData);
    const response = await apiService.post<Sale>(
      API_ENDPOINTS.SALES,
      saleData
    );
    
    // Eğer satış tamamlandı statüsündeyse emlak durumunu güncelle
    if (saleData.status === SaleStatus.Completed) {
      await this.updatePropertyStatusAfterSale(saleData.propertyId);
    }
    
    return response;
  }

  async updateSale(saleData: UpdateSaleRequest): Promise<Sale> {
    console.log('Updating sale:', saleData);
    
    // Önce mevcut sale'i al
    const currentSale = await this.getSaleById(saleData.id);
    
    const response = await apiService.put<Sale>(
      API_ENDPOINTS.SALE_BY_ID(saleData.id.toString()),
      saleData
    );
    
    // Eğer satış durumu Tamamlandı'ya değiştiyse ve daha önce tamamlanmamışsa
    if (saleData.status === SaleStatus.Completed && currentSale.status !== SaleStatus.Completed) {
      await this.updatePropertyStatusAfterSale(saleData.propertyId);
    }
    
    return response;
  }

  // Satış tamamlandığında emlak durumunu otomatik güncelle
  private async updatePropertyStatusAfterSale(propertyId: number): Promise<void> {
    try {
      console.log(`Updating property status after sale completion for property ${propertyId}`);
      
      // Property bilgilerini al
      const property = await propertyService.getPropertyById(propertyId);
      console.log('Current property status:', property.status);
      
      // Eğer property Kiralık veya SatılıkKiralık durumundaysa Kiralandı yap
      if (property.status === 'Kiralık' || property.status === 'SatılıkKiralık') {
        console.log(`Property is in rental status (${property.status}), updating to Kiralandı`);
        await propertyService.updatePropertyStatus(propertyId, 'Kiralandı');
        console.log('Property status updated to Kiralandı');
      } 
      // Eğer property Satılık durumundaysa Satıldı yap
      else if (property.status === 'Satılık') {
        console.log('Property is for sale, updating to Satıldı');
        await propertyService.updatePropertyStatus(propertyId, 'Satıldı');
        console.log('Property status updated to Satıldı');
      } else {
        console.log(`Property status ${property.status} does not require automatic update`);
      }
      
    } catch (error) {
      console.error('Failed to update property status after sale:', error);
      // Property status güncellemesi başarısız olsa bile sale işlemini kesintiye uğratma
      // Sadece log'la ve devam et
    }
  }

  async deleteSale(id: number): Promise<void> {
    await apiService.delete(API_ENDPOINTS.SALE_BY_ID(id.toString()));
  }

  async getSalesByProperty(propertyId: number): Promise<Sale[]> {
    const response = await apiService.get<Sale[]>(
      API_ENDPOINTS.SALE_BY_PROPERTY(propertyId.toString())
    );
    return response;
  }

  async canSellProperty(propertyId: number): Promise<boolean> {
    try {
      const response = await apiService.get<{ canSell: boolean }>(
        API_ENDPOINTS.CAN_SELL_PROPERTY(propertyId.toString())
      );
      return response.canSell;
    } catch (error) {
      console.error('Can sell property check failed:', error);
      return false;
    }
  }

  async calculateCommission(salePrice: number): Promise<{ commission: number }> {
    const response = await apiService.post<{ commission: number }>(
      API_ENDPOINTS.CALCULATE_COMMISSION,
      { salePrice }
    );
    return response;
  }

  async getSaleStatistics(): Promise<SaleStatistics> {
    try {
      console.log('=== FETCHING SALE STATISTICS ===');
      console.log('Making request to:', API_ENDPOINTS.SALE_STATISTICS);
      
      const response = await apiService.get<any>(API_ENDPOINTS.SALE_STATISTICS);
      console.log('Sale statistics raw response:', response);
      console.log('Response type:', typeof response);
      console.log('Response keys:', Object.keys(response || {}));
      
      // Backend'ten dönen format kontrol et
      if (response && response.success && response.data) {
        console.log('Found success response with data:', response.data);
        return response.data as SaleStatistics;
      }
      
      // Eğer direkt SaleStatistics objesi dönerse
      if (response && typeof response === 'object' && 'totalSales' in response) {
        console.log('Direct SaleStatistics object response');
        return response as SaleStatistics;
      }
      
      // Default değerler döndür
      console.warn('Invalid response format, returning default values');
      const defaultStats: SaleStatistics = {
        totalSales: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalExpenses: 0,
        totalNetProfit: 0,
        averageSalePrice: 0,
        salesThisMonth: 0,
        revenueThisMonth: 0
      };
      return defaultStats;
      
    } catch (error: any) {
      console.error('Sale statistics API Error:', error);
      console.error('Error response:', error.response?.data);
      
      // Hata durumunda varsayılan değerler döndür
      const defaultStats: SaleStatistics = {
        totalSales: 0,
        totalRevenue: 0,
        totalCommission: 0,
        totalExpenses: 0,
        totalNetProfit: 0,
        averageSalePrice: 0,
        salesThisMonth: 0,
        revenueThisMonth: 0
      };
      return defaultStats;
    }
  }

  async getMySaleStatistics(): Promise<SaleStatistics> {
    const response = await apiService.get<SaleStatistics>(
      API_ENDPOINTS.MY_SALE_STATISTICS
    );
    return response;
  }
}

export const saleService = new SaleService(); 