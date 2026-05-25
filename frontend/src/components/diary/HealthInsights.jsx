import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

const SEVERITY_CONFIG = {
  danger : { icon: AlertCircle,   className: 'alert-error'   },
  warning: { icon: AlertTriangle, className: 'alert-warning'  },
  info   : { icon: Info,          className: 'alert-info'     },
};

export default function HealthInsights({ insights = [] }) {
  if (!insights.length) return null;

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/50">
        💡 Health Insights
      </h3>
      {insights.map((item, i) => {
        const cfg = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.info;
        const Icon = cfg.icon;
        return (
          <div key={i} className={`alert ${cfg.className} py-2 px-3`}>
            <Icon className="w-4 h-4 shrink-0" />
            <span className="text-sm">{item.message}</span>
          </div>
        );
      })}
    </div>
  );
}
