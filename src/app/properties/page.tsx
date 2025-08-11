'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  ChevronLeft,
  ChevronRight,
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Download,
  MoreHorizontal,
  MapPin,
  Phone,
  User,
  Eye
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { useRoleProtection } from '@/hooks/use-role-protection';
import { propertyService } from '@/services/property-service';
import { customerService } from '@/services/customer-service';
import { locationService } from '@/services/location-service';
import { Property, PropertyType, PropertyStatus, PropertyFilters, Customer } from '@/types';
import { PropertyForm } from '@/components/forms/property-form';
import { PropertyDetailDialog } from '../../components/property-detail-dialog';
import { exportPropertiesToCSV } from '@/utils/export';

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

const getPropertyTypeBadge = (type: PropertyType) => {
  const variants: Record<PropertyType, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    [PropertyType.Land]: 'default',
    [PropertyType.Field]: 'secondary',
    [PropertyType.Apartment]: 'outline',
    [PropertyType.Commercial]: 'destructive',
    [PropertyType.SharedParcel]: 'outline'
  };
  
  const labels: Record<PropertyType, string> = {
    [PropertyType.Land]: 'Arsa',
    [PropertyType.Field]: 'Tarla',
    [PropertyType.Apartment]: 'Daire',
    [PropertyType.Commercial]: 'İşyeri',
    [PropertyType.SharedParcel]: 'Hisseli Parsel'
  };

  return (
    <Badge variant={variants[type]}>
      {labels[type]}
    </Badge>
  );
};

const getPropertyStatusBadge = (status: any) => {
  // Backend'den gelen değeri önce string'e çevir
  const stringStatus = convertNumericStatusToString(status);
  
  let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'outline';
  let label: string = stringStatus;

  switch (stringStatus) {
    case 'Satılık':
      variant = 'default';
      label = 'Satılık';
      break;
    case 'Kiralık':
      variant = 'secondary';
      label = 'Kiralık';
      break;
    case 'SatılıkKiralık':
      variant = 'outline';
      label = 'Satılık/Kiralık';
      break;
    case 'Rezerv':
      variant = 'outline';
      label = 'Rezerv';
      break;
    case 'Satıldı':
      variant = 'destructive';
      label = 'Satıldı';
      break;
    case 'Kiralandı':
      variant = 'destructive';
      label = 'Kiralandı';
      break;
    default:
      variant = 'outline';
      label = String(stringStatus);
  }

  return (
    <Badge variant={variant}>
      {label}
    </Badge>
  );
};

export default function PropertiesPage() {
  const { hasPermission, isInitialized } = useRoleProtection();
  const queryClient = useQueryClient();
  
  const [filters, setFilters] = useState<PropertyFilters>({
    search: '',
    propertyType: undefined,
    status: undefined,
    provinceId: undefined,
    districtId: undefined,
    neighborhoodId: undefined,
    hasShareholder: undefined,
    page: 1,
    limit: 5
  });

  const [debouncedFilters, setDebouncedFilters] = useState<PropertyFilters>(filters);
  
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [propertyForDetail, setPropertyForDetail] = useState<Property | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

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

  // Fetch districts for selected province
  const { data: filteredDistricts = [] } = useQuery({
    queryKey: ['districts', filters.provinceId],
    queryFn: () => locationService.getDistrictsByProvince(filters.provinceId!),
    enabled: !!filters.provinceId,
  });

  // Fetch neighborhoods for selected district
  const { data: filteredNeighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods', filters.districtId],
    queryFn: () => locationService.getNeighborhoodsByDistrict(filters.districtId!),
    enabled: !!filters.districtId,
  });

  // Fetch properties from API - before permission check to maintain hook order
  const { data: allProperties = [], isLoading, refetch } = useQuery({
    queryKey: ['properties'],
    queryFn: () => propertyService.getProperties(),
    enabled: hasPermission, // Only fetch when user has permission
  });

  // Fetch customers for mapping names
  const { data: allCustomers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
    enabled: hasPermission,
  });

  // Fetch all location data
  const { data: allProvinces = [] } = useQuery({
    queryKey: ['all-provinces'],
    queryFn: () => locationService.getProvinces(),
    enabled: hasPermission,
  });

  const { data: allDistricts = [] } = useQuery({
    queryKey: ['all-districts'],
    queryFn: () => locationService.getAllDistricts(),
    enabled: hasPermission,
  });

  const { data: allNeighborhoods = [] } = useQuery({
    queryKey: ['all-neighborhoods'],
    queryFn: () => locationService.getAllNeighborhoods(),
    enabled: hasPermission,
  });

  // Ensure allProperties is always an array
  const safeAllProperties = Array.isArray(allProperties) ? allProperties : [];

  // Filter properties client-side
  const filterResult = propertyService.filterProperties(safeAllProperties, currentFilters, allCustomers);
  const properties = filterResult.data;
  const totalProperties = filterResult.total;
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
    mutationFn: propertyService.createProperty,
    onSuccess: (newProperty) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property-price-history'] });
      toast.success('Emlak başarıyla eklendi');
      setIsFormOpen(false);
      setSelectedProperty(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Emlak eklenirken bir hata oluştu');
    }
  });

  const updateMutation = useMutation({
    mutationFn: propertyService.updateProperty,
    onSuccess: (updatedProperty) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property-price-history'] });
      queryClient.invalidateQueries({ queryKey: ['property-price-history', updatedProperty.id] });
      
      toast.success('Emlak başarıyla güncellendi');
      setIsFormOpen(false);
      
      if (isDetailOpen && propertyForDetail?.id === updatedProperty.id) {
        setPropertyForDetail(updatedProperty);
        queryClient.refetchQueries({ queryKey: ['property-price-history', updatedProperty.id] });
      }
      
      setSelectedProperty(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Emlak güncellenirken bir hata oluştu');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: propertyService.deleteProperty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property-price-history'] });
      toast.success('Emlak başarıyla silindi');
      setIsDeleteOpen(false);
      setPropertyToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Emlak silinirken bir hata oluştu');
    }
  });

  // Permission check after all hooks are called
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

  const handleCreateProperty = async (data: any) => {
    await createMutation.mutateAsync(data);
  };

  const handleUpdateProperty = async (data: any) => {
    if (selectedProperty) {
      await updateMutation.mutateAsync({ ...data, id: selectedProperty.id });
    }
  };

  const handleDeleteProperty = async () => {
    if (propertyToDelete) {
      await deleteMutation.mutateAsync(propertyToDelete.id);
    }
  };

  const openEditForm = (property: Property) => {
    setSelectedProperty(property);
    setIsFormOpen(true);
  };

  const openDetailDialog = (property: Property) => {
    setPropertyForDetail(property);
    setIsDetailOpen(true);
  };

  const openDeleteDialog = (property: Property) => {
    setPropertyToDelete(property);
    setIsDeleteOpen(true);
  };

  const getTotalPrice = (property: Property) => {
    return property.typeSpecificProperties?.TotalPrice || 0;
  };

  const getCustomerName = (customerId: number) => {
    const customer = allCustomers.find(c => c.id === customerId);
    return customer ? customer.fullName : 'Bilinmiyor';
  };

  const getLocationString = (provinceId: number, districtId: number, neighborhoodId: number) => {
    const province = allProvinces.find(p => p.id === provinceId);
    const district = allDistricts.find(d => d.id === districtId);
    const neighborhood = allNeighborhoods.find(n => n.id === neighborhoodId);
    
    const provinceName = province?.name || 'Bilinmiyor';
    const districtName = district?.name || 'Bilinmiyor';
    const neighborhoodName = neighborhood?.name || 'Bilinmiyor';
    
    return `${provinceName} / ${districtName} / ${neighborhoodName}`;
  };

  // Location filter handlers
  const handleProvinceFilterChange = (value: string) => {
    const provinceId = value === 'ALL' ? undefined : parseInt(value);
    setFilters({ 
      ...filters, 
      provinceId,
      districtId: undefined, // Reset district when province changes
      neighborhoodId: undefined, // Reset neighborhood when province changes
      page: 1 // Reset to first page
    });
  };

  const handleDistrictFilterChange = (value: string) => {
    const districtId = value === 'ALL' ? undefined : parseInt(value);
    setFilters({ 
      ...filters, 
      districtId,
      neighborhoodId: undefined, // Reset neighborhood when district changes
      page: 1 // Reset to first page
    });
  };

  const handleNeighborhoodFilterChange = (value: string) => {
    const neighborhoodId = value === 'ALL' ? undefined : parseInt(value);
    setFilters({ 
      ...filters, 
      neighborhoodId,
      page: 1 // Reset to first page
    });
  };

  const handleExport = () => {
    exportPropertiesToCSV(properties);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Emlak İşlemleri</h1>
            <p className="text-muted-foreground">
              Emlak bilgilerini yönetin ve takip edin
            </p>
          </div>
          <Button className="w-full sm:w-auto" onClick={() => setIsFormOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Emlak
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Toplam Emlak</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">{safeAllProperties.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Arsa/Tarla</CardTitle>
              <MapPin className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {safeAllProperties.filter(p => p.propertyType === PropertyType.Land || p.propertyType === PropertyType.Field).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Daireler</CardTitle>
              <Building2 className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {safeAllProperties.filter(p => p.propertyType === PropertyType.Apartment).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">İşyerleri</CardTitle>
              <Building2 className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {safeAllProperties.filter(p => p.propertyType === PropertyType.Commercial).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Hisseli Parsel</CardTitle>
              <Building2 className="h-4 w-4 text-teal-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">
                {safeAllProperties.filter(p => p.propertyType === PropertyType.SharedParcel).length}
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
            <div className="space-y-4">
              {/* Search and Property Type - First Row */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <div className="sm:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Başlık, aracı, müşteri veya notlar ile arama..."
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
                  value={filters.propertyType?.toString() || 'ALL'}
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    propertyType: value === 'ALL' ? undefined : parseInt(value) 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Emlak Tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tümü</SelectItem>
                    <SelectItem value={PropertyType.Land.toString()}>Arsa</SelectItem>
                    <SelectItem value={PropertyType.Field.toString()}>Tarla</SelectItem>
                    <SelectItem value={PropertyType.Apartment.toString()}>Daire</SelectItem>
                    <SelectItem value={PropertyType.Commercial.toString()}>İşyeri</SelectItem>
                    <SelectItem value={PropertyType.SharedParcel.toString()}>Hisseli Parsel</SelectItem>
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
                    onClick={() => setFilters({ 
                      search: '', 
                      propertyType: undefined, 
                      status: undefined, 
                      provinceId: undefined, 
                      districtId: undefined, 
                      neighborhoodId: undefined, 
                      hasShareholder: undefined,
                      page: 1, 
                      limit: 5 
                    })}
                    className="text-muted-foreground hover:text-foreground w-full sm:w-auto"
                  >
                    <span className="hidden sm:inline">Filtreleri Temizle</span>
                    <span className="sm:hidden">Temizle</span>
                  </Button>
                </div>
              </div>

              {/* Location Filters - Second Row */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                {/* HasShareholder filter for Field properties */}
                {filters.propertyType === PropertyType.Field && (
                  <div className="flex items-center space-x-2 p-2 border rounded-md">
                    <div className="flex-1">
                      <Label htmlFor="hasShareholder" className="font-medium">
                        Hisseli Tarla
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Sadece hissedar içeren tarlaları göster
                      </p>
                    </div>
                    <Switch
                      id="hasShareholder"
                      checked={filters.hasShareholder === true}
                      onCheckedChange={(checked) => {
                        setFilters({ 
                          ...filters, 
                          hasShareholder: checked ? true : undefined,
                          page: 1
                        });
                      }}
                    />
                  </div>
                )}
                <Select
                  value={filters.provinceId?.toString() || 'ALL'}
                  onValueChange={handleProvinceFilterChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="İl Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm İller</SelectItem>
                    {allProvinces.map((province) => (
                      <SelectItem key={province.id} value={province.id.toString()}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.districtId?.toString() || 'ALL'}
                  onValueChange={handleDistrictFilterChange}
                  disabled={!filters.provinceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filters.provinceId ? "İlçe Seçin" : "Önce İl Seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm İlçeler</SelectItem>
                    {filteredDistricts.map((district) => (
                      <SelectItem key={district.id} value={district.id.toString()}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={filters.neighborhoodId?.toString() || 'ALL'}
                  onValueChange={handleNeighborhoodFilterChange}
                  disabled={!filters.districtId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={filters.districtId ? "Mahalle Seçin" : "Önce İlçe Seçin"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tüm Mahalleler</SelectItem>
                    {filteredNeighborhoods.map((neighborhood) => (
                      <SelectItem key={neighborhood.id} value={neighborhood.id.toString()}>
                        {neighborhood.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Filter Summary */}
            {(filters.search || filters.propertyType !== undefined || filters.status !== undefined || 
              filters.provinceId !== undefined || filters.districtId !== undefined || filters.neighborhoodId !== undefined ||
              filters.hasShareholder !== undefined) && (
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
                {filters.propertyType !== undefined && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Tip: {filters.propertyType === PropertyType.Land ? 'Arsa' : 
                          filters.propertyType === PropertyType.Field ? 'Tarla' :
                          filters.propertyType === PropertyType.Apartment ? 'Daire' :
                          filters.propertyType === PropertyType.Commercial ? 'İşyeri' : 'Hisseli Parsel'}
                    <button 
                      onClick={() => setFilters({ ...filters, propertyType: undefined })}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.provinceId !== undefined && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    İl: {allProvinces.find(p => p.id === filters.provinceId)?.name || 'Bilinmiyor'}
                    <button 
                      onClick={() => setFilters({ 
                        ...filters, 
                        provinceId: undefined, 
                        districtId: undefined, 
                        neighborhoodId: undefined 
                      })}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.districtId !== undefined && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    İlçe: {allDistricts.find(d => d.id === filters.districtId)?.name || 'Bilinmiyor'}
                    <button 
                      onClick={() => setFilters({ 
                        ...filters, 
                        districtId: undefined, 
                        neighborhoodId: undefined 
                      })}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.neighborhoodId !== undefined && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Mahalle: {allNeighborhoods.find(n => n.id === filters.neighborhoodId)?.name || 'Bilinmiyor'}
                    <button 
                      onClick={() => setFilters({ ...filters, neighborhoodId: undefined })}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {filters.hasShareholder !== undefined && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Hisseli Tarla
                    <button 
                      onClick={() => setFilters({ ...filters, hasShareholder: undefined })}
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

        {/* Properties Table */}
        <Card>
          <CardHeader>
            <CardTitle>Emlak Listesi</CardTitle>
            <CardDescription>
              {totalProperties} emlaktan {properties.length} tanesi gösteriliyor (Sayfa {filters.page || 1} / {totalPages})
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Emlaklar yükleniyor...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}
                <div className="hidden md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Başlık</TableHead>
                        <TableHead>Tip</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Lokasyon</TableHead>
                        <TableHead>Fiyat</TableHead>
                        <TableHead>Müşteri</TableHead>
                        <TableHead>Aracı</TableHead>
                        <TableHead>Ekleme Tarihi</TableHead>
                        <TableHead className="text-right">İşlemler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {properties.map((property) => (
                        <TableRow 
                          key={property.id}
                          className="cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => openDetailDialog(property)}
                        >
                          <TableCell>
                            <div className="font-medium">
                              {property.title}
                            </div>
                          </TableCell>
                          <TableCell>
                            {getPropertyTypeBadge(property.propertyType)}
                          </TableCell>
                          <TableCell>
                            {getPropertyStatusBadge(property.status)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-xs truncate">
                                {getLocationString(property.provinceId, property.districtId, property.neighborhoodId)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            ₺{getTotalPrice(property).toLocaleString('tr-TR')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{getCustomerName(property.customerId)}</span>
                              <span className="text-xs text-muted-foreground">
                                {allCustomers.find(c => c.id === property.customerId)?.phone || 'N/A'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{property.intermediaryFullName}</span>
                              <span className="text-xs text-muted-foreground">{property.intermediaryPhone}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(property.createdAt).toLocaleDateString('tr-TR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0"
                                  onClick={(e) => e.stopPropagation()} // Prevent row click when clicking dropdown
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  openDetailDialog(property);
                                }}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Detayları Görüntüle
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  openEditForm(property);
                                }}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Düzenle
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openDeleteDialog(property);
                                  }}
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
                  {properties.map((property) => (
                    <Card 
                      key={property.id} 
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => openDetailDialog(property)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {property.title}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{property.intermediaryFullName}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">{property.intermediaryPhone}</span>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              openDetailDialog(property);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              Detayları Görüntüle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              openEditForm(property);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteDialog(property);
                              }}
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
                          <div className="mt-1">{getPropertyTypeBadge(property.propertyType)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Durum:</span>
                          <div className="mt-1">{getPropertyStatusBadge(property.status)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fiyat:</span>
                          <div className="mt-1 font-medium">₺{getTotalPrice(property).toLocaleString('tr-TR')}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Müşteri:</span>
                          <div className="mt-1 text-xs">
                            {getCustomerName(property.customerId)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Aracı:</span>
                          <div className="mt-1 text-xs">
                            {property.intermediaryFullName}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Kayıt:</span>
                          <div className="mt-1 text-xs">
                            {new Date(property.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                        </div>
                      </div>
                      
                      {/* Lokasyon bilgisi - mobile için ayrı satır */}
                      <div className="mt-3 pt-2 border-t">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <span className="text-muted-foreground text-sm">Lokasyon:</span>
                            <div className="text-xs mt-1">
                              {getLocationString(property.provinceId, property.districtId, property.neighborhoodId)}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t">
                    <div className="text-sm text-muted-foreground">
                      Toplam {totalProperties} emlak, sayfa {filters.page || 1} / {totalPages}
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
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Emlakı Sil</AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem geri alınamaz. {propertyToDelete?.title} 
                adlı emlakı kalıcı olarak silmek istediğinizden emin misiniz?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteProperty}
                className="bg-red-600 hover:bg-red-700"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Property Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedProperty ? 'Emlak Düzenle' : 'Yeni Emlak Ekle'}
              </DialogTitle>
              <DialogDescription>
                {selectedProperty ? 'Mevcut emlak bilgilerini düzenleyin' : 'Yeni emlak bilgilerini girin'}
              </DialogDescription>
            </DialogHeader>
            <PropertyForm
              property={selectedProperty || undefined}
              onSubmit={selectedProperty ? handleUpdateProperty : handleCreateProperty}
              onCancel={() => {
                setIsFormOpen(false);
                setSelectedProperty(null);
              }}
              isLoading={createMutation.isPending || updateMutation.isPending}
            />
          </DialogContent>
        </Dialog>

        {/* Property Detail Dialog */}
        <PropertyDetailDialog
          property={propertyForDetail}
          isOpen={isDetailOpen}
          onClose={() => {
            setIsDetailOpen(false);
            setPropertyForDetail(null);
          }}
          customerName={propertyForDetail ? getCustomerName(propertyForDetail.customerId) : undefined}
          locationString={propertyForDetail ? getLocationString(propertyForDetail.provinceId, propertyForDetail.districtId, propertyForDetail.neighborhoodId) : undefined}
        />
      </div>
    </DashboardLayout>
  );
} 