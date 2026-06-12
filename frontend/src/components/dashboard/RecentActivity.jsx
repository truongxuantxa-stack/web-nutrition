import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';

export default function RecentActivity({ logs = [], totalBurned = 0 }) {
  const navigate = useNavigate();
  const isEmpty  = logs.length === 0;

  const displayLogs = [...logs]
    .sort((a, b) => new Date(b.createdAt || b.id) - new Date(a.createdAt || a.id))
    .slice(0, 5);

  return (
    <div className="tcl-card rounded-2xl p-6 flex flex-col justify-between h-full min-h-[300px]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-[#003139]">
            <span>🏃</span> Hoạt động hôm nay
          </h3>
          {totalBurned > 0 && (
            <span className="tcl-badge-success gap-1 whitespace-nowrap shrink-0">
              🔥 {totalBurned} kcal
            </span>
          )}
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F0F2F3] flex items-center justify-center text-2xl">🏋️</div>
            <div className="text-sm font-medium text-[#244348]">Chưa có hoạt động hôm nay!</div>
            <p className="text-xs text-[#96A5A8] max-w-[200px]">
              Tập luyện giúp đốt cháy năng lượng dư thừa và tăng cường sức khỏe.
            </p>
            <button
              onClick={() => navigate('/exercise')}
              className="tcl-btn-success text-sm px-4 py-2 rounded-full mt-2 gap-1.5"
            >
              <Activity className="w-3.5 h-3.5" /> Ghi lại bài tập 💪
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {displayLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F0F2F3] hover:bg-[#DFE3E4]/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    {log.sportIcon || '🏃'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-[#003139]">{log.sportLabel}</p>
                    <p className="text-[10px] text-[#96A5A8]">Thời gian: {log.duration} phút</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-sm font-bold text-[#2EA850]">-{log.caloriesBurned}</span>
                  <span className="text-[10px] text-[#96A5A8] block">kcal</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {!isEmpty && (
        <div className="border-t border-[#DFE3E4] pt-4 mt-4">
          <button
            onClick={() => navigate('/exercise')}
            className="text-xs font-semibold text-[#003139] hover:underline flex items-center justify-center w-full gap-1"
          >
            Xem nhật ký tập luyện →
          </button>
        </div>
      )}
    </div>
  );
}
