import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function RecentActivity({ logs = [], totalBurned = 0 }) {
  const navigate = useNavigate();
  const isEmpty = logs.length === 0;

  // Lấy tối đa 5 logs gần nhất
  const displayLogs = [...logs]
    .sort((a, b) => new Date(b.createdAt || b.id) - new Date(a.createdAt || a.id))
    .slice(0, 5);

  return (
    <div className="glass-card p-6 flex flex-col justify-between h-full min-h-[300px]">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-base-content/90">
            <span>🏃</span> Hoạt động hôm nay
          </h3>
          {totalBurned > 0 && (
            <span className="badge badge-success text-success-content font-bold gap-1 text-xs">
              🔥 {totalBurned} kcal
            </span>
          )}
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-base-200/50 flex items-center justify-center text-2xl">
              🏋️
            </div>
            <div className="text-sm font-medium text-base-content/80">Chưa có hoạt động hôm nay!</div>
            <p className="text-xs text-base-content/50 max-w-[200px]">
              Tập luyện giúp đốt cháy năng lượng dư thừa và tăng cường sức khỏe.
            </p>
            <button
              onClick={() => navigate('/exercise')}
              className="btn btn-success btn-sm btn-outline rounded-full mt-2 gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" /> Ghi lại bài tập 💪
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {displayLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-base-200/30 hover:bg-base-200/50 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-xl flex-shrink-0 w-8 h-8 rounded-lg bg-base-200/80 flex items-center justify-center"
                    role="img"
                    aria-label={log.sportLabel}
                  >
                    {log.sportIcon || '🏃'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-base-content/90">
                      {log.sportLabel}
                    </p>
                    <p className="text-[10px] text-base-content/50">
                      Thời gian: {log.duration} phút
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-sm font-bold text-success">
                    -{log.caloriesBurned}
                  </span>
                  <span className="text-[10px] text-base-content/40 block">kcal</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isEmpty && (
        <div className="border-t border-base-200/50 pt-4 mt-4">
          <button
            onClick={() => navigate('/exercise')}
            className="text-xs font-semibold text-primary hover:underline flex items-center justify-center w-full gap-1"
          >
            Xem nhật ký tập luyện →
          </button>
        </div>
      )}
    </div>
  );
}
