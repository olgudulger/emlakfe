'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Customer, CreateCustomerRequest, CustomerType, InterestType, ProvincePreference } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

const customerSchema = z.object({
  fullName: z.string().min(2, 'Ad soyad en az 2 karakter olmalıdır'),
  phone: z.string().min(10, 'Geçerli bir telefon numarası girin'),
  budget: z.number().min(0, 'Bütçe 0 veya daha büyük olmalıdır'),
  notes: z.string().optional(),
  interestType: z.nativeEnum(InterestType, {
    required_error: 'İlgi türü seçmelisiniz'
  }),
  customerType: z.nativeEnum(CustomerType, {
    required_error: 'Müşteri tipi seçmelisiniz'
  }),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CreateCustomerRequest) => Promise<void>;
  isLoading?: boolean;
  onCancel?: () => void;
}

const customerTypeOptions = [
  { value: CustomerType.Alıcı, label: 'Alıcı' },
  { value: CustomerType.Satıcı, label: 'Satıcı' },
  { value: CustomerType.AlıcıSatıcı, label: 'Alıcı/Satıcı' },
];

const interestTypeOptions = [
  // Arsa kategorisi
  { value: InterestType.Arsa, label: 'Arsa', category: 'Arsa' },
  { value: InterestType.SanayiArsası, label: 'Sanayi Arsası', category: 'Arsa' },
  { value: InterestType.ÇiftlikArsası, label: 'Çiftlik Arsası', category: 'Arsa' },
  { value: InterestType.ArsadanHisse, label: 'Arsadan Hisse', category: 'Arsa' },
  
  // Tarla kategorisi
  { value: InterestType.Tarla, label: 'Tarla', category: 'Tarla' },
  { value: InterestType.Bağ, label: 'Bağ', category: 'Tarla' },
  { value: InterestType.Bahçe, label: 'Bahçe', category: 'Tarla' },
  { value: InterestType.TarladanHisse, label: 'Tarladan Hisse', category: 'Tarla' },
  
  // Daire kategorisi
  { value: InterestType.Daire, label: 'Daire', category: 'Daire' },
  { value: InterestType.KiralıkDaire, label: 'Kiralık Daire', category: 'Daire' },
  
  // İşyeri kategorisi
  { value: InterestType.İşyeri, label: 'İşyeri', category: 'İşyeri' },
  { value: InterestType.Kiralıkİşyeri, label: 'Kiralık İşyeri', category: 'İşyeri' },
  
  // Genel
  { value: InterestType.Tümü, label: 'Tümü', category: 'Genel' },
];

export function CustomerForm({ customer, onSubmit, isLoading, onCancel }: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      fullName: customer?.fullName || '',
      phone: customer?.phone || '',
      budget: customer?.budget || 0,
      notes: customer?.notes || '',
      interestType: customer?.interestType ?? InterestType.Daire,
      customerType: customer?.customerType ?? CustomerType.Alıcı,
    },
  });

  const handleSubmit = (data: CustomerFormData) => {
    const submitData: CreateCustomerRequest = {
      ...data,
      provincePreferences: [], // Şimdilik boş, daha sonra province seçimi eklenebilir
    };
    onSubmit(submitData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {customer ? 'Müşteriyi Düzenle' : 'Yeni Müşteri Ekle'}
        </CardTitle>
        <CardDescription>
          {customer ? 'Müşteri bilgilerini güncelleyin' : 'Yeni müşteri bilgilerini girin'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          {/* Temel Bilgiler */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="fullName">Ad Soyad</Label>
              <Input
                id="fullName"
                {...form.register('fullName')}
                className={form.formState.errors.fullName ? 'border-red-500' : ''}
                placeholder="Örn: Ahmet Yılmaz"
              />
              {form.formState.errors.fullName && (
                <p className="text-sm text-red-500">{form.formState.errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                {...form.register('phone')}
                className={form.formState.errors.phone ? 'border-red-500' : ''}
                placeholder="Örn: 05341234567"
              />
              {form.formState.errors.phone && (
                <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="budget">Bütçe (₺)</Label>
              <Input
                id="budget"
                type="number"
                min="0"
                {...form.register('budget', { valueAsNumber: true })}
                className={form.formState.errors.budget ? 'border-red-500' : ''}
                placeholder="Örn: 1000000"
              />
              {form.formState.errors.budget && (
                <p className="text-sm text-red-500">{form.formState.errors.budget.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Müşteri Tipi</Label>
              <Select 
                value={form.watch('customerType')?.toString()} 
                onValueChange={(value) => form.setValue('customerType', parseInt(value) as CustomerType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Müşteri tipi seçin" />
                </SelectTrigger>
                <SelectContent>
                  {customerTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.customerType && (
                <p className="text-sm text-red-500">{form.formState.errors.customerType.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>İlgi Türü</Label>
              <Select 
                value={form.watch('interestType')?.toString()} 
                onValueChange={(value) => form.setValue('interestType', parseInt(value) as InterestType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="İlgi türü seçin" />
                </SelectTrigger>
                <SelectContent>
                  {/* Arsa Kategorisi */}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted">
                    Arsa Kategorisi
                  </div>
                  {interestTypeOptions
                    .filter(option => option.category === 'Arsa')
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  
                  {/* Tarla Kategorisi */}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted mt-1">
                    Tarla Kategorisi
                  </div>
                  {interestTypeOptions
                    .filter(option => option.category === 'Tarla')
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  
                  {/* Daire Kategorisi */}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted mt-1">
                    Daire Kategorisi
                  </div>
                  {interestTypeOptions
                    .filter(option => option.category === 'Daire')
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  
                  {/* İşyeri Kategorisi */}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted mt-1">
                    İşyeri Kategorisi
                  </div>
                  {interestTypeOptions
                    .filter(option => option.category === 'İşyeri')
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                  
                  {/* Genel */}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground bg-muted mt-1">
                    Genel
                  </div>
                  {interestTypeOptions
                    .filter(option => option.category === 'Genel')
                    .map((option) => (
                      <SelectItem key={option.value} value={option.value.toString()}>
                        {option.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {form.formState.errors.interestType && (
                <p className="text-sm text-red-500">{form.formState.errors.interestType.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notlar</Label>
            <Textarea
              id="notes"
              placeholder="Müşteri hakkında özel notlar..."
              {...form.register('notes')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Kaydediliyor...
                </>
              ) : (
                customer ? 'Güncelle' : 'Kaydet'
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                İptal
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 