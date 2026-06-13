import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';

// ─── Config giao diện theo severity — TCL palette ────────────────────────────
const SEVERITY_STYLE = {
  danger:     { border: 'border-l-[#DC2626]',       bg: 'bg-white',              badge: 'bg-[#DC2626]/10 text-[#DC2626]',             label: 'Cảnh báo' },
  warning:    { border: 'border-l-[#F59E0B]',      bg: 'bg-white',            badge: 'bg-[#F59E0B]/10 text-[#D97706]',         label: 'Lưu ý'    },
  water:      { border: 'border-l-[#3B82A0]',       bg: 'bg-white',             badge: 'bg-[#3B82A0]/10 text-[#3B82A0]',           label: 'Nước'     },
  suggestion: { border: 'border-l-[#2EA850]',      bg: 'bg-white',         badge: 'bg-[#2EA850]/10 text-[#2EA850]',      label: 'Gợi ý'   },
};

// ─── Màu score circle theo điểm ─────────────────────────────────────────────
const getScoreColor = (score) => {
  if (score === null) return { ring: '#DFE3E4', text: 'text-[#96A5A8]' };
  if (score >= 70)    return { ring: '#2EA850', text: 'text-[#2EA850]' };
  if (score >= 40)    return { ring: '#003139', text: 'text-[#003139]' };
  return               { ring: '#DC2626', text: 'text-[#DC2626]' };
};

// ─── Màu gradient progress bar theo điểm ────────────────────────────────────
const getScoreBarClass = (score) => {
  if (score >= 70) return 'from-[#5FE089] to-[#2EA850]';
  if (score >= 40) return 'from-[#4A767E] to-[#003139]';
  return                  'from-[#ef4444] to-[#DC2626]';
};

// ─── Bonus key → icon mapping ────────────────────────────────────────────────
const BONUS_ICON = { calo: '🎯', protein: '🥩', water: '💧', fiber: '🥦' };

// ─── Component InsightItem ───────────────────────────────────────────────────
function InsightItem({ insight }) {
  const style = SEVERITY_STYLE[insight.severity] || SEVERITY_STYLE.suggestion;
  return (
    <div className={`flex gap-3 items-start border-l-4 ${style.border} ${style.bg} rounded-r-xl px-3 py-2.5`}>
      <span className="text-lg flex-shrink-0 mt-0.5">{insight.icon}</span>
      <div className="flex flex-col gap-0.5 min-w-0">
        <p className="text-xs font-bold text-[#003139] leading-snug">{insight.title}</p>
        <p className="text-[11px] text-[#96A5A8] leading-relaxed">{insight.message}</p>
      </div>
      <span className={`ml-auto flex-shrink-0 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${style.badge} mt-0.5`}>
        {style.label}
      </span>
    </div>
  );
}

// ─── Component BonusBadge ────────────────────────────────────────────────────
function BonusBadge({ bonus, achieved }) {
  if (achieved) {
    return (
      <div className={`
        flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-bold
        bg-[#5FE089]/15 text-[#2EA850] border border-[#5FE089]/25
        shadow-[0_0_8px_rgba(95,224,137,0.25)]
        animate-pulse
      `}>
        <span>{BONUS_ICON[bonus.key] || '✅'}</span>
        <span>{bonus.label}</span>
        <span className="ml-1 font-black text-[#2EA850]">+{bonus.points}</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold opacity-40 bg-[#F0F2F3] border border-[#DFE3E4]">
      <Lock className="w-3 h-3 flex-shrink-0 text-[#96A5A8]" />
      <span className="text-[#244348]">{bonus.label}</span>
      <span className="ml-1 text-[#96A5A8]">+{bonus.points}</span>
    </div>
  );
}

// ─── Danh sách tất cả bonus ──────────────────────────────────────────────────
const ALL_POSSIBLE_BONUSES = [
  { key: 'calo',    label: 'Calo trong khoảng lý tưởng', points: 5 },
  { key: 'protein', label: 'Đạt mục tiêu Protein',        points: 3 },
  { key: 'water',   label: 'Uống đủ nước mục tiêu',       points: 5 },
  { key: 'fiber',   label: 'Đạt mục tiêu Chất xơ',        points: 2 },
];

// ─── Component chính ─────────────────────────────────────────────────────────
export default function DailyInsightsCard({ insights = [], healthScore = null, maxVisible = 3 }) {
  const [expanded, setExpanded]         = useState(false);
  const [bonusExpanded, setBonusExpanded] = useState(false);

  const score  = healthScore?.score ?? null;
  const label  = healthScore?.label ?? 'Chưa có dữ liệu';
  const emoji  = healthScore?.emoji ?? '🍽️';
  const achievedBonusKeys = useMemo(
    () => new Set((healthScore?.bonuses || []).map(b => b.key)),
    [healthScore]
  );

  const scoreColor      = getScoreColor(score);
  const visibleInsights = expanded ? insights : insights.slice(0, maxVisible);
  const hasMore         = insights.length > maxVisible;

  // ── SVG Ring ──────────────────────────────────────────────────────────────
  const size          = 80;
  const cx            = size / 2;
  const cy            = size / 2;
  const radius        = 32;
  const strokeWidth   = 7;
  const circumference = 2 * Math.PI * radius;
  const pct           = score !== null ? score / 100 : 0;
  const strokeDashoffset = circumference - pct * circumference;

  return (
    <div className="tcl-card bg-white border border-[#DFE3E4] rounded-2xl p-6 shadow-sm flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">🧠</span>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-[#96A5A8]">Phân tích AI</h3>
      </div>

      {/* Score Section */}
      <div className="flex items-center gap-4">
        {/* Ring */}
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            {/* Track */}
            <circle cx={cx} cy={cy} r={radius} fill="none" strokeWidth={strokeWidth} stroke="#DFE3E4" />
            {/* Glow track */}
            <circle cx={cx} cy={cy} r={radius} fill="none" strokeWidth={strokeWidth + 4}
              stroke={scoreColor.ring} opacity="0.1" />
            {/* Progress */}
            {score !== null && (
              <circle
                cx={cx} cy={cy} r={radius} fill="none"
                strokeWidth={strokeWidth}
                stroke={scoreColor.ring}
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            )}
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
            {score !== null ? (
              <>
                <span className={`text-2xl font-black leading-none ${scoreColor.text}`}>{score}</span>
                <span className="text-[9px] text-[#96A5A8] font-bold mt-0.5">/ 100</span>
              </>
            ) : (
              <span className="text-2xl font-black text-[#DFE3E4]">--</span>
            )}
          </div>
        </div>

        {/* Score Info */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-lg">{emoji}</span>
            <span className={`text-sm font-extrabold ${score !== null ? scoreColor.text : 'text-[#96A5A8]'}`}>
              {label}
            </span>
          </div>

          {score !== null ? (
            <>
              <div className="h-2 rounded-full bg-[#F0F2F3] overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r transition-all duration-1000 ease-out ${getScoreBarClass(score)}`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <p className="text-[10px] text-[#96A5A8] leading-none">
                Dựa trên {insights.length} tiêu chí hôm nay
              </p>
            </>
          ) : (
            <p className="text-[11px] text-[#96A5A8] leading-relaxed">
              Điểm sức khỏe sẽ được tính sau khi bạn nhập bữa ăn đầu tiên trong ngày!
            </p>
          )}
        </div>
      </div>

      {/* Divider */}
      {insights.length > 0 && (
        <div className="border-t border-[#DFE3E4]" />
      )}

      {/* Insights List */}
      {insights.length > 0 ? (
        <div className="flex flex-col gap-2">
          {visibleInsights.map((insight) => (
            <InsightItem key={`${insight.severity}-${insight.icon}`} insight={insight} />
          ))}

          {hasMore && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#96A5A8] hover:text-[#003139] transition-colors py-1 rounded-lg hover:bg-[#F0F2F3]"
            >
              {expanded ? (
                <><ChevronUp className="w-3.5 h-3.5" /> Thu gọn</>
              ) : (
                <><ChevronDown className="w-3.5 h-3.5" /> Xem thêm {insights.length - maxVisible} gợi ý</>
              )}
            </button>
          )}
        </div>
      ) : score !== null ? (
        <div className="flex items-center gap-2 bg-[#5FE089]/8 border border-[#5FE089]/20 rounded-xl px-3 py-2.5">
          <span className="text-lg">🎉</span>
          <p className="text-xs font-semibold text-[#2EA850]">Tuyệt vời! Hôm nay bạn không có cảnh báo nào cả!</p>
        </div>
      ) : null}

      {/* Bonuses Section */}
      <div className="border-t border-[#DFE3E4] pt-3">
        <button
          onClick={() => setBonusExpanded(!bonusExpanded)}
          className="flex items-center justify-between w-full text-[11px] font-bold text-[#96A5A8] hover:text-[#244348] transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <span>⭐</span>
            Điểm thưởng hôm nay
            {achievedBonusKeys.size > 0 && (
              <span className="bg-[#2EA850] text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                {achievedBonusKeys.size}/{ALL_POSSIBLE_BONUSES.length}
              </span>
            )}
          </span>
          {bonusExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {bonusExpanded && (
          <div className="flex flex-wrap gap-2 mt-3">
            {ALL_POSSIBLE_BONUSES.map(bonus => (
              <BonusBadge key={bonus.key} bonus={bonus} achieved={achievedBonusKeys.has(bonus.key)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
