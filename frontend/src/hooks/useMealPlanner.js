import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';

// ─── Queries ──────────────────────────────────────────────────────────────────
export const useMealConfig = () =>
  useQuery({
    queryKey: ['meal-planner', 'config'],
    queryFn : () => api.get('/meal-planner/config').then(r => r.data.data),
  });

export const useTemplates = () =>
  useQuery({
    queryKey: ['meal-planner', 'templates'],
    queryFn : () => api.get('/meal-planner/templates').then(r => r.data.data),
  });

export const useFoodsByRole = (role, tags = []) => {
  const tagsStr = tags && tags.length > 0 ? tags.join(',') : '';
  return useQuery({
    queryKey: ['meal-planner', 'foods', role, tagsStr],
    queryFn : () => api.get(`/meal-planner/foods?role=${role}${tagsStr ? `&tags=${tagsStr}` : ''}`).then(r => r.data.data),
    enabled : !!role,
    staleTime: 5 * 60_000, // 5 phút
  });
};

// ─── Mutations ────────────────────────────────────────────────────────────────
export const useGenerateMeal = () =>
  useMutation({
    mutationFn: (payload) => api.post('/meal-planner/generate', payload).then(r => r.data),
  });

export const useSwapIngredient = () =>
  useMutation({
    mutationFn: (payload) => api.post('/meal-planner/swap', payload).then(r => r.data),
  });

export const useUpdateConfig = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (meals) => api.put('/meal-planner/config', { meals }),
    onSuccess : () => qc.invalidateQueries({ queryKey: ['meal-planner', 'config'] }),
  });
};

// ─── Push to diary ────────────────────────────────────────────────────────────
export const usePushToDiary = (date) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entries) =>
      Promise.all(entries.map(e => api.post('/diary/entries', { ...e, date }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diary', date] });
      qc.invalidateQueries({ queryKey: ['dashboard', date] });
    },
  });
};
