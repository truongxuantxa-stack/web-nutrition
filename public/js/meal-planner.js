document.addEventListener('DOMContentLoaded', () => {
    // ─── DOM Elements ────────────────────────────────────────────────────────────
    const configContainer = document.getElementById('mealConfigContainer');
    const totalPercentDisplay = document.getElementById('totalPercentDisplay');
    const formConfig = document.getElementById('mealConfigForm');
    
    const selectTemplate = document.getElementById('selectTemplate');
    const selectMealKey = document.getElementById('selectMealKey');
    const btnGenerate = document.getElementById('btnGenerate');
    const btnRetryGenerate = document.getElementById('btnRetryGenerate');
    
    const overlay = document.getElementById('loadingOverlay');
    const emptyState = document.getElementById('emptyState');
    const errorState = document.getElementById('errorState');
    const resultView = document.getElementById('resultView');
    
    // Result DOMs
    const resTotalCal = document.getElementById('resTotalCal');
    const resTotalPro = document.getElementById('resTotalPro');
    const resTotalCarb = document.getElementById('resTotalCarb');
    const resTotalFat = document.getElementById('resTotalFat');
    const warningContainer = document.getElementById('warningContainer');
    const foodListContainer = document.getElementById('foodListContainer');
    const btnLogMeal = document.getElementById('btnLogMeal');

    // State
    let currentResultData = null; // Lưu mảng các món đang suggest
    let currentMealKey = null;

    // ─── Khởi tạo ────────────────────────────────────────────────────────────────
    loadConfig();
    loadTemplates();

    // ─── Cấu hình % Bữa Ăn ───────────────────────────────────────────────────────
    async function loadConfig() {
        try {
            const { data } = await axios.get('/api/meal-planner/config');
            if(data.success && data.data) {
                renderConfigInputs(data.data);
            }
        } catch (error) {
            console.error('Lỗi tải cấu hình:', error);
            configContainer.innerHTML = '<div class="text-red-500 text-sm">Lỗi kết nối.</div>';
        }
    }

    function renderConfigInputs(meals) {
        configContainer.innerHTML = '';
        let total = 0;
        meals.forEach((meal, index) => {
            total += Number(meal.percent);
            const html = `
                <div class="flex items-center gap-3">
                    <div class="flex-1">
                        <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">${meal.label}</label>
                        <input type="hidden" name="mealKey[]" value="${meal.key}">
                        <input type="hidden" name="mealLabel[]" value="${meal.label}">
                        <div class="relative">
                            <input type="number" name="mealPercent[]" value="${meal.percent}" min="0" max="100" class="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold text-gray-700 focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none meal-percent-input">
                            <span class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-bold">%</span>
                        </div>
                    </div>
                </div>
            `;
            configContainer.insertAdjacentHTML('beforeend', html);
        });
        
        updateTotalDisplay(total);

        // Lắng nghe sự kiện input để tính lại tổng
        document.querySelectorAll('.meal-percent-input').forEach(input => {
            input.addEventListener('input', () => {
                let currentTotal = 0;
                document.querySelectorAll('.meal-percent-input').forEach(i => currentTotal += Number(i.value) || 0);
                updateTotalDisplay(currentTotal);
            });
        });
    }

    function updateTotalDisplay(total) {
        totalPercentDisplay.textContent = `${total}%`;
        if (total === 100) {
            totalPercentDisplay.className = 'font-bold text-green-600';
            document.getElementById('btnSaveConfig').disabled = false;
        } else {
            totalPercentDisplay.className = 'font-bold text-red-500';
            document.getElementById('btnSaveConfig').disabled = true;
        }
    }

    formConfig.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const keys = document.getElementsByName('mealKey[]');
        const labels = document.getElementsByName('mealLabel[]');
        const percents = document.getElementsByName('mealPercent[]');
        
        const meals = [];
        for(let i = 0; i < keys.length; i++) {
            meals.push({
                key: keys[i].value,
                label: labels[i].value,
                percent: Number(percents[i].value)
            });
        }

        const btn = document.getElementById('btnSaveConfig');
        const oldText = btn.textContent;
        btn.innerHTML = '<span class="loading loading-spinner loading-xs"></span> Đang lưu...';
        btn.disabled = true;

        try {
            const { data } = await axios.put('/api/meal-planner/config', { meals });
            if(data.success) {
                // Hiển thị toast (nếu có thư viện toast thì dùng, ở đây dùng alert đơn giản)
                alert('Đã lưu cấu hình thành công!');
            } else {
                alert(data.message || 'Lỗi lưu cấu hình.');
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi kết nối.');
        } finally {
            btn.innerHTML = oldText;
            btn.disabled = false;
        }
    });

    // ─── Tải Template ─────────────────────────────────────────────────────────────
    async function loadTemplates() {
        try {
            const { data } = await axios.get('/api/meal-planner/templates');
            if(data.success && data.data) {
                selectTemplate.innerHTML = '';
                data.data.forEach(t => {
                    const opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = t.name;
                    selectTemplate.appendChild(opt);
                });
            }
        } catch (error) {
            console.error('Lỗi tải template:', error);
            selectTemplate.innerHTML = '<option value="">Lỗi tải dữ liệu</option>';
        }
    }

    // ─── Sinh Bữa Ăn (Generate) ───────────────────────────────────────────────────
    btnGenerate.addEventListener('click', handleGenerate);
    if(btnRetryGenerate) btnRetryGenerate.addEventListener('click', handleGenerate);

    async function handleGenerate() {
        const templateId = selectTemplate.value;
        const mealKey = selectMealKey.value;
        if (!templateId || !mealKey) {
            alert('Vui lòng chọn bữa ăn và template!');
            return;
        }

        // Show UI loading
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
        resultView.classList.add('hidden');

        try {
            const { data } = await axios.post('/api/meal-planner/generate', {
                mealKey,
                templateId,
                preferences: {} // Chưa áp dụng preferences ở phiên bản v1
            });

            if (data.success || (!data.success && data.data)) {
                // Có dữ liệu data (kể cả khi warning hay error mảng)
                currentResultData = data.data;
                currentMealKey = mealKey;
                renderResult(data.data, data.warnings || data.errors, data.success);
            } else {
                showError(data.message || (data.errors && data.errors[0]?.message) || 'Lỗi không xác định.');
            }
        } catch (error) {
            const msg = error.response?.data?.message || (error.response?.data?.errors && error.response.data.errors[0]?.message) || 'Lỗi server / Mạng.';
            showError(msg);
        } finally {
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
    }

    function showError(message) {
        errorState.classList.remove('hidden');
        document.getElementById('errorMessage').textContent = message;
    }

    function renderResult(foodItems, alerts = [], isSuccess) {
        resultView.classList.remove('hidden');

        // 1. Render Foods & Tính tổng Macro
        foodListContainer.innerHTML = '';
        let tCal = 0, tPro = 0, tCarb = 0, tFat = 0;

        foodItems.forEach(item => {
            const f = item.food;
            const g = item.grams;
            const multiplier = g / 100;
            
            const cal = f.calories * multiplier;
            const pro = f.protein * multiplier;
            const carb = f.carbs * multiplier;
            const fat = f.fat * multiplier;

            tCal += cal; tPro += pro; tCarb += carb; tFat += fat;

            // Chỉnh màu tuỳ theo độ nghiêm trọng (nếu g < 0)
            const isNegative = g < 0;
            const cardBg = isNegative ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100 hover:border-green-200';
            
            // Lấy icon theo category
            let icon = 'fa-leaf text-green-500';
            if(f.category === 'protein') icon = 'fa-drumstick-bite text-red-500';
            if(f.category === 'carb') icon = 'fa-bowl-rice text-orange-500';
            if(f.category === 'fat') icon = 'fa-droplet text-yellow-500';

            const html = `
                <div class="flex items-center justify-between p-4 rounded-2xl border ${cardBg} transition-all group">
                    <div class="flex items-center gap-4">
                        <div class="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
                            <i class="fa-solid ${icon}"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-800 ${isNegative ? 'text-red-600' : ''}">${f.name}</h4>
                            <div class="text-xs text-gray-500 font-medium flex gap-2">
                                <span>P: ${pro.toFixed(1)}g</span>
                                <span>C: ${carb.toFixed(1)}g</span>
                                <span>F: ${fat.toFixed(1)}g</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <div class="text-right">
                            <div class="font-black text-lg ${isNegative ? 'text-red-600' : 'text-gray-800'}">${g}g</div>
                            <div class="text-xs text-gray-400 font-medium">${cal.toFixed(0)} kcal</div>
                        </div>
                        <!-- Nút Đổi món -->
                        <button class="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-green-600 hover:border-green-300 transition-colors" title="Đổi nguyên liệu khác" onclick="window.openSwapModal(${f.id}, '${f.category}', '${f.name.replace(/'/g, "\\'")}')">
                            <i class="fa-solid fa-rotate"></i>
                        </button>
                    </div>
                </div>
            `;
            foodListContainer.insertAdjacentHTML('beforeend', html);
        });

        // Cập nhật tổng
        resTotalCal.textContent = `${Math.round(tCal)} kcal`;
        resTotalPro.textContent = `${tPro.toFixed(1)}g`;
        resTotalCarb.textContent = `${tCarb.toFixed(1)}g`;
        resTotalFat.textContent = `${tFat.toFixed(1)}g`;

        // 2. Render Cảnh báo (nếu có)
        warningContainer.innerHTML = '';
        if (alerts && alerts.length > 0) {
            warningContainer.classList.remove('hidden');
            alerts.forEach(alert => {
                const colorClass = alert.severity === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200';
                const iconClass = alert.severity === 'error' ? 'fa-circle-xmark text-red-500' : 'fa-triangle-exclamation text-yellow-500';
                
                const html = `
                    <div class="p-3 rounded-xl border ${colorClass} text-sm flex gap-3 items-start">
                        <i class="fa-solid ${iconClass} mt-0.5"></i>
                        <div>
                            <p class="font-semibold">${alert.message}</p>
                            ${alert.suggestion ? `<p class="mt-1 text-xs opacity-80"><i class="fa-solid fa-lightbulb mr-1"></i> ${alert.suggestion}</p>` : ''}
                        </div>
                    </div>
                `;
                warningContainer.insertAdjacentHTML('beforeend', html);
            });
        } else {
            warningContainer.classList.add('hidden');
        }
    }

    // ─── TÍNH NĂNG SMART SWAP ────────────────────────────────────────────────────
    const swapModal = document.getElementById('swapModal');
    const swapFoodName = document.getElementById('swapFoodName');
    const swapFoodList = document.getElementById('swapFoodList');

    window.openSwapModal = async function(currentFoodId, role, foodName) {
        swapFoodName.textContent = foodName;
        swapModal.showModal();
        swapFoodList.innerHTML = '<div class="text-center py-4"><span class="loading loading-spinner"></span> Đang tải nguyên liệu...</div>';

        try {
            const { data } = await axios.get(`/api/meal-planner/foods?role=${role}`);
            if(data.success && data.data) {
                renderSwapList(data.data, currentFoodId, role);
            }
        } catch (error) {
            swapFoodList.innerHTML = '<div class="text-red-500 text-center">Lỗi tải dữ liệu.</div>';
        }
    };

    function renderSwapList(foods, currentFoodId, role) {
        swapFoodList.innerHTML = '';
        if(foods.length === 0) {
            swapFoodList.innerHTML = '<div class="text-gray-500 text-center text-sm">Không tìm thấy món thay thế.</div>';
            return;
        }

        foods.forEach(f => {
            if (f.id === currentFoodId) return; // Không hiển thị món đang chọn

            const html = `
                <div class="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:bg-green-50 hover:border-green-200 transition-all cursor-pointer" onclick="window.submitSwap(${f.id}, '${role}')">
                    <div>
                        <div class="font-semibold text-gray-800 text-sm">${f.name}</div>
                        <div class="text-xs text-gray-500">P:${f.protein}g | C:${f.carbs}g | F:${f.fat}g</div>
                    </div>
                    <div class="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <i class="fa-solid fa-arrow-right-arrow-left text-xs"></i>
                    </div>
                </div>
            `;
            swapFoodList.insertAdjacentHTML('beforeend', html);
        });
    }

    window.submitSwap = async function(newFoodId, role) {
        // Đóng modal
        swapModal.close();
        
        // Show loading ở result panel
        resultView.classList.add('opacity-50');
        overlay.classList.remove('hidden');
        overlay.classList.add('flex');

        try {
            // currentResultData lưu mảng 4 items [{food:..., grams:...}]
            const currentFoodIds = currentResultData.map(item => item.food.id);

            const { data } = await axios.post('/api/meal-planner/swap', {
                mealKey: currentMealKey,
                currentFoodIds: currentFoodIds,
                newFoodId: newFoodId,
                slotRoleToSwap: role
            });

            if (data.success || (!data.success && data.data)) {
                currentResultData = data.data; // Cập nhật state
                renderResult(data.data, data.warnings || data.errors, data.success);
            } else {
                alert(data.message || (data.errors && data.errors[0]?.message) || 'Lỗi không xác định.');
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Lỗi server / Mạng.';
            alert(msg);
        } finally {
            resultView.classList.remove('opacity-50');
            overlay.classList.add('hidden');
            overlay.classList.remove('flex');
        }
    };

    // ─── LƯU VÀO NHẬT KÝ ─────────────────────────────────────────────────────────
    if (btnLogMeal) {
        btnLogMeal.addEventListener('click', async () => {
            if (!currentResultData || currentResultData.length === 0) return;
            
            // Format ngày local (YYYY-MM-DD)
            const d = new Date();
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const today = `${year}-${month}-${day}`;

            const oldHtml = btnLogMeal.innerHTML;
            btnLogMeal.innerHTML = '<span class="loading loading-spinner loading-xs"></span> Đang ghi nhật ký...';
            btnLogMeal.disabled = true;

            try {
                // Tạo các mảng promise để POST song song
                const requests = currentResultData.map(item => {
                    const amountMultiplier = item.grams / 100; // API nhật ký yêu cầu amount là tỷ lệ so với 100g
                    return axios.post('/nhat-ky/them', {
                        foodId: item.food.id,
                        amount: amountMultiplier,
                        mealType: currentMealKey,
                        date: today,
                        note: 'Gợi ý từ Meal Planner'
                    });
                });

                await Promise.all(requests);
                
                alert('Đã lưu thực đơn vào nhật ký hôm nay thành công!');
                window.location.href = `/nhat-ky?date=${today}`;
            } catch (error) {
                console.error('Error logging to diary:', error);
                alert('Có lỗi xảy ra khi ghi nhật ký. Vui lòng thử lại.');
                btnLogMeal.innerHTML = oldHtml;
                btnLogMeal.disabled = false;
            }
        });
    }
});
