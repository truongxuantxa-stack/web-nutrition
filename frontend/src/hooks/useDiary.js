import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

// ─── Query: lấy nhật ký ngày ─────────────────────────────────────────────────
export const useDiaryData = (date) => {
  return useQuery({
    queryKey: ['diary', date],
    queryFn : () => api.get(`/diary?date=${date}`).then(r => r.data.data),
    enabled : !!date,
  });
};

// ─── Mutation: thêm entry ─────────────────────────────────────────────────────
export const useAddEntry = (date) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/diary/entries', payload),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['diary', date] });
      qc.invalidateQueries({ queryKey: ['dashboard', date] });
    },
  });
};

// ─── Mutation: xóa entry ─────────────────────────────────────────────────────
export const useDeleteEntry = (date) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/diary/entries/${id}`),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['diary', date] });
      qc.invalidateQueries({ queryKey: ['dashboard', date] });
    },
  });
};

// ─── Mutation: thêm nước ─────────────────────────────────────────────────────
export const useAddWater = (date) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, note }) => api.post('/water', { amount, date, note }),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['diary', date] });
      qc.invalidateQueries({ queryKey: ['dashboard', date] });
    },
  });
};

// ─── Mutation: xóa nước ──────────────────────────────────────────────────────
export const useDeleteWater = (date) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/water/${id}`),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['diary', date] });
      qc.invalidateQueries({ queryKey: ['dashboard', date] });
    },
  });
};
