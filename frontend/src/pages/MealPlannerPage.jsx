import { useState } from 'react';
import {
  useMealConfig, useTemplates, useGenerateMeal, useSwapIngredient, usePushToDiary,
} from '../hooks/useMealPlanner';
import { getToday } from '../lib/dayjs';
import MealSelector        from '../components/meal-planner/MealSelector';
import TemplateSelector    from '../components/meal-planner/TemplateSelector';
import MealResult          from '../components/meal-planner/MealResult';
import IngredientSwapModal from '../components/meal-planner/IngredientSwapModal';
import MealConfigModal     from '../components/meal-planner/MealConfigModal';
import PinSlotRow          from '../components/meal-planner/PinSlotRow';
import toast from 'react-hot-toast';
import { Settings, Wand2, BookOpen } from 'lucide-react';

export default function MealPlannerPage() {
  const [selectedMeal, setSelectedMeal]         = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [result, setResult]                     = useState(null);
  const [swapTarget, setSwapTarget]             = useState(null);
  const [showSwap, setShowSwap]                 = useState(false);
  const [showConfig, setShowConfig]             = useState(false);
  const [currentFoods, setCurrentFoods]         = useState([]);
  const [pinnedFoods, setPinnedFoods]           = useState({ carb: null, protein: null, fat: null, fiber: null });

  const { data: configData = [] } = useMealConfig();
  const { data: templates = [] }  = useTemplates();
  const generateMeal   = useGenerateMeal();
  const swapIngredient = useSwapIngredient();
  const pushToDiary    = usePushToDiary(getToday());

  const handleGenerate = () => {
    if (!selectedMeal)     { toast.error('Vui lòng chọn bữa ăn.'); return; }
    if (!selectedTemplate) { toast.error('Vui lòng chọn template.'); return; }
    const preferences = {};
    Object.entries(pinnedFoods).forEach(([role, id]) => { if (id) preferences[role] = id; });
    generateMeal.mutate(
      { mealKey: selectedMeal, templateId: selectedTemplate, preferences },
      {
        onSuccess: (res) => {
          setResult(res);
          setCurrentFoods(res.data?.map(i => i.food?.id) || []);
          if (res.success) toast.success('Đã tạo thực đơn!');
          else toast('Thực đơn có cảnh báo — kiểm tra kết quả', { icon: '⚠️' });
        },
        onError: () => toast.error('Không thể tạo thực đơn.'),
      }
    );
  };

  const handleTogglePin = (item) => {
    const role = item.food?.category || item.role;
    if (!role) return;
    setPinnedFoods(prev => {
      const isPinned = prev[role] === item.food?.id;
      const nextId = isPinned ? null : item.food?.id;
      if (nextId) toast.success(`Đã ghim món ${item.food?.name}`);
      else toast('Đã bỏ ghim món', { icon: '🔓' });
      return { ...prev, [role]: nextId };
    });
  };

  const handleSwapClick = (item) => { setSwapTarget(item); setShowSwap(true); };

  const handleConfirmSwap = (newFood) => {
    if (!result) return;
    swapIngredient.mutate(
      {
        mealKey: selectedMeal,
        currentFoodIds: currentFoods,
        newFoodId: newFood.id,
        slotRoleToSwap: swapTarget.food?.category || swapTarget.role,
      },
      {
        onSuccess: (res) => {
          setResult(res);
          setCurrentFoods(res.data?.map(i => i.food?.id) || []);
          const role = swapTarget.food?.category || swapTarget.role;
          if (role) setPinnedFoods(prev => ({ ...prev, [role]: newFood.id }));
          if (res.success) toast.success(`Đã đổi sang ${newFood.name}!`);
          else toast('Tổ hợp này có vấn đề — xem cảnh báo', { icon: '⚠️' });
        },
      }
    );
  };

  const handlePushToDiary = () => {
    if (!result?.data?.length) { toast.error('Chưa có thực đơn để đẩy.'); return; }
    const entries = result.data
      .filter(i => i.grams > 0)
      .map(i => ({ foodId: i.food?.id, amount: Math.round(i.grams), mealType: selectedMeal }));
    pushToDiary.mutate(entries, {
      onSuccess: () => toast.success('Đã đẩy thực đơn vào nhật ký hôm nay!'),
      onError:   () => toast.error('Có lỗi khi đẩy vào nhật ký.'),
    });
  };

  const activeTemplate = templates.find(t => t.id === selectedTemplate);
  const swapRole = swapTarget?.food?.category || swapTarget?.role;
  const allowedTags = activeTemplate?.slots?.find(s => s.role === swapRole)?.allowedTags || [];

  const handleSelectTemplate = (id) => {
    setSelectedTemplate(id);
    setPinnedFoods({ carb: null, protein: null, fat: null, fiber: null });
    setResult(null);
  };

  const handlePinChange = (role, foodId) => {
    setPinnedFoods(prev => ({ ...prev, [role]: foodId }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#003139]">Lập kế hoạch bữa ăn</h1>
          <p className="text-[#96A5A8] text-sm">Thuật toán Gauss Solver tự động tính gram chuẩn</p>
        </div>
        <button
          id="open-config"
          onClick={() => setShowConfig(true)}
          className="tcl-btn-ghost gap-2 text-sm border border-[#DFE3E4]"
        >
          <Settings className="w-4 h-4" />
          Cấu hình
        </button>
      </div>

      {/* Step 1 */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-[#96A5A8] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#003139] text-white text-xs font-bold inline-flex items-center justify-center">1</span>
          Chọn bữa ăn
        </h2>
        <MealSelector mealsConfig={configData} selectedMeal={selectedMeal} onSelect={setSelectedMeal} />
      </div>

      {/* Step 2 */}
      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-[#96A5A8] flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[#003139] text-white text-xs font-bold inline-flex items-center justify-center">2</span>
          Chọn template
        </h2>
        <TemplateSelector templates={templates} selectedId={selectedTemplate} onSelect={handleSelectTemplate} />
      </div>

      {/* Step 2.5: Pin Slots */}
      {activeTemplate && activeTemplate.slots && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#96A5A8] flex items-center gap-2">
              <span className="w-10 h-6 rounded-full bg-[#003139] text-white text-xs font-bold inline-flex items-center justify-center">2.5</span>
              Ghim sẵn nguyên liệu (Tùy chọn)
            </h2>
            {Object.values(pinnedFoods).some(v => v !== null) && (
              <button
                id="clear-all-pins"
                onClick={() => setPinnedFoods({ carb: null, protein: null, fat: null, fiber: null })}
                className="text-xs font-semibold text-red-500 hover:underline"
              >
                Xóa tất cả ghim
              </button>
            )}
          </div>
          <p className="text-xs text-[#96A5A8]">Khóa nguyên liệu yêu thích trước khi thuật toán tự động đề xuất.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTemplate.slots.map((slot, idx) => (
              <PinSlotRow key={idx} slot={slot} pinnedFoodId={pinnedFoods[slot.role]} onPinChange={handlePinChange} />
            ))}
          </div>
        </div>
      )}

      {/* Generate button */}
      <div>
        <button
          id="generate-meal"
          onClick={handleGenerate}
          disabled={generateMeal.isPending || !selectedMeal || !selectedTemplate}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[#003139] text-white font-bold rounded-xl hover:bg-[#244348] hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {generateMeal.isPending ? (
            <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          Tạo thực đơn
        </button>
      </div>

      {/* Result */}
      {result && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-[#96A5A8] flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-[#003139] text-white text-xs font-bold inline-flex items-center justify-center">3</span>
            Kết quả thực đơn
          </h2>
          <MealResult result={result} onSwap={handleSwapClick} pinnedFoods={pinnedFoods} onTogglePin={handleTogglePin} />

          {result.success && (
            <button
              id="push-to-diary"
              onClick={handlePushToDiary}
              disabled={pushToDiary.isPending}
              className="tcl-btn-success gap-2 self-start"
            >
              {pushToDiary.isPending ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
              Đẩy vào nhật ký hôm nay
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <IngredientSwapModal
        isOpen={showSwap}
        onClose={() => setShowSwap(false)}
        swapTarget={swapTarget}
        allowedTags={allowedTags}
        onConfirmSwap={handleConfirmSwap}
      />
      <MealConfigModal isOpen={showConfig} onClose={() => setShowConfig(false)} />
    </div>
  );
}
