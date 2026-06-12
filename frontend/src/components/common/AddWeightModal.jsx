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
  const [outlierWarning, setOutlierWarning] = useState(null);

  // Reset fields when opening modal
  useEffect(() => {
    if (isOpen) {
      setWeightInput('');
      setDateInput(getToday());
      setNoteInput('');
      setOutlierWarning(null); // Reset cảnh báo mỗi lần mở modal
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

          {outlierWarning && (
            <div className="alert alert-warning shadow-sm mt-2 p-3 text-sm rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-5 w-5" fill="none" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <div>
                <h3 className="font-bold">Cảnh báo bất thường</h3>
                <div className="text-xs">{outlierWarning.message}</div>
              </div>
            </div>
          )}

          <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-base-200">
            {outlierWarning ? (
              <>
                <button
                  type="button"
                  onClick={() => setOutlierWarning(null)}
                  className="btn btn-ghost btn-sm rounded-xl"
                >
                  Sửa lại
                </button>
                <button
                  type="button"
                  onClick={() => doSubmit(true)}
                  disabled={addWeight.isPending}
                  className="btn btn-warning btn-sm rounded-xl px-4"
                >
                  {addWeight.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Vẫn lưu'}
                </button>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/45 backdrop-blur-xs" onClick={onClose} />
    </div>
  );
}
