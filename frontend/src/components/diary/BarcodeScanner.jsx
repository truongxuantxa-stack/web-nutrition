import { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Barcode } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../lib/axios';

const SUPPORTED_FORMATS = [
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.UPC_A,
    Html5QrcodeSupportedFormats.UPC_E,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.ITF,
];

/**
 * BarcodeScanner — 2 chế độ:
 * 1. Live scan: dùng html5-qrcode + getUserMedia (tiện nhưng có thể mờ)
 * 2. Chụp ảnh: mở Camera GỐC → chụp → decode từ ảnh tĩnh (nét nhất)
 */
export default function BarcodeScanner({ onDetected, isActive }) {
    const scannerRef = useRef(null);
    const isRunningRef = useRef(false);
    const [mode, setMode] = useState('live'); // 'live' | 'photo'
    const [isDecoding, setIsDecoding] = useState(false);

    // ── Live Scanner ──────────────────────────────────────────────────────────
    const stopScanner = useCallback(async () => {
        if (!scannerRef.current || !isRunningRef.current) return;
        try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
        } catch (_) {}
        scannerRef.current = null;
        isRunningRef.current = false;
    }, []);

    const startScanner = useCallback(async () => {
        if (isRunningRef.current || mode !== 'live') return;

        try {
            const scanner = new Html5Qrcode('barcode-scanner-container');
            scannerRef.current = scanner;
            isRunningRef.current = true;

            await scanner.start(
                { facingMode: 'environment' }, // Đơn giản, tương thích tốt nhất
                {
                    fps: 10,
                    qrbox: { width: 250, height: 130 },
                    aspectRatio: 1.333,
                    formatsToSupport: SUPPORTED_FORMATS,
                    showTorchButtonIfSupported: true,
                },
                (decodedText) => {
                    stopScanner();
                    onDetected(decodedText);
                },
                () => {}
            );

        } catch (err) {
            console.warn('[BarcodeScanner] Failed to start:', err.message);
            isRunningRef.current = false;
        }
    }, [onDetected, stopScanner, mode]);

    useEffect(() => {
        if (isActive && mode === 'live') {
            startScanner();
        }
        return () => { stopScanner(); };
    }, [isActive, mode, startScanner, stopScanner]);

    // ── Helper: tạo ImageBitmap từ File ─────────────────────────────────────
    const fileToImageBitmap = (file) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                // Tạo canvas để vẽ ảnh (ImageBitmap không dùng được trực tiếp trên mọi platform)
                resolve(img);
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error('Không đọc được ảnh'));
            };
            img.src = url;
        });
    };

    // ── Helper: resize ảnh về kích thước cụ thể ──────────────────────────────
    const resizeToCanvas = (img, maxDimension) => {
        const { width, height } = img;
        const scale = Math.min(maxDimension / Math.max(width, height), 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(width * scale);
        canvas.height = Math.round(height * scale);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        return canvas;
    };

    // ── Strategy 1: BarcodeDetector API (native, rất chính xác) ──────────────
    const tryNativeDetector = async (img) => {
        if (!('BarcodeDetector' in window)) return null;

        const detector = new window.BarcodeDetector({
            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'itf'],
        });

        // Thử nhiều kích thước: gốc → 1024px → 640px
        const sizes = [null, 1024, 640];
        for (const size of sizes) {
            const source = size ? resizeToCanvas(img, size) : img;
            const barcodes = await detector.detect(source);
            if (barcodes.length > 0) {
                return barcodes[0].rawValue;
            }
        }
        return null;
    };

    // ── Strategy 2: html5-qrcode scanFile (fallback) ─────────────────────────
    const tryZxingFallback = async (file, img) => {
        // Tạo file đã resize để ZXing xử lý tốt hơn
        const canvas = resizeToCanvas(img, 1024);
        const resizedFile = await new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(new File([blob], file.name, { type: 'image/jpeg' }));
            }, 'image/jpeg', 0.92);
        });

        const tempScanner = new Html5Qrcode('barcode-file-decoder');
        try {
            const result = await tempScanner.scanFile(resizedFile, true);
            return result;
        } finally {
            tempScanner.clear();
        }
    };

    // ── Strategy 3: Gemini Vision (gửi ảnh lên backend AI đọc số) ──────────
    const tryGeminiVision = async (img) => {
        // Resize xuống 800px để giảm payload
        const canvas = resizeToCanvas(img, 800);
        const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];

        const { data } = await api.post('/scanner/decode-barcode-image', {
            image: base64,
            mimeType: 'image/jpeg',
        });

        if (data?.data?.found && data.data.barcode) {
            return data.data.barcode;
        }
        return null;
    };

    // ── Photo Scanner (Camera gốc) — 3 strategies chạy SONG SONG ──────────────
    const handlePhotoDecode = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = '';

        setIsDecoding(true);
        try {
            const img = await fileToImageBitmap(file);

            // Chạy cả 3 strategy song song — ai thắng trước lấy trước
            const strategies = [
                // Strategy 1: Native BarcodeDetector
                tryNativeDetector(img).then(r => { if (r) return r; throw new Error('no result'); }),
                // Strategy 2: ZXing
                tryZxingFallback(file, img).then(r => { if (r) return r; throw new Error('no result'); }),
                // Strategy 3: Gemini Vision AI
                tryGeminiVision(img).then(r => { if (r) return r; throw new Error('no result'); }),
            ];

            const barcode = await Promise.any(strategies);
            onDetected(barcode);
        } catch (err) {
            // AggregateError = tất cả strategies đều fail
            toast.error('Không tìm thấy mã vạch trong ảnh. Hãy chụp rõ hơn và căn thẳng mã vạch.');
        } finally {
            setIsDecoding(false);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex flex-col items-center gap-3">
            {/* Toggle Live / Photo */}
            <div className="flex bg-base-200 rounded-lg p-1 gap-1 w-full">
                <button
                    type="button"
                    className={`flex-1 btn btn-sm gap-1 ${mode === 'live' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setMode('live')}
                >
                    <Barcode className="w-3.5 h-3.5" /> Quét trực tiếp
                </button>
                <button
                    type="button"
                    className={`flex-1 btn btn-sm gap-1 ${mode === 'photo' ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => { stopScanner(); setMode('photo'); }}
                >
                    <Camera className="w-3.5 h-3.5" /> Chụp mã vạch
                </button>
            </div>

            {/* Mode: Live Scanner */}
            {mode === 'live' && (
                <>
                    <div
                        id="barcode-scanner-container"
                        className="w-full rounded-xl overflow-hidden bg-black"
                        style={{ minHeight: '280px' }}
                    />
                    <p className="text-xs text-base-content/50 text-center">
                        Nếu camera mờ, hãy chuyển sang <strong>Chụp mã vạch</strong> để dùng Camera gốc
                    </p>
                </>
            )}

            {/* Mode: Photo Scanner (dùng Camera gốc) */}
            {mode === 'photo' && (
                <div className="flex flex-col items-center gap-4 py-4 w-full">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                        <Camera className="w-8 h-8 text-primary" />
                    </div>
                    <div className="text-center">
                        <p className="font-medium">Chụp ảnh mã vạch bằng Camera gốc</p>
                        <p className="text-xs text-base-content/50 mt-1 max-w-xs">
                            Camera gốc cho ảnh nét nhất. Chụp rõ mã vạch, AI sẽ tự đọc số.
                        </p>
                    </div>

                    {isDecoding ? (
                        <div className="flex items-center gap-2 text-sm">
                            <span className="loading loading-spinner loading-sm" />
                            Đang đọc mã vạch...
                        </div>
                    ) : (
                        <>
                            <label
                                htmlFor="barcode-camera-input"
                                className="btn btn-primary gap-2 w-full max-w-xs cursor-pointer"
                            >
                                <Camera className="w-5 h-5" /> 📷 Mở Camera & Chụp
                            </label>
                            <input
                                id="barcode-camera-input"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={handlePhotoDecode}
                            />

                            <label
                                htmlFor="barcode-gallery-input"
                                className="btn btn-ghost btn-sm gap-1 cursor-pointer"
                            >
                                Chọn ảnh từ thư viện
                            </label>
                            <input
                                id="barcode-gallery-input"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handlePhotoDecode}
                            />
                        </>
                    )}
                </div>
            )}

            {/* Container cho file decoder — cần kích thước thực để ZXing hoạt động */}
            <div id="barcode-file-decoder" style={{ position: 'absolute', left: '-9999px', width: '600px' }} />
        </div>
    );
}
