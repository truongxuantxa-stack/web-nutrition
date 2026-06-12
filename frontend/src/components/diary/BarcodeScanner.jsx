import { useEffect, useRef, useCallback, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Barcode } from 'lucide-react';
import toast from 'react-hot-toast';

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

    // ── Photo Scanner (Camera gốc) ───────────────────────────────────────────
    const handlePhotoDecode = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = ''; // reset để chọn lại được

        setIsDecoding(true);
        try {
            // Tạo scanner tạm để decode ảnh
            const tempScanner = new Html5Qrcode('barcode-file-decoder');
            const result = await tempScanner.scanFile(file, /* showImage */ false);
            tempScanner.clear();
            onDetected(result);
        } catch (err) {
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

            {/* Hidden container cho file decoder */}
            <div id="barcode-file-decoder" style={{ display: 'none' }} />
        </div>
    );
}
