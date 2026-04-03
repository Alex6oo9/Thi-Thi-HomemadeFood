import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export type BusinessSettings = {
  phoneNumber: string;
  viberNumber: string;
  contactEmail: string;
  fbPageUrl: string;
  fbPageName: string;
  kbzPayNumber: string;
  kbzPayName: string;
  bankName: string;
};

export function useBusinessSettings() {
  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'business'],
    queryFn: () => api.getBusinessSettings(),
    staleTime: 5 * 60 * 1000,
  });

  const settings: BusinessSettings = {
    phoneNumber: data?.phoneNumber ?? '',
    viberNumber: data?.viberNumber ?? '',
    contactEmail: data?.contactEmail ?? '',
    fbPageUrl: data?.fbPageUrl ?? '',
    fbPageName: data?.fbPageName ?? '',
    kbzPayNumber: data?.kbzPayNumber ?? '',
    kbzPayName: data?.kbzPayName ?? '',
    bankName: data?.bankName ?? '',
  };

  return { settings, isLoading };
}
