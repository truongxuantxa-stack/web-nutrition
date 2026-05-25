import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

// Lấy trạng thái hiện tại của Adaptive TDEE
export const useAdaptiveStatus = () => {
  return useQuery({
    queryKey: ['adaptive-tdee', 'status'],
    queryFn: () => api.get('/adaptive-tdee/status').then((r) => r.data.data),
  });
};

// Lấy lịch sử 12 tuần gần nhất
export const useAdaptiveHistory = () => {
  return useQuery({
    queryKey: ['adaptive-tdee', 'history'],
    queryFn: () => api.get('/adaptive-tdee/history').then((r) => r.data.data),
  });
};

// Cập nhật trạng thái sử dụng Adaptive TDEE (Bật/Tắt)
export const useToggleAdaptive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (useAdaptiveTDEE) => api.put('/adaptive-tdee/toggle', { useAdaptiveTDEE }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adaptive-tdee'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

// Kích hoạt tính toán thủ công Adaptive TDEE cho tuần trước
export const useCalculateAdaptive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post('/adaptive-tdee/calculate').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adaptive-tdee'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['weight'] });
    },
  });
};

// Đánh dấu bỏ qua tuần tính toán hiện tại
export const useSkipWeekAdaptive = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.put('/adaptive-tdee/skip-week').then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adaptive-tdee'] });
    },
  });
};
