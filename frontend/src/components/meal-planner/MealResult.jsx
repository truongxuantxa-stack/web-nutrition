import { useState } from 'react';
import { RefreshCw, AlertTriangle, Pin } from 'lucide-react';
import ImageLightbox from '../common/ImageLightbox';
import SafeImage from '../common/SafeImage';

export default function MealResult({ result, onSwap, pinnedFoods = {}, onTogglePin }) {
  const [activeLightboxImg, setActiveLightboxImg] = useState(null);
  const [activeLightboxTitle, setActiveLightboxTitle] = useState('');

  if (!result) return null;

  const { data: items = [], errors = [], warnings = [] } = result;

  const allIssues = [...errors, ...(warnings || [])];

  return (
    <div className="flex flex-col gap-3">
      {/* Warnings / Errors */}
      {allIssues.map((issue, i) => (
        <div
          key={i}
          className={`alert ${issue.severity === 'error' || issue.type === 'FATAL' ? 'alert-error' : 'alert-warning'} py-2`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span className="text-sm">{issue.message}</span>
        </div>
      ))}

      {/* Result table */}
      {items.length > 0 && (
        <div className="glass-card overflow-hidden">
          <table className="table table-sm">
            <thead>
              <tr className="bg-base-200 text-xs text-base-content/60">
                <th>Nguyên liệu</th>
                <th className="text-right">Gram</th>
                <th className="text-right">Calo</th>
                <th className="text-right">P/C/F</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => {
                const isNegative = item.grams < 0;
                const role = item.food?.category || item.role;
                const isPinned = pinnedFoods[role] === item.food?.id;

                return (
                  <tr key={i} className={isNegative ? 'bg-error/5' : ''}>
                    <td className="align-middle">
                      <div className="flex items-center gap-2">
                        {isPinned && <Pin className="w-3.5 h-3.5 text-primary shrink-0 fill-primary" />}
                        <SafeImage
                          src={item.food?.imageUrl}
                          alt={item.food?.name}
                          className="w-7 h-7 rounded-lg object-cover bg-base-300 border border-base-content/10 shadow-sm shrink-0 cursor-zoom-in hover:scale-110 active:scale-95 transition-transform"
                          onClick={() => {
                            setActiveLightboxImg(item.food.imageUrl);
                            setActiveLightboxTitle(item.food.name);
                          }}
                          fallback={
                            <div className="w-7 h-7 rounded-lg bg-base-200 flex items-center justify-center text-xs shrink-0 select-none border border-base-content/5">
                              {role === 'protein' ? '🥩' : role === 'carb' ? '🍚' : role === 'fat' ? '🥑' : role === 'fiber' ? '🥗' : '🍽️'}
                            </div>
                          }
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="font-medium text-sm truncate max-w-[150px] sm:max-w-xs">{item.food?.name || item.foodName}</span>
                          {isNegative && (
                            <span className="badge badge-error badge-xs w-max mt-0.5">⚠️ Giá trị âm</span>
                          )}
                          {/* Vi chất */}
                          {!isNegative && (() => {
                            const f = item.food;
                            const g = item.grams;
                            if (!f) return null;
                            const fiber    = f.fiber    > 0 ? Math.round(f.fiber    * g / 100 * 10) / 10 : 0;
                            const vitA     = f.vitaminA > 0 ? Math.round(f.vitaminA * g / 100) : 0;
                            const vitC     = f.vitaminC > 0 ? Math.round(f.vitaminC * g / 100 * 10) / 10 : 0;
                            const calcium  = f.calcium  > 0 ? Math.round(f.calcium  * g / 100) : 0;
                            const iron     = f.iron     > 0 ? Math.round(f.iron     * g / 100 * 10) / 10 : 0;
                            if (!fiber && !vitA && !vitC && !calcium && !iron) return null;
                            return (
                              <span className="text-[10px] text-base-content/40 flex flex-wrap gap-x-2 mt-0.5">
                                {fiber   > 0 && <span>Chất xơ: {fiber}g</span>}
                                {vitA    > 0 && <span>🥕 Vitamin A: {vitA}µg</span>}
                                {vitC    > 0 && <span>🍊 Vitamin C: {vitC}mg</span>}
                                {calcium > 0 && <span>🦴 Canxi: {calcium}mg</span>}
                                {iron    > 0 && <span>🩸 Sắt: {iron}mg</span>}
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                      {role && (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
                          role === 'protein' ? 'bg-blue-500/10 text-blue-600' :
                          role === 'carb'    ? 'bg-amber-500/10 text-amber-600' :
                          role === 'fat'     ? 'bg-pink-500/10 text-pink-600' :
                                               'bg-emerald-500/10 text-emerald-600'
                        }`}>{role}</span>
                      )}
                    </td>
                    <td className="text-right font-mono text-sm">
                      {isNegative ? '—' : `${Math.round(item.grams)}g`}
                    </td>
                    <td className="text-right text-sm">
                      {isNegative ? '—' : `${Math.round((item.food?.calories || 0) * item.grams / 100)} kcal`}
                    </td>
                    <td className="text-right text-xs text-base-content/50">
                      {isNegative ? '—' : `${Math.round((item.food?.protein || 0) * item.grams / 100)}/${Math.round((item.food?.carbs || 0) * item.grams / 100)}/${Math.round((item.food?.fat || 0) * item.grams / 100)}`}
                    </td>
                    <td className="flex items-center justify-end gap-1.5">
                      <button
                        id={`pin-${i}`}
                        onClick={() => onTogglePin(item)}
                        className={`btn btn-ghost btn-xs btn-square ${isPinned ? 'text-primary bg-primary/10' : 'text-base-content/30 hover:bg-base-200'}`}
                        title={isPinned ? 'Bỏ ghim món này' : 'Ghim cố định món này'}
                      >
                        <Pin className="w-3.5 h-3.5" />
                      </button>
                      <button
                        id={`swap-${i}`}
                        onClick={() => onSwap(item, i)}
                        className="btn btn-ghost btn-xs btn-square text-base-content/60 hover:bg-base-200"
                        title="Đổi nguyên liệu"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ImageLightbox 
        src={activeLightboxImg} 
        alt={activeLightboxTitle} 
        isOpen={!!activeLightboxImg} 
        onClose={() => setActiveLightboxImg(null)} 
      />
    </div>
  );
}
