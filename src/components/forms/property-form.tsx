'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  PropertyType, 
  PropertyStatus, 
  LandZoneStatus, 
  LandType, 
  FieldType, 
  HeatingType,
  ElevatorType,
  ParkingType,
  FornitureStatus,
  WorkplaceType,
  MezzanineStatus,
  BasementStatus,
  UsageStatus,
  Property,
  CreatePropertyRequest,
  Customer
} from '@/types';
import { customerService } from '@/services/customer-service';
import { locationService } from '@/services/location-service';

// Form validation schema
const basePropertySchema = z.object({
  title: z.string().min(1, 'Başlık gereklidir'),
  propertyType: z.nativeEnum(PropertyType, { required_error: 'Emlak tipi seçilmelidir' }),
  provinceId: z.number().min(1, 'Şehir seçilmelidir'),
  districtId: z.number().min(1, 'İlçe seçilmelidir'),
  neighborhoodId: z.number().min(1, 'Mahalle seçilmelidir'),
  // Aracı bilgileri opsiyonel: boş bırakılabilir
  intermediaryFullName: z.union([
    z.literal(''),
    z.string().min(1, 'Aracı adı gereklidir')
  ]),
  intermediaryPhone: z.union([
    z.literal(''),
    z
      .string()
      .min(10, 'Geçerli telefon numarası giriniz')
      .max(11, 'Telefon numarası en fazla 11 haneli olmalıdır')
  ]),
  status: z.enum(['Satılık', 'Kiralık', 'SatılıkKiralık', 'Rezerv', 'Satıldı', 'Kiralandı'], { required_error: 'Durum seçilmelidir' }),
  notes: z.string().optional(),
  customerId: z.number().min(1, 'Müşteri seçilmelidir'),
  // Type-specific fields - make them all optional and accept both string and number
  BlockNumber: z.string().optional(),
  ParcelNumber: z.string().optional(),
  TotalArea: z.number().optional(),
  PricePerSquareMeter: z.number().optional(),
  TotalPrice: z.number().optional(),
  ZoningStatus: z.union([z.number(), z.string()]).optional(),
  LandType: z.union([z.number(), z.string()]).optional(),
  RoadStatus: z.string().optional(),
  FieldType: z.union([z.number(), z.string()]).optional(),
  HasShareholder: z.boolean().optional(),
  Floor: z.string().optional(),
  RoomCount: z.number().optional(),
  BathroomCount: z.number().optional(),
  BalconyCount: z.number().optional(),
  LivingRoomCount: z.number().optional(),
  ParkingCount: z.string().optional(),
  TotalAreaGross: z.number().optional(),
  TotalAreaNet: z.number().optional(),
  HeatingType: z.union([z.number(), z.string()]).optional(),
  ElevatorType: z.union([z.number(), z.string()]).optional(),
  ParkingType: z.union([z.number(), z.string()]).optional(),
  FornitureStatus: z.union([z.number(), z.string()]).optional(),
  WorkplaceType: z.union([z.number(), z.string()]).optional(),
  MezzanineStatus: z.union([z.number(), z.string()]).optional(),
  BasementStatus: z.union([z.number(), z.string()]).optional(),
  UsageStatus: z.union([z.number(), z.string()]).optional(),
  ShareRatio: z.number().optional(),
});

interface PropertyFormProps {
  property?: Property;
  onSubmit: (data: CreatePropertyRequest) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PropertyForm({ property, onSubmit, onCancel, isLoading }: PropertyFormProps) {
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType | undefined>(
    property?.propertyType
  );
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | undefined>(
    property?.provinceId
  );
  const [selectedDistrictId, setSelectedDistrictId] = useState<number | undefined>(
    property?.districtId
  );

  // Fetch customers for dropdown
  const { data: customers = [] } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customerService.getCustomers(),
  });

  // Fetch provinces
  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: () => locationService.getProvinces(),
  });

  // Fetch districts based on selected province
  const { data: districts = [] } = useQuery({
    queryKey: ['districts', selectedProvinceId],
    queryFn: () => locationService.getDistrictsByProvince(selectedProvinceId!),
    enabled: !!selectedProvinceId,
  });

  // Fetch neighborhoods based on selected district
  const { data: neighborhoods = [] } = useQuery({
    queryKey: ['neighborhoods', selectedDistrictId],
    queryFn: () => locationService.getNeighborhoodsByDistrict(selectedDistrictId!),
    enabled: !!selectedDistrictId,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm({
    resolver: zodResolver(basePropertySchema),
    defaultValues: property ? {
      title: property.title,
      propertyType: property.propertyType,
      provinceId: property.provinceId,
      districtId: property.districtId,
      neighborhoodId: property.neighborhoodId,
      intermediaryFullName: property.intermediaryFullName,
      intermediaryPhone: property.intermediaryPhone,
      status: property.status,
      notes: property.notes,
      customerId: property.customerId,
      ...property.typeSpecificProperties
    } : {
      title: '',
      propertyType: undefined,
      provinceId: 0,
      districtId: 0,
      neighborhoodId: 0,
      intermediaryFullName: '',
      intermediaryPhone: '',
      status: 'Satılık',
      notes: '',
      customerId: undefined,
    }
  });

  const watchedPropertyType = watch('propertyType');
  const watchedTotalArea = watch('TotalArea');
  const watchedPricePerSquareMeter = watch('PricePerSquareMeter');

  // Update selected property type when form value changes
  useEffect(() => {
    if (watchedPropertyType !== undefined) {
      setSelectedPropertyType(watchedPropertyType);
    }
  }, [watchedPropertyType]);

  // Auto-calculate total price
  useEffect(() => {
    if (watchedTotalArea && watchedPricePerSquareMeter) {
      const totalPrice = watchedTotalArea * watchedPricePerSquareMeter;
      setValue('TotalPrice', totalPrice);
    }
  }, [watchedTotalArea, watchedPricePerSquareMeter, setValue]);

  // Reset form when property changes (for new vs edit mode)
  useEffect(() => {
    if (!property) {
      // New property mode - reset form to default values
      reset({
        title: '',
        propertyType: undefined,
        provinceId: 0,
        districtId: 0,
        neighborhoodId: 0,
        intermediaryFullName: '',
        intermediaryPhone: '',
        status: 'Satılık',
        notes: '',
        customerId: undefined,
      });
      setSelectedPropertyType(undefined);
      setSelectedProvinceId(undefined);
      setSelectedDistrictId(undefined);
    } else {
      // Edit mode - load property data
      reset({
        title: property.title,
        propertyType: property.propertyType,
        provinceId: property.provinceId,
        districtId: property.districtId,
        neighborhoodId: property.neighborhoodId,
        intermediaryFullName: property.intermediaryFullName,
        intermediaryPhone: property.intermediaryPhone,
        status: property.status,
        notes: property.notes,
        customerId: property.customerId,
        ...property.typeSpecificProperties
      });
      setSelectedPropertyType(property.propertyType);
      setSelectedProvinceId(property.provinceId);
      setSelectedDistrictId(property.districtId);
    }
  }, [property, reset]);

  // Handle province change
  const handleProvinceChange = (value: string) => {
    const provinceId = parseInt(value);
    setSelectedProvinceId(provinceId);
    setValue('provinceId', provinceId);
    
    // Reset district and neighborhood when province changes
    setSelectedDistrictId(undefined);
    setValue('districtId', 0);
    setValue('neighborhoodId', 0);
  };

  // Handle district change
  const handleDistrictChange = (value: string) => {
    const districtId = parseInt(value);
    setSelectedDistrictId(districtId);
    setValue('districtId', districtId);
    
    // Reset neighborhood when district changes
    setValue('neighborhoodId', 0);
  };

  // Handle neighborhood change
  const handleNeighborhoodChange = (value: string) => {
    const neighborhoodId = parseInt(value);
    setValue('neighborhoodId', neighborhoodId);
  };

  const onFormSubmit = async (data: any) => {
    try {
      console.log('=== FORM SUBMIT STARTED ===');
      console.log('Raw form data received:', data);
      console.log('Form errors:', errors);
      
      // Prepare type-specific properties
      const typeSpecificProperties: any = {};
      
      // Copy all form fields except base property fields to typeSpecificProperties
      const baseFields = ['title', 'propertyType', 'provinceId', 'districtId', 'neighborhoodId', 
                         'intermediaryFullName', 'intermediaryPhone', 'status', 'notes', 'customerId'];
      
      Object.keys(data).forEach(key => {
        if (!baseFields.includes(key)) {
          let value = data[key];
          
          console.log(`Processing field ${key} with value:`, value, typeof value);
          
          // Convert enum string values to numbers if they exist
          if (value !== undefined && value !== null && value !== '') {
            // Special handling for enum fields - convert string names to numeric values
            if (key === 'ZoningStatus') {
              if (typeof value === 'string') {
                switch (value) {
                  case 'Var': value = LandZoneStatus.Var; break;
                  case 'Yok': value = LandZoneStatus.Yok; break;
                  case 'Belirsiz': value = LandZoneStatus.Belirsiz; break;
                  default: 
                    // If it's a numeric string, convert to number
                    if (!isNaN(Number(value))) value = Number(value);
                }
              }
            } else if (key === 'LandType') {
              if (typeof value === 'string') {
                switch (value) {
                  case 'Arsa': value = LandType.Arsa; break;
                  case 'Sanayi': value = LandType.Sanayi; break;
                  case 'Çiftlik': value = LandType.Çiftlik; break;
                  case 'Belirsiz': value = LandType.Belirsiz; break;
                  default: 
                    if (!isNaN(Number(value))) value = Number(value);
                }
              }
            } else if (key === 'FieldType') {
              if (typeof value === 'string') {
                switch (value) {
                  case 'Tarla': value = FieldType.Tarla; break;
                  case 'Bağ': value = FieldType.Bağ; break;
                  case 'Bahçe': value = FieldType.Bahçe; break;
                  case 'Belirsiz': value = FieldType.Belirsiz; break;
                  default: 
                    if (!isNaN(Number(value))) value = Number(value);
                }
              }
            } else if (key === 'HeatingType') {
              if (typeof value === 'string') {
                console.log(`Converting HeatingType: "${value}"`);
                switch (value) {
                  case 'Merkezi': value = HeatingType.Merkezi; break;
                  case 'MerkeziPayölçer': value = HeatingType.MerkeziPayölçer; break;
                  case 'Kalorifer': value = HeatingType.Kalorifer; break;
                  case 'Kombi': value = HeatingType.Kombi; break;
                  case 'Elektrikli': value = HeatingType.Elektrikli; break;
                  case 'Soba': value = HeatingType.Soba; break;
                  case 'Klima': value = HeatingType.Klima; break;
                  case 'YerdenIsıtma': value = HeatingType.YerdenIsıtma; break;
                  case 'Yok': value = HeatingType.Yok; break;
                  case 'Belirsiz': value = HeatingType.Belirsiz; break;
                  default: 
                    console.log(`No match for HeatingType: "${value}"`);
                    if (!isNaN(Number(value))) value = Number(value);
                }
                console.log(`HeatingType converted to:`, value);
              }
            } else if (key === 'ElevatorType') {
              if (typeof value === 'string') {
                console.log(`Converting ElevatorType: "${value}"`);
                switch (value) {
                  case 'Var': value = ElevatorType.Var; break;
                  case 'Yok': value = ElevatorType.Yok; break;
                  case 'Belirsiz': value = ElevatorType.Belirsiz; break;
                  default: 
                    console.log(`No match for ElevatorType: "${value}"`);
                    if (!isNaN(Number(value))) value = Number(value);
                }
                console.log(`ElevatorType converted to:`, value);
              }
            } else if (key === 'ParkingType') {
              if (typeof value === 'string') {
                console.log(`Converting ParkingType: "${value}"`);
                switch (value) {
                  case 'VarAçık': value = ParkingType.VarAçık; break;
                  case 'VarKapalı': value = ParkingType.VarKapalı; break;
                  case 'Yok': value = ParkingType.Yok; break;
                  case 'Belirsiz': value = ParkingType.Belirsiz; break;
                  default: 
                    console.log(`No match for ParkingType: "${value}"`);
                    if (!isNaN(Number(value))) value = Number(value);
                }
                console.log(`ParkingType converted to:`, value);
              }
            } else if (key === 'FornitureStatus') {
              if (typeof value === 'string') {
                console.log(`Converting FornitureStatus: "${value}"`);
                switch (value) {
                  case 'Eşyalı': value = FornitureStatus.Eşyalı; break;
                  case 'Eşyasız': value = FornitureStatus.Eşyasız; break;
                  case 'KısmenEşyalı': value = FornitureStatus.KısmenEşyalı; break;
                  case 'Belirsiz': value = FornitureStatus.Belirsiz; break;
                  default: 
                    console.log(`No match for FornitureStatus: "${value}"`);
                    if (!isNaN(Number(value))) value = Number(value);
                }
                console.log(`FornitureStatus converted to:`, value);
              }
            } else if (key === 'WorkplaceType') {
              if (typeof value === 'string') {
                switch (value) {
                  case 'Satılık': value = WorkplaceType.Satılık; break;
                  case 'Kiralık': value = WorkplaceType.Kiralık; break;
                  case 'DevrenKiralık': value = WorkplaceType.DevrenKiralık; break;
                  case 'DevrenSatılık': value = WorkplaceType.DevrenSatılık; break;
                  case 'Belirsiz': value = WorkplaceType.Belirsiz; break;
                  default: 
                    if (!isNaN(Number(value))) value = Number(value);
                }
              }
            } else if (key === 'MezzanineStatus') {
              if (typeof value === 'string') {
                switch (value) {
                  case 'Var': value = MezzanineStatus.Var; break;
                  case 'Yok': value = MezzanineStatus.Yok; break;
                  case 'Belirsiz': value = MezzanineStatus.Belirsiz; break;
                  default: 
                    if (!isNaN(Number(value))) value = Number(value);
                }
              }
            } else if (key === 'BasementStatus') {
              if (typeof value === 'string') {
                switch (value) {
                  case 'Var': value = BasementStatus.Var; break;
                  case 'Yok': value = BasementStatus.Yok; break;
                  case 'Belirsiz': value = BasementStatus.Belirsiz; break;
                  default: 
                    if (!isNaN(Number(value))) value = Number(value);
                }
              }
            } else if (key === 'UsageStatus') {
              if (typeof value === 'string') {
                switch (value) {
                  case 'Boş': value = UsageStatus.Boş; break;
                  case 'Dolu': value = UsageStatus.Dolu; break;
                  case 'DoluKiracılı': value = UsageStatus.DoluKiracılı; break;
                  case 'Belirsiz': value = UsageStatus.Belirsiz; break;
                  default: 
                    if (!isNaN(Number(value))) value = Number(value);
                }
              }
            } else {
              // For other fields, check if it's a numeric string
              if (typeof value === 'string' && !isNaN(Number(value))) {
                value = Number(value);
                console.log(`Converted ${key} to number:`, value);
              }
            }
          }
          
          typeSpecificProperties[key] = value;
        }
      });

      console.log('Type-specific properties prepared:', typeSpecificProperties);

      const formData: CreatePropertyRequest = {
        title: data.title,
        propertyType: Number(data.propertyType),
        provinceId: Number(data.provinceId),
        districtId: Number(data.districtId),
        neighborhoodId: Number(data.neighborhoodId),
        intermediaryFullName: data.intermediaryFullName,
        intermediaryPhone: data.intermediaryPhone,
        status: data.status,
        notes: data.notes || '',
        customerId: Number(data.customerId),
        typeSpecificProperties,
      };

      console.log('Final form data being submitted:', formData);
      console.log('TypeSpecificProperties detail:', JSON.stringify(typeSpecificProperties, null, 2));
      
      console.log('Calling onSubmit...');
      await onSubmit(formData);
      console.log('onSubmit completed successfully');
      
    } catch (error) {
      console.error('Form submit error:', error);
      throw error; // Re-throw to let react-hook-form handle it
    }
  };

  const renderTypeSpecificFields = () => {
    if (!selectedPropertyType && selectedPropertyType !== 0) return null;

    switch (selectedPropertyType) {
      case PropertyType.Land:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Arsa Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="BlockNumber">Ada Numarası</Label>
                  <Input {...register('BlockNumber')} placeholder="Ada numarası" />
                </div>
                <div>
                  <Label htmlFor="ParcelNumber">Parsel Numarası</Label>
                  <Input {...register('ParcelNumber')} placeholder="Parsel numarası" />
                </div>
                <div>
                  <Label htmlFor="TotalArea">Toplam Alan (m²)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    {...register('TotalArea', { valueAsNumber: true })} 
                    placeholder="Toplam alan" 
                  />
                </div>
                <div>
                  <Label htmlFor="PricePerSquareMeter">m² Fiyatı (₺)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    {...register('PricePerSquareMeter', { valueAsNumber: true })} 
                    placeholder="Metrekare fiyatı" 
                  />
                </div>
                <div>
                  <Label htmlFor="TotalPrice">Toplam Fiyat (₺) - Otomatik</Label>
                  <Input 
                    type="number" 
                    {...register('TotalPrice', { valueAsNumber: true })} 
                    placeholder="Otomatik hesaplanacak"
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="ZoningStatus">İmar Durumu</Label>
                  <Select 
                    onValueChange={(value) => setValue('ZoningStatus', value)}
                    value={watch('ZoningStatus')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="İmar durumunu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Var">Var</SelectItem>
                      <SelectItem value="Yok">Yok</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="LandType">Arsa Tipi</Label>
                  <Select 
                    onValueChange={(value) => setValue('LandType', value)}
                    value={watch('LandType')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Arsa tipini seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arsa">Arsa</SelectItem>
                      <SelectItem value="Sanayi">Sanayi</SelectItem>
                      <SelectItem value="Çiftlik">Çiftlik</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case PropertyType.Field:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Tarla Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="BlockNumber">Ada Numarası</Label>
                  <Input {...register('BlockNumber')} placeholder="Ada numarası" />
                </div>
                <div>
                  <Label htmlFor="ParcelNumber">Parsel Numarası</Label>
                  <Input {...register('ParcelNumber')} placeholder="Parsel numarası" />
                </div>
                <div>
                  <Label htmlFor="TotalArea">Toplam Alan (m²)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    {...register('TotalArea', { valueAsNumber: true })} 
                    placeholder="Toplam alan" 
                  />
                </div>
                <div>
                  <Label htmlFor="PricePerSquareMeter">m² Fiyatı (₺)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    {...register('PricePerSquareMeter', { valueAsNumber: true })} 
                    placeholder="Metrekare fiyatı" 
                  />
                </div>
                <div>
                  <Label htmlFor="TotalPrice">Toplam Fiyat (₺) - Otomatik</Label>
                  <Input 
                    type="number" 
                    {...register('TotalPrice', { valueAsNumber: true })} 
                    placeholder="Otomatik hesaplanacak"
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="RoadStatus">Yol Durumu</Label>
                  <Input {...register('RoadStatus')} placeholder="Yol durumu" />
                </div>
                <div>
                  <Label htmlFor="FieldType">Tarla Tipi</Label>
                  <Select 
                    onValueChange={(value) => setValue('FieldType', value)}
                    value={watch('FieldType')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Tarla tipini seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tarla">Tarla</SelectItem>
                      <SelectItem value="Bağ">Bağ</SelectItem>
                      <SelectItem value="Bahçe">Bahçe</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="HasShareholder"
                    {...register('HasShareholder')}
                    checked={watch('HasShareholder') || false}
                    onCheckedChange={(checked: boolean) => {
                      setValue('HasShareholder', checked === true);
                    }}
                  />
                  <Label htmlFor="HasShareholder" className="cursor-pointer">
                    Hissedar Var mı?
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case PropertyType.Apartment:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Daire Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="Floor">Kat</Label>
                  <Input {...register('Floor')} placeholder="Kat" />
                </div>
                <div>
                  <Label htmlFor="RoomCount">Oda Sayısı</Label>
                  <Input 
                    type="number" 
                    {...register('RoomCount', { valueAsNumber: true })} 
                    placeholder="Oda sayısı" 
                  />
                </div>
                <div>
                  <Label htmlFor="BathroomCount">Banyo Sayısı</Label>
                  <Input 
                    type="number" 
                    {...register('BathroomCount', { valueAsNumber: true })} 
                    placeholder="Banyo sayısı" 
                  />
                </div>
                <div>
                  <Label htmlFor="BalconyCount">Balkon Sayısı</Label>
                  <Input 
                    type="number" 
                    {...register('BalconyCount', { valueAsNumber: true })} 
                    placeholder="Balkon sayısı" 
                  />
                </div>
                <div>
                  <Label htmlFor="LivingRoomCount">Salon Sayısı</Label>
                  <Input 
                    type="number" 
                    {...register('LivingRoomCount', { valueAsNumber: true })} 
                    placeholder="Salon sayısı" 
                  />
                </div>
                <div>
                  <Label htmlFor="ParkingCount">Otopark Sayısı</Label>
                  <Input {...register('ParkingCount')} placeholder="Otopark sayısı" />
                </div>
                <div>
                  <Label htmlFor="TotalAreaGross">Brüt Alan (m²)</Label>
                  <Input 
                    type="number" 
                    {...register('TotalAreaGross', { valueAsNumber: true })} 
                    placeholder="Brüt alan" 
                  />
                </div>
                <div>
                  <Label htmlFor="TotalAreaNet">Net Alan (m²)</Label>
                  <Input 
                    type="number" 
                    {...register('TotalAreaNet', { valueAsNumber: true })} 
                    placeholder="Net alan" 
                  />
                </div>
                <div>
                  <Label htmlFor="TotalPrice">Toplam Fiyat (₺)</Label>
                  <Input 
                    type="number" 
                    {...register('TotalPrice', { valueAsNumber: true })} 
                    placeholder="Toplam fiyat" 
                  />
                </div>
                <div>
                  <Label htmlFor="HeatingType">Isıtma Tipi</Label>
                  <Select 
                    onValueChange={(value) => setValue('HeatingType', value)}
                    value={watch('HeatingType')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Isıtma tipini seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Merkezi">Merkezi</SelectItem>
                      <SelectItem value="MerkeziPayölçer">Merkezi Pay Ölçer</SelectItem>
                      <SelectItem value="Kalorifer">Kalorifer</SelectItem>
                      <SelectItem value="Kombi">Kombi</SelectItem>
                      <SelectItem value="Elektrikli">Elektrikli</SelectItem>
                      <SelectItem value="Soba">Soba</SelectItem>
                      <SelectItem value="Klima">Klima</SelectItem>
                      <SelectItem value="YerdenIsıtma">Yerden Isıtma</SelectItem>
                      <SelectItem value="Yok">Yok</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ElevatorType">Asansör</Label>
                  <Select 
                    onValueChange={(value) => setValue('ElevatorType', value)}
                    value={watch('ElevatorType')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Asansör durumu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Var">Var</SelectItem>
                      <SelectItem value="Yok">Yok</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ParkingType">Otopark Tipi</Label>
                  <Select 
                    onValueChange={(value) => setValue('ParkingType', value)}
                    value={watch('ParkingType')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Otopark tipini seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="VarAçık">Var (Açık)</SelectItem>
                      <SelectItem value="VarKapalı">Var (Kapalı)</SelectItem>
                      <SelectItem value="Yok">Yok</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="FornitureStatus">Eşya Durumu</Label>
                  <Select 
                    onValueChange={(value) => setValue('FornitureStatus', value)}
                    value={watch('FornitureStatus')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Eşya durumunu seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Eşyalı">Eşyalı</SelectItem>
                      <SelectItem value="Eşyasız">Eşyasız</SelectItem>
                      <SelectItem value="KısmenEşyalı">Kısmen Eşyalı</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case PropertyType.Commercial:
        return (
          <Card>
            <CardHeader>
              <CardTitle>İşyeri Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="WorkplaceType">İşyeri Tipi</Label>
                  <Select 
                    onValueChange={(value) => setValue('WorkplaceType', value)}
                    value={watch('WorkplaceType')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="İşyeri tipini seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Satılık">Satılık</SelectItem>
                      <SelectItem value="Kiralık">Kiralık</SelectItem>
                      <SelectItem value="DevrenKiralık">Devren Kiralık</SelectItem>
                      <SelectItem value="DevrenSatılık">Devren Satılık</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="TotalAreaGross">Brüt Alan (m²)</Label>
                  <Input 
                    type="number" 
                    {...register('TotalAreaGross', { valueAsNumber: true })} 
                    placeholder="Brüt alan" 
                  />
                </div>
                <div>
                  <Label htmlFor="TotalAreaNet">Net Alan (m²)</Label>
                  <Input 
                    type="number" 
                    {...register('TotalAreaNet', { valueAsNumber: true })} 
                    placeholder="Net alan" 
                  />
                </div>
                <div>
                  <Label htmlFor="RoomCount">Oda Sayısı</Label>
                  <Input 
                    type="number" 
                    {...register('RoomCount', { valueAsNumber: true })} 
                    placeholder="Oda sayısı" 
                  />
                </div>
                <div>
                  <Label htmlFor="BathroomCount">Banyo Sayısı</Label>
                  <Input 
                    type="number" 
                    {...register('BathroomCount', { valueAsNumber: true })} 
                    placeholder="Banyo sayısı" 
                  />
                </div>
                <div>
                  <Label htmlFor="TotalPrice">Toplam Fiyat (₺)</Label>
                  <Input 
                    type="number" 
                    {...register('TotalPrice', { valueAsNumber: true })} 
                    placeholder="Toplam fiyat" 
                  />
                </div>
                <div>
                  <Label htmlFor="HeatingType">Isıtma Tipi</Label>
                  <Select 
                    onValueChange={(value) => setValue('HeatingType', value)}
                    value={watch('HeatingType')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Isıtma tipini seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Merkezi">Merkezi</SelectItem>
                      <SelectItem value="MerkeziPayölçer">Merkezi Pay Ölçer</SelectItem>
                      <SelectItem value="Kalorifer">Kalorifer</SelectItem>
                      <SelectItem value="Kombi">Kombi</SelectItem>
                      <SelectItem value="Elektrikli">Elektrikli</SelectItem>
                      <SelectItem value="Soba">Soba</SelectItem>
                      <SelectItem value="Klima">Klima</SelectItem>
                      <SelectItem value="YerdenIsıtma">Yerden Isıtma</SelectItem>
                      <SelectItem value="Yok">Yok</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="MezzanineStatus">Asma Kat</Label>
                  <Select 
                    onValueChange={(value) => setValue('MezzanineStatus', value)}
                    value={watch('MezzanineStatus')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Asma kat durumu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Var">Var</SelectItem>
                      <SelectItem value="Yok">Yok</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="BasementStatus">Bodrum</Label>
                  <Select 
                    onValueChange={(value) => setValue('BasementStatus', value)}
                    value={watch('BasementStatus')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Bodrum durumu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Var">Var</SelectItem>
                      <SelectItem value="Yok">Yok</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="UsageStatus">Kullanım Durumu</Label>
                  <Select 
                    onValueChange={(value) => setValue('UsageStatus', value)}
                    value={watch('UsageStatus')?.toString() || ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kullanım durumu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Boş">Boş</SelectItem>
                      <SelectItem value="Dolu">Dolu</SelectItem>
                      <SelectItem value="DoluKiracılı">Dolu (Kiracılı)</SelectItem>
                      <SelectItem value="Belirsiz">Belirsiz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case PropertyType.SharedParcel:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Hisseli Parsel Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="BlockNumber">Ada Numarası</Label>
                  <Input {...register('BlockNumber')} placeholder="Ada numarası" />
                </div>
                <div>
                  <Label htmlFor="ParcelNumber">Parsel Numarası</Label>
                  <Input {...register('ParcelNumber')} placeholder="Parsel numarası" />
                </div>
                <div>
                  <Label htmlFor="TotalArea">Toplam Alan (m²)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    {...register('TotalArea', { valueAsNumber: true })} 
                    placeholder="Toplam alan" 
                  />
                </div>
                <div>
                  <Label htmlFor="PricePerSquareMeter">m² Fiyatı (₺)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    {...register('PricePerSquareMeter', { valueAsNumber: true })} 
                    placeholder="Metrekare fiyatı" 
                  />
                </div>
                <div>
                  <Label htmlFor="TotalPrice">Toplam Fiyat (₺) - Otomatik</Label>
                  <Input 
                    type="number" 
                    {...register('TotalPrice', { valueAsNumber: true })} 
                    placeholder="Otomatik hesaplanacak"
                    readOnly
                  />
                </div>
                <div>
                  <Label htmlFor="ShareRatio">Hisse Oranı (0-1)</Label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    max="1"
                    {...register('ShareRatio', { valueAsNumber: true })} 
                    placeholder="Örn: 0.25 (%25 hisse)" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Basic Property Information */}
      <Card>
        <CardHeader>
          <CardTitle>Temel Bilgiler</CardTitle>
          <CardDescription>Emlak hakkında genel bilgiler</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Başlık *</Label>
              <Input
                {...register('title')}
                placeholder="Emlak başlığı"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title.message as string}</p>
              )}
            </div>

            <div>
              <Label htmlFor="propertyType">Emlak Tipi *</Label>
              <Select 
                onValueChange={(value) => setValue('propertyType', parseInt(value))}
                defaultValue={property?.propertyType?.toString()}
              >
                <SelectTrigger className={errors.propertyType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Emlak tipini seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PropertyType.Land.toString()}>Arsa</SelectItem>
                  <SelectItem value={PropertyType.Field.toString()}>Tarla</SelectItem>
                  <SelectItem value={PropertyType.Apartment.toString()}>Daire</SelectItem>
                  <SelectItem value={PropertyType.Commercial.toString()}>İşyeri</SelectItem>
                  <SelectItem value={PropertyType.SharedParcel.toString()}>Hisseli Parsel</SelectItem>
                </SelectContent>
              </Select>
              {errors.propertyType && (
                <p className="text-red-500 text-sm mt-1">{errors.propertyType.message as string}</p>
              )}
            </div>

            <div>
              <Label htmlFor="intermediaryFullName">Aracı Adı</Label>
              <Input
                {...register('intermediaryFullName')}
                placeholder="Aracı kişinin tam adı"
                className={errors.intermediaryFullName ? 'border-red-500' : ''}
              />
              {errors.intermediaryFullName && (
                <p className="text-red-500 text-sm mt-1">{errors.intermediaryFullName.message as string}</p>
              )}
            </div>

            <div>
              <Label htmlFor="intermediaryPhone">Aracı Telefonu</Label>
              <Input
                maxLength={11}
                inputMode="numeric"
                pattern="\d*"
                {...register('intermediaryPhone')}
                placeholder="05xxxxxxxxx"
                className={errors.intermediaryPhone ? 'border-red-500' : ''}
              />
              {errors.intermediaryPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.intermediaryPhone.message as string}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Durum *</Label>
              <Select 
                onValueChange={(value) => setValue('status', value as any)}
                defaultValue={property?.status?.toString() || 'Satılık'}
              >
                <SelectTrigger className={errors.status ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Durumu seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Satılık">Satılık</SelectItem>
                  <SelectItem value="Kiralık">Kiralık</SelectItem>
                  <SelectItem value="SatılıkKiralık">Satılık/Kiralık</SelectItem>
                  <SelectItem value="Rezerv">Rezerv</SelectItem>
                  <SelectItem value="Satıldı">Satıldı</SelectItem>
                  <SelectItem value="Kiralandı">Kiralandı</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="text-red-500 text-sm mt-1">{errors.status.message as string}</p>
              )}
            </div>

            <div>
              <Label htmlFor="customerId">Müşteri *</Label>
              <Select 
                onValueChange={(value) => setValue('customerId', parseInt(value))}
                defaultValue={property?.customerId?.toString()}
              >
                <SelectTrigger className={errors.customerId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Müşteri seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.fullName} - {customer.phone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customerId && (
                <p className="text-red-500 text-sm mt-1">{errors.customerId.message as string}</p>
              )}
            </div>
            
            {/* Lokasyon Seçimi */}
            <div>
              <Label htmlFor="provinceId">İl *</Label>
              <Select 
                onValueChange={handleProvinceChange}
                value={selectedProvinceId?.toString() || ''}
              >
                <SelectTrigger className={errors.provinceId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="İl seçin" />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.id} value={province.id.toString()}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.provinceId && (
                <p className="text-red-500 text-sm mt-1">{errors.provinceId.message as string}</p>
              )}
            </div>

            <div>
              <Label htmlFor="districtId">İlçe *</Label>
              <Select 
                onValueChange={handleDistrictChange}
                value={selectedDistrictId?.toString() || ''}
                disabled={!selectedProvinceId}
              >
                <SelectTrigger className={errors.districtId ? 'border-red-500' : ''}>
                  <SelectValue placeholder={selectedProvinceId ? "İlçe seçin" : "Önce il seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.id.toString()}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.districtId && (
                <p className="text-red-500 text-sm mt-1">{errors.districtId.message as string}</p>
              )}
            </div>

            <div>
              <Label htmlFor="neighborhoodId">Mahalle *</Label>
              <Select 
                onValueChange={handleNeighborhoodChange}
                value={watch('neighborhoodId')?.toString() || ''}
                disabled={!selectedDistrictId}
              >
                <SelectTrigger className={errors.neighborhoodId ? 'border-red-500' : ''}>
                  <SelectValue placeholder={selectedDistrictId ? "Mahalle seçin" : "Önce ilçe seçin"} />
                </SelectTrigger>
                <SelectContent>
                  {neighborhoods.map((neighborhood) => (
                    <SelectItem key={neighborhood.id} value={neighborhood.id.toString()}>
                      {neighborhood.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.neighborhoodId && (
                <p className="text-red-500 text-sm mt-1">{errors.neighborhoodId.message as string}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              {...register('notes')}
              placeholder="Emlak hakkında ek notlar..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Type-specific fields */}
      {renderTypeSpecificFields()}

      {/* Action buttons */}
      <div className="flex gap-4 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          İptal
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          onClick={() => {
            console.log('Submit button clicked');
            console.log('Form errors at submit:', errors);
            console.log('Form is valid:', Object.keys(errors).length === 0);
            
            // Show detailed validation errors if any
            if (Object.keys(errors).length > 0) {
              Object.entries(errors).forEach(([field, error]: [string, any]) => {
                console.log(`Validation error in ${field}:`, error.message);
              });
            }
          }}
        >
          {isLoading ? 'Kaydediliyor...' : property ? 'Güncelle' : 'Ekle'}
        </Button>
      </div>
    </form>
  );
} 