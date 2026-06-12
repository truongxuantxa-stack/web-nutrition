export default function TrendSummaryCard({ data }) {
  if (!data) return null;

  const { summary, hasSufficientData } = data;

  if (!hasSufficientData || !summary.trendWeight) {
    return (
      <div className="glass-card rounded-3xl p-5 flex flex-col justify-center min-h-[140px]">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-base-content/60 mb-2">Xu hướng</h3>
        <p className="text-sm text-base-content/70">Cần thêm dữ liệu để tính toán xu hướng.</p>
      </div>
    );
  }

  const { trendWeight, latestRaw, weeklyRate, direction, goalWeight, goal } = summary;

  let directionText = 'Ổn định';
  let badgeClass = 'badge-ghost';
  
  // Logic hiển thị theo direction và goal
  const isGoalGain = goal === 'gain_weight';
  
  if (direction === 'down') {
    directionText = `${Math.abs(weeklyRate)} kg/tuần`;
    badgeClass = isGoalGain ? 'bg-error/15 text-error' : 'bg-success/15 text-success';
  } else if (direction === 'up') {
    directionText = `${weeklyRate} kg/tuần`;
    badgeClass = isGoalGain ? 'bg-success/15 text-success' : 'bg-error/15 text-error';
  }

  // Calculate estimated weeks to goal
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

  return (
    <div className="glass-card rounded-3xl p-5 relative overflow-hidden group">
      {/* Background decoration */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20 transition-colors duration-500 ${
        (direction === 'down' && !isGoalGain) || (direction === 'up' && isGoalGain) ? 'bg-success' : 
        (direction === 'up' && !isGoalGain) || (direction === 'down' && isGoalGain) ? 'bg-error' : 
        'bg-base-content'
      }`} />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-widest text-base-content/60 mb-4">
          Xu hướng
        </h3>
        
        <div>
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-3xl font-bold tracking-tight">
              {trendWeight.toFixed(1)}
            </span>
            <span className="text-sm font-medium text-base-content/50">kg</span>
          </div>
          
          <div className="flex flex-col gap-1.5 mt-2">
            <div className={`inline-flex items-center w-fit max-w-full px-2 py-0.5 rounded-md text-[11px] font-medium ${badgeClass}`}>
              <span className="mr-1 shrink-0">{direction === 'down' ? '📉' : direction === 'up' ? '📈' : '➖'}</span>
              <span className="truncate whitespace-nowrap">{directionText}</span>
            </div>
            
            <div className="text-[11px] text-base-content/50 truncate">
              Hôm nay: <span className="font-medium text-base-content/70">{latestRaw?.toFixed(1)} kg</span>
            </div>
          </div>
        </div>

        {goalWeight && (
          <div className="mt-2 pt-3 border-t border-base-content/5 flex items-center justify-between text-xs">
            <span className="text-base-content/70">Mục tiêu: <span className="font-semibold text-base-content">{goalWeight}</span></span>
            <span className="font-medium text-primary truncate ml-1">{weeksToGoalText}</span>
          </div>
        )}
      </div>
    </div>
  );
}
