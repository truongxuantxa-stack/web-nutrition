import { useState, useEffect } from 'react';
import { AlertTriangle, XCircle, AlertCircle } from 'lucide-react';

/**
 * Form editable hiển thị kết quả AI và cho phép chỉnh sửa.
 * Physics Validation realtime — errors đỏ block submit, warnings vàng cho qua.
 *
 * @param {{
 *   initialData: object,
 *   onSubmit: (data: object) => void,
 *   onRetake: () => void,
 *   isSubmitting: boolean,
 * }} props
 */
export default function NutritionReviewForm({ initialData, onSubmit, onRetake, isSubmitting }) {
    const [form, setForm] = useState({
        name: initialData?.productName || '',
        calories: String(initialData?.calories ?? ''),
        protein: String(initialData?.protein ?? ''),
        carbs: String(initialData?.carbs ?? ''),
        fat: String(initialData?.fat ?? ''),
        fiber: initialData?.fiber != null ? String(initialData.fiber) : '',
        sugar: initialData?.sugar != null ? String(initialData.sugar) : '',
        sodium: initialData?.sodium != null ? String(initialData.sodium) : '',
        vitaminA: initialData?.vitaminA != null ? String(initialData.vitaminA) : '',
        vitaminC: initialData?.vitaminC != null ? String(initialData.vitaminC) : '',
        calcium: initialData?.calcium != null ? String(initialData.calcium) : '',
        iron: initialData?.iron != null ? String(initialData.iron) : '',
        unit: initialData?.unit || '100g', // Thêm state unit
    });

    const [physicsErrors, setPhysicsErrors] = useState([]);
    const [physicsWarnings, setPhysicsWarnings] = useState([]);

    // Physics validation realtime (client-side, không cần gọi API)
    useEffect(() => {
        const cal = parseFloat(form.calories);
        const pro = parseFloat(form.protein);
        const carb = parseFloat(form.carbs);
        const fat = parseFloat(form.fat);
        const fiber = form.fiber ? parseFloat(form.fiber) : null;
        const sugar = form.sugar ? parseFloat(form.sugar) : null;

        if ([cal, pro, carb, fat].some(isNaN)) {
            setPhysicsErrors([]);
            setPhysicsWarnings([]);
            return;
        }

        const errs = [];
        const warns = [];

        if (pro < 0 || carb < 0 || fat < 0 || cal < 0) {
            errs.push('Giá trị dinh dưỡng không thể âm.');
        }
        const unitLabel = form.unit;

        if (pro + carb + fat > 100) {
            errs.push(`Tổng P+C+F = ${(pro + carb + fat).toFixed(1)}g > 100g/${unitLabel} — phi lý.`);
        }
        if (cal > 900) {
            errs.push(`${cal} kcal/${unitLabel} vượt giới hạn vật lý (max 900 kcal).`);
        }
        const estCal = (pro * 4) + (carb * 4) + (fat * 9);
        if (cal > 0 && estCal > 0) {
            const dev = Math.abs(cal - estCal) / cal;
            if (dev > 0.15) {
                // Nếu sai lệch quá lớn (gấp ~4.2 lần), khả năng rất cao là AI hoặc User nhập nhầm kJ thay vì kcal
                if (cal / estCal > 3.5 && cal / estCal < 4.8) {
                    errs.push(`Calo đang là ${cal}, nhưng ước tính chỉ khoảng ${estCal.toFixed(0)} kcal. Có vẻ bạn/AI đã nhập nhầm chỉ số kJ. Vui lòng sửa lại thành ${estCal.toFixed(0)} (kcal).`);
                } else {
                    errs.push(`Tổng Calo (${cal}) không khớp với tổng Protein/Carb/Fat (ước tính ${estCal.toFixed(0)} kcal). Vui lòng kiểm tra lại.`);
                }
            }
        }
        if (fiber != null && fiber > carb) {
            warns.push('Chất xơ > Carb — Có thể nhãn dùng Net Carb (kiểu Mỹ).');
        }
        if (sugar != null && sugar > carb) {
            warns.push('Đường > Carb — Có thể nhãn dùng Net Carb (kiểu Mỹ).');
        }

        setPhysicsErrors(errs);
        setPhysicsWarnings(warns);
    }, [form.calories, form.protein, form.carbs, form.fat, form.fiber, form.sugar]);

    const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (physicsErrors.length > 0) return;
        onSubmit({
            name: form.name,
            calories: parseFloat(form.calories),
            protein: parseFloat(form.protein),
            carbs: parseFloat(form.carbs),
            fat: parseFloat(form.fat),
            fiber: form.fiber ? parseFloat(form.fiber) : null,
            sugar: form.sugar ? parseFloat(form.sugar) : null,
            sodium: form.sodium ? parseFloat(form.sodium) : null,
            vitaminA: form.vitaminA ? parseFloat(form.vitaminA) : null,
            vitaminC: form.vitaminC ? parseFloat(form.vitaminC) : null,
            calcium: form.calcium ? parseFloat(form.calcium) : null,
            iron: form.iron ? parseFloat(form.iron) : null,
            unit: form.unit,
        });
    };

    const inputClass = 'input input-bordered input-sm w-full';

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {/* AI Confidence badge */}
            {initialData?.confidence && (
                <div className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1 ${
                    initialData.confidence === 'high' ? 'bg-success/10 text-success' :
                    initialData.confidence === 'medium' ? 'bg-warning/10 text-warning' :
                    'bg-error/10 text-error'
                }`}>
                    <AlertCircle className="w-3 h-3" />
                    AI đọc với độ tự tin:{' '}
                    {initialData.confidence === 'high' ? 'Cao ✅' :
                     initialData.confidence === 'medium' ? 'Trung bình ⚠️' : 'Thấp ❌'}
                    {' '}- Vui lòng kiểm tra lại trước khi xác nhận
                </div>
            )}

            {/* Tên sản phẩm */}
            <div className="form-control">
                <label className="label py-0"><span className="label-text text-xs">Tên sản phẩm</span></label>
                <input
                    id="review-name"
                    type="text"
                    className={inputClass}
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                    placeholder="Tên sản phẩm (tùy chọn)"
                />
            </div>

            {/* Chọn đơn vị (Read-only, do AI tự động trích xuất) */}
            <div className="form-control">
                <label className="label py-0"><span className="label-text text-xs">Đơn vị chuẩn (AI trích xuất từ nhãn)</span></label>
                <div className="mt-1">
                    <span className="badge badge-primary font-semibold">
                        {form.unit === '100ml' ? '100ml (Đồ uống)' : '100g (Đồ ăn)'}
                    </span>
                </div>
            </div>

            {/* Macros bắt buộc */}
            <div className="grid grid-cols-2 gap-2">
                {[
                    { k: 'calories', label: `Calo (kcal/${form.unit}) *` },
                    { k: 'protein',  label: `Protein (g/${form.unit}) *` },
                    { k: 'carbs',    label: `Carbs (g/${form.unit}) *` },
                    { k: 'fat',      label: `Béo (g/${form.unit}) *` },
                ].map(({ k, label }) => (
                    <div key={k} className="form-control">
                        <label className="label py-0"><span className="label-text text-xs">{label}</span></label>
                        <input
                            id={`review-${k}`}
                            type="number"
                            className={inputClass}
                            value={form[k]}
                            onChange={e => set(k, e.target.value)}
                            min="0"
                            step="any"
                            required
                        />
                    </div>
                ))}
            </div>

            {/* Vi chất tùy chọn */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                    { k: 'fiber',    label: 'Xơ (g)' },
                    { k: 'sugar',    label: 'Đường (g)' },
                    { k: 'sodium',   label: 'Natri (mg)' },
                    { k: 'vitaminA', label: 'Vitamin A (µg)' },
                    { k: 'vitaminC', label: 'Vitamin C (mg)' },
                    { k: 'calcium',  label: 'Canxi (mg)' },
                    { k: 'iron',     label: 'Sắt (mg)' },
                ].map(({ k, label }) => (
                    <div key={k} className="form-control">
                        <label className="label py-0"><span className="label-text text-[10px]">{label}</span></label>
                        <input
                            id={`review-${k}`}
                            type="number"
                            className="input input-bordered input-xs h-7 w-full"
                            value={form[k]}
                            onChange={e => set(k, e.target.value)}
                            min="0"
                            step="any"
                        />
                    </div>
                ))}
            </div>

            {/* Physics errors — đỏ, block submit */}
            {physicsErrors.length > 0 && (
                <div className="alert alert-error py-2 text-xs flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1 font-semibold">
                        <XCircle className="w-4 h-4" /> Dữ liệu phi lý — không thể lưu
                    </div>
                    <ul className="list-disc list-inside">
                        {physicsErrors.map((e, i) => <li key={i}>{e}</li>)}
                    </ul>
                </div>
            )}

            {/* Physics warnings — vàng, vẫn cho submit */}
            {physicsWarnings.length > 0 && (
                <div className="alert alert-warning py-2 text-xs flex flex-col items-start gap-1">
                    <div className="flex items-center gap-1 font-semibold">
                        <AlertTriangle className="w-4 h-4" /> Cảnh báo (vẫn có thể lưu)
                    </div>
                    <ul className="list-disc list-inside">
                        {physicsWarnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                </div>
            )}

            {/* Buttons */}
            <div className="flex gap-2 mt-1">
                <button
                    type="button"
                    className="btn btn-ghost btn-sm flex-1"
                    onClick={onRetake}
                    disabled={isSubmitting}
                >
                    Chụp lại
                </button>
                <button
                    id="review-confirm-btn"
                    type="submit"
                    className="btn btn-primary btn-sm flex-1"
                    disabled={physicsErrors.length > 0 || isSubmitting}
                >
                    {isSubmitting
                        ? <span className="loading loading-spinner loading-xs" />
                        : 'Xác nhận & Lưu'}
                </button>
            </div>
        </form>
    );
}
