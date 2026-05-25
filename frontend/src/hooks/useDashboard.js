import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export const useDashboard = (date) => {
  return useQuery({
    queryKey: ['dashboard', date],
    queryFn : () => api.get(`/dashboard?date=${date}`).then(r => r.data.data),
    enabled : !!date,
  });
};
