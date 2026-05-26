import { useState, useEffect } from 'react';
import { useAddWeight } from '../../hooks/useWeight';
import { getToday } from '../../lib/dayjs';
import { X, Calendar, Scale, Edit3, Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AddWeightModal({ isOpen, onClose }) {
  const addWeight = useAddWeight();

  const [weightInput, setWeightInput] = useState('');
  const [dateInput, setDateInput] = useState(getToday());
  const [noteInput, setNoteInput] = useState('');

  // Reset fields when opening modal
  useEffect(() => {
    if (isOpen) {
      setWeightInput('');
      setDateInput(getToday());
      setNoteInput('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!weightInput) {
      toast.error('Vui lòng nhập cân nặng');
      return;
    }
    const val = parseFloat(weightInput);
    if (isNaN(val) || val < 10 || val > 500) {
      toast.error('Cân nặng phải từ 10kg đến 500kg');
      return;
    }

    addWeight.mutate(
      { weight: val, date: dateInput, note: noteInput },
      {
        onSuccess: (res) => {
          toast.success(res.message || 'Đã ghi nhận cân nặng');
          onClose();
        },
        onError: (err) => {
          const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi ghi nhận cân nặng';
          toast.error(errMsg);
        },
      }
    );
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md w-full relative bg-base-100/90 backdrop-blur-md border border-base-200 shadow-2xl rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-base-200">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Ghi nhận cân nặng
          </h3>
          <button
            id="close-weight-modal"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-medium flex items-center gap-1.5 text-xs text-base-content/75">
                <Calendar className="w-3.5 h-3.5 text-base-content/40" /> Ngày ghi nhận
              </span>
            </label>
            <input
              id="modal-weight-date"
              type="date"
              className="input input-bordered input-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
              max={getToday()}
              value={dateInput}
              onChange={(e) => setDateInput(e.target.value)}
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-medium flex items-center gap-1.5 text-xs text-base-content/75">
                <Scale className="w-3.5 h-3.5 text-base-content/40" /> Cân nặng (kg)
              </span>
            </label>
            <input
              id="modal-weight-value"
              type="number"
              step="0.1"
              min="10"
              max="500"
              placeholder="Ví dụ: 65.5"
              className="input input-bordered input-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
              required
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-control">
            <label className="label py-1">
              <span className="label-text font-medium flex items-center gap-1.5 text-xs text-base-content/75">
                <Edit3 className="w-3.5 h-3.5 text-base-content/40" /> Ghi chú (nếu có)
              </span>
            </label>
            <input
              id="modal-weight-note"
              type="text"
              placeholder="Ví dụ: Cân lúc sáng sớm ngủ dậy"
              className="input input-bordered input-sm rounded-xl focus:ring-2 focus:ring-primary/30 focus:border-primary transition-shadow"
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
            />
          </div>

          <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-base-200">
            <button
              id="cancel-weight-modal"
              type="button"
              onClick={onClose}
              className="btn btn-ghost btn-sm rounded-xl"
            >
              Hủy
            </button>
            <button
              id="submit-weight-modal"
              type="submit"
              disabled={addWeight.isPending}
              className="btn btn-primary btn-sm rounded-xl gap-2 px-4"
            >
              {addWeight.isPending ? (
                <span className="loading loading-spinner loading-xs" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Ghi nhận
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/45 backdrop-blur-xs" onClick={onClose} />
    </div>
  );
}
