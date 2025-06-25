// Property Enums
export enum PropertyType {
  Land = 0,
  Field = 1, 
  Apartment = 2,
  Commercial = 3,
  SharedParcel = 4
}

// Backend database'de string olarak tutulan enum değerleri ile uyum sorunu var
// Geçici olarak string union type kullanıyoruz
export type PropertyStatus = 'Satılık' | 'Kiralık' | 'SatılıkKiralık' | 'Rezerv' | 'Satıldı' | 'Kiralandı';

// Bu enum'u backend sorunu çözülünce aktif edeceğiz
/*
export enum PropertyStatus {
  Satilik = 0,
  Kiralik = 1,
  SatilikKiralik = 2,
  Rezerv = 3,
  Satildi = 4,
  Kiralandi = 5  // YENİ!
}
*/

export enum LandZoneStatus {
  Var = 0,
  Yok = 1,
  Belirsiz = 2
}

export enum LandType {
  Arsa = 0,
  Sanayi = 1,
  Çiftlik = 2,
  Belirsiz = 3
}

export enum FieldType {
  Tarla = 0,
  Bağ = 1,
  Bahçe = 2,
  Belirsiz = 3
}

export enum HeatingType {
  Merkezi = 0,
  MerkeziPayölçer = 1,
  Kalorifer = 2,
  Kombi = 3,
  Elektrikli = 4,
  Soba = 5,
  Klima = 6,
  YerdenIsıtma = 7,
  Yok = 8,
  Belirsiz = 9
}

export enum ElevatorType {
  Var = 0,
  Yok = 1,
  Belirsiz = 2
}

export enum ParkingType {
  VarAçık = 0,
  VarKapalı = 1,
  Yok = 2,
  Belirsiz = 3
}

export enum FornitureStatus {
  Eşyalı = 0,
  Eşyasız = 1,
  KısmenEşyalı = 2,
  Belirsiz = 3
}

export enum WorkplaceType {
  Satılık = 0,
  Kiralık = 1,
  DevrenKiralık = 2,
  DevrenSatılık = 3,
  Belirsiz = 4
}

export enum MezzanineStatus {
  Var = 0,
  Yok = 1,
  Belirsiz = 2
}

export enum BasementStatus {
  Var = 0,
  Yok = 1,
  Belirsiz = 2
}

export enum UsageStatus {
  Boş = 0,
  Dolu = 1,
  DoluKiracılı = 2,
  Belirsiz = 3
}

// Property Interfaces
export interface Property {
  id: number;
  propertyType: PropertyType;
  title: string;
  provinceId: number;
  districtId: number;
  neighborhoodId: number;
  intermediaryFullName: string;
  intermediaryPhone: string;
  status: PropertyStatus;
  notes: string;
  customerId: number;
  typeSpecificProperties: any;
  createdAt: string;
}

// Type-specific property interfaces
export interface LandProperties {
  BlockNumber: string;
  ParcelNumber: string;
  TotalArea: number;
  PricePerSquareMeter: number;
  TotalPrice: number;
  ZoningStatus: LandZoneStatus;
  LandType: LandType;
}

export interface FieldProperties {
  BlockNumber: string;
  ParcelNumber: string;
  TotalArea: number;
  PricePerSquareMeter: number;
  TotalPrice: number;
  RoadStatus: string;
  FieldType: FieldType;
}

export interface ApartmentProperties {
  Floor: string;
  RoomCount: number;
  BathroomCount: number;
  BalconyCount: number;
  LivingRoomCount: number;
  ParkingCount: string;
  Elevator: string;
  HeatingType: HeatingType;
  ElevatorType: ElevatorType;
  ParkingType: ParkingType;
  FornitureStatus: FornitureStatus;
  TotalAreaGross: number;
  TotalAreaNet: number;
  TotalPrice: number;
}

export interface CommercialProperties {
  WorkplaceType: WorkplaceType;
  TotalAreaGross: number;
  TotalAreaNet: number;
  RoomCount: number;
  BathroomCount: number;
  TotalPrice: number;
  HeatingType: HeatingType;
  MezzanineStatus: MezzanineStatus;
  BasementStatus: BasementStatus;
  UsageStatus: UsageStatus;
}

export interface SharedParcelProperties {
  BlockNumber: string;
  ParcelNumber: string;
  TotalArea: number;
  PricePerSquareMeter: number;
  TotalPrice: number;
  ShareRatio: number;
}

export interface CreatePropertyRequest {
  propertyType: PropertyType;
  title: string;
  provinceId: number;
  districtId: number;
  neighborhoodId: number;
  intermediaryFullName: string;
  intermediaryPhone: string;
  status: PropertyStatus;
  notes: string;
  customerId: number;
  typeSpecificProperties: LandProperties | FieldProperties | ApartmentProperties | CommercialProperties | SharedParcelProperties;
}

export interface UpdatePropertyRequest extends CreatePropertyRequest {
  id: number;
}

export interface PropertyFilters {
  search?: string;
  propertyType?: PropertyType;
  status?: PropertyStatus;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

// Price History Interface
export interface PriceHistoryEntry {
  id: number;
  price: number;
  date: string;
  createdAt: string;
} 