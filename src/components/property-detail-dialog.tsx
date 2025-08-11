'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Property, PropertyType, PropertyStatus, LandZoneStatus, LandType, FieldType, HeatingType, ElevatorType, ParkingType, FornitureStatus, WorkplaceType, MezzanineStatus, BasementStatus, UsageStatus } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Info, History } from 'lucide-react';
import { PropertyPriceHistory } from './property-price-history';

interface PropertyDetailDialogProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
  locationString?: string;
}

// Helper functions to convert enum values to readable strings
const getZoningStatusLabel = (status: number | string | undefined) => {
  console.log('ZoningStatus value:', status, 'type:', typeof status);
  if (status === undefined || status === null) return 'Belirtilmemiş';
  
  // Handle both numeric and string enum values
  if (typeof status === 'string') {
    switch (status.toLowerCase()) {
      case 'var': return 'Var';
      case 'yok': return 'Yok';
      case 'belirsiz': return 'Belirsiz';
      default: 
        console.log('Unknown ZoningStatus string value:', status);
        return status; // Return the original string value
    }
  }
  
  // Handle numeric values
  switch (Number(status)) {
    case LandZoneStatus.Var: return 'Var';
    case LandZoneStatus.Yok: return 'Yok';
    case LandZoneStatus.Belirsiz: return 'Belirsiz';
    default: 
      console.log('Unknown ZoningStatus numeric value:', status);
      return `Bilinmeyen değer (${status})`;
  }
};

const getLandTypeLabel = (type: number | string | undefined) => {
  console.log('LandType value:', type, 'type:', typeof type);
  if (type === undefined || type === null) return 'Belirtilmemiş';
  
  // Handle both numeric and string enum values
  if (typeof type === 'string') {
    switch (type.toLowerCase()) {
      case 'arsa': return 'Arsa';
      case 'sanayi': return 'Sanayi';
      case 'çiftlik': return 'Çiftlik';
      case 'belirsiz': return 'Belirsiz';
      default: 
        console.log('Unknown LandType string value:', type);
        return type; // Return the original string value
    }
  }
  
  // Handle numeric values
  switch (Number(type)) {
    case LandType.Arsa: return 'Arsa';
    case LandType.Sanayi: return 'Sanayi';
    case LandType.Çiftlik: return 'Çiftlik';
    case LandType.Belirsiz: return 'Belirsiz';
    default: 
      console.log('Unknown LandType numeric value:', type);
      return `Bilinmeyen değer (${type})`;
  }
};

const getFieldTypeLabel = (type: number | string | undefined) => {
  console.log('FieldType value:', type, 'type:', typeof type);
  if (type === undefined || type === null) return 'Belirtilmemiş';
  
  if (typeof type === 'string') {
    switch (type.toLowerCase()) {
      case 'tarla': return 'Tarla';
      case 'bağ': return 'Bağ';
      case 'bahçe': return 'Bahçe';
      case 'belirsiz': return 'Belirsiz';
      default: 
        console.log('Unknown FieldType string value:', type);
        return type;
    }
  }
  
  switch (Number(type)) {
    case FieldType.Tarla: return 'Tarla';
    case FieldType.Bağ: return 'Bağ';
    case FieldType.Bahçe: return 'Bahçe';
    case FieldType.Belirsiz: return 'Belirsiz';
    default: 
      console.log('Unknown FieldType numeric value:', type);
      return `Bilinmeyen değer (${type})`;
  }
};

const getHeatingTypeLabel = (type: number | string | undefined) => {
  console.log('HeatingType value:', type, 'type:', typeof type);
  if (type === undefined || type === null) return 'Belirtilmemiş';
  
  if (typeof type === 'string') {
    switch (type.toLowerCase()) {
      case 'merkezi': return 'Merkezi';
      case 'merkezipayölçer': return 'Merkezi Pay Ölçer';
      case 'kalorifer': return 'Kalorifer';
      case 'kombi': return 'Kombi';
      case 'elektrikli': return 'Elektrikli';
      case 'soba': return 'Soba';
      case 'klima': return 'Klima';
      case 'yerdenısıtma': return 'Yerden Isıtma';
      case 'yok': return 'Yok';
      case 'belirsiz': return 'Belirsiz';
      default: 
        console.log('Unknown HeatingType string value:', type);
        return type;
    }
  }
  
  switch (Number(type)) {
    case HeatingType.Merkezi: return 'Merkezi';
    case HeatingType.MerkeziPayölçer: return 'Merkezi Pay Ölçer';
    case HeatingType.Kalorifer: return 'Kalorifer';
    case HeatingType.Kombi: return 'Kombi';
    case HeatingType.Elektrikli: return 'Elektrikli';
    case HeatingType.Soba: return 'Soba';
    case HeatingType.Klima: return 'Klima';
    case HeatingType.YerdenIsıtma: return 'Yerden Isıtma';
    case HeatingType.Yok: return 'Yok';
    case HeatingType.Belirsiz: return 'Belirsiz';
    default: 
      console.log('Unknown HeatingType numeric value:', type);
      return `Bilinmeyen değer (${type})`;
  }
};

const getElevatorTypeLabel = (type: number | string | undefined) => {
  if (type === undefined || type === null) return 'Belirtilmemiş';
  
  if (typeof type === 'string') {
    switch (type.toLowerCase()) {
      case 'var': return 'Var';
      case 'yok': return 'Yok';
      case 'belirsiz': return 'Belirsiz';
      default: return type;
    }
  }
  
  switch (Number(type)) {
    case ElevatorType.Var: return 'Var';
    case ElevatorType.Yok: return 'Yok';
    case ElevatorType.Belirsiz: return 'Belirsiz';
    default: return `Bilinmeyen değer (${type})`;
  }
};

const getParkingTypeLabel = (type: number | string | undefined) => {
  if (type === undefined || type === null) return 'Belirtilmemiş';
  
  if (typeof type === 'string') {
    switch (type.toLowerCase()) {
      case 'varaçık': return 'Var (Açık)';
      case 'varkapalı': return 'Var (Kapalı)';
      case 'yok': return 'Yok';
      case 'belirsiz': return 'Belirsiz';
      default: return type;
    }
  }
  
  switch (Number(type)) {
    case ParkingType.VarAçık: return 'Var (Açık)';
    case ParkingType.VarKapalı: return 'Var (Kapalı)';
    case ParkingType.Yok: return 'Yok';
    case ParkingType.Belirsiz: return 'Belirsiz';
    default: return `Bilinmeyen değer (${type})`;
  }
};

const getFornitureStatusLabel = (status: number | string | undefined) => {
  if (status === undefined || status === null) return 'Belirtilmemiş';
  
  if (typeof status === 'string') {
    switch (status.toLowerCase()) {
      case 'eşyalı': return 'Eşyalı';
      case 'eşyasız': return 'Eşyasız';
      case 'kısmeneşyalı': return 'Kısmen Eşyalı';
      case 'belirsiz': return 'Belirsiz';
      default: return status;
    }
  }
  
  switch (Number(status)) {
    case FornitureStatus.Eşyalı: return 'Eşyalı';
    case FornitureStatus.Eşyasız: return 'Eşyasız';
    case FornitureStatus.KısmenEşyalı: return 'Kısmen Eşyalı';
    case FornitureStatus.Belirsiz: return 'Belirsiz';
    default: return `Bilinmeyen değer (${status})`;
  }
};

const getWorkplaceTypeLabel = (type: number | string | undefined) => {
  if (type === undefined || type === null) return 'Belirtilmemiş';
  
  if (typeof type === 'string') {
    switch (type.toLowerCase()) {
      case 'satılık': return 'Satılık';
      case 'kiralık': return 'Kiralık';
      case 'devrenkiralık': return 'Devren Kiralık';
      case 'devrensatılık': return 'Devren Satılık';
      case 'belirsiz': return 'Belirsiz';
      default: return type;
    }
  }
  
  switch (Number(type)) {
    case WorkplaceType.Satılık: return 'Satılık';
    case WorkplaceType.Kiralık: return 'Kiralık';
    case WorkplaceType.DevrenKiralık: return 'Devren Kiralık';
    case WorkplaceType.DevrenSatılık: return 'Devren Satılık';
    case WorkplaceType.Belirsiz: return 'Belirsiz';
    default: return `Bilinmeyen değer (${type})`;
  }
};

const getMezzanineStatusLabel = (status: number | string | undefined) => {
  if (status === undefined || status === null) return 'Belirtilmemiş';
  
  if (typeof status === 'string') {
    switch (status.toLowerCase()) {
      case 'var': return 'Var';
      case 'yok': return 'Yok';
      case 'belirsiz': return 'Belirsiz';
      default: return status;
    }
  }
  
  switch (Number(status)) {
    case MezzanineStatus.Var: return 'Var';
    case MezzanineStatus.Yok: return 'Yok';
    case MezzanineStatus.Belirsiz: return 'Belirsiz';
    default: return `Bilinmeyen değer (${status})`;
  }
};

const getBasementStatusLabel = (status: number | string | undefined) => {
  if (status === undefined || status === null) return 'Belirtilmemiş';
  
  if (typeof status === 'string') {
    switch (status.toLowerCase()) {
      case 'var': return 'Var';
      case 'yok': return 'Yok';
      case 'belirsiz': return 'Belirsiz';
      default: return status;
    }
  }
  
  switch (Number(status)) {
    case BasementStatus.Var: return 'Var';
    case BasementStatus.Yok: return 'Yok';
    case BasementStatus.Belirsiz: return 'Belirsiz';
    default: return `Bilinmeyen değer (${status})`;
  }
};

const getUsageStatusLabel = (status: number | string | undefined) => {
  if (status === undefined || status === null) return 'Belirtilmemiş';
  
  if (typeof status === 'string') {
    switch (status.toLowerCase()) {
      case 'boş': return 'Boş';
      case 'dolu': return 'Dolu';
      case 'dolukiracılı': return 'Dolu (Kiracılı)';
      case 'belirsiz': return 'Belirsiz';
      default: return status;
    }
  }
  
  switch (Number(status)) {
    case UsageStatus.Boş: return 'Boş';
    case UsageStatus.Dolu: return 'Dolu';
    case UsageStatus.DoluKiracılı: return 'Dolu (Kiracılı)';
    case UsageStatus.Belirsiz: return 'Belirsiz';
    default: return `Bilinmeyen değer (${status})`;
  }
};

export function PropertyDetailDialog({ property, isOpen, onClose, customerName, locationString }: PropertyDetailDialogProps) {
  const [activeTab, setActiveTab] = useState('details');
  const queryClient = useQueryClient();
  
  if (!property) return null;

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    // Fiyat geçmişi tabına geçiş yapıldığında query'yi refetch et
    if (value === 'price-history') {
      queryClient.refetchQueries({ 
        queryKey: ['property-price-history', property.id] 
      });
    }
  };

  const handleClose = () => {
    setActiveTab('details'); // Dialog kapanırken tab'ı sıfırla
    onClose();
  };

  const getPropertyTypeLabel = (type: PropertyType) => {
    const labels: Record<PropertyType, string> = {
      [PropertyType.Land]: 'Arsa',
      [PropertyType.Field]: 'Tarla',
      [PropertyType.Apartment]: 'Daire',
      [PropertyType.Commercial]: 'İşyeri',
      [PropertyType.SharedParcel]: 'Hisseli Parsel'
    };
    return labels[type];
  };

  const getPropertyStatusLabel = (status: any) => {
    let stringStatus = '';
    
    if (typeof status === 'string') {
      stringStatus = status;
    } else {
      // Sayısal değerleri string'e çevir
      switch (Number(status)) {
        case 0: stringStatus = 'Satılık'; break;
        case 1: stringStatus = 'Kiralık'; break;
        case 2: stringStatus = 'SatılıkKiralık'; break;
        case 3: stringStatus = 'Rezerv'; break;
        case 4: stringStatus = 'Satıldı'; break;
        case 5: stringStatus = 'Kiralandı'; break;
        default: stringStatus = 'Satılık'; // Varsayılan değer
      }
    }

    const labels: Record<string, string> = {
      'Satılık': 'Satılık',
      'Kiralık': 'Kiralık',
      'SatılıkKiralık': 'Satılık/Kiralık',
      'Rezerv': 'Rezerv',
      'Satıldı': 'Satıldı',
      'Kiralandı': 'Kiralandı'
    };
    
    return labels[stringStatus] || stringStatus;
  };

  const renderTypeSpecificDetails = () => {
    const typeProperties = property.typeSpecificProperties;
    console.log('Property object:', property);
    console.log('TypeSpecific properties:', typeProperties);
    
    if (!typeProperties) return null;

    switch (property.propertyType) {
      case PropertyType.Land:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Arsa Detayları</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Ada Numarası:</span>
                  <p className="text-sm">{typeProperties.BlockNumber || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Parsel No:</span>
                  <p className="text-sm">{typeProperties.ParcelNumber || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Toplam Alan:</span>
                  <p className="text-sm">{typeProperties.TotalArea ? `${typeProperties.TotalArea} m²` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">m² Fiyatı:</span>
                  <p className="text-sm">{typeProperties.PricePerSquareMeter ? `₺${typeProperties.PricePerSquareMeter.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Toplam Fiyat:</span>
                  <p className="text-sm font-bold">{typeProperties.TotalPrice ? `₺${typeProperties.TotalPrice.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">İmar Durumu:</span>
                  <p className="text-sm">{getZoningStatusLabel(typeProperties.ZoningStatus)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Arsa Tipi:</span>
                  <p className="text-sm">{getLandTypeLabel(typeProperties.LandType)}</p>
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
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Ada Numarası:</span>
                  <p className="text-sm">{typeProperties.BlockNumber || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Parsel No:</span>
                  <p className="text-sm">{typeProperties.ParcelNumber || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Toplam Alan:</span>
                  <p className="text-sm">{typeProperties.TotalArea ? `${typeProperties.TotalArea} m²` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">m² Fiyatı:</span>
                  <p className="text-sm">{typeProperties.PricePerSquareMeter ? `₺${typeProperties.PricePerSquareMeter.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Toplam Fiyat:</span>
                  <p className="text-sm font-bold">{typeProperties.TotalPrice ? `₺${typeProperties.TotalPrice.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Yol Durumu:</span>
                  <p className="text-sm">{typeProperties.RoadStatus || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Tarla Tipi:</span>
                  <p className="text-sm">{getFieldTypeLabel(typeProperties.FieldType)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Hissedar Durumu:</span>
                  <p className="text-sm">{typeProperties.HasShareholder ? 'Var' : 'Yok'}</p>
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
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Kat:</span>
                  <p className="text-sm">{typeProperties.Floor || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Oda Sayısı:</span>
                  <p className="text-sm">{typeProperties.RoomCount || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Banyo Sayısı:</span>
                  <p className="text-sm">{typeProperties.BathroomCount || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Balkon Sayısı:</span>
                  <p className="text-sm">{typeProperties.BalconyCount || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Salon Sayısı:</span>
                  <p className="text-sm">{typeProperties.LivingRoomCount || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Otopark:</span>
                  <p className="text-sm">{typeProperties.ParkingCount || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Brüt Alan:</span>
                  <p className="text-sm">{typeProperties.TotalAreaGross ? `${typeProperties.TotalAreaGross} m²` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Net Alan:</span>
                  <p className="text-sm">{typeProperties.TotalAreaNet ? `${typeProperties.TotalAreaNet} m²` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Toplam Fiyat:</span>
                  <p className="text-sm font-bold">{typeProperties.TotalPrice ? `₺${typeProperties.TotalPrice.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Isıtma:</span>
                  <p className="text-sm">{getHeatingTypeLabel(typeProperties.HeatingType)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Asansör:</span>
                  <p className="text-sm">{getElevatorTypeLabel(typeProperties.ElevatorType)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Otopark Tipi:</span>
                  <p className="text-sm">{getParkingTypeLabel(typeProperties.ParkingType)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Eşya Durumu:</span>
                  <p className="text-sm">{getFornitureStatusLabel(typeProperties.FornitureStatus)}</p>
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
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">İşyeri Tipi:</span>
                  <p className="text-sm">{getWorkplaceTypeLabel(typeProperties.WorkplaceType)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Brüt Alan:</span>
                  <p className="text-sm">{typeProperties.TotalAreaGross ? `${typeProperties.TotalAreaGross} m²` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Net Alan:</span>
                  <p className="text-sm">{typeProperties.TotalAreaNet ? `${typeProperties.TotalAreaNet} m²` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Oda Sayısı:</span>
                  <p className="text-sm">{typeProperties.RoomCount || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Banyo Sayısı:</span>
                  <p className="text-sm">{typeProperties.BathroomCount || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Toplam Fiyat:</span>
                  <p className="text-sm font-bold">{typeProperties.TotalPrice ? `₺${typeProperties.TotalPrice.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Isıtma:</span>
                  <p className="text-sm">{getHeatingTypeLabel(typeProperties.HeatingType)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Asma Kat:</span>
                  <p className="text-sm">{getMezzanineStatusLabel(typeProperties.MezzanineStatus)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Bodrum:</span>
                  <p className="text-sm">{getBasementStatusLabel(typeProperties.BasementStatus)}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Kullanım Durumu:</span>
                  <p className="text-sm">{getUsageStatusLabel(typeProperties.UsageStatus)}</p>
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
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Ada Numarası:</span>
                  <p className="text-sm">{typeProperties.BlockNumber || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Parsel No:</span>
                  <p className="text-sm">{typeProperties.ParcelNumber || 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Toplam Alan:</span>
                  <p className="text-sm">{typeProperties.TotalArea ? `${typeProperties.TotalArea} m²` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">m² Fiyatı:</span>
                  <p className="text-sm">{typeProperties.PricePerSquareMeter ? `₺${typeProperties.PricePerSquareMeter.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Toplam Fiyat:</span>
                  <p className="text-sm font-bold">{typeProperties.TotalPrice ? `₺${typeProperties.TotalPrice.toLocaleString('tr-TR')}` : 'Belirtilmemiş'}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Hisse Oranı:</span>
                  <p className="text-sm">{typeProperties.ShareRatio ? `%${(typeProperties.ShareRatio * 100).toFixed(2)}` : 'Belirtilmemiş'}</p>
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {property.title}
            <Badge variant="outline">
              {getPropertyTypeLabel(property.propertyType)}
            </Badge>
            <Badge variant="secondary">
              {getPropertyStatusLabel(property.status)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Emlak detay bilgilerini görüntüleyin
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full" value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="details" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Detaylar
            </TabsTrigger>
            <TabsTrigger value="price-history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Fiyat Geçmişi
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Temel Bilgiler</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Emlak ID:</span>
                    <p className="text-sm">#{property.id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Kayıt Tarihi:</span>
                    <p className="text-sm">{new Date(property.createdAt).toLocaleDateString('tr-TR')}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Müşteri:</span>
                    <p className="text-sm">{customerName || 'Bilinmiyor'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Aracı:</span>
                    <p className="text-sm">{property.intermediaryFullName}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Aracı Telefon:</span>
                    <p className="text-sm">{property.intermediaryPhone}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Durum:</span>
                    <p className="text-sm">{getPropertyStatusLabel(property.status)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Lokasyon:</span>
                    <div className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <p className="text-sm">{locationString || 'Belirtilmemiş'}</p>
                    </div>
                  </div>
                </div>
                
                {property.notes && (
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Notlar:</span>
                    <p className="text-sm mt-1 p-3 bg-muted rounded-md">{property.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Type-specific details */}
            {renderTypeSpecificDetails()}
          </TabsContent>

          <TabsContent value="price-history" className="mt-6 max-h-[60vh] overflow-y-auto">
            <PropertyPriceHistory propertyId={property.id} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 