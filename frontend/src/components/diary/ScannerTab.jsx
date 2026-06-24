import { useState } from 'react';
import { Camera, Barcode, ArrowLeft, Flag, CheckCircle2 } from 'lucide-react';
import useScanner from '../../hooks/useScanner';
import BarcodeScanner from './BarcodeScanner';
import PhotoCapture from './PhotoCapture';
import NutritionReviewForm from './NutritionReviewForm';
import ConfidenceBadge from './ConfidenceBadge';
import ConfettiEffect from '../common/ConfettiEffect';

const MEAL_LABELS = {
    sang: 'Bữa sáng',
    trua: 'Bữa trưa',
    toi: 'Bữa tối',
    phu: 'Bữa phụ',
};

/**
 * ScannerTab — Tab thứ 3 trong AddFoodModal.
 * State machine: idle → barcode_scanning / photo_capture → processing → review_result → done
 *
 * @param {{ date: string, defaultMeal: string, onClose: function }} props
 */
export default function ScannerTab({ date, defaultMeal, onClose }) {
    // uiState là state machine của UI
    const [uiState, setUiState] = useState('idle');
    const [currentBarcode, setCurrentBarcode] = useState(null);

    const scanner = useScanner({ date, defaultMeal, onClose });

    // ─── Handler: Chọn quét barcode ───────────────────────────────────────────
    const handleStartBarcode = () => {
        setUiState('barcode_scanning');
        scanner.reset();
    };

    // ─── Handler: Barcode detected ────────────────────────────────────────────
    const handleBarcodeDetected = async (barcode) => {
        setCurrentBarcode(barcode);
        setUiState('barcode_processing');
        const result = await scanner.lookupBarcode(barcode);
        if (result?.found) {
            setUiState('barcode_found');
        } else {
            // Không tìm thấy → chuyển sang chụp bảng thành phần
            setUiState('barcode_not_found');
        }
    };

    // ─── Handler: Chụp bảng thành phần ───────────────────────────────────────
    const handleStartPhoto = () => {
        setUiState('photo_capture');
        scanner.reset();
    };

    // ─── Handler: Ảnh được chụp → gửi AI Vision ──────────────────────────────
    const handlePhotoCapture = async (base64, mimeType) => {
        setUiState('ai_processing');
        try {
            await scanner.captureAndAnalyze(base64, currentBarcode, mimeType);
            setUiState('review_result');
        } catch (err) {
            // Lỗi đã được toast.error trong useScanner → quay lại photo_capture
            setUiState('photo_capture');
        }
    };

    // ─── Handler: User xác nhận kết quả AI ───────────────────────────────────
    const handleConfirm = async (nutritionData) => {
        const result = await scanner.confirmAndSave(nutritionData, currentBarcode);
        if (result) {
            setUiState('done');
        }
    };

    // ─── Handler: Thêm vào nhật ký ───────────────────────────────────────────
    const handleAddToDiary = () => {
        if (scanner.confirmedFood?.id) {
            scanner.addFoodToDiary(scanner.confirmedFood.id);
        }
    };

    // ─── Handler: Thêm trực tiếp từ barcode lookup ───────────────────────────
    const handleAddBarcodeProductToDiary = (product) => {
        // Tạo food entry từ scanned product rồi thêm vào diary
        scanner.confirmAndSave({
            name: product.name,
            calories: product.calories,
            protein: product.protein,
            carbs: product.carbs,
            fat: product.fat,
            fiber: product.fiber,
            sugar: product.sugar,
            sodium: product.sodium,
            unit: product.unit || '100g',
        }, product.barcode).then(() => {
            setUiState('done');
        });
    };

    const handleBack = () => {
        setUiState('idle');
        setCurrentBarcode(null);
        scanner.reset();
    };

    // ═══════════════════════════════════════════════════════════════════════════
    //  RENDER theo uiState
    // ═══════════════════════════════════════════════════════════════════════════

    // ── idle ──────────────────────────────────────────────────────────────────
    if (uiState === 'idle') {
        return (
            <div className="flex flex-col gap-4 py-2">
                <p className="text-sm text-base-content/60 text-center">
                    Chọn phương thức quét để thêm thông tin dinh dưỡng nhanh chóng
                </p>

                {/* Nút chính: Chụp bảng thành phần */}
                <button
                    id="scanner-photo-btn"
                    type="button"
                    className="btn btn-primary gap-3 h-auto py-4 flex-col"
                    onClick={handleStartPhoto}
                >
                    <Camera className="w-8 h-8" />
                    <span>
                        <div className="font-semibold text-base">📷 Chụp bảng thành phần</div>
                        <div className="text-xs font-normal opacity-80">AI đọc nhãn dinh dưỡng tự động</div>
                    </span>
                </button>

                {/* Nút phụ: Quét mã vạch */}
                <button
                    id="scanner-barcode-btn"
                    type="button"
                    className="btn btn-outline gap-3"
                    onClick={handleStartBarcode}
                >
                    <Barcode className="w-5 h-5" />
                    📊 Quét mã vạch sản phẩm
                </button>

                <p className="text-xs text-base-content/40 text-center">
                    Dữ liệu bạn đóng góp sẽ giúp cộng đồng tìm kiếm dễ hơn 🌟
                </p>
            </div>
        );
    }

    // ── barcode_scanning ──────────────────────────────────────────────────────
    if (uiState === 'barcode_scanning') {
        return (
            <div className="flex flex-col gap-3">
                <BackButton onBack={handleBack} />
                <h4 className="font-medium text-sm">Hướng camera vào mã vạch</h4>
                <BarcodeScanner
                    isActive={uiState === 'barcode_scanning'}
                    onDetected={handleBarcodeDetected}
                />
            </div>
        );
    }

    // ── barcode_processing ────────────────────────────────────────────────────
    if (uiState === 'barcode_processing') {
        return (
            <div className="flex flex-col items-center gap-4 py-8">
                <span className="loading loading-spinner loading-lg text-primary" />
                <p className="text-sm text-base-content/60">Đang tra cứu sản phẩm...</p>
                {currentBarcode && (
                    <p className="text-xs text-base-content/40 font-mono">{currentBarcode}</p>
                )}
            </div>
        );
    }

    // ── barcode_found ─────────────────────────────────────────────────────────
    if (uiState === 'barcode_found' && scanner.scanResult?.product) {
        const product = scanner.scanResult.product;
        return (
            <div className="flex flex-col gap-3">
                <BackButton onBack={handleBack} />

                <div className="bg-base-200 rounded-xl p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <p className="font-semibold">{product.name}</p>
                            {currentBarcode && (
                                <p className="text-xs text-base-content/40 font-mono">{currentBarcode}</p>
                            )}
                        </div>
                        {product.imageUrl && (
                            <img src={product.imageUrl} alt={product.name} className="w-12 h-12 object-contain rounded" />
                        )}
                    </div>

                    <ConfidenceBadge
                        status={product.status}
                        confidenceScore={product.confidenceScore}
                        dataSource={product.dataSource}
                    />

                    {/* Bảng dinh dưỡng */}
                    <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                            { label: 'Calo', value: `${product.calories}`, unit: 'kcal' },
                            { label: 'Protein', value: `${product.protein}`, unit: 'g' },
                            { label: 'Carbs', value: `${product.carbs}`, unit: 'g' },
                            { label: 'Béo', value: `${product.fat}`, unit: 'g' },
                        ].map(({ label, value, unit }) => (
                            <div key={label} className="bg-base-100 rounded-lg p-2">
                                <div className="text-xs text-base-content/50">{label}</div>
                                <div className="font-bold text-sm">{parseFloat(value).toFixed(1)}</div>
                                <div className="text-xs text-base-content/40">{unit}</div>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs text-base-content/50 text-center mb-4">per {product.unit || '100g'}</p>
                    
                    {/* Chọn bữa + số lượng */}
                    <div className="grid grid-cols-2 gap-2">
                        <div className="form-control">
                            <label className="label py-0"><span className="label-text text-xs">Số lượng</span></label>
                            <input
                                type="number"
                                className="input input-bordered input-sm"
                                value={scanner.amount}
                                onChange={e => scanner.setAmount(e.target.value)}
                                min="1"
                                step="any"
                            />
                        </div>
                        <div className="form-control">
                            <label className="label py-0"><span className="label-text text-xs">Bữa ăn</span></label>
                            <select
                                className="select select-bordered select-sm"
                                value={scanner.mealType}
                                onChange={e => scanner.setMealType(e.target.value)}
                            >
                                {Object.entries(MEAL_LABELS).map(([k, v]) => (
                                    <option key={k} value={k}>{v}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm flex-1"
                        onClick={() => setUiState('photo_capture')}
                    >
                        Chụp để cập nhật
                    </button>
                    <button
                        id="barcode-add-diary-btn"
                        type="button"
                        className="btn btn-primary btn-sm flex-1"
                        disabled={scanner.isConfirming || scanner.isAddingToDiary}
                        onClick={() => handleAddBarcodeProductToDiary(product)}
                    >
                        {scanner.isConfirming ? <span className="loading loading-spinner loading-xs" /> : '+ Thêm vào nhật ký'}
                    </button>
                </div>

                {/* Nút báo sai */}
                <button
                    type="button"
                    className="btn btn-ghost btn-xs text-error gap-1 self-center"
                    onClick={() => scanner.reportBadData(product.id, 'Dữ liệu không chính xác')}
                >
                    <Flag className="w-3 h-3" /> Báo sai dữ liệu
                </button>
            </div>
        );
    }

    // ── barcode_not_found ─────────────────────────────────────────────────────
    if (uiState === 'barcode_not_found') {
        return (
            <div className="flex flex-col gap-3">
                <BackButton onBack={handleBack} />

                <div className="alert alert-warning text-sm py-3">
                    <span>
                        Không tìm thấy <strong>{currentBarcode}</strong> trong cơ sở dữ liệu.
                        Hãy chụp bảng thành phần để đóng góp cho cộng đồng!
                    </span>
                </div>

                <button
                    type="button"
                    className="btn btn-primary gap-2"
                    onClick={() => setUiState('photo_capture')}
                >
                    <Camera className="w-4 h-4" />
                    Chụp bảng thành phần
                </button>
            </div>
        );
    }

    // ── photo_capture ─────────────────────────────────────────────────────────
    if (uiState === 'photo_capture') {
        return (
            <div className="flex flex-col gap-3">
                <BackButton onBack={handleBack} />
                <h4 className="font-medium text-sm">
                    {currentBarcode ? 'Chụp bảng thành phần dinh dưỡng' : 'Chụp bảng thành phần'}
                </h4>
                <PhotoCapture onCapture={handlePhotoCapture} />
            </div>
        );
    }

    // ── ai_processing ─────────────────────────────────────────────────────────
    if (uiState === 'ai_processing') {
        return (
            <div className="flex flex-col items-center gap-4 py-8">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="loading loading-spinner loading-lg text-primary" />
                </div>
                <div className="text-center">
                    <p className="font-medium">AI đang đọc nhãn...</p>
                    <p className="text-sm text-base-content/60 mt-1">
                        Gemini Vision đang phân tích bảng thành phần dinh dưỡng
                    </p>
                </div>
            </div>
        );
    }

    // ── review_result ─────────────────────────────────────────────────────────
    if (uiState === 'review_result' && scanner.aiResult) {
        return (
            <div className="flex flex-col gap-3">
                <BackButton onBack={handleBack} />
                <h4 className="font-medium text-sm">Kiểm tra & Xác nhận kết quả</h4>
                <NutritionReviewForm
                    initialData={scanner.aiResult.nutrition}
                    onSubmit={handleConfirm}
                    onRetake={() => setUiState('photo_capture')}
                    isSubmitting={scanner.isConfirming}
                />
            </div>
        );
    }

    // ── done ──────────────────────────────────────────────────────────────────
    if (uiState === 'done') {
        return (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
                <ConfettiEffect />

                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                </div>

                <div>
                    <p className="font-semibold text-lg">
                        {scanner.contributionMessage || 'Đã lưu thành công!'}
                    </p>
                    {scanner.confirmedFood && (
                        <p className="text-sm text-base-content/60 mt-1">
                            {scanner.confirmedFood.name} — {scanner.confirmedFood.calories} kcal/{scanner.confirmedFood.unit || '100g'}
                        </p>
                    )}
                </div>

                {/* Chọn bữa + số lượng */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-xs">
                    <div className="form-control">
                        <label className="label py-0"><span className="label-text text-xs">Số lượng</span></label>
                        <input
                            type="number"
                            className="input input-bordered input-sm"
                            value={scanner.amount}
                            onChange={e => scanner.setAmount(e.target.value)}
                            min="1"
                            step="any"
                        />
                    </div>
                    <div className="form-control">
                        <label className="label py-0"><span className="label-text text-xs">Bữa ăn</span></label>
                        <select
                            className="select select-bordered select-sm"
                            value={scanner.mealType}
                            onChange={e => scanner.setMealType(e.target.value)}
                        >
                            {Object.entries(MEAL_LABELS).map(([k, v]) => (
                                <option key={k} value={k}>{v}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    id="scanner-add-diary-btn"
                    type="button"
                    className="btn btn-primary w-full max-w-xs"
                    disabled={scanner.isAddingToDiary || !scanner.confirmedFood}
                    onClick={handleAddToDiary}
                >
                    {scanner.isAddingToDiary
                        ? <span className="loading loading-spinner loading-xs" />
                        : '+ Thêm vào nhật ký'}
                </button>

                <button type="button" className="btn btn-ghost btn-sm" onClick={handleBack}>
                    Quét sản phẩm khác
                </button>
            </div>
        );
    }

    return null;
}

// Helper component
function BackButton({ onBack }) {
    return (
        <button
            type="button"
            className="btn btn-ghost btn-xs gap-1 self-start -ml-1"
            onClick={onBack}
        >
            <ArrowLeft className="w-3 h-3" /> Quay lại
        </button>
    );
}
