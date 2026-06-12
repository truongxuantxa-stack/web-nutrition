import { useState, useEffect } from 'react';
import { useAddWeight } from '../../hooks/useWeight';
import { getToday } from '../../lib/dayjs';
import { X, Calendar, Scale, Edit3, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddWeightModal({ isOpen, onClose }) {
  const addWeight = useAddWeight();

  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput]     = useState(getToday());
  const [noteInput, setNoteInput]     = useState('');
  const [outlierWarning, setOutlierWarning] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setWeightInput('');
      setDateInput(getToday());
      setNoteInput('');
      setOutlierWarning(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weightInput) { toast.error('Vui lòng nhập cân nặng'); return; }
    const val = parseFloat(weightInput);
    if (isNaN(val) || val < 10 || val > 500) { toast.error('Cân nặng phải từ 10kg đến 500kg'); return; }
    doSubmit(false);
  };

  const doSubmit = (forceConfirm) => {
    const val = parseFloat(weightInput);
    addWeight.mutate(
      { weight: val, date: dateInput, note: noteInput, forceConfirm },
      {
        onSuccess: (res) => {
          toast.success(res.message || 'Đã ghi nhận cân nặng');
          setOutlierWarning(null);
          onClose();
        },
        onError: (err) => {
          if (err.response?.status === 409 && err.response?.data?.requiresConfirmation) {
            setOutlierWarning(err.response.data.outlierWarning);
            return;
          }
          toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi ghi nhận cân nặng');
        },
      }
    );
  };

  return (
    <div className="tcl-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="tcl-modal-content max-w-md w-full relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#DFE3E4] mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2 text-[#003139]">
            <Scale className="w-5 h-5 text-[#003139]" />
            Ghi nhận cân nặng
          </h3>
          <button
            id="close-weight-modal"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-[#96A5A8] hover:bg-[#F0F2F3] hover:text-[#003139] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="tcl-label flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#96A5A8]" /> Ngày ghi nhận
            </label>
            <input
              id="modal-weight-date"
              type="date"
              className="tcl-input"
              max={getToday()}
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
          </div>

          <div>
            <label className="tcl-label flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-[#96A5A8]" /> Cân nặng (kg)
            </label>
            <input
              id="modal-weight-value"
              type="number"
              step="0.1"
              min="10"
              max="500"
              placeholder="Ví dụ: 65.5"
              className="tcl-input"
              required
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              autoFocus
            />
          </div>

          <div>
            <label className="tcl-label flex items-center gap-1.5">
              <Edit3 className="w-3.5 h-3.5 text-[#96A5A8]" /> Ghi chú (nếu có)
            </label>
            <input
              id="modal-weight-note"
              type="text"
              placeholder="Ví dụ: Cân lúc sáng sớm ngủ dậy"
              className="tcl-input"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />
          </div>

          {outlierWarning && (
            <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm">
              <span className="text-amber-500 text-lg shrink-0">⚠️</span>
              <div>
                <h4 className="font-bold text-amber-700">Cảnh báo bất thường</h4>
                <p className="text-xs text-amber-600 mt-0.5">{outlierWarning.message}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end mt-2 pt-3 border-t border-[#DFE3E4]">
            {outlierWarning ? (
              <>
                <button
                  type="button"
                  onClick={() => setOutlierWarning(null)}
                  className="tcl-btn-ghost text-sm py-2 px-4"
                >
                  Sửa lại
                </button>
                <button
                  type="button"
                  onClick={() => doSubmit(true)}
                  disabled={addWeight.isPending}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white font-semibold text-sm rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                >
                  {addWeight.isPending ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : 'Vẫn lưu'}
                </button>
              </>
            ) : (
              <>
                <button
                  id="cancel-weight-modal"
                  type="button"
                  onClick={onClose}
                  className="tcl-btn-ghost text-sm py-2 px-4"
                >
                  Hủy
                </button>
                <button
                  id="submit-weight-modal"
                  type="submit"
                  disabled={addWeight.isPending}
                  className="tcl-btn-primary text-sm py-2 px-4 gap-2"
                >
                  {addWeight.isPending ? (
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Ghi nhận
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
