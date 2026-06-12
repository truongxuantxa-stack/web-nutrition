import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export const useWeightTrend = (range = 30) => {
  return useQuery({
    queryKey: ['weightTrend', range],
    queryFn: () => api.get(`/weight/trend?range=${range}`).then(r => r.data.data),
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};
