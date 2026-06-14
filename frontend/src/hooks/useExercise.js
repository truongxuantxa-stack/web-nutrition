import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

// Query: Lấy logs và tổng calo đốt theo ngày
export const useExerciseData = (date) => {
  return useQuery({
    queryKey: ['exercise', date],
    queryFn: () => api.get(`/exercise?date=${date}`).then((r) => r.data.data),
    enabled: !!date,
  });
};

// Query: Lấy danh sách các môn thể thao được hỗ trợ
export const useExerciseSports = () => {
  return useQuery({
    queryKey: ['exercise', 'sports'],
    queryFn: () => api.get('/exercise/sports').then((r) => r.data.data.sports),
    staleTime: Infinity, // Danh sách thể thao cố định nên cache mãi mãi
  });
};

// Mutation: Thêm log luyện tập
export const useAddExercise = (date) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/exercise', { ...payload, date }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise', date], refetchType: 'active' });
      qc.invalidateQueries({ queryKey: ['dashboard', date], refetchType: 'active' });
    },
  });
};

// Mutation: Xóa log luyện tập
export const useDeleteExercise = (date) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => api.delete(`/exercise/${id}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exercise', date], refetchType: 'active' });
      qc.invalidateQueries({ queryKey: ['dashboard', date], refetchType: 'active' });
    },
  });
};
