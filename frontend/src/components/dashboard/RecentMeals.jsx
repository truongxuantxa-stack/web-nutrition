import { Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Utensils } from 'lucide-react';
import SafeImage from '../common/SafeImage';
import { useRecentEntries } from '../../hooks/useRecentEntries';

const MEAL_EMOJI = { sang: '🌅', trua: '☀️', toi: '🌙', phu: '🍪' };
const MEAL_NAME  = { sang: 'Bữa sáng', trua: 'Bữa trưa', toi: 'Bữa tối', phu: 'Bữa phụ' };

// Wrapper với Suspense
export default function RecentMeals({ date, onAddClick }) {
  return (
    <Suspense fallback={<RecentMealsSkeleton />}>
      <RecentMealsContent date={date} onAddClick={onAddClick} />
    </Suspense>
  );
}

function RecentMealsContent({ date, onAddClick }) {
  const { data: entries = [] } = useRecentEntries(date);
  const navigate = useNavigate();
  const isEmpty  = entries.length === 0;

  return (
    <div className="tcl-card rounded-2xl p-6 flex flex-col justify-between h-full min-h-[300px]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold flex items-center gap-2 text-[#003139]">
            <span>🍽️</span> Bữa ăn gần đây
          </h3>
          <span className="tcl-badge">{entries.length} món</span>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-8 text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#F0F2F3] flex items-center justify-center text-2xl">🥣</div>
            <div className="text-sm font-medium text-[#244348]">Bạn chưa ăn gì hôm nay!</div>
            <p className="text-xs text-[#96A5A8] max-w-[200px]">
              Ghi lại bữa ăn đầu tiên để bắt đầu theo dõi năng lượng.
            </p>
            <button
              onClick={onAddClick || (() => navigate('/diary'))}
              className="tcl-btn-secondary text-sm px-4 py-2 rounded-full mt-2 gap-1.5"
            >
              <Utensils className="w-3.5 h-3.5" /> Ghi lại bữa ăn ngay
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#F0F2F3] hover:bg-[#DFE3E4]/60 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {entry.imageUrl ? (
                    <SafeImage src={entry.imageUrl} alt={entry.foodName}
                      className="w-8 h-8 rounded-lg object-cover flex-shrink-0 shadow-sm"
                      fallback={MEAL_EMOJI[entry.mealType] || '🍲'} />
                  ) : (
                    <span className="text-xl flex-shrink-0 w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
                      {MEAL_EMOJI[entry.mealType] || '🍲'}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-[#003139]">{entry.foodName}</p>
                    <p className="text-[10px] text-[#96A5A8]">
                      {MEAL_NAME[entry.mealType] || 'Bữa ăn'} • {entry.unit === '100g' ? `${entry.amount}g` : entry.unit === '100ml' ? `${entry.amount}ml` : `${entry.amount} ${entry.unit}`}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className="text-sm font-bold text-[#003139]">+{entry.caloriesSnapshot}</span>
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
            onClick={() => navigate('/diary')}
            className="text-xs font-semibold text-[#003139] hover:underline flex items-center justify-center w-full gap-1"
          >
            Xem nhật ký chi tiết →
          </button>
        </div>
      )}
    </div>
  );
}

function RecentMealsSkeleton() {
  return (
    <div className="tcl-card rounded-2xl p-6 flex flex-col gap-3 min-h-[300px]">
      <div className="h-5 w-32 bg-[#DFE3E4] rounded animate-pulse" />
      {[...Array(3)].map((_, i) => (
        <div key={i} className="h-14 rounded-xl bg-gradient-to-r from-[#DFE3E4] via-[#F0F2F3] to-[#DFE3E4] bg-[length:200%_100%] animate-pulse" />
      ))}
    </div>
  );
}
