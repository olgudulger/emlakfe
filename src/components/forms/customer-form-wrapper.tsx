'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '@/services/customer-service';
import { CreateCustomerRequest } from '@/types';
import { CustomerForm } from './customer-form';

interface CustomerFormWrapperProps {
  onClose: () => void;
}

export function CustomerFormWrapper({ onClose }: CustomerFormWrapperProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerRequest) => customerService.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers-for-sales'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      onClose();
    },
    onError: (error: any) => {
      console.error('Customer creation failed:', error);
      alert(error.response?.data?.message || 'Müşteri oluşturma başarısız oldu.');
    }
  });

  const handleSubmit = async (data: CreateCustomerRequest) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <CustomerForm
      onSubmit={handleSubmit}
      isLoading={createMutation.isPending}
      onCancel={onClose}
    />
  );
} 