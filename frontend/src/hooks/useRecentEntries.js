import { useSuspenseQuery } from '@tanstack/react-query';
import api from '../lib/axios';

export const useRecentEntries = (date) => {
  return useSuspenseQuery({
    queryKey: ['diary', 'recent', date],
    queryFn: () => api.get(`/diary/recent?date=${date}&limit=5`).then(r => r.data.data.entries),
  });
};
