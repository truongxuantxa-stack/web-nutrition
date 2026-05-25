export default function TemplateSelector({ templates = [], selectedId, onSelect }) {
  if (!templates.length) {
    return <p className="text-base-content/40 text-sm text-center py-4">Chưa có template bữa ăn</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-base-content/50">
        Chọn Template
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {templates.map(t => (
          <button
            key={t.id}
            id={`template-${t.id}`}
            onClick={() => onSelect(t.id)}
            className={`card border-2 p-3 text-left gap-1 transition-all
              ${selectedId === t.id
                ? 'border-primary bg-primary/5'
                : 'border-base-300 bg-base-100 hover:border-primary/30'
              }`}
          >
            <p className="font-semibold text-sm">{t.name}</p>
            {t.description && (
              <p className="text-xs text-base-content/50 line-clamp-2">{t.description}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
