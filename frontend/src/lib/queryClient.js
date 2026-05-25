import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // 30s — dữ liệu dinh dưỡng thay đổi thường xuyên
      retry: 1,                  // retry 1 lần khi thất bại
      refetchOnWindowFocus: true, // auto-refresh khi user quay lại tab
    },
  },
});

export default queryClient;
