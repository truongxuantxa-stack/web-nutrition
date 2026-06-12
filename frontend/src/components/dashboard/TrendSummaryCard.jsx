export default function TrendSummaryCard({ data }) {
  if (!data) return null;

  const { summary, hasSufficientData } = data;

  if (!hasSufficientData || !summary.trendWeight) {
    return (
      <div className="tcl-card rounded-2xl p-5 flex flex-col justify-center min-h-[140px]">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8] mb-2">Xu hướng</h3>
        <p className="text-sm text-[#244348]">Cần thêm dữ liệu để tính toán xu hướng.</p>
      </div>
    );
  }

  const { trendWeight, latestRaw, weeklyRate, direction, goalWeight, goal } = summary;

  let directionText = 'Ổn định';
  let badgeClass    = 'bg-[#F0F2F3] text-[#96A5A8]';

  const isGoalGain = goal === 'gain_weight';

  if (direction === 'down') {
    directionText = `${Math.abs(weeklyRate)} kg/tuần`;
    badgeClass    = isGoalGain ? 'bg-red-100 text-red-600' : 'bg-[#5FE089]/15 text-[#2EA850]';
  } else if (direction === 'up') {
    directionText = `${weeklyRate} kg/tuần`;
    badgeClass    = isGoalGain ? 'bg-[#5FE089]/15 text-[#2EA850]' : 'bg-red-100 text-red-600';
  }

  // Estimated weeks to goal
  let weeksToGoalText = '';
  if (goalWeight && Math.abs(weeklyRate) > 0.05) {
    if (direction === 'down' && trendWeight > goalWeight) {
      const weeks = Math.round((trendWeight - goalWeight) / Math.abs(weeklyRate));
      weeksToGoalText = `Còn ~${weeks} tuần`;
    } else if (direction === 'up' && trendWeight < goalWeight) {
      const weeks = Math.round((goalWeight - trendWeight) / Math.abs(weeklyRate));
      weeksToGoalText = `Còn ~${weeks} tuần`;
    } else if (Math.abs(trendWeight - goalWeight) <= 0.5) {
      weeksToGoalText = 'Đã đạt mục tiêu!';
    } else {
      weeksToGoalText = 'Xu hướng ngược mục tiêu';
    }
  } else if (goalWeight) {
    if (Math.abs(trendWeight - goalWeight) <= 0.5) {
      weeksToGoalText = 'Đã đạt mục tiêu!';
    } else {
      weeksToGoalText = 'Cân ngang mục tiêu';
    }
  }

  const isGoodTrend = (direction === 'down' && !isGoalGain) || (direction === 'up' && isGoalGain);
  const isBadTrend  = (direction === 'up' && !isGoalGain) || (direction === 'down' && isGoalGain);

  return (
    <div className="tcl-card rounded-2xl p-5 relative overflow-hidden group">
      {/* Background decoration */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-colors duration-500 ${
        isGoodTrend ? 'bg-[#5FE089]' : isBadTrend ? 'bg-red-500' : 'bg-[#DFE3E4]'
      }`} />

      <div className="relative z-10 flex flex-col h-full justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8] mb-4">Xu hướng</h3>

        <div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold tracking-tight text-[#003139]">{trendWeight.toFixed(1)}</span>
            <span className="text-sm font-medium text-[#96A5A8]">kg</span>
          </div>

          <div className="flex flex-col gap-1.5 mt-2">
            <div className={`inline-flex items-center w-fit max-w-full px-2 py-0.5 rounded-md text-[11px] font-medium ${badgeClass}`}>
              <span className="mr-1 shrink-0">{direction === 'down' ? '📉' : direction === 'up' ? '📈' : '➖'}</span>
              <span className="truncate whitespace-nowrap">{directionText}</span>
            </div>

            <div className="text-[11px] text-[#96A5A8] truncate">
              Hôm nay: <span className="font-medium text-[#244348]">{latestRaw?.toFixed(1)} kg</span>
            </div>
          </div>
        </div>

        {goalWeight && (
          <div className="mt-2 pt-3 border-t border-[#DFE3E4] flex items-center justify-between text-xs">
            <span className="text-[#96A5A8]">Mục tiêu: <span className="font-semibold text-[#244348]">{goalWeight}</span></span>
            <span className="font-medium text-[#003139] truncate ml-1">{weeksToGoalText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
