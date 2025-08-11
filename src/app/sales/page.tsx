'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Users, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  XCircle,
  DollarSign,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  PauseCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRoleProtection } from '@/hooks/use-role-protection';
import { saleService } from '@/services/sale-service';
import { PropertyService } from '@/services/property-service';
import { customerService } from '@/services/customer-service';
import { Sale, SaleStatus, SaleFilters, PropertyType } from '@/types';
import { SaleForm } from '@/components/forms/sale-form';

const propertyService = new PropertyService();

export default function SalesPage() {
  const { hasPermission, isInitialized } = useRoleProtection();
  const queryClient = useQueryClient();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [filters, setFilters] = useState<SaleFilters>({
    page: 1,
    limit: 10
  });

  // Data queries
  const { data: allSales = [], isLoading: salesLoading, refetch: refetchSales } = useQuery({
    queryKey: ['sales'],
    queryFn: () => saleService.getSales(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['properties-for-sales'],
    queryFn: () => propertyService.getProperties(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery({
    queryKey: ['customers-for-sales'],
    queryFn: () => customerService.getCustomers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter and paginate sales
  const { data: sales, total: totalSales, totalPages } = saleService.filterSales(allSales, filters);

  // Client-side statistics calculation (fallback if backend fails)
  const completedSales = allSales.filter(sale => sale.status === 1); // Sadece tamamlanmış satışlar
  
  const clientStats = {
    totalSales: completedSales.length,
    totalRevenue: completedSales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0),
    totalCommission: completedSales.reduce((sum, sale) => sum + (sale.commission || 0), 0),
    totalExpenses: completedSales.reduce((sum, sale) => sum + (sale.expenses || 0), 0),
    totalNetProfit: completedSales.reduce((sum, sale) => sum + (sale.netProfit || 0), 0),
    averageSalePrice: completedSales.length > 0 ? completedSales.reduce((sum, sale) => sum + (sale.salePrice || 0), 0) / completedSales.length : 0,
    averageCommission: completedSales.length > 0 ? completedSales.reduce((sum, sale) => sum + (sale.commission || 0), 0) / completedSales.length : 0,
    // Bu ayın tamamlanmış satışları
    salesThisMonth: completedSales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      const currentDate = new Date();
      return saleDate.getMonth() === currentDate.getMonth() && saleDate.getFullYear() === currentDate.getFullYear();
    }).length,
    // Bu ayın tamamlanmış satışlarından ciro
    revenueThisMonth: completedSales.filter(sale => {
      const saleDate = new Date(sale.saleDate);
      const currentDate = new Date();
      return saleDate.getMonth() === currentDate.getMonth() && saleDate.getFullYear() === currentDate.getFullYear();
    }).reduce((sum, sale) => sum + (sale.salePrice || 0), 0)
  };

  // Client-side hesaplamayı kullan (backend endpoint'ine gerek yok)
  const displayStats = clientStats;
  
  console.log('📊 Statistics Debug:');
  console.log('All sales:', allSales.length);
  console.log('Completed sales (status=1):', completedSales.length);
  console.log('Final displayStats:', displayStats);

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: number) => saleService.cancelSale(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['properties-for-sales'] });
    },
  });

  const handleCancel = async (id: number) => {
    if (window.confirm('Bu satışı iptal etmek istediğinizden emin misiniz?')) {
      try {
        await cancelMutation.mutateAsync(id);
      } catch (error: any) {
        console.error('Cancel failed:', error);
        alert(error.message || 'Satış iptal edilemedi');
      }
    }
  };

  const openCreateForm = () => {
    setEditingSale(null);
    setIsFormOpen(true);
  };

  const openEditForm = (sale: Sale) => {
    console.log('📝 Opening edit form for sale:', sale);
    console.log('📝 Sale object details:', JSON.stringify(sale, null, 2));
    console.log('📝 Properties loaded:', properties.length);
    console.log('📝 Properties array:', properties.map(p => ({ id: p.id, title: p.title, propertyType: p.propertyType })));
    console.log('📝 Customers loaded:', customers.length);
    console.log('📝 Looking for property ID:', sale.propertyId);
    
    // Manual property lookup test
    const foundProperty = properties.find(p => p.id === sale.propertyId);
    console.log('📝 Manual property lookup result:', foundProperty);
    
    setEditingSale(sale);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingSale(null);
    refetchSales();
    queryClient.invalidateQueries({ queryKey: ['properties'] });
    queryClient.invalidateQueries({ queryKey: ['properties-for-sales'] });
  };

  const getSaleStatusBadge = (status: SaleStatus) => {
    switch (status) {
      case SaleStatus.Completed:
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" /> Tamamlandı</Badge>;
      case SaleStatus.Pending:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" /> Beklemede</Badge>;
      case SaleStatus.Cancelled:
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" /> İptal Edildi</Badge>;
      case SaleStatus.Postponed:
        return <Badge className="bg-gray-100 text-gray-800"><PauseCircle className="w-3 h-3 mr-1" /> Ertelendi</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPropertyTypeName = (type: string | PropertyType) => {
    // String olarak geliyorsa direkt çevir
    if (typeof type === 'string') {
      switch (type.toLowerCase()) {
        case 'land': return 'Arsa';
        case 'field': return 'Tarla';
        case 'apartment': return 'Daire';
        case 'commercial': return 'İşyeri';
        case 'sharedparcel': return 'Hisseli';
        default: return type;
      }
    }
    
    // Enum olarak geliyorsa
    switch (type) {
      case PropertyType.Land: return 'Arsa';
      case PropertyType.Field: return 'Tarla';
      case PropertyType.Apartment: return 'Daire';
      case PropertyType.Commercial: return 'İşyeri';
      case PropertyType.SharedParcel: return 'Hisseli';
      default: return 'Bilinmiyor';
    }
  };

  if (!isInitialized) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Yükleniyor...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!hasPermission) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Satış/Kiralama İşlemleri</h1>
            <p className="text-muted-foreground">
              Emlak satış işlemlerini yönetin ve takip edin
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={openCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni Satış
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {displayStats && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam İşlem</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayStats.totalSales}</div>
                <p className="text-xs text-muted-foreground">
                  Bu ay {displayStats.salesThisMonth} işlem
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam İşlem Gören Emlak Değeri</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₺{(displayStats.totalRevenue || 0).toLocaleString('tr-TR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Bu ay ₺{(displayStats.revenueThisMonth || 0).toLocaleString('tr-TR')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Komisyon</CardTitle>
                <DollarSign className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₺{(displayStats.totalCommission || 0).toLocaleString('tr-TR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ortalama ₺{Math.round(displayStats.averageCommission || 0).toLocaleString('tr-TR')}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Kar</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ₺{(displayStats.totalNetProfit || 0).toLocaleString('tr-TR')}
                </div>
                <p className="text-xs text-muted-foreground">
                  Giderler ₺{(displayStats.totalExpenses || 0).toLocaleString('tr-TR')}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Başlık, alıcı veya satıcı ara..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                  className="pl-10"
                />
              </div>

              <Select 
                value={filters.status?.toString() || 'all'} 
                onValueChange={(value) => setFilters({ 
                  ...filters, 
                  status: value === 'all' ? undefined : parseInt(value) as SaleStatus,
                  page: 1 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="1">Tamamlandı</SelectItem>
                  <SelectItem value="2">Beklemede</SelectItem>
                  <SelectItem value="3">İptal Edildi</SelectItem>
                  <SelectItem value="4">Ertelendi</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={filters.propertyType?.toString() || 'all'} 
                onValueChange={(value) => setFilters({ 
                  ...filters, 
                  propertyType: value === 'all' ? undefined : parseInt(value),
                  page: 1 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Emlak tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tipler</SelectItem>
                  <SelectItem value="0">Arsa</SelectItem>
                  <SelectItem value="1">Tarla</SelectItem>
                  <SelectItem value="2">Daire</SelectItem>
                  <SelectItem value="3">İşyeri</SelectItem>
                  <SelectItem value="4">Hisseli</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={() => setFilters({ page: 1, limit: 10 })}
              >
                Filtreleri Temizle
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sales List */}
        <Card>
          <CardHeader>
            <CardTitle>Satış Listesi</CardTitle>
            <CardDescription>
              {totalSales} satıştan {sales.length} tanesi gösteriliyor (Sayfa {filters.page || 1} / {totalPages})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {salesLoading ? (
              <div className="flex justify-center p-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Satışlar yükleniyor...</span>
                </div>
              </div>
            ) : (
              <>
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Emlak</TableHead>
                        <TableHead>Satıcı</TableHead>
                        <TableHead>Alıcı</TableHead>
                        <TableHead>Satış Fiyatı</TableHead>
                        <TableHead>Komisyon</TableHead>
                        <TableHead>Komisyon %</TableHead>
                        <TableHead>Net Kar</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sales.map((sale) => (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.propertyTitle || 'Emlak bulunamadı'}</div>
                              <div className="text-sm text-muted-foreground">
                                {sale.propertyType && getPropertyTypeName(sale.propertyType)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.sellerCustomerName || 'Satıcı bulunamadı'}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{sale.buyerCustomerName || 'Alıcı bulunamadı'}</div>
                            </div>
                          </TableCell>
                          <TableCell>₺{(sale.salePrice || 0).toLocaleString('tr-TR')}</TableCell>
                          <TableCell>₺{(sale.commission || 0).toLocaleString('tr-TR')}</TableCell>
                          <TableCell>{sale.commissionRate?.toFixed(1) || '0.0'}%</TableCell>
                          <TableCell>₺{(sale.netProfit || 0).toLocaleString('tr-TR')}</TableCell>
                          <TableCell>{getSaleStatusBadge(sale.status)}</TableCell>
                          <TableCell>
                            {format(new Date(sale.saleDate), 'dd MMM yyyy', { locale: tr })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditForm(sale)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(sale.id)}
                                className="text-orange-600 hover:text-orange-700"
                                disabled={sale.status === 3} // SaleStatus.Cancelled
                                title={sale.status === 3 ? "Zaten iptal edilmiş" : "Satışı iptal et"}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                  {sales.map((sale) => (
                    <Card key={sale.id}>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{sale.propertyTitle || 'Emlak bulunamadı'}</h3>
                            {getSaleStatusBadge(sale.status)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {sale.propertyType && getPropertyTypeName(sale.propertyType)}
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Satıcı: </span>
                              {sale.sellerCustomerName || 'Bulunamadı'}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Alıcı: </span>
                              {sale.buyerCustomerName || 'Bulunamadı'}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Komisyon %: </span>
                              {sale.commissionRate?.toFixed(1) || '0.0'}%
                            </div>
                            <div>
                              <span className="text-muted-foreground">Net Kar: </span>
                              ₺{(sale.netProfit || 0).toLocaleString('tr-TR')}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Fiyat: </span>
                              ₺{(sale.salePrice || 0).toLocaleString('tr-TR')}
                            </div>
                            <div>
                              <span className="text-muted-foreground">Komisyon: </span>
                              ₺{(sale.commission || 0).toLocaleString('tr-TR')}
                            </div>
                          </div>
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(sale.saleDate), 'dd MMM yyyy', { locale: tr })}
                            </span>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditForm(sale)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleCancel(sale.id)}
                                className="text-orange-600 hover:text-orange-700"
                                disabled={sale.status === 3} // SaleStatus.Cancelled
                                title={sale.status === 3 ? "Zaten iptal edilmiş" : "Satışı iptal et"}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Toplam {totalSales} kayıt
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ ...filters, page: Math.max(1, (filters.page || 1) - 1) })}
                      disabled={(filters.page || 1) <= 1}
                    >
                      Önceki
                    </Button>
                    <span className="text-sm">
                      Sayfa {filters.page || 1} / {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ ...filters, page: Math.min(totalPages, (filters.page || 1) + 1) })}
                      disabled={(filters.page || 1) >= totalPages}
                    >
                      Sonraki
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Sale Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingSale ? 'Satış Düzenle' : 'Yeni Satış'}
              </DialogTitle>
              <DialogDescription>
                {editingSale ? 'Satış bilgilerini güncelleyin.' : 'Yeni satış kaydı oluşturun.'}
              </DialogDescription>
            </DialogHeader>
            {propertiesLoading || customersLoading ? (
              <div className="flex justify-center p-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Emlak ve müşteri verileri yükleniyor...</span>
                </div>
              </div>
            ) : (
              <SaleForm
                sale={editingSale}
                properties={properties}
                customers={customers}
                onClose={closeForm}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 