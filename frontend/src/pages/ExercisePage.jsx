import { useState } from 'react';
import { useExerciseData, useExerciseSports, useAddExercise, useDeleteExercise } from '../hooks/useExercise';
import { getToday } from '../lib/dayjs';
import DateNavigator from '../components/common/DateNavigator';
import { Flame, Clock, Plus, Trash2, Dumbbell, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExercisePage() {
  const [date, setDate] = useState(getToday());
  const { data, isLoading, error } = useExerciseData(date);
  const { data: sports = [], isLoading: isLoadingSports } = useExerciseSports();

  const addExercise = useAddExercise(date);
  const deleteExercise = useDeleteExercise(date);

  // Form states
  const [selectedSport, setSelectedSport] = useState('');
  const [durationInput, setDurationInput] = useState('');

  if (isLoading) return <ExerciseSkeleton />;
  if (error) return <div className="alert alert-error">Không thể tải dữ liệu luyện tập.</div>;

  const { logs = [], totalBurned = 0 } = data || {};

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSport) {
      toast.error('Vui lòng chọn môn thể thao');
      return;
    }
    const mins = parseInt(durationInput);
    if (isNaN(mins) || mins < 1 || mins > 600) {
      toast.error('Thời gian luyện tập phải từ 1 đến 600 phút');
      return;
    }

    addExercise.mutate(
      { sport: selectedSport, duration: mins },
      {
        onSuccess: (res) => {
          toast.success(res.message || 'Đã thêm bài tập mới!');
          setSelectedSport('');
          setDurationInput('');
        },
        onError: (err) => {
          const errMsg = err.response?.data?.message || 'Có lỗi xảy ra khi ghi nhận luyện tập';
          toast.error(errMsg);
        },
      }
    );
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mục luyện tập này?')) {
      deleteExercise.mutate(id, {
        onSuccess: (res) => {
          toast.success(res.message || 'Đã xóa mục luyện tập');
        },
        onError: () => {
          toast.error('Không thể xóa mục luyện tập');
        },
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header & DateNavigator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Nhật ký Luyện tập</h1>
          <p className="text-base-content/50 text-sm">Quản lý các hoạt động thể chất và lượng calo tiêu thụ</p>
        </div>
        <DateNavigator date={date} onDateChange={setDate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form & Summary */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          {/* Calorie Burned Summary Card */}
          <div className="card bg-base-100 border border-base-300 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 w-24 h-24 bg-success/5 rounded-full blur-xl pointer-events-none" />
            <div className="card-body p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-success/15 text-success">
                  <Flame className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">Năng lượng tiêu thụ</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-3xl font-extrabold text-base-content">{totalBurned}</span>
                    <span className="text-sm font-semibold text-base-content/60">kcal</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Exercise Form */}
          <div className="card bg-base-100 border border-base-300 shadow-sm">
            <div className="card-body p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50 mb-4">Ghi nhận Luyện tập</h3>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-base-content/50" /> Chọn hoạt động
                    </span>
                  </label>
                  <select
                    id="exercise-sport"
                    className="select select-bordered select-sm w-full"
                    required
                    value={selectedSport}
                    onChange={(e) => setSelectedSport(e.target.value)}
                    disabled={isLoadingSports}
                  >
                    <option value="" disabled>-- Chọn môn thể thao --</option>
                    {sports.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.icon} {s.label} ({Math.round(s.defaultMet * 60)} kcal/h)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-base-content/50" /> Thời gian tập (phút)
                    </span>
                  </label>
                  <input
                    id="exercise-duration"
                    type="number"
                    min="1"
                    max="600"
                    placeholder="Ví dụ: 30"
                    className="input input-bordered input-sm"
                    required
                    value={durationInput}
                    onChange={(e) => setDurationInput(e.target.value)}
                  />
                </div>

                <button
                  id="submit-exercise"
                  type="submit"
                  disabled={addExercise.isPending || isLoadingSports}
                  className="btn btn-primary btn-sm gap-2 mt-2"
                >
                  {addExercise.isPending ? (
                    <span className="loading loading-spinner loading-sm" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Ghi nhận
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: Today's Exercise Log */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 border border-base-300 shadow-sm overflow-hidden h-full">
            <div className="card-body p-6 gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-base-content/50">Bài tập đã ghi</h3>
                <span className="badge badge-neutral badge-sm">{logs.length} dòng</span>
              </div>

              <div className="overflow-x-auto flex-1">
                {logs.length > 0 ? (
                  <table className="table table-sm w-full">
                    <thead>
                      <tr className="bg-base-200 text-xs text-base-content/60">
                        <th>Hoạt động</th>
                        <th className="text-right">Thời gian</th>
                        <th className="text-right">Calo tiêu thụ</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id} className="hover:bg-base-200/50 transition-colors">
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="text-lg shrink-0">{log.sportIcon || '🏃'}</span>
                              <span className="font-medium text-sm">{log.sportLabel}</span>
                            </div>
                          </td>
                          <td className="text-right font-mono text-sm">
                            {log.duration} phút
                          </td>
                          <td className="text-right font-mono font-bold text-success text-sm">
                            -{Math.round(log.caloriesBurned)} kcal
                          </td>
                          <td>
                            <button
                              id={`delete-exercise-${log.id}`}
                              onClick={() => handleDelete(log.id)}
                              disabled={deleteExercise.isPending}
                              className="btn btn-ghost btn-xs btn-square text-error hover:bg-error/10"
                              title="Xóa dòng"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center text-base-content/40 text-sm gap-2">
                    <Sparkles className="w-8 h-8 text-base-content/25" />
                    <span>Hôm nay chưa có ghi nhận tập luyện nào.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExerciseSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-base-300 rounded w-48" />
        <div className="h-8 bg-base-300 rounded w-32" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className="h-20 bg-base-300 rounded-2xl" />
          <div className="h-56 bg-base-300 rounded-2xl" />
        </div>
        <div className="h-80 bg-base-300 rounded-2xl lg:col-span-2" />
      </div>
    </div>
  );
}
