import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import toast from 'react-hot-toast';

/**
 * Custom hook quản lý state và API calls cho Scanner tab.
 * @param {{ date: string, defaultMeal: string, onClose: function }} options
 */
export default function useScanner({ date, defaultMeal, onClose }) {
    const qc = useQueryClient();

    // State machine
    const [scanMode, setScanMode] = useState(null); // 'barcode' | 'photo'
    const [scanResult, setScanResult] = useState(null);  // kết quả barcode lookup
    const [aiResult, setAiResult] = useState(null);       // kết quả AI Vision
    const [mealType, setMealType] = useState(defaultMeal);
    const [amount, setAmount] = useState('100');

    // Mutation: barcode lookup
    const barcodeMutation = useMutation({
        mutationFn: (barcode) => api.post('/scanner/barcode-lookup', { barcode }).then(r => r.data.data),
        onSuccess: (data) => {
            setScanResult(data);
        },
        onError: () => {
            toast.error('Lỗi khi tra cứu barcode. Vui lòng thử lại.');
        },
    });

    // Mutation: AI Vision
    const aiVisionMutation = useMutation({
        mutationFn: ({ image, barcode, mimeType }) =>
            api.post('/scanner/ai-vision', { image, barcode, mimeType }).then(r => r.data.data),
        onSuccess: (data) => {
            setAiResult(data);
        },
        onError: (err) => {
            const msg = err?.response?.data?.message || 'Lỗi khi xử lý ảnh.';
            toast.error(msg);
        },
    });

    // Mutation: confirm contribution
    const confirmMutation = useMutation({
        mutationFn: (payload) =>
            api.post('/scanner/confirm-contribution', payload).then(r => r.data.data),
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: ['diary', date] });
            qc.invalidateQueries({ queryKey: ['dashboard', date] });
        },
        onError: (err) => {
            const errors = err?.response?.data?.errors;
            if (errors?.length) {
                toast.error(errors[0]);
            } else {
                toast.error('Lỗi khi lưu đóng góp.');
            }
        },
    });

    // Mutation: report
    const reportMutation = useMutation({
        mutationFn: (payload) =>
            api.post('/scanner/report', payload).then(r => r.data),
        onSuccess: () => {
            toast.success('Cảm ơn phản hồi! Dữ liệu đang được xem xét lại.');
            setScanResult(null);
        },
    });

    // Mutation: add to diary
    const addToDiaryMutation = useMutation({
        mutationFn: (payload) => api.post('/diary/entries', payload),
        onSuccess: (_, payload) => {
            qc.invalidateQueries({ queryKey: ['diary', date] });
            qc.invalidateQueries({ queryKey: ['dashboard', date] });
            toast.success('Đã thêm vào nhật ký!');
            onClose();
        },
    });

    const uploadImageMutation = useMutation({
        mutationFn: ({ scannedProductId, image }) =>
            api.post('/scanner/upload-product-image', { scannedProductId, image }).then(r => r.data.data),
    });

    const uploadProductImage = (scannedProductId, image) => {
        return uploadImageMutation.mutateAsync({ scannedProductId, image });
    };

    const lookupBarcode = (barcode) => {
        return barcodeMutation.mutateAsync(barcode);
    };

    const captureAndAnalyze = (image, barcode, mimeType) => {
        return aiVisionMutation.mutateAsync({ image, barcode, mimeType });
    };

    const confirmAndSave = (nutritionData, barcode) => {
        return confirmMutation.mutateAsync({ ...nutritionData, barcode });
    };

    const addFoodToDiary = (foodId) => {
        addToDiaryMutation.mutate({
            foodId,
            amount: Number(amount),
            mealType,
            date,
        });
    };

    const reportBadData = (scannedProductId, reason) => {
        reportMutation.mutate({ scannedProductId, reason });
    };

    const reset = () => {
        setScanMode(null);
        setScanResult(null);
        setAiResult(null);
        uploadImageMutation.reset();
    };

    return {
        // State
        scanMode, setScanMode,
        scanResult, setScanResult,
        aiResult, setAiResult,
        mealType, setMealType,
        amount, setAmount,

        // Loading states
        isLookingUp: barcodeMutation.isPending,
        isProcessingAI: aiVisionMutation.isPending,
        isConfirming: confirmMutation.isPending,
        isAddingToDiary: addToDiaryMutation.isPending,
        isUploadingImage: uploadImageMutation.isPending,

        // Confirmed food from contribution
        confirmedFood: confirmMutation.data?.food || null,
        contributionMessage: confirmMutation.data?.contributionMessage || null,
        contributionCount: confirmMutation.data?.contributionCount || 0,
        uploadedImageUrl: uploadImageMutation.data?.imageUrl || null,
        scannedProductId: confirmMutation.data?.scannedProduct?.id || null,

        // Actions
        lookupBarcode,
        captureAndAnalyze,
        confirmAndSave,
        addFoodToDiary,
        reportBadData,
        uploadProductImage,
        reset,
    };
}
