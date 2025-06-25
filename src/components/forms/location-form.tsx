'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

import { LocationProvince, LocationDistrict } from '@/types';

// Combined form schema for all location types
const locationSchema = z.object({
  name: z.string().min(1, 'Ad gereklidir'),
  provinceId: z.number().optional(),
  districtId: z.number().optional(),
});

type LocationFormData = z.infer<typeof locationSchema>;
type LocationType = 'province' | 'district' | 'neighborhood';

interface LocationFormProps {
  type: LocationType;
  item?: any;
  provinces: LocationProvince[];
  districts: LocationDistrict[];
  selectedProvince?: LocationProvince | null;
  selectedDistrict?: LocationDistrict | null;
  onSubmit: (data: LocationFormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function LocationForm({
  type,
  item,
  provinces,
  districts,
  selectedProvince,
  selectedDistrict,
  onSubmit,
  onCancel,
  isLoading
}: LocationFormProps) {
  const [selectedProvinceId, setSelectedProvinceId] = useState<number | undefined>(
    selectedProvince?.id || item?.provinceId
  );

  const form = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: item?.name || '',
      provinceId: selectedProvince?.id || item?.provinceId,
      districtId: selectedDistrict?.id || item?.districtId,
    }
  });

  // Update selectedProvinceId when props change
  useEffect(() => {
    if (selectedProvince?.id) {
      setSelectedProvinceId(selectedProvince.id);
      form.setValue('provinceId', selectedProvince.id);
    }
    if (selectedDistrict?.id) {
      form.setValue('districtId', selectedDistrict.id);
    }
  }, [selectedProvince, selectedDistrict, form]);

  const handleSubmit = async (data: LocationFormData) => {
    try {
      console.log('Form submission data:', data);
      console.log('Form type:', type);
      
      // Validate required fields based on type
      if (type === 'district' && !data.provinceId) {
        console.log('District missing provinceId');
        form.setError('provinceId', { message: 'İl seçimi gereklidir' });
        return;
      }
      if (type === 'neighborhood' && !data.districtId) {
        console.log('Neighborhood missing districtId, current districtId:', data.districtId);
        form.setError('districtId', { message: 'İlçe seçimi gereklidir' });
        return;
      }
      if (type === 'neighborhood' && !data.provinceId) {
        console.log('Neighborhood missing provinceId');
        form.setError('provinceId', { message: 'İl seçimi gereklidir' });
        return;
      }

      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const filteredDistricts = districts.filter(d => d.provinceId === selectedProvinceId);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Name Field */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {type === 'province' ? 'İl Adı' : 
                 type === 'district' ? 'İlçe Adı' : 'Mahalle Adı'}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={
                    type === 'province' ? 'İl adını girin' : 
                    type === 'district' ? 'İlçe adını girin' : 'Mahalle adını girin'
                  }
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Province Selection for District */}
        {type === 'district' && (
          <FormField
            control={form.control}
            name="provinceId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>İl</FormLabel>
                <Select
                  onValueChange={(value) => {
                    const provinceId = parseInt(value);
                    field.onChange(provinceId);
                    setSelectedProvinceId(provinceId);
                  }}
                  value={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="İl seçin" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province.id} value={province.id.toString()}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* District Selection for Neighborhood */}
        {type === 'neighborhood' && (
          <>
            <FormField
              control={form.control}
              name="provinceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İl</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const provinceId = parseInt(value);
                      field.onChange(provinceId);
                      setSelectedProvinceId(provinceId);
                      // Reset district selection when province changes
                      form.setValue('districtId', undefined);
                    }}
                    value={selectedProvinceId?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="İl seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {provinces.map((province) => (
                        <SelectItem key={province.id} value={province.id.toString()}>
                          {province.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="districtId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>İlçe</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={!selectedProvinceId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="İlçe seçin" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredDistricts.map((district) => (
                        <SelectItem key={district.id} value={district.id.toString()}>
                          {district.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            İptal
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </div>
      </form>
    </Form>
  );
} 