import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

// Lấy thông tin profile
export const useProfileData = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/profile').then((r) => r.data.data),
  });
};

// Cập nhật thông tin profile cơ bản
export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put('/profile', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Cập nhật tỷ lệ macros
export const useUpdateMacros = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.put('/profile/macros', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
};

// Lấy thực phẩm dị ứng
export const useAllergies = () => {
  return useQuery({
    queryKey: ['profile', 'allergies'],
    queryFn: () => api.get('/profile/allergies').then((r) => r.data.data.allergies),
  });
};

// Cập nhật thực phẩm dị ứng
export const useUpdateAllergies = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (foodIds) => api.put('/profile/allergies', { foodIds }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile', 'allergies'] });
    },
  });
};

// Thiết lập hồ sơ ban đầu (onboarding)
export const useOnboard = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => api.post('/profile/onboarding', payload).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });
};
