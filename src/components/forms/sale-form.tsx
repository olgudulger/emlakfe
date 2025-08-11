'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Calculator,
  Calendar,
  Save,
  X,
  Plus
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { saleService } from '@/services/sale-service';
import { customerService } from '@/services/customer-service';
import { Sale, CreateSaleRequest, UpdateSaleRequest, Property, Customer, SaleStatus, PropertyType, CreateCustomerRequest } from '@/types';
import { CustomerForm } from './customer-form';

interface SaleFormProps {
  sale?: Sale | null;
  properties: Property[];
  customers: Customer[];
  onClose: () => void;
}

export function SaleForm({ sale, properties, customers, onClose }: SaleFormProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState<CreateSaleRequest>({
    propertyId: 0,
    buyerCustomerId: 0,
    salePrice: 0,
    commission: 0,
    expenses: 0,
    commissionRate: 0,
    saleDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    status: SaleStatus.Pending
  });

  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType | null>(null);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [netProfit, setNetProfit] = useState(0);
  const [isCustomerFormOpen, setIsCustomerFormOpen] = useState(false);
  const [existingSales, setExistingSales] = useState<any[]>([]);

  // Initialize form with existing sale data
  useEffect(() => {
    if (sale) {
      console.log('🔄 Initializing edit form with sale data:', sale);
      console.log('🔄 Available properties count:', properties.length);
      console.log('🔄 Available customers count:', customers.length);
      console.log('🔄 Current selectedPropertyType:', selectedPropertyType);
      console.log('🔄 Current selectedProperty:', selectedProperty?.title);

      setFormData({
        propertyId: sale.propertyId,
        buyerCustomerId: sale.buyerCustomerId || 0,
        salePrice: sale.salePrice,
        commission: sale.commission,
        expenses: sale.expenses || 0,
        commissionRate: sale.commissionRate || 0,
        saleDate: format(new Date(sale.saleDate), 'yyyy-MM-dd'),
        notes: sale.notes || '',
        status: sale.status
      });
      
      // Eğer buyerCustomerId yoksa ve buyerCustomerName varsa, müşteri listesinden bul
      if (!sale.buyerCustomerId && sale.buyerCustomerName && customers.length > 0) {
        const buyerCustomer = customers.find(c => c.fullName === sale.buyerCustomerName);
        if (buyerCustomer) {
          console.log('🔍 Found buyer customer by name:', buyerCustomer);
          setFormData(prev => ({ ...prev, buyerCustomerId: buyerCustomer.id }));
        } else {
          console.log('❌ Buyer customer not found by name:', sale.buyerCustomerName);
        }
      }
      
      // Properties array'inde property'yi bul
      const property = properties.find(p => p.id === sale.propertyId);
      console.log('🔍 Found property for edit:', property);
      console.log('🔍 Sale propertyId:', sale.propertyId, typeof sale.propertyId);
      console.log('🔍 Available property IDs:', properties.map(p => `${p.id} (${typeof p.id})`));
      
      if (property) {
        // Sadece henüz set edilmemişse set et
        if (selectedPropertyType !== property.propertyType || selectedProperty?.id !== property.id) {
          console.log('🔄 Property changed or not set, updating...');
          setSelectedProperty(property);
          setSelectedPropertyType(property.propertyType);
          console.log('✅ Set selectedProperty and propertyType:', property.propertyType);
        } else {
          console.log('✅ Property already correctly set, no change needed');
        }
      } else if (properties.length > 0) {
        console.log('❌ Property not found in properties array. PropertyId:', sale.propertyId);
        console.log('Available properties:', properties.map(p => ({ id: p.id, title: p.title, type: p.propertyType })));
        
        // Sadece daha önce set edilmişse reset et
        if (selectedPropertyType !== null || selectedProperty !== null) {
          console.log('🔄 Resetting property selection due to not found');
          setSelectedProperty(null);
          setSelectedPropertyType(null);
        }
      } else {
        console.log('⏳ Properties not loaded yet, will retry...');
      }

      console.log('🔄 Form data set:', {
        propertyId: sale.propertyId,
        buyerCustomerId: sale.buyerCustomerId,
        salePrice: sale.salePrice,
        commission: sale.commission
      });
    }
  }, [sale, properties]);

  // Edit modunda customers yüklendikten sonra buyerCustomerId'yi set et
  useEffect(() => {
    if (sale && customers.length > 0 && formData.buyerCustomerId === 0) {
      console.log('🔍 Looking for buyer customer...');
      console.log('🔍 Sale buyerCustomerId:', sale.buyerCustomerId);
      console.log('🔍 Sale buyerCustomerName:', sale.buyerCustomerName);
      console.log('🔍 Sale buyerCustomer object:', sale.buyerCustomer);
      console.log('🔍 Available customers:', customers.map(c => ({ id: c.id, name: c.fullName })));
      
      let buyerCustomer = null;
      
      // Önce buyerCustomerId ile dene
      if (sale.buyerCustomerId) {
        buyerCustomer = customers.find(c => c.id === sale.buyerCustomerId);
        console.log('🔍 Found buyer by ID:', buyerCustomer);
      }
      
      // buyerCustomer objesi varsa ID'sini kullan
      if (!buyerCustomer && sale.buyerCustomer?.id) {
        buyerCustomer = customers.find(c => c.id === sale.buyerCustomer!.id);
        console.log('🔍 Found buyer by customer object ID:', buyerCustomer);
      }
      
      // buyerCustomerName ile dene
      if (!buyerCustomer && sale.buyerCustomerName) {
        buyerCustomer = customers.find(c => c.fullName === sale.buyerCustomerName);
        console.log('🔍 Found buyer by name:', buyerCustomer);
      }
      
      // buyerCustomer objesi varsa fullName ile dene
      if (!buyerCustomer && sale.buyerCustomer?.fullName) {
        buyerCustomer = customers.find(c => c.fullName === sale.buyerCustomer!.fullName);
        console.log('🔍 Found buyer by customer object name:', buyerCustomer);
      }
      
      if (buyerCustomer) {
        console.log('✅ Setting buyer customer:', buyerCustomer);
        setFormData(prev => ({ ...prev, buyerCustomerId: buyerCustomer.id }));
      } else {
        console.log('❌ Buyer customer not found');
      }
    }
  }, [sale, customers, formData.buyerCustomerId]);

  // Edit modunda properties yüklendikten sonra tekrar kontrol et
  useEffect(() => {
    // Sadece property bulunamamış durumda çalış
    if (sale && properties.length > 0 && selectedPropertyType === null && selectedProperty === null) {
      console.log('🔄 Late binding check - properties loaded, looking for property...');
      console.log('🔍 Looking for propertyId:', sale.propertyId, typeof sale.propertyId);
      console.log('🔍 Available properties:', properties.map(p => ({ 
        id: p.id, 
        idType: typeof p.id,
        title: p.title, 
        type: p.propertyType 
      })));
      
      // Type-safe ID comparison
      const property = properties.find(p => {
        // Try both numeric and string comparison - but handle types properly
        const propertyId = Number(p.id);
        const salePropertyId = Number(sale.propertyId);
        return propertyId === salePropertyId;
      });
      
      console.log('🔍 Found property in late binding:', property);
      
      if (property) {
        setSelectedProperty(property);
        setSelectedPropertyType(property.propertyType);
        console.log('✅ Late binding - Set selectedProperty and propertyType:', property.propertyType);
      } else {
        console.log('❌ Late binding - Property still not found');
        console.log('🔄 Trying fallback approach...');
        
        // Fallback: Backend'den property bilgisini direkt alalım
        console.log('🔄 Sale object contains property info? Checking...');
        
        // Eğer sale objesi property info içeriyorsa kullan
        if (sale.property && sale.property.propertyType !== undefined) {
          console.log('✅ Found property info in sale object:', sale.property);
          setSelectedPropertyType(sale.property.propertyType);
          // sale.property tam Property objesi değil, bu yüzden sadece propertyType'ı set ediyoruz
        } else if ((sale as any).propertyType !== undefined) {
          console.log('✅ Found propertyType directly in sale:', (sale as any).propertyType);
          setSelectedPropertyType((sale as any).propertyType as PropertyType);
        } else {
          console.log('🔄 No property info available, setting default to enable form');
          // En son çare olarak varsayılan type seç
          setSelectedPropertyType(PropertyType.Land);
        }
      }
    }
  }, [sale, properties, selectedPropertyType, selectedProperty]);

  // Debug current state
  useEffect(() => {
    console.log('🔍 Current form state:', {
      selectedPropertyType,
      selectedProperty: selectedProperty?.title,
      formDataPropertyId: formData.propertyId,
      propertiesCount: properties.length,
      filteredPropertiesCount: filteredProperties.length,
      isEditMode: !!sale
    });
  }, [selectedPropertyType, selectedProperty, formData.propertyId, properties.length, filteredProperties.length, sale]);

  // Filter properties by selected type
  useEffect(() => {
    if (selectedPropertyType !== null) {
      const filtered = properties.filter(p => p.propertyType === selectedPropertyType);
      setFilteredProperties(filtered);
    } else {
      setFilteredProperties([]);
    }
  }, [selectedPropertyType, properties]);

  // Calculate commission rate automatically
  useEffect(() => {
    if (formData.salePrice > 0 && formData.commission >= 0) {
      const rate = (formData.commission / formData.salePrice) * 100;
      setFormData(prev => ({ ...prev, commissionRate: Math.round(rate * 10) / 10 })); // Round to 1 decimal
    } else {
      setFormData(prev => ({ ...prev, commissionRate: 0 }));
    }
  }, [formData.salePrice, formData.commission]);

  // Calculate net profit automatically
  useEffect(() => {
    const calculatedNetProfit = formData.commission - (formData.expenses || 0);
    setNetProfit(calculatedNetProfit);
  }, [formData.commission, formData.expenses]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: CreateSaleRequest) => saleService.createSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSaleRequest) => saleService.updateSale(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales'] });
      queryClient.invalidateQueries({ queryKey: ['sales-dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      onClose();
    },
  });

  // Customer create mutation
  const createCustomerMutation = useMutation({
    mutationFn: (data: CreateCustomerRequest) => customerService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-for-sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsCustomerFormOpen(false);
    },
    onError: (error: any) => {
      console.error('Customer creation failed:', error);
      alert(error.response?.data?.message || 'Müşteri oluşturma başarısız oldu.');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.propertyId || !formData.buyerCustomerId) {
      alert('Lütfen tüm gerekli alanları doldurun.');
      return;
    }

    if (formData.buyerCustomerId === 0) {
      alert('Alıcı müşterisi seçilmelidir.');
      return;
    }

    // Debug: Submission öncesi durumu logla
    const selectedProperty = properties.find(p => p.id === formData.propertyId);
    const selectedBuyer = customers.find(c => c.id === formData.buyerCustomerId);
    
    console.log('=== SALE SUBMISSION DEBUG ===');
    console.log('Selected Property:', selectedProperty);
    console.log('Selected Buyer Customer:', selectedBuyer);
    console.log('Form Data:', formData);
    console.log('Property Status:', selectedProperty?.status);
    console.log('Property Customer ID:', selectedProperty?.customerId);
    console.log('Selected Buyer ID:', formData.buyerCustomerId);
    
    // Mevcut satışları kontrol et
    const allSalesQuery = queryClient.getQueryData(['sales']);
    if (allSalesQuery && Array.isArray(allSalesQuery)) {
      const existingSalesForProperty = allSalesQuery.filter((sale: any) => sale.propertyId === formData.propertyId);
      console.log('🚨 Existing sales for this property:', existingSalesForProperty);
      console.log('🚨 Number of existing sales:', existingSalesForProperty.length);
      
      if (existingSalesForProperty.length > 0) {
        console.log('⚠️ WARNING: This property already has sales records!');
        existingSalesForProperty.forEach((sale: any, index: number) => {
          console.log(`   Sale ${index + 1}:`, {
            id: sale.id,
            status: sale.status,
            saleDate: sale.saleDate,
            buyer: sale.buyerCustomer?.fullName
          });
        });
      }
    }
    
    console.log('==============================');

    console.log('Submitting sale data:', formData);

    try {
      if (sale) {
        console.log('Updating existing sale:', { ...formData, id: sale.id });
        await updateMutation.mutateAsync({
          ...formData,
          id: sale.id
        });
      } else {
        console.log('Creating new sale:', formData);
        await createMutation.mutateAsync(formData);
      }
    } catch (error: any) {
      console.error('Sale operation failed:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      // Daha detaylı hata mesajı göster
      let errorMessage = 'İşlem başarısız oldu.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        // Validation errors için
        const errors = error.response.data.errors;
        if (typeof errors === 'object') {
          errorMessage = Object.values(errors).flat().join(', ');
        } else {
          errorMessage = errors.toString();
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleCustomerSubmit = async (data: CreateCustomerRequest) => {
    await createCustomerMutation.mutateAsync(data);
  };

  const handlePropertyTypeChange = (value: string) => {
    console.log('🎯 handlePropertyTypeChange called with value:', value, typeof value);
    
    // Boş string kontrolü ekle
    if (!value || value.trim() === '') {
      console.log('🚨 Empty property type value, ignoring:', value);
      return;
    }
    
    const propertyType = parseInt(value);
    console.log('🎯 Parsed propertyType:', propertyType, 'isNaN:', isNaN(propertyType));
    
    if (isNaN(propertyType)) {
      console.error('🚨 Invalid property type value, ignoring:', value);
      return;
    }
    
    console.log('🎯 Setting selectedPropertyType to:', propertyType);
    setSelectedPropertyType(propertyType as PropertyType);
    setSelectedProperty(null);
    setFormData({ ...formData, propertyId: 0 });
  };

  const handlePropertyChange = (value: string) => {
    // Boş string kontrolü ekle
    if (!value || value.trim() === '') {
      console.log('🚨 Empty property value, ignoring:', value);
      return;
    }
    
    const propertyId = parseInt(value);
    if (isNaN(propertyId)) {
      console.error('🚨 Invalid property ID, ignoring:', value);
      return;
    }
    
    const property = properties.find(p => p.id === propertyId);
    setSelectedProperty(property || null);
    setFormData({ ...formData, propertyId });

    // Debug: Property detaylarını logla
    if (property) {
      console.log('Selected property details:', {
        id: property.id,
        title: property.title,
        status: property.status,
        statusText: property.status === 'Satılık' ? 'Satılık' : property.status === 'Kiralık' ? 'Kiralık' : 'Satılık/Kiralık',
        customerId: property.customerId,
        propertyType: property.propertyType,
        fullProperty: property
      });
      
      // Bu property için önceki satışları kontrol et
      console.log('🔍 Checking previous sales for property ID:', property.id);
      
      // Mevcut satışları kontrol et
      const allSalesQuery = queryClient.getQueryData(['sales']);
      if (allSalesQuery && Array.isArray(allSalesQuery)) {
        const existingSalesForProperty = allSalesQuery.filter((sale: any) => sale.propertyId === property.id);
        setExistingSales(existingSalesForProperty);
        console.log('Found existing sales:', existingSalesForProperty.length);
      } else {
        setExistingSales([]);
      }
    } else {
      setExistingSales([]);
    }

    // Auto-fill buyer customer if property has customer
    if (property && property.customerId && !formData.buyerCustomerId) {
      setFormData(prev => ({ ...prev, buyerCustomerId: property.customerId }));
      console.log('Auto-filled buyer customer from property:', property.customerId);
    }
  };

  const getPropertyTypeName = (type: PropertyType) => {
    switch (type) {
      case PropertyType.Land: return 'Arsa';
      case PropertyType.Field: return 'Tarla';
      case PropertyType.Apartment: return 'Daire';
      case PropertyType.Commercial: return 'İşyeri';
      case PropertyType.SharedParcel: return 'Hisseli';
      default: return 'Bilinmiyor';
    }
  };

  // Filter customers by type
  const buyerCustomers = customers.filter(c => 
    c.customerType === 0 || c.customerType === 2 // Alıcı veya AlıcıSatıcı
  );

  // Helper function to convert string to PropertyType enum
  const convertStringToPropertyType = (typeString: string): PropertyType | null => {
    switch (typeString.toLowerCase()) {
      case 'land': return PropertyType.Land;
      case 'field': return PropertyType.Field;
      case 'apartment': return PropertyType.Apartment;
      case 'commercial': return PropertyType.Commercial;
      case 'sharedparcel': return PropertyType.SharedParcel;
      default: return null;
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Property Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Emlak Seçimi
            </CardTitle>
            <CardDescription>
              Önce emlak tipini seçin, sonra ilgili emlakı seçin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyType">Emlak Tipi *</Label>
                <Select 
                  value={selectedPropertyType?.toString() || ''} 
                  onValueChange={handlePropertyTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Emlak tipi seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Arsa</SelectItem>
                    <SelectItem value="1">Tarla</SelectItem>
                    <SelectItem value="2">Daire</SelectItem>
                    <SelectItem value="3">İşyeri</SelectItem>
                    <SelectItem value="4">Hisseli</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyId">Emlak *</Label>
                <Select 
                  value={(formData.propertyId || 0).toString()} 
                  onValueChange={handlePropertyChange}
                  disabled={filteredProperties.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Emlak seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProperties.map((property) => (
                      <SelectItem key={property.id} value={property.id.toString()}>
                        {property.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedPropertyType !== null && filteredProperties.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Bu tipte emlak bulunamadı.
                  </p>
                )}
              </div>
            </div>

            {selectedProperty && (
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{selectedProperty.title}</h4>
                      <Badge variant="outline">
                        {getPropertyTypeName(selectedProperty.propertyType)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      <p>Aracı: {selectedProperty.intermediaryFullName}</p>
                      <p>Telefon: {selectedProperty.intermediaryPhone}</p>
                      <p>Durum: {selectedProperty.status}</p>
                      {(() => {
                        const propertyOwner = customers.find(c => c.id === selectedProperty.customerId);
                        return propertyOwner ? (
                          <>
                            <p>Mülk Sahibi: {propertyOwner.fullName}</p>
                            <p>Mülk Sahibi Tel: {propertyOwner.phone}</p>
                          </>
                        ) : (
                          <p>Mülk Sahibi ID: {selectedProperty.customerId}</p>
                        );
                      })()}
                      {selectedProperty.typeSpecificProperties?.TotalPrice && (
                        <p>Liste Fiyatı: ₺{selectedProperty.typeSpecificProperties.TotalPrice.toLocaleString('tr-TR')}</p>
                      )}
                    </div>
                    {selectedProperty.status === 'Kiralık' && (
                      <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800 text-sm">
                        ⚠️ Bu emlak sadece "Kiralık" olarak işaretlenmiş. Satış yapabilmek için emlak durumunu kontrol edin.
                      </div>
                    )}
                    {selectedProperty.status === 'Satıldı' && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                        🚨 Bu emlak "Satıldı" olarak işaretlenmiş. Bu emlak için satış işlemi yapılamayabilir.
                      </div>
                    )}
                    {selectedProperty.status === 'Rezerv' && (
                      <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-orange-800 text-sm">
                        ⏳ Bu emlak "Rezerv" durumunda. Satış işlemi için durumu kontrol edin.
                      </div>
                    )}
                    {existingSales.length > 0 && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
                        🚨 <strong>DİKKAT:</strong> Bu emlak için {existingSales.length} adet satış kaydı bulundu! 
                        Bu emlak daha önce satılmış olabilir.
                        <details className="mt-1">
                          <summary className="cursor-pointer text-xs">Detayları göster</summary>
                          <div className="mt-1 text-xs">
                            {existingSales.map((sale, index) => (
                              <div key={sale.id} className="mt-1">
                                #{index + 1}: {sale.buyerCustomer?.fullName} - {sale.saleDate} - Durum: {sale.status}
                              </div>
                            ))}
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Customer Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Müşteri Seçimi
            </CardTitle>
            <CardDescription>
              Alıcı müşterilerini seçin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="buyerCustomerId">Alıcı Müşteri *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCustomerFormOpen(true)}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Yeni Müşteri
                  </Button>
                </div>
                <Select 
                  value={(formData.buyerCustomerId || 0).toString()} 
                  onValueChange={(value) => {
                    // Boş string kontrolü ekle
                    if (!value || value.trim() === '') {
                      console.log('🚨 Empty buyer customer value, ignoring:', value);
                      return;
                    }
                    
                    const customerId = parseInt(value);
                    if (isNaN(customerId)) {
                      console.error('🚨 Invalid customer ID, ignoring:', value);
                      return;
                    }
                    
                    setFormData({ ...formData, buyerCustomerId: customerId });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alıcı seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {buyerCustomers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.fullName} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Mali Bilgiler
            </CardTitle>
            <CardDescription>
              Satış fiyatı, komisyon ve gider bilgilerini girin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* İlk satır: Satış Fiyatı + Alınan Komisyon */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="salePrice">Satış Fiyatı (₺) *</Label>
                <Input
                  id="salePrice"
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.salePrice || ''}
                  onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  required
                  className="text-lg font-mono"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="commission">Alınan Komisyon (₺) *</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.commission || ''}
                  onChange={(e) => setFormData({ ...formData, commission: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  required
                  className="text-lg font-mono"
                />
              </div>
            </div>

            {/* İkinci satır: Komisyon Oranı + Giderler */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="commissionRate">Komisyon Oranı (%)</Label>
                <Input
                  id="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={(formData.commissionRate || 0).toFixed(1)}
                  onChange={(e) => setFormData({ ...formData, commissionRate: parseFloat(e.target.value) || 0 })}
                  placeholder="0.0"
                  disabled
                  className="text-lg font-mono"
                />
                <p className="text-xs text-muted-foreground">Otomatik hesaplanır</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expenses">Giderler (₺)</Label>
                <Input
                  id="expenses"
                  type="number"
                  min="0"
                  step="100"
                  value={formData.expenses || ''}
                  onChange={(e) => setFormData({ ...formData, expenses: parseFloat(e.target.value) || 0 })}
                  placeholder="0"
                  className="text-lg font-mono"
                />
              </div>
            </div>

            {/* Net Profit Display */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    <span className="font-medium">Net Kar:</span>
                  </div>
                  <span className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₺{netProfit.toLocaleString('tr-TR')}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Komisyon ({formData.commission.toLocaleString('tr-TR')}) - Giderler ({(formData.expenses || 0).toLocaleString('tr-TR')})
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Ek Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="saleDate">Satış Tarihi *</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={formData.saleDate}
                  onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Durum *</Label>
                <Select 
                  value={(formData.status || SaleStatus.Pending).toString()} 
                  onValueChange={(value) => {
                    console.log('🎯 Status changed to:', value, 'parsed:', parseInt(value));
                    
                    // Boş string kontrolü ekle
                    if (!value || value.trim() === '') {
                      console.log('🚨 Empty status value, ignoring:', value);
                      return;
                    }
                    
                    const statusValue = parseInt(value);
                    if (isNaN(statusValue)) {
                      console.error('🚨 Invalid status value, ignoring:', value);
                      return;
                    }
                    
                    setFormData({ ...formData, status: statusValue as SaleStatus });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Tamamlandı</SelectItem>
                    <SelectItem value="2">Beklemede</SelectItem>
                    <SelectItem value="3">İptal Edildi</SelectItem>
                    <SelectItem value="4">Ertelendi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notlar</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Satış ile ilgili notlarınızı buraya yazabilirsiniz..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            İptal
          </Button>
          <Button 
            type="submit" 
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {createMutation.isPending || updateMutation.isPending 
              ? 'Kaydediliyor...' 
              : sale ? 'Güncelle' : 'Kaydet'
            }
          </Button>
        </div>
      </form>

      {/* Customer Form Dialog */}
      <Dialog open={isCustomerFormOpen} onOpenChange={setIsCustomerFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Müşteri</DialogTitle>
            <DialogDescription>
              Yeni müşteri kaydı oluşturun.
            </DialogDescription>
          </DialogHeader>
          <CustomerForm
            onSubmit={handleCustomerSubmit}
            isLoading={createCustomerMutation.isPending}
            onCancel={() => setIsCustomerFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 