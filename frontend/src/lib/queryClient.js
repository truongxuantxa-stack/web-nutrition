import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60_000,    // 5 phút — giảm refetch không cần thiết
      retry: 1,                  // retry 1 lần khi thất bại
      refetchOnWindowFocus: true, // GIỮ NGUYÊN — chỉ fire nếu data đã stale (>5 phút)
    },
  },
});

export default queryClient;
