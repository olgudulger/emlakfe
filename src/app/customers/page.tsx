'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Download,
  MoreHorizontal
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { CustomerForm } from '@/components/forms/customer-form';
import { useRoleProtection } from '@/hooks/use-role-protection';
import { customerService, CustomerFilters } from '@/services/customer-service';
import { Customer, CustomerType, InterestType } from '@/types';
import { exportCustomersToCSV } from '@/utils/export';

const getCustomerTypeBadge = (type: CustomerType) => {
  const variants: Record<CustomerType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [CustomerType.Alıcı]: 'default',
    [CustomerType.Satıcı]: 'secondary',
    [CustomerType.AlıcıSatıcı]: 'outline'
  };
  
  const labels: Record<CustomerType, string> = {
    [CustomerType.Alıcı]: 'Alıcı',
    [CustomerType.Satıcı]: 'Satıcı',
    [CustomerType.AlıcıSatıcı]: 'Alıcı/Satıcı'
  };

  return (
    <Badge variant={variants[type]}>
      {labels[type]}
    </Badge>
  );
};

const getInterestTypeLabel = (interestType: InterestType) => {
  const labels: Record<InterestType, string> = {
    // Arsa kategorisi
    [InterestType.Arsa]: 'Arsa',
    [InterestType.SanayiArsası]: 'Sanayi Arsası',
    [InterestType.ÇiftlikArsası]: 'Çiftlik Arsası',
    [InterestType.ArsadanHisse]: 'Arsadan Hisse',
    
    // Tarla kategorisi
    [InterestType.Tarla]: 'Tarla',
    [InterestType.Bağ]: 'Bağ',
    [InterestType.Bahçe]: 'Bahçe',
    [InterestType.TarladanHisse]: 'Tarladan Hisse',
    
    // Daire kategorisi
    [InterestType.Daire]: 'Daire',
    [InterestType.KiralıkDaire]: 'Kiralık Daire',
    
    // İşyeri kategorisi
    [InterestType.İşyeri]: 'İşyeri',
    [InterestType.Kiralıkİşyeri]: 'Kiralık İşyeri',
    
    // Genel
    [InterestType.Tümü]: 'Tümü'
  };
  
  return labels[interestType] || 'Bilinmiyor';
};

export default function CustomersPage() {
  const { hasPermission } = useRoleProtection();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<CustomerFilters>({
    search: '',
    customerType: undefined,
    page: 1,
    limit: 5
  });

  const [debouncedFilters, setDebouncedFilters] = useState<CustomerFilters>(filters);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Debounce filters to avoid too many renders for search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [filters.search]); // Only debounce search, other filters apply immediately

  // For non-search filters, apply immediately
  const currentFilters = {
    ...filters,
    search: debouncedFilters.search
  };

  // Fetch customers from API - before permission check to maintain hook order
  const { data: allCustomers = [], isLoading, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    enabled: hasPermission, // Only fetch when user has permission
  });

  // Filter customers client-side
  const filterResult = customerService.filterCustomers(allCustomers, currentFilters);
  const customers = filterResult.data;
  const totalCustomers = filterResult.total;
  const totalPages = filterResult.totalPages;

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handlePrevPage = () => {
    const currentPage = filters.page || 1;
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const currentPage = filters.page || 1;
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    }
  };

  const createMutation = useMutation({
    mutationFn: customerService.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Müşteri başarıyla eklendi');
      setIsFormOpen(false);
      setSelectedCustomer(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Müşteri eklenirken bir hata oluştu');
    }
  });

  const updateMutation = useMutation({
    mutationFn: customerService.updateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Müşteri başarıyla güncellendi');
      setIsFormOpen(false);
      setSelectedCustomer(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Müşteri güncellenirken bir hata oluştu');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: customerService.deleteCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Müşteri başarıyla silindi');
      setIsDeleteOpen(false);
      setCustomerToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Müşteri silinirken bir hata oluştu');
    }
  });

  // Permission check after all hooks are called
  if (!hasPermission) {
    return null;
  }

  const handleCreateCustomer = async (data: any) => {
    await createMutation.mutateAsync(data);
  };

  const handleUpdateCustomer = async (data: any) => {
    if (selectedCustomer) {
      await updateMutation.mutateAsync({ ...data, id: selectedCustomer.id });
    }
  };

  const handleDeleteCustomer = async () => {
    if (customerToDelete) {
      await deleteMutation.mutateAsync(customerToDelete.id);
    }
  };

  const openEditForm = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (customer: Customer) => {
    setCustomerToDelete(customer);
    setIsDeleteOpen(true);
  };

  const handleExport = () => {
    exportCustomersToCSV(customers);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Müşteriler</h1>
            <p className="text-muted-foreground">
              Müşteri bilgilerini yönetin ve takip edin
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Yeni Müşteri
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Toplam Müşteri</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{allCustomers.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Alıcılar</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {allCustomers.filter(c => c.customerType === CustomerType.Alıcı).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Satıcılar</CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {allCustomers.filter(c => c.customerType === CustomerType.Satıcı).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Alıcı/Satıcı</CardTitle>
              <Users className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {allCustomers.filter(c => c.customerType === CustomerType.AlıcıSatıcı).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards - Second Row */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Ortalama Bütçe</CardTitle>
              <Users className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                ₺{Math.round(allCustomers.reduce((sum, c) => sum + c.budget, 0) / allCustomers.length || 0).toLocaleString('tr-TR')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Bu Ay Eklenen</CardTitle>
              <Users className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {allCustomers.filter(c => {
                  const createdAt = new Date(c.createdAt);
                  const now = new Date();
                  return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filtreler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <div className="sm:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Ad, soyad veya telefon ile arama..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                    className="pl-10"
                  />
                  {filters.search && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                      onClick={() => setFilters({ ...filters, search: '' })}
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>
              
              <Select
                value={filters.customerType?.toString() || 'ALL'}
                onValueChange={(value) => setFilters({ 
                  ...filters, 
                  customerType: value === 'ALL' ? undefined : parseInt(value) 
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri Tipi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tümü</SelectItem>
                  <SelectItem value={CustomerType.Alıcı.toString()}>Alıcı</SelectItem>
                  <SelectItem value={CustomerType.Satıcı.toString()}>Satıcı</SelectItem>
                  <SelectItem value={CustomerType.AlıcıSatıcı.toString()}>Alıcı/Satıcı</SelectItem>
                </SelectContent>
              </Select>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={handleExport}
                >
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Dışa Aktar</span>
                  <span className="sm:hidden">Export</span>
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setFilters({ search: '', customerType: undefined, page: 1, limit: 5 })}
                  className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
                >
                  <span className="hidden sm:inline">Filtreleri Temizle</span>
                  <span className="sm:hidden">Temizle</span>
                </Button>
              </div>
            </div>
            
            {/* Filter Summary */}
            {(filters.search || filters.customerType !== undefined) && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>Aktif filtreler:</span>
                {filters.search && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Arama: "{filters.search}"
                    <button 
                      onClick={() => setFilters({ ...filters, search: '' })}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.customerType !== undefined && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Tip: {filters.customerType === CustomerType.Alıcı ? 'Alıcı' : 
                          filters.customerType === CustomerType.Satıcı ? 'Satıcı' : 'Alıcı/Satıcı'}
                    <button 
                      onClick={() => setFilters({ ...filters, customerType: undefined })}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Müşteri Listesi</CardTitle>
            <CardDescription>
              {totalCustomers} müşteriden {customers.length} tanesi gösteriliyor (Sayfa {filters.page || 1} / {totalPages})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Müşteriler yükleniyor...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Ad Soyad</TableHead>
                        <TableHead>Telefon</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Bütçe</TableHead>
                        <TableHead>İlgi Türü</TableHead>
                        <TableHead>Notlar</TableHead>
                        <TableHead>Kayıt Tarihi</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell>
                            <div className="font-medium">
                              {customer.fullName}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{customer.phone}</div>
                          </TableCell>
                          <TableCell>
                            {getCustomerTypeBadge(customer.customerType)}
                          </TableCell>
                          <TableCell>
                            ₺{customer.budget.toLocaleString('tr-TR')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {getInterestTypeLabel(customer.interestType)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm max-w-[200px] truncate">
                              {customer.notes || '-'}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => openEditForm(customer)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(customer)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {customers.map((customer) => (
                    <Card key={customer.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{customer.fullName}</h3>
                          <p className="text-sm text-muted-foreground">{customer.phone}</p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openEditForm(customer)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => openDeleteDialog(customer)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Tip:</span>
                          <div className="mt-1">{getCustomerTypeBadge(customer.customerType)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Bütçe:</span>
                          <div className="mt-1 font-medium">₺{customer.budget.toLocaleString('tr-TR')}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">İlgi Türü:</span>
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getInterestTypeLabel(customer.interestType)}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Notlar:</span>
                          <div className="mt-1 text-sm">
                            {customer.notes || '-'}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kayıt:</span>
                          <div className="mt-1 text-xs">
                            {new Date(customer.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Toplam {totalCustomers} müşteri, sayfa {filters.page || 1} / {totalPages}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={!filters.page || filters.page <= 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">Önceki</span>
                  </Button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <Button
                        key={pageNum}
                        variant={pageNum === (filters.page || 1) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    ))}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={!filters.page || filters.page >= totalPages}
                    className="flex items-center gap-1"
                  >
                    <span className="hidden sm:inline">Sonraki</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedCustomer ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}
              </DialogTitle>
            </DialogHeader>
            <CustomerForm
              customer={selectedCustomer || undefined}
              onSubmit={selectedCustomer ? handleUpdateCustomer : handleCreateCustomer}
              isLoading={createMutation.isPending || updateMutation.isPending}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedCustomer(null);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Müşteriyi Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem geri alınamaz. {customerToDelete?.fullName} 
                adlı müşteriyi kalıcı olarak silmek istediğinizden emin misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteCustomer}
                className="bg-red-600 hover:bg-red-700"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
} 