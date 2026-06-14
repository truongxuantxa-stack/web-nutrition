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
      qc.invalidateQueries({ queryKey: ['diary', date], refetchType: 'active' });
      qc.invalidateQueries({ queryKey: ['diary', 'recent', date], refetchType: 'active' });
      qc.invalidateQueries({ queryKey: ['dashboard', date], refetchType: 'active' });
    },
  });
};

// ─── Mutation: xóa entry ─────────────────────────────────────────────────────
export const useDeleteEntry = (date) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/diary/entries/${id}`),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['diary', date], refetchType: 'active' });
      qc.invalidateQueries({ queryKey: ['diary', 'recent', date], refetchType: 'active' });
      qc.invalidateQueries({ queryKey: ['dashboard', date], refetchType: 'active' });
    },
  });
};

// ─── Mutation: thêm nước (Optimistic Update) ─────────────────────────────────
export const useAddWater = (date) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, note }) => api.post('/water', { amount, date, note }),
    onMutate: async ({ amount }) => {
      await qc.cancelQueries({ queryKey: ['diary', date] });
      // Optimistic: cập nhật waterTotal trong diary cache
      qc.setQueryData(['diary', date], (old) => {
        if (!old) return old;
        return { ...old, waterTotal: (old.waterTotal || 0) + amount };
      });
    },
    onError: (err, { amount }) => {
      // Concurrent-safe rollback
      qc.setQueryData(['diary', date], (old) => {
        if (!old) return old;
        return { ...old, waterTotal: Math.max(0, (old.waterTotal || 0) - amount) };
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['diary', date], refetchType: 'active' });
      qc.invalidateQueries({ queryKey: ['dashboard', date], refetchType: 'active' });
    },
  });
};

// ─── Mutation: xóa nước ──────────────────────────────────────────────────────
export const useDeleteWater = (date) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/water/${id}`),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['diary', date], refetchType: 'active' });
      qc.invalidateQueries({ queryKey: ['dashboard', date], refetchType: 'active' });
    },
  });
};
