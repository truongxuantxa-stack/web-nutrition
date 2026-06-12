import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

// Query: Lấy lịch sử và thống kê cân nặng
export const useWeightData = () => {
  return useQuery({
    queryKey: ['weight'],
    queryFn: () => api.get('/weight').then((r) => r.data.data),
  });
};

// Mutation: Thêm hoặc cập nhật cân nặng
export const useAddWeight = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/weight', payload).then((r) => r.data),
    onSuccess: () => {
      // Invalidate cache để cập nhật UI
      qc.invalidateQueries({ queryKey: ['weight'] });
      qc.invalidateQueries({ queryKey: ['weightTrend'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Mutation: Xóa log cân nặng
export const useDeleteWeight = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/weight/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['weight'] });
      qc.invalidateQueries({ queryKey: ['weightTrend'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};
