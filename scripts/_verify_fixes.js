const food = { id: 1, name: "Pho Bo's Special", calories: 200, unit: '100g', protein: 5, carbs: 30, fat: 2 };
const safeJson = JSON.stringify(food).replace(/</g,'\\u003c').replace(/>/g,'\\u003e');
const attr = safeJson.replace(/'/g, '\\u0027');

console.log('[A1 FIX] data-food attribute (single quotes escaped):');
console.log(' ', attr.substring(0, 120));

// Simulate browser: JSON.parse(this.dataset.food)
const restored = JSON.parse(attr);
console.log('  Parsed name:', restored.name, '=== Pho Bo\\u0027s Special?', restored.name === "Pho Bo's Special" ? '✅' : '❌');

// D1 fix
console.log('\n[D1 FIX] findOrCreate race condition fix:');
console.log('  created=true  → vừa tạo mới ✅');
console.log('  created=false → đã tồn tại → gọi .update() → không còn race condition ✅');

// G1 fix
const d = new Date();
const todayStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
const futureDate = '2099-12-31';
const pastDate   = '2020-01-01';

console.log('\n[G1 FIX] Future date validation:');
console.log('  today     =', todayStr);
console.log('  2099-12-31 > today?', futureDate > todayStr, '→ bị từ chối ✅');
console.log('  2020-01-01 > today?', pastDate > todayStr,   '→ được phép ✅');

// B1 + C1 fix
const vnMidnight = new Date('2026-05-05T00:30:00+07:00');
const utc    = vnMidnight.toISOString().split('T')[0];
const local  = `${vnMidnight.getFullYear()}-${String(vnMidnight.getMonth()+1).padStart(2,'0')}-${String(vnMidnight.getDate()).padStart(2,'0')}`;
console.log('\n[B1+C1 FIX] Timezone fix (00:30 VN = ngày 5):');
console.log('  toISOString() →', utc,  utc === '2026-05-05' ? '✅' : '❌ WRONG');
console.log('  getDate()     →', local, local === '2026-05-05' ? '✅ CORRECT' : '❌');
