import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import FoodSearchResult from './FoodSearchResult';
import toast from 'react-hot-toast';
import { X, Search, ChefHat } from 'lucide-react';

const MEAL_LABELS = {
  sang: 'Bữa sáng',
  trua: 'Bữa trưa',
  toi : 'Bữa tối',
  phu : 'Bữa phụ',
};

// ─── Tab: Tìm kiếm ────────────────────────────────────────────────────────────
function SearchTab({ date, defaultMeal }) {
  const [q, setQ]           = useState('');
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState('100');
  const [mealType, setMealType] = useState(defaultMeal);
  const qc = useQueryClient();

  const { data: searchResults, isFetching } = useQuery({
    queryKey: ['foods', 'search', q],
    queryFn : () => api.get(`/diary/foods/search?q=${encodeURIComponent(q)}&limit=30`).then(r => r.data.data.foods),
    enabled : q.length >= 1,
    staleTime: 60_000,
  });

  const addEntry = useMutation({
    mutationFn: (payload) => api.post('/diary/entries', payload),
    onSuccess : () => {
      qc.invalidateQueries({ queryKey: ['diary', date] });
      qc.invalidateQueries({ queryKey: ['dashboard', date] });
      toast.success(`Đã thêm ${selected.name}!`);
      setSelected(null);
      setAmount('100');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selected) { toast.error('Vui lòng chọn món ăn.'); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast.error('Số lượng không hợp lệ.'); return; }
    addEntry.mutate({ foodId: selected.id, amount: amt, mealType, date });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-base-content/40" />
        <input
          id="food-search-input"
          type="text"
          className="input input-bordered w-full pl-9"
          placeholder="Tìm món ăn, nguyên liệu..."
          value={q}
          onChange={e => { setQ(e.target.value); setSelected(null); }}
          autoFocus
        />
        {isFetching && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 loading loading-spinner loading-xs" />
        )}
      </div>

      {/* Kết quả tìm kiếm */}
      {!selected && searchResults?.length > 0 && (
        <div className="max-h-56 overflow-y-auto flex flex-col gap-1 border border-base-300 rounded-xl p-2">
          {searchResults.map(food => (
            <FoodSearchResult
              key={food.id}
              food={food}
              onSelect={setSelected}
            />
          ))}
        </div>
      )}

      {!selected && q && !isFetching && (!searchResults || searchResults.length === 0) && (
        <p className="text-center text-base-content/40 text-sm py-4">Không tìm thấy kết quả</p>
      )}

      {/* Form nhập số lượng sau khi chọn */}
      {selected && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 p-3 bg-base-200 rounded-xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-sm">{selected.name}</p>
              <p className="text-xs text-base-content/50">{selected.calories} kcal/{selected.unit || '100g'}</p>
            </div>
            <button type="button" onClick={() => setSelected(null)} className="btn btn-ghost btn-xs">
              Đổi
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="form-control">
              <label className="label py-0">
                <span className="label-text text-xs">
                  Số lượng ({selected.unit === '100g' ? 'g' : selected.unit === '100ml' ? 'ml' : (selected.unit || 'g')})
                </span>
              </label>
              <input
                id="food-amount-input"
                type="number"
                className="input input-bordered input-sm"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="1"
                step="any"
                required
              />
            </div>
            <div className="form-control">
              <label className="label py-0">
                <span className="label-text text-xs">Bữa ăn</span>
              </label>
              <select
                id="food-meal-select"
                className="select select-bordered select-sm"
                value={mealType}
                onChange={e => setMealType(e.target.value)}
              >
                {Object.entries(MEAL_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            id="food-add-submit"
            type="submit"
            className="btn btn-primary btn-sm"
            disabled={addEntry.isPending}
          >
            {addEntry.isPending ? <span className="loading loading-spinner loading-xs" /> : '+ Thêm vào nhật ký'}
          </button>
        </form>
      )}
    </div>
  );
}

// ─── Tab: Tạo món mới ─────────────────────────────────────────────────────────
function CreateFoodTab({ onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: '', calories: '', protein: '', carbs: '', fat: '',
    fiber: '', sugar: '', sodium: '', vitaminA: '', vitaminC: '', calcium: '', iron: '',
    unit: '100g', category: 'khac', foodType: 'raw',
  });

  const createFood = useMutation({
    mutationFn: (payload) => api.post('/diary/foods', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['foods'] });
      toast.success(`Đã tạo món "${form.name}"!`);
      onClose();
    },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    createFood.mutate(form);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2">
        <div className="form-control">
          <label className="label py-0"><span className="label-text text-xs">Tên món *</span></label>
          <input
            id="create-food-name"
            className="input input-bordered input-sm"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { k: 'calories', label: 'Calories (kcal) *' },
            { k: 'protein',  label: 'Protein (g) *' },
            { k: 'carbs',    label: 'Carbs (g) *' },
            { k: 'fat',      label: 'Fat (g) *' },
          ].map(({ k, label }) => (
            <div key={k} className="form-control">
              <label className="label py-0"><span className="label-text text-xs">{label}</span></label>
              <input
                id={`create-food-${k}`}
                type="number"
                className="input input-bordered input-sm"
                value={form[k]}
                onChange={e => set(k, e.target.value)}
                min="0"
                step="any"
                required
              />
            </div>
          ))}
        </div>

        {/* Vi chất nâng cao */}
        <div className="collapse collapse-arrow border border-base-300 bg-base-100 rounded-box mt-2">
          <input type="checkbox" id="collapse-micronutrients" /> 
          <div className="collapse-title text-xs font-medium py-2 min-h-0">
            Vi chất nâng cao (Tùy chọn)
          </div>
          <div className="collapse-content flex flex-col gap-2 pb-2">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { k: 'fiber',    label: 'Chất xơ (g)' },
                { k: 'sugar',    label: 'Đường (g)' },
                { k: 'sodium',   label: 'Natri (mg)' },
                { k: 'vitaminA', label: 'Vitamin A (µg)' },
                { k: 'vitaminC', label: 'Vitamin C (mg)' },
                { k: 'calcium',  label: 'Canxi (mg)' },
                { k: 'iron',     label: 'Sắt (mg)' },
              ].map(({ k, label }) => (
                <div key={k} className="form-control">
                  <label className="label py-0"><span className="label-text text-[10px] text-base-content/70">{label}</span></label>
                  <input
                    id={`create-food-${k}`}
                    type="number"
                    className="input input-bordered input-xs h-7"
                    value={form[k]}
                    onChange={e => set(k, e.target.value)}
                    min="0"
                    step="any"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div className="form-control">
            <label className="label py-0"><span className="label-text text-xs">Đơn vị</span></label>
            <input
              id="create-food-unit"
              className="input input-bordered input-sm"
              value={form.unit}
              onChange={e => set('unit', e.target.value)}
            />
          </div>
          <div className="form-control">
            <label className="label py-0"><span className="label-text text-xs">Loại</span></label>
            <select
              id="create-food-type"
              className="select select-bordered select-sm"
              value={form.foodType}
              onChange={e => set('foodType', e.target.value)}
            >
              <option value="raw">Nguyên liệu</option>
              <option value="dish">Món ăn</option>
            </select>
          </div>
        </div>
      </div>
      <button
        id="create-food-submit"
        type="submit"
        className="btn btn-primary btn-sm"
        disabled={createFood.isPending}
      >
        {createFood.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Tạo món'}
      </button>
    </form>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export default function AddFoodModal({ isOpen, onClose, date, defaultMeal = 'sang' }) {
  const [tab, setTab] = useState('search');

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Thêm món ăn</h3>
          <button
            id="add-food-modal-close"
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-square"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-4">
          <button
            id="tab-search"
            className={`tab ${tab === 'search' ? 'tab-active' : ''}`}
            onClick={() => setTab('search')}
          >
            <Search className="w-4 h-4 mr-1" /> Tìm kiếm
          </button>
          <button
            id="tab-create"
            className={`tab ${tab === 'create' ? 'tab-active' : ''}`}
            onClick={() => setTab('create')}
          >
            <ChefHat className="w-4 h-4 mr-1" /> Tạo món mới
          </button>
        </div>

        {tab === 'search' ? (
          <SearchTab date={date} defaultMeal={defaultMeal} />
        ) : (
          <CreateFoodTab onClose={onClose} />
        )}
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose} />
    </div>
  );
}
