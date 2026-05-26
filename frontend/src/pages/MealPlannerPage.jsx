import { useState } from 'react';
import {
  useMealConfig,
  useTemplates,
  useGenerateMeal,
  useSwapIngredient,
  usePushToDiary,
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
import AnimatedSection from '../components/common/AnimatedSection';

export default function MealPlannerPage() {
  const [selectedMeal, setSelectedMeal]       = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [result, setResult]                   = useState(null);
  const [swapTarget, setSwapTarget]           = useState(null);
  const [showSwap, setShowSwap]               = useState(false);
  const [showConfig, setShowConfig]           = useState(false);
  const [currentFoods, setCurrentFoods]       = useState([]);
  const [pinnedFoods, setPinnedFoods]         = useState({
    carb: null,
    protein: null,
    fat: null,
    fiber: null
  });

  const { data: configData = [] }   = useMealConfig();
  const { data: templates = [] }    = useTemplates();
  const generateMeal   = useGenerateMeal();
  const swapIngredient = useSwapIngredient();
  const pushToDiary    = usePushToDiary(getToday());

  const handleGenerate = () => {
    if (!selectedMeal)     { toast.error('Vui lòng chọn bữa ăn.'); return; }
    if (!selectedTemplate) { toast.error('Vui lòng chọn template.'); return; }

    const preferences = {};
    Object.entries(pinnedFoods).forEach(([role, id]) => {
      if (id) preferences[role] = id;
    });

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
      if (nextId) {
        toast.success(`Đã ghim món ${item.food?.name}`);
      } else {
        toast('Đã bỏ ghim món', { icon: '🔓' });
      }
      return {
        ...prev,
        [role]: nextId
      };
    });
  };

  const handleSwapClick = (item) => {
    setSwapTarget(item);
    setShowSwap(true);
  };

  const handleConfirmSwap = (newFood) => {
    if (!result) return;
    swapIngredient.mutate(
      {
        mealKey       : selectedMeal,
        currentFoodIds: currentFoods,
        newFoodId     : newFood.id,
        slotRoleToSwap: swapTarget.food?.category || swapTarget.role,
      },
      {
        onSuccess: (res) => {
          setResult(res);
          setCurrentFoods(res.data?.map(i => i.food?.id) || []); // Đồng bộ món hiện tại sau khi đổi
          
          // Tự động ghim món vừa đổi để giữ nguyên cho các lần tạo tiếp theo
          const role = swapTarget.food?.category || swapTarget.role;
          if (role) {
            setPinnedFoods(prev => ({
              ...prev,
              [role]: newFood.id
            }));
          }

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
      .map(i => ({
        foodId  : i.food?.id,
        amount  : Math.round(i.grams),
        mealType: selectedMeal,
      }));
    pushToDiary.mutate(entries, {
      onSuccess: () => toast.success('Đã đẩy thực đơn vào nhật ký hôm nay!'),
      onError  : () => toast.error('Có lỗi khi đẩy vào nhật ký.'),
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
    setPinnedFoods(prev => ({
      ...prev,
      [role]: foodId
    }));
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Lập kế hoạch bữa ăn</h1>
          <p className="text-base-content/50 text-sm">Thuật toán Gauss Solver tự động tính gram chuẩn</p>
        </div>
        <button
          id="open-config"
          onClick={() => setShowConfig(true)}
          className="btn btn-ghost btn-sm gap-2"
        >
          <Settings className="w-4 h-4" />
          Cấu hình
        </button>
      </div>

      {/* Step 1: Chọn bữa ăn */}
      <AnimatedSection delay={0} className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-base-content/60 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-bold inline-flex items-center justify-center">1</span>
          Chọn bữa ăn
        </h2>
        <MealSelector
          mealsConfig={configData}
          selectedMeal={selectedMeal}
          onSelect={setSelectedMeal}
        />
      </AnimatedSection>

      {/* Step 2: Chọn template */}
      <AnimatedSection delay={0.05} className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-base-content/60 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-bold inline-flex items-center justify-center">2</span>
          Chọn template
        </h2>
        <TemplateSelector
          templates={templates}
          selectedId={selectedTemplate}
          onSelect={handleSelectTemplate}
        />
      </AnimatedSection>

      {/* Step 2.5: Ghim sẵn nguyên liệu */}
      {activeTemplate && activeTemplate.slots && (
        <AnimatedSection delay={0.1} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-base-content/60 flex items-center gap-2">
              <span className="w-10 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-bold inline-flex items-center justify-center">2.5</span>
              Ghim sẵn nguyên liệu (Tùy chọn)
            </h2>
            {Object.values(pinnedFoods).some(v => v !== null) && (
              <button
                id="clear-all-pins"
                onClick={() => setPinnedFoods({ carb: null, protein: null, fat: null, fiber: null })}
                className="btn btn-ghost btn-xs text-error font-semibold"
              >
                Xóa tất cả ghim
              </button>
            )}
          </div>
          <p className="text-xs text-base-content/50">Khóa nguyên liệu yêu thích trước khi thuật toán tự động đề xuất.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {activeTemplate.slots.map((slot, idx) => (
              <PinSlotRow
                key={idx}
                slot={slot}
                pinnedFoodId={pinnedFoods[slot.role]}
                onPinChange={handlePinChange}
              />
            ))}
          </div>
        </AnimatedSection>
      )}

      {/* Nút Tạo thực đơn */}
      <AnimatedSection delay={0.12}>
        <button
          id="generate-meal"
          onClick={handleGenerate}
          disabled={generateMeal.isPending || !selectedMeal || !selectedTemplate}
          className="btn border-none gap-2 w-full sm:w-auto self-start bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:scale-[1.02] active:scale-[0.98] transition-all"
        >
          {generateMeal.isPending ? (
            <span className="loading loading-spinner loading-sm" />
          ) : (
            <Wand2 className="w-4 h-4" />
          )}
          Tạo thực đơn
        </button>
      </AnimatedSection>

      {/* Step 3: Kết quả */}
      {result && (
        <AnimatedSection delay={0.15} className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-base-content/60 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-bold inline-flex items-center justify-center">3</span>
            Kết quả thực đơn
          </h2>
          <MealResult result={result} onSwap={handleSwapClick} pinnedFoods={pinnedFoods} onTogglePin={handleTogglePin} />

          {/* Đẩy vào nhật ký */}
          {result.success && (
            <button
              id="push-to-diary"
              onClick={handlePushToDiary}
              disabled={pushToDiary.isPending}
              className="btn btn-success gap-2 w-full sm:w-auto self-start"
            >
              {pushToDiary.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <BookOpen className="w-4 h-4" />
              )}
              Đẩy vào nhật ký hôm nay
            </button>
          )}
        </AnimatedSection>
      )}

      {/* Modals */}
      <IngredientSwapModal
        isOpen={showSwap}
        onClose={() => setShowSwap(false)}
        swapTarget={swapTarget}
        allowedTags={allowedTags}
        onConfirmSwap={handleConfirmSwap}
      />
      <MealConfigModal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
      />
    </div>
  );
}
