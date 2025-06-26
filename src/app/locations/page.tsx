'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MapPin,
  Plus,
  Search,
  Edit,
  Trash2,
  MoreHorizontal,
  Building,
  TreeDeciduous,
  ChevronDown,
  ChevronRight,
  MapPinIcon
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { locationService } from '@/services/location-service';
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
import { LocationForm } from '../../components/forms/location-form';

type LocationType = 'province' | 'district' | 'neighborhood';

interface LocationFormData {
  name: string;
  provinceId?: number;
  districtId?: number;
}

export default function LocationsPage() {
  const { hasPermission, isInitialized } = useRoleProtection();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<LocationProvince | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<LocationDistrict | null>(null);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<LocationNeighborhood | null>(null);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formType, setFormType] = useState<LocationType>('province');
  const [editingItem, setEditingItem] = useState<any>(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState<{type: LocationType, item: any} | null>(null);
  
  const [expandedProvinces, setExpandedProvinces] = useState<Set<number>>(new Set());
  const [expandedDistricts, setExpandedDistricts] = useState<Set<number>>(new Set());

  // Fetch provinces
  const { data: provinces = [], isLoading, refetch } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => locationService.getProvinces(),
    enabled: hasPermission,
  });

  // Fetch all districts for statistics and display
  const districtsQueries = useQuery({
    queryKey: ['all-districts'],
    queryFn: () => locationService.getAllDistricts(),
    enabled: hasPermission,
  });

  // Fetch all neighborhoods for statistics and display
  const neighborhoodsQueries = useQuery({
    queryKey: ['all-neighborhoods'],
    queryFn: () => locationService.getAllNeighborhoods(),
    enabled: hasPermission,
  });

  const allDistricts = districtsQueries.data || [];
  const allNeighborhoods = neighborhoodsQueries.data || [];

  // Combined loading state
  const isLoadingData = isLoading || districtsQueries.isLoading || neighborhoodsQueries.isLoading;

  // Mutations
  const createProvinceMutation = useMutation({
    mutationFn: locationService.createProvince,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provinces'] });
      toast.success('İl başarıyla eklendi');
      setIsFormOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'İl eklenirken bir hata oluştu');
    }
  });

  const updateProvinceMutation = useMutation({
    mutationFn: locationService.updateProvince,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provinces'] });
      toast.success('İl başarıyla güncellendi');
      setIsFormOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'İl güncellenirken bir hata oluştu');
    }
  });

  const deleteProvinceMutation = useMutation({
    mutationFn: locationService.deleteProvince,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provinces'] });
      toast.success('İl başarıyla silindi');
      setIsDeleteOpen(false);
      setDeleteItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'İl silinirken bir hata oluştu');
    }
  });

  const createDistrictMutation = useMutation({
    mutationFn: locationService.createDistrict,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-districts'] });
      toast.success('İlçe başarıyla eklendi');
      setIsFormOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'İlçe eklenirken bir hata oluştu');
    }
  });

  const updateDistrictMutation = useMutation({
    mutationFn: locationService.updateDistrict,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-districts'] });
      toast.success('İlçe başarıyla güncellendi');
      setIsFormOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'İlçe güncellenirken bir hata oluştu');
    }
  });

  const deleteDistrictMutation = useMutation({
    mutationFn: locationService.deleteDistrict,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-districts'] });
      toast.success('İlçe başarıyla silindi');
      setIsDeleteOpen(false);
      setDeleteItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'İlçe silinirken bir hata oluştu');
    }
  });

  const createNeighborhoodMutation = useMutation({
    mutationFn: locationService.createNeighborhood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-neighborhoods'] });
      toast.success('Mahalle başarıyla eklendi');
      setIsFormOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Mahalle eklenirken bir hata oluştu');
    }
  });

  const updateNeighborhoodMutation = useMutation({
    mutationFn: locationService.updateNeighborhood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-neighborhoods'] });
      toast.success('Mahalle başarıyla güncellendi');
      setIsFormOpen(false);
      setEditingItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Mahalle güncellenirken bir hata oluştu');
    }
  });

  const deleteNeighborhoodMutation = useMutation({
    mutationFn: locationService.deleteNeighborhood,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-neighborhoods'] });
      toast.success('Mahalle başarıyla silindi');
      setIsDeleteOpen(false);
      setDeleteItem(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Mahalle silinirken bir hata oluştu');
    }
  });

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

  const handleFormSubmit = async (data: LocationFormData) => {
    try {
      if (formType === 'province') {
        if (editingItem) {
          await updateProvinceMutation.mutateAsync({ ...data, id: editingItem.id });
        } else {
          await createProvinceMutation.mutateAsync(data as CreateProvinceRequest);
        }
      } else if (formType === 'district') {
        if (editingItem) {
          await updateDistrictMutation.mutateAsync({ ...data, id: editingItem.id, provinceId: data.provinceId! });
        } else {
          await createDistrictMutation.mutateAsync(data as CreateDistrictRequest);
        }
      } else if (formType === 'neighborhood') {
        if (editingItem) {
          await updateNeighborhoodMutation.mutateAsync({ ...data, id: editingItem.id, districtId: data.districtId! });
        } else {
          await createNeighborhoodMutation.mutateAsync(data as CreateNeighborhoodRequest);
        }
      }
    } catch (error) {
      // Error handling is done in mutations
    }
  };

  const handleDelete = async () => {
    if (!deleteItem) return;
    
    try {
      if (deleteItem.type === 'province') {
        await deleteProvinceMutation.mutateAsync(deleteItem.item.id);
      } else if (deleteItem.type === 'district') {
        await deleteDistrictMutation.mutateAsync(deleteItem.item.id);
      } else if (deleteItem.type === 'neighborhood') {
        await deleteNeighborhoodMutation.mutateAsync(deleteItem.item.id);
      }
    } catch (error) {
      // Error handling is done in mutations
    }
  };

  const openCreateForm = (type: LocationType, parentId?: number) => {
    setFormType(type);
    setEditingItem(null);
    if (type === 'district' && parentId) {
      setSelectedProvince(provinces.find(p => p.id === parentId) || null);
      setSelectedDistrict(null);
    } else if (type === 'neighborhood' && parentId) {
      const district = allDistricts.find(d => d.id === parentId);
      setSelectedDistrict(district || null);
      // Also set the province for this district
      if (district) {
        setSelectedProvince(provinces.find(p => p.id === district.provinceId) || null);
      }
    } else {
      setSelectedProvince(null);
      setSelectedDistrict(null);
    }
    setIsFormOpen(true);
  };

  const openEditForm = (type: LocationType, item: any) => {
    setFormType(type);
    setEditingItem(item);
    if (type === 'district') {
      setSelectedProvince(provinces.find(p => p.id === item.provinceId) || null);
    } else if (type === 'neighborhood') {
      setSelectedDistrict(allDistricts.find(d => d.id === item.districtId) || null);
    }
    setIsFormOpen(true);
  };

  const openDeleteDialog = (type: LocationType, item: any) => {
    setDeleteItem({ type, item });
    setIsDeleteOpen(true);
  };

  const toggleProvinceExpansion = (provinceId: number) => {
    const newExpanded = new Set(expandedProvinces);
    if (newExpanded.has(provinceId)) {
      newExpanded.delete(provinceId);
    } else {
      newExpanded.add(provinceId);
    }
    setExpandedProvinces(newExpanded);
  };

  const toggleDistrictExpansion = (districtId: number) => {
    const newExpanded = new Set(expandedDistricts);
    if (newExpanded.has(districtId)) {
      newExpanded.delete(districtId);
    } else {
      newExpanded.add(districtId);
    }
    setExpandedDistricts(newExpanded);
  };

  const getDistrictsForProvince = (provinceId: number) => {
    return allDistricts.filter(d => d.provinceId === provinceId);
  };

  const getNeighborhoodsForDistrict = (districtId: number) => {
    return allNeighborhoods.filter(n => n.districtId === districtId);
  };

  const filteredProvinces = provinces.filter(province =>
    province.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics
  const totalProvinces = provinces.length;
  const totalDistricts = allDistricts.length;
  const totalNeighborhoods = allNeighborhoods.length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Lokasyon Yönetimi</h1>
            <p className="text-muted-foreground">
              İl, ilçe ve mahalleleri yönetin
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => openCreateForm('province')}>
              <Plus className="mr-2 h-4 w-4" />
              Yeni İl
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam İl</CardTitle>
              <Building className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProvinces}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam İlçe</CardTitle>
              <TreeDeciduous className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDistricts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Mahalle</CardTitle>
              <MapPinIcon className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalNeighborhoods}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Arama
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="İl adı ile arama..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Locations Tree */}
        <Card>
          <CardHeader>
            <CardTitle>Lokasyon Ağacı</CardTitle>
            <CardDescription>
              İl, ilçe ve mahallelerin hiyerarşik yapısı
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingData ? (
              <div className="flex justify-center p-8">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span>Lokasyonlar yükleniyor...</span>
                </div>
              </div>
            ) : (
              <>
                {/* Desktop Tree View */}
                <div className="hidden md:block space-y-2">
                  {filteredProvinces.map((province) => (
                    <div key={province.id} className="border rounded-lg">
                      {/* Province */}
                      <div className="flex items-center justify-between p-4 hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleProvinceExpansion(province.id)}
                            className="p-0 h-auto"
                          >
                            {expandedProvinces.has(province.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                          <Building className="h-5 w-5 text-blue-600" />
                          <div>
                            <div className="font-semibold">{province.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {getDistrictsForProvince(province.id).length} ilçe
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCreateForm('district', province.id)}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            İlçe Ekle
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openEditForm('province', province)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Düzenle
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog('province', province)}
                                className="text-red-600"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Sil
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      {/* Districts */}
                      {expandedProvinces.has(province.id) && (
                        <div className="border-t bg-muted/30">
                          {getDistrictsForProvince(province.id).map((district) => (
                            <div key={district.id} className="border-b last:border-b-0">
                              <div className="flex items-center justify-between p-4 pl-12 hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleDistrictExpansion(district.id)}
                                    className="p-0 h-auto"
                                  >
                                    {expandedDistricts.has(district.id) ? (
                                      <ChevronDown className="h-4 w-4" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4" />
                                    )}
                                  </Button>
                                  <TreeDeciduous className="h-4 w-4 text-green-600" />
                                  <div>
                                    <div className="font-medium">{district.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {getNeighborhoodsForDistrict(district.id).length} mahalle
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openCreateForm('neighborhood', district.id)}
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Mahalle Ekle
                                  </Button>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => openEditForm('district', district)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Düzenle
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openDeleteDialog('district', district)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Sil
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              {/* Neighborhoods */}
                              {expandedDistricts.has(district.id) && (
                                <div className="bg-muted/50">
                                  {getNeighborhoodsForDistrict(district.id).map((neighborhood) => (
                                    <div key={neighborhood.id} className="flex items-center justify-between p-4 pl-20 border-b last:border-b-0 hover:bg-muted/70">
                                      <div className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-purple-600" />
                                        <div>
                                          <div className="font-medium">{neighborhood.name}</div>
                                          <div className="text-sm text-muted-foreground">Mahalle</div>
                                        </div>
                                      </div>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
                                          <DropdownMenuItem onClick={() => openEditForm('neighborhood', neighborhood)}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Düzenle
                                          </DropdownMenuItem>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuItem
                                            onClick={() => openDeleteDialog('neighborhood', neighborhood)}
                                            className="text-red-600"
                                          >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Sil
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Mobile Card View */}
                <div className="md:hidden space-y-4">
                  {filteredProvinces.map((province) => (
                    <Card key={province.id} className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <Building className="h-5 w-5 text-blue-600" />
                          <div>
                            <h3 className="font-semibold text-lg">{province.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {getDistrictsForProvince(province.id).length} ilçe
                            </p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>İl İşlemleri</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => openCreateForm('district', province.id)}>
                              <Plus className="mr-2 h-4 w-4" />
                              İlçe Ekle
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditForm('province', province)}>
                              <Edit className="mr-2 h-4 w-4" />
                              İl Düzenle
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog('province', province)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              İl Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Districts in Mobile */}
                      <div className="space-y-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleProvinceExpansion(province.id)}
                          className="w-full"
                        >
                          {expandedProvinces.has(province.id) ? (
                            <>
                              <ChevronDown className="mr-2 h-4 w-4" />
                              İlçeleri Gizle
                            </>
                          ) : (
                            <>
                              <ChevronRight className="mr-2 h-4 w-4" />
                              İlçeleri Göster
                            </>
                          )}
                        </Button>

                        {expandedProvinces.has(province.id) && (
                          <div className="space-y-2 pl-4 border-l-2 border-muted">
                            {getDistrictsForProvince(province.id).map((district) => (
                              <div key={district.id} className="bg-muted/30 rounded-lg p-3">
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex items-center gap-2">
                                    <TreeDeciduous className="h-4 w-4 text-green-600" />
                                    <div>
                                      <div className="font-medium">{district.name}</div>
                                      <div className="text-xs text-muted-foreground">
                                        {getNeighborhoodsForDistrict(district.id).length} mahalle
                                      </div>
                                    </div>
                                  </div>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-6 w-6 p-0">
                                        <MoreHorizontal className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>İlçe İşlemleri</DropdownMenuLabel>
                                      <DropdownMenuItem onClick={() => openCreateForm('neighborhood', district.id)}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Mahalle Ekle
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => openEditForm('district', district)}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        İlçe Düzenle
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() => openDeleteDialog('district', district)}
                                        className="text-red-600"
                                      >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        İlçe Sil
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>

                                {/* Neighborhoods in Mobile */}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleDistrictExpansion(district.id)}
                                  className="w-full text-xs p-1 h-auto"
                                >
                                  {expandedDistricts.has(district.id) ? (
                                    <>
                                      <ChevronDown className="mr-1 h-3 w-3" />
                                      Mahalleleri Gizle
                                    </>
                                  ) : (
                                    <>
                                      <ChevronRight className="mr-1 h-3 w-3" />
                                      Mahalleleri Göster
                                    </>
                                  )}
                                </Button>

                                {expandedDistricts.has(district.id) && (
                                  <div className="space-y-1 mt-2 pl-3 border-l border-muted">
                                    {getNeighborhoodsForDistrict(district.id).map((neighborhood) => (
                                      <div key={neighborhood.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-3 w-3 text-purple-600" />
                                          <span className="font-medium">{neighborhood.name}</span>
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-5 w-5 p-0">
                                              <MoreHorizontal className="h-3 w-3" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Mahalle İşlemleri</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => openEditForm('neighborhood', neighborhood)}>
                                              <Edit className="mr-2 h-4 w-4" />
                                              Düzenle
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              onClick={() => openDeleteDialog('neighborhood', neighborhood)}
                                              className="text-red-600"
                                            >
                                              <Trash2 className="mr-2 h-4 w-4" />
                                              Sil
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {deleteItem?.type === 'province' ? 'İl' : 
                 deleteItem?.type === 'district' ? 'İlçe' : 'Mahalle'} Sil
              </AlertDialogTitle>
              <AlertDialogDescription>
                Bu işlem geri alınamaz. {deleteItem?.item?.name} 
                adlı {deleteItem?.type === 'province' ? 'ili' : 
                      deleteItem?.type === 'district' ? 'ilçeyi' : 'mahalleyi'} kalıcı olarak silmek istediğinizden emin misiniz?
                {deleteItem?.type === 'province' && ' Bu işlem tüm alt ilçe ve mahalleleri de silecektir.'}
                {deleteItem?.type === 'district' && ' Bu işlem tüm alt mahalleleri de silecektir.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>İptal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Sil
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Location Form Dialog */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 
                  `${formType === 'province' ? 'İl' : formType === 'district' ? 'İlçe' : 'Mahalle'} Düzenle` :
                  `Yeni ${formType === 'province' ? 'İl' : formType === 'district' ? 'İlçe' : 'Mahalle'} Ekle`
                }
              </DialogTitle>
              <DialogDescription>
                {editingItem ? 
                  `Mevcut ${formType === 'province' ? 'il' : formType === 'district' ? 'ilçe' : 'mahalle'} bilgilerini düzenleyin` :
                  `Yeni ${formType === 'province' ? 'il' : formType === 'district' ? 'ilçe' : 'mahalle'} bilgilerini girin`
                }
              </DialogDescription>
            </DialogHeader>
            <LocationForm
              type={formType}
              item={editingItem}
              provinces={provinces}
              districts={formType === 'neighborhood' ? allDistricts : []}
              selectedProvince={selectedProvince}
              selectedDistrict={selectedDistrict}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setIsFormOpen(false);
                setEditingItem(null);
                setSelectedProvince(null);
                setSelectedDistrict(null);
              }}
              isLoading={
                createProvinceMutation.isPending || 
                updateProvinceMutation.isPending ||
                createDistrictMutation.isPending || 
                updateDistrictMutation.isPending ||
                createNeighborhoodMutation.isPending || 
                updateNeighborhoodMutation.isPending
              }
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
} 