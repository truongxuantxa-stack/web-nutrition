import { useMutation } from '@tanstack/react-query';
import api from '../lib/axios';

// Hook để tải xuống báo cáo PDF dinh dưỡng
export const useDownloadReport = () => {
  return useMutation({
    mutationFn: async (range = 'week') => {
      const response = await api.get('/report/pdf', {
        params: { range },
        responseType: 'blob',
      });

      const rangeLabel = range === 'week' ? '7ngay' : '30ngay';
      const today = new Date().toISOString().split('T')[0];
      const filename = `baocao-dinhduong-${rangeLabel}-${today}.pdf`;

      // Tạo Blob và kích hoạt download trong trình duyệt
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      return true;
    },
  });
};
