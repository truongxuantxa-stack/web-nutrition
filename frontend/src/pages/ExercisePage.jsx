import { useState } from 'react';
import { useExerciseData, useExerciseSports, useAddExercise, useDeleteExercise } from '../hooks/useExercise';
import { getToday } from '../lib/dayjs';
import DateNavigator from '../components/common/DateNavigator';
import { Clock, Plus, Trash2, Dumbbell, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import CalorieRing from '../components/dashboard/CalorieRing';

export default function ExercisePage() {
  const [date, setDate] = useState(getToday());
  const { data, isLoading, error } = useExerciseData(date);
  const { data: sports = [], isLoading: isLoadingSports } = useExerciseSports();

  const addExercise    = useAddExercise(date);
  const deleteExercise = useDeleteExercise(date);

  const [selectedSport, setSelectedSport] = useState('');
  const [durationInput, setDurationInput] = useState('');

  if (isLoading) return <ExerciseSkeleton />;
  if (error) return (
    <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium">
      Không thể tải dữ liệu luyện tập.
    </div>
  );

  const { logs = [], totalBurned = 0 } = data || {};

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedSport) { toast.error('Vui lòng chọn môn thể thao'); return; }
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
        onError: (err) => toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi ghi nhận luyện tập'),
      }
    );
  };

  const handleDelete = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mục luyện tập này?')) {
      deleteExercise.mutate(id, {
        onSuccess: (res) => toast.success(res.message || 'Đã xóa mục luyện tập'),
        onError:   () => toast.error('Không thể xóa mục luyện tập'),
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#003139]">Nhật ký Luyện tập</h1>
          <p className="text-[#96A5A8] text-sm">Quản lý các hoạt động thể chất và lượng calo tiêu thụ</p>
        </div>
        <DateNavigator date={date} onDateChange={setDate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Form & Ring */}
        <div className="flex flex-col gap-6 lg:col-span-1">
          <CalorieRing consumed={totalBurned} target={500} />

          {/* Add Form */}
          <div className="tcl-card rounded-2xl p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#96A5A8] mb-4">Ghi nhận Luyện tập</h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="tcl-label flex items-center gap-1.5">
                  <Dumbbell className="w-4 h-4 text-[#96A5A8]" /> Chọn hoạt động
                </label>
                <select
                  id="exercise-sport"
                  className="tcl-select"
                  required
                  value={selectedSport}
                  onChange={(e) => setSelectedSport(e.target.value)}
                  disabled={isLoadingSports}
                >
                  <option value="" disabled>-- Chọn môn thể thao --</option>
                  {sports.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.icon} {s.label} ({s.caloriesPerHour || Math.round(s.defaultMet * 60)} kcal/h)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="tcl-label flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#96A5A8]" /> Thời gian tập (phút)
                </label>
                <input
                  id="exercise-duration"
                  type="number"
                  min="1"
                  max="600"
                  placeholder="Ví dụ: 30"
                  className="tcl-input"
                  required
                  value={durationInput}
                  onChange={(e) => setDurationInput(e.target.value)}
                />
              </div>

              <button
                id="submit-exercise"
                type="submit"
                disabled={addExercise.isPending || isLoadingSports}
                className="tcl-btn-primary gap-2 mt-2 py-2.5 justify-center"
              >
                {addExercise.isPending ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Ghi nhận
              </button>
            </form>
          </div>
        </div>

        {/* Right: Log Table */}
        <div className="lg:col-span-2">
          <div className="tcl-card rounded-2xl overflow-hidden h-full">
            <div className="p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#96A5A8]">Bài tập đã ghi</h3>
                <span className="tcl-badge">{logs.length} dòng</span>
              </div>

              <div className="overflow-x-auto">
                {logs.length > 0 ? (
                  <table className="tcl-table w-full">
                    <thead>
                      <tr>
                        <th>Hoạt động</th>
                        <th className="text-right">Thời gian</th>
                        <th className="text-right">Calo tiêu thụ</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <div className="flex items-center gap-2">
                              <span className="text-lg shrink-0">{log.sportIcon || '🏃'}</span>
                              <span className="font-medium text-sm text-[#003139]">{log.sportLabel}</span>
                            </div>
                          </td>
                          <td className="text-right font-mono text-sm text-[#244348]">{log.duration} phút</td>
                          <td className="text-right font-mono font-bold text-[#2EA850] text-sm">
                            -{Math.round(log.caloriesBurned)} kcal
                          </td>
                          <td>
                            <button
                              id={`delete-exercise-${log.id}`}
                              onClick={() => handleDelete(log.id)}
                              disabled={deleteExercise.isPending}
                              className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
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
                  <div className="flex flex-col items-center justify-center py-16 text-center text-[#96A5A8] text-sm gap-2">
                    <Sparkles className="w-8 h-8 text-[#DFE3E4]" />
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
  const shimmer = 'rounded-2xl bg-gradient-to-r from-[#DFE3E4] via-[#F0F2F3] to-[#DFE3E4] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite]';
  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div className="h-8 bg-[#DFE3E4] rounded w-48 animate-pulse" />
        <div className="h-8 bg-[#DFE3E4] rounded w-32 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="flex flex-col gap-6 lg:col-span-1">
          <div className={`h-44 ${shimmer}`} />
          <div className={`h-56 ${shimmer}`} />
        </div>
        <div className={`h-80 ${shimmer} lg:col-span-2`} />
      </div>
    </div>
  );
}
