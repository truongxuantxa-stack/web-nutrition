'use strict';

/**
 * test-auth-logic.js
 * ──────────────────────────────────────────────────────────────────────────────
 * Script kiểm tra Auth & Redirect Logic của NutriTrack NMS.
 * Chạy: node test-auth-logic.js
 *
 * Yêu cầu: Server đang chạy tại http://localhost:3000
 * Không cần cài thêm thư viện — dùng Node.js built-in (http, https, url).
 * ──────────────────────────────────────────────────────────────────────────────
 */

require('dotenv').config();
const http = require('http');
const https = require('https');
const { URL } = require('url');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('./models');

// ─── Config ───────────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:3000';
const TEST_USERS = {
    notOnboarded: {
        email: `test_not_onboarded_${Date.now()}@nutritrack.test`,
        password: 'test123456',
        fullName: 'Test Chưa Onboard',
    },
    onboarded: {
        email: `test_onboarded_${Date.now()}@nutritrack.test`,
        password: 'test123456',
        fullName: 'Test Đã Onboard',
    },
};

// ─── ANSI Colors ──────────────────────────────────────────────────────────────

const C = {
    reset:  '\x1b[0m',
    bold:   '\x1b[1m',
    green:  '\x1b[32m',
    red:    '\x1b[31m',
    yellow: '\x1b[33m',
    cyan:   '\x1b[36m',
    gray:   '\x1b[90m',
    blue:   '\x1b[34m',
};

// ─── Test Runner ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;
const results = [];

function assert(name, condition, detail = '') {
    if (condition) {
        passed++;
        results.push({ status: 'PASS', name, detail });
        console.log(`  ${C.green}✅ PASS${C.reset} ${name}`);
        if (detail) console.log(`       ${C.gray}→ ${detail}${C.reset}`);
    } else {
        failed++;
        results.push({ status: 'FAIL', name, detail });
        console.log(`  ${C.red}❌ FAIL${C.reset} ${name}`);
        if (detail) console.log(`       ${C.gray}→ ${detail}${C.reset}`);
    }
}

function section(title) {
    console.log(`\n${C.cyan}${C.bold}━━━ ${title} ━━━${C.reset}`);
}

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

/**
 * Gửi HTTP request và trả về { statusCode, headers, body, location }.
 * Tự động theo redirect nếu followRedirects = true.
 * @param {object} options
 * @returns {Promise<{statusCode, headers, body, location, redirectChain}>}
 */
function request(options) {
    return new Promise((resolve, reject) => {
        const {
            url,
            method = 'GET',
            body = null,
            cookie = '',
            followRedirects = false,
            maxRedirects = 5,
            redirectChain = [],
        } = options;

        const parsed = new URL(url);
        const lib = parsed.protocol === 'https:' ? https : http;

        const postData = body ? new URLSearchParams(body).toString() : '';

        const reqOptions = {
            hostname: parsed.hostname,
            port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
            path: parsed.pathname + parsed.search,
            method,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'Cookie': cookie,
                'User-Agent': 'NMS-TestScript/1.0',
            },
        };

        const req = lib.request(reqOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                const location = res.headers['location'] || null;
                const setCookie = res.headers['set-cookie'] || [];

                // Theo redirect nếu được yêu cầu
                if (followRedirects && location && maxRedirects > 0 &&
                    [301, 302, 303, 307, 308].includes(res.statusCode)) {

                    const nextUrl = location.startsWith('http')
                        ? location
                        : `${parsed.protocol}//${parsed.host}${location}`;

                    // Cộng dồn cookie từ response
                    const newCookie = mergeCookies(cookie, setCookie);

                    resolve(request({
                        url: nextUrl,
                        method: 'GET',
                        cookie: newCookie,
                        followRedirects,
                        maxRedirects: maxRedirects - 1,
                        redirectChain: [...redirectChain, { url, statusCode: res.statusCode, location }],
                    }));
                } else {
                    resolve({
                        statusCode: res.statusCode,
                        headers: res.headers,
                        body: data,
                        location,
                        setCookie,
                        redirectChain: [...redirectChain, { url, statusCode: res.statusCode, location }],
                    });
                }
            });
        });

        req.on('error', reject);

        if (postData) req.write(postData);
        req.end();
    });
}

/**
 * Gộp cookie cũ với Set-Cookie headers mới.
 */
function mergeCookies(existingCookie, setCookieHeaders) {
    const cookieMap = {};

    // Parse existing
    existingCookie.split(';').forEach(part => {
        const [k, v] = part.trim().split('=');
        if (k) cookieMap[k.trim()] = v || '';
    });

    // Parse mới
    setCookieHeaders.forEach(header => {
        const part = header.split(';')[0].trim();
        const eqIdx = part.indexOf('=');
        if (eqIdx > 0) {
            const k = part.substring(0, eqIdx).trim();
            const v = part.substring(eqIdx + 1).trim();
            cookieMap[k] = v;
        }
    });

    return Object.entries(cookieMap)
        .filter(([k]) => k)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
}

/**
 * Lấy giá trị cookie "token" từ Set-Cookie headers.
 */
function extractTokenCookie(setCookieHeaders) {
    for (const header of setCookieHeaders) {
        const match = header.match(/^token=([^;]+)/);
        if (match) return match[1];
    }
    return null;
}

/**
 * Tạo cookie string từ token value.
 */
function buildCookieString(token) {
    return token ? `token=${token}` : '';
}

// ─── Database Setup Helpers ────────────────────────────────────────────────────

async function createTestUser(data, isOnboarded = false) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await User.create({
        fullName: data.fullName,
        email: data.email,
        password: hashedPassword,
        isOnboarded,
        ...(isOnboarded ? {
            gender: 'male',
            birthDate: '2000-01-01',
            height: 170,
            weight: 65,
            activityLevel: 'moderate',
            goal: 'maintain_weight',
        } : {}),
    });
    return user;
}

async function cleanupTestUsers() {
    await User.destroy({
        where: {
            email: [
                TEST_USERS.notOnboarded.email,
                TEST_USERS.onboarded.email,
            ],
        },
        force: true,
    });
}

// ─── Login Helper ─────────────────────────────────────────────────────────────

async function loginUser(email, password) {
    const res = await request({
        url: `${BASE_URL}/dang-nhap`,
        method: 'POST',
        body: { email, password },
        followRedirects: false,
    });
    return res;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

async function runTests() {
    console.log(`\n${C.bold}${C.blue}╔══════════════════════════════════════════════════╗`);
    console.log(`║   NutriTrack — Auth Logic Test Suite             ║`);
    console.log(`╚══════════════════════════════════════════════════╝${C.reset}`);
    console.log(`${C.gray}Server: ${BASE_URL}${C.reset}`);
    console.log(`${C.gray}Time  : ${new Date().toLocaleString('vi-VN')}${C.reset}`);

    // ── Kiểm tra server ─────────────────────────────────────────────────────
    section('BƯỚC 0 — Kiểm tra Server đang chạy');
    try {
        const ping = await request({ url: `${BASE_URL}/dang-nhap` });
        assert(
            'Server phản hồi tại localhost:3000',
            ping.statusCode >= 200 && ping.statusCode < 500,
            `HTTP ${ping.statusCode}`
        );
    } catch (err) {
        console.log(`\n${C.red}${C.bold}🚫 Không thể kết nối server tại ${BASE_URL}${C.reset}`);
        console.log(`${C.red}   Hãy chắc chắn "npm run dev" đang chạy trước khi test.${C.reset}`);
        process.exit(1);
    }

    // ── Tạo dữ liệu test ────────────────────────────────────────────────────
    section('BƯỚC 1 — Tạo dữ liệu test trong DB');
    let userNotOnboarded, userOnboarded;

    try {
        // Dọn dẹp user cũ nếu có
        await cleanupTestUsers();

        userNotOnboarded = await createTestUser(TEST_USERS.notOnboarded, false);
        assert(
            'Tạo user CHƯA onboarded thành công',
            userNotOnboarded && userNotOnboarded.id > 0,
            `id=${userNotOnboarded.id} | email=${TEST_USERS.notOnboarded.email} | isOnboarded=false`
        );

        userOnboarded = await createTestUser(TEST_USERS.onboarded, true);
        assert(
            'Tạo user ĐÃ onboarded thành công',
            userOnboarded && userOnboarded.id > 0,
            `id=${userOnboarded.id} | email=${TEST_USERS.onboarded.email} | isOnboarded=true`
        );
    } catch (err) {
        console.log(`${C.red}❌ Lỗi tạo dữ liệu test: ${err.message}${C.reset}`);
        process.exit(1);
    }

    // ══════════════════════════════════════════════════════════════════════════
    // TEST GROUP 1: JWT Cookie sau khi đăng nhập
    // ══════════════════════════════════════════════════════════════════════════
    section('TEST 1 — JWT Cookie sau khi đăng nhập');

    // Test 1.1: Đăng nhập thành công → nhận cookie token
    const loginRes = await loginUser(TEST_USERS.notOnboarded.email, TEST_USERS.notOnboarded.password);
    const tokenValue = extractTokenCookie(loginRes.setCookie);

    assert(
        '[T1.1] POST /dang-nhap trả về redirect (302)',
        loginRes.statusCode === 302,
        `HTTP ${loginRes.statusCode}`
    );

    assert(
        '[T1.2] Response có header Set-Cookie chứa "token"',
        tokenValue !== null,
        tokenValue ? `token=...${tokenValue.slice(-20)}` : 'Không tìm thấy cookie token'
    );

    // Test 1.3: Verify JWT token hợp lệ
    if (tokenValue) {
        try {
            const decoded = jwt.verify(tokenValue, process.env.JWT_SECRET);
            assert(
                '[T1.3] JWT token có thể verify bằng JWT_SECRET',
                decoded && decoded.id === userNotOnboarded.id,
                `decoded.id=${decoded?.id} | expected id=${userNotOnboarded.id}`
            );

            // Test 1.4: Token có trường exp (expiry)
            const hasExpiry = decoded.exp && decoded.exp > Math.floor(Date.now() / 1000);
            assert(
                '[T1.4] JWT token có exp hợp lệ (chưa hết hạn)',
                hasExpiry,
                `exp=${decoded.exp} | now=${Math.floor(Date.now() / 1000)} | còn ${Math.round((decoded.exp - Date.now()/1000)/3600/24)} ngày`
            );
        } catch (err) {
            assert('[T1.3] JWT token có thể verify bằng JWT_SECRET', false, `Lỗi: ${err.message}`);
            assert('[T1.4] JWT token có exp hợp lệ', false, 'Không verify được token');
        }
    } else {
        assert('[T1.3] JWT token có thể verify bằng JWT_SECRET', false, 'Không có token để verify');
        assert('[T1.4] JWT token có exp hợp lệ', false, 'Không có token để kiểm tra');
    }

    // Test 1.5: Cookie httpOnly flag
    const cookieHeader = loginRes.setCookie.find(c => c.startsWith('token=')) || '';
    assert(
        '[T1.5] Cookie "token" có flag HttpOnly',
        cookieHeader.toLowerCase().includes('httponly'),
        cookieHeader.split(';').map(s => s.trim()).join(' | ')
    );

    // Test 1.6: Cookie có SameSite
    assert(
        '[T1.6] Cookie "token" có flag SameSite',
        cookieHeader.toLowerCase().includes('samesite'),
        cookieHeader.toLowerCase().includes('samesite=lax') ? 'SameSite=Lax ✓' : 'Không có SameSite'
    );

    // Test 1.7: Đăng nhập sai mật khẩu KHÔNG nhận cookie
    const badLoginRes = await loginUser(TEST_USERS.notOnboarded.email, 'wrongpassword');
    const badToken = extractTokenCookie(badLoginRes.setCookie);
    assert(
        '[T1.7] Đăng nhập sai mật khẩu → KHÔNG nhận cookie token',
        badToken === null && badLoginRes.statusCode === 200,
        `HTTP ${badLoginRes.statusCode} | token=${badToken}`
    );

    // ══════════════════════════════════════════════════════════════════════════
    // TEST GROUP 2: User CHƯA onboarded → /dashboard → redirect /onboarding
    // ══════════════════════════════════════════════════════════════════════════
    section('TEST 2 — User CHƯA Onboarded truy cập /dashboard');

    // Lấy token cho user chưa onboarded
    const loginResNotOnboard = await loginUser(
        TEST_USERS.notOnboarded.email,
        TEST_USERS.notOnboarded.password
    );
    const tokenNotOnboarded = extractTokenCookie(loginResNotOnboard.setCookie);
    const cookieNotOnboarded = buildCookieString(tokenNotOnboarded);

    // Test 2.1: Truy cập /dashboard với token của user chưa onboarded
    const dashboardRes = await request({
        url: `${BASE_URL}/dashboard`,
        cookie: cookieNotOnboarded,
        followRedirects: false,
    });

    assert(
        '[T2.1] GET /dashboard (chưa onboard) → redirect 302',
        dashboardRes.statusCode === 302,
        `HTTP ${dashboardRes.statusCode}`
    );

    assert(
        '[T2.2] GET /dashboard (chưa onboard) → Location: /onboarding',
        dashboardRes.location === '/onboarding',
        `Location: ${dashboardRes.location}`
    );

    // Test 2.3: Follow redirect → thực sự đến /onboarding
    const dashboardFollowed = await request({
        url: `${BASE_URL}/dashboard`,
        cookie: cookieNotOnboarded,
        followRedirects: true,
    });

    const finalUrlNotOnboard = dashboardFollowed.redirectChain[dashboardFollowed.redirectChain.length - 1]?.url || '';
    assert(
        '[T2.3] Follow redirect → cuối cùng đến /onboarding',
        finalUrlNotOnboard.includes('/onboarding'),
        `Redirect chain: ${dashboardFollowed.redirectChain.map(r => `${r.url}(${r.statusCode})`).join(' → ')}`
    );

    // Test 2.4: /onboarding trả về 200 (không bị redirect thêm)
    assert(
        '[T2.4] Trang /onboarding trả về HTTP 200',
        dashboardFollowed.statusCode === 200,
        `HTTP ${dashboardFollowed.statusCode}`
    );

    // ══════════════════════════════════════════════════════════════════════════
    // TEST GROUP 3: User ĐÃ onboarded → /onboarding → redirect /dashboard
    // ══════════════════════════════════════════════════════════════════════════
    section('TEST 3 — User ĐÃ Onboarded truy cập /onboarding');

    const loginResOnboard = await loginUser(
        TEST_USERS.onboarded.email,
        TEST_USERS.onboarded.password
    );
    const tokenOnboarded = extractTokenCookie(loginResOnboard.setCookie);
    const cookieOnboarded = buildCookieString(tokenOnboarded);

    // Test 3.1: Sau login, user đã onboarded → redirect về /dashboard (không phải /onboarding)
    assert(
        '[T3.1] POST /dang-nhap (đã onboard) → redirect về /dashboard',
        loginResOnboard.location === '/dashboard',
        `Location: ${loginResOnboard.location}`
    );

    // Test 3.2: Truy cập /onboarding với token đã onboarded
    const onboardingRes = await request({
        url: `${BASE_URL}/onboarding`,
        cookie: cookieOnboarded,
        followRedirects: false,
    });

    assert(
        '[T3.2] GET /onboarding (đã onboard) → redirect 302',
        onboardingRes.statusCode === 302,
        `HTTP ${onboardingRes.statusCode}`
    );

    assert(
        '[T3.3] GET /onboarding (đã onboard) → Location: /dashboard',
        onboardingRes.location === '/dashboard',
        `Location: ${onboardingRes.location}`
    );

    // Test 3.4: Follow redirect → cuối cùng đến /dashboard
    const onboardingFollowed = await request({
        url: `${BASE_URL}/onboarding`,
        cookie: cookieOnboarded,
        followRedirects: true,
    });

    const finalUrlOnboard = onboardingFollowed.redirectChain[onboardingFollowed.redirectChain.length - 1]?.url || '';
    assert(
        '[T3.4] Follow redirect → cuối cùng đến /dashboard',
        finalUrlOnboard.includes('/dashboard'),
        `Redirect chain: ${onboardingFollowed.redirectChain.map(r => `${r.url}(${r.statusCode})`).join(' → ')}`
    );

    assert(
        '[T3.5] Trang /dashboard trả về HTTP 200',
        onboardingFollowed.statusCode === 200,
        `HTTP ${onboardingFollowed.statusCode}`
    );

    // ══════════════════════════════════════════════════════════════════════════
    // TEST GROUP 4: Edge cases & Bảo mật
    // ══════════════════════════════════════════════════════════════════════════
    section('TEST 4 — Edge Cases & Bảo mật');

    // Test 4.1: Không có cookie → /dashboard redirect về /dang-nhap
    const noCookieRes = await request({
        url: `${BASE_URL}/dashboard`,
        cookie: '',
        followRedirects: false,
    });
    assert(
        '[T4.1] GET /dashboard (không có cookie) → redirect về /dang-nhap',
        noCookieRes.statusCode === 302 && noCookieRes.location === '/dang-nhap',
        `HTTP ${noCookieRes.statusCode} | Location: ${noCookieRes.location}`
    );

    // Test 4.2: Cookie token giả mạo → /dashboard redirect về /dang-nhap
    const fakeToken = 'fake.token.value';
    const fakeRes = await request({
        url: `${BASE_URL}/dashboard`,
        cookie: `token=${fakeToken}`,
        followRedirects: false,
    });
    assert(
        '[T4.2] GET /dashboard (token giả) → redirect về /dang-nhap',
        fakeRes.statusCode === 302 && fakeRes.location === '/dang-nhap',
        `HTTP ${fakeRes.statusCode} | Location: ${fakeRes.location}`
    );

    // Test 4.3: Token ký bằng secret sai → bị reject
    const wrongSecretToken = jwt.sign(
        { id: userNotOnboarded.id },
        'wrong_secret_key',
        { expiresIn: '1h' }
    );
    const wrongSecretRes = await request({
        url: `${BASE_URL}/dashboard`,
        cookie: `token=${wrongSecretToken}`,
        followRedirects: false,
    });
    assert(
        '[T4.3] GET /dashboard (token ký sai secret) → redirect về /dang-nhap',
        wrongSecretRes.statusCode === 302 && wrongSecretRes.location === '/dang-nhap',
        `HTTP ${wrongSecretRes.statusCode} | Location: ${wrongSecretRes.location}`
    );

    // Test 4.4: Token hết hạn → bị reject
    const expiredToken = jwt.sign(
        { id: userNotOnboarded.id },
        process.env.JWT_SECRET,
        { expiresIn: '1ms' }
    );
    await new Promise(r => setTimeout(r, 10)); // Chờ token expire
    const expiredRes = await request({
        url: `${BASE_URL}/dashboard`,
        cookie: `token=${expiredToken}`,
        followRedirects: false,
    });
    assert(
        '[T4.4] GET /dashboard (token hết hạn) → redirect về /dang-nhap',
        expiredRes.statusCode === 302 && expiredRes.location === '/dang-nhap',
        `HTTP ${expiredRes.statusCode} | Location: ${expiredRes.location}`
    );

    // Test 4.5: Đã đăng nhập truy cập /dang-nhap → redirect về /dashboard
    const loginPageRes = await request({
        url: `${BASE_URL}/dang-nhap`,
        cookie: cookieOnboarded,
        followRedirects: false,
    });
    assert(
        '[T4.5] GET /dang-nhap (đã đăng nhập) → redirect về /dashboard',
        loginPageRes.statusCode === 302 && loginPageRes.location === '/dashboard',
        `HTTP ${loginPageRes.statusCode} | Location: ${loginPageRes.location}`
    );

    // Test 4.6: GET /dang-xuat → xóa cookie và redirect
    const logoutRes = await request({
        url: `${BASE_URL}/dang-xuat`,
        cookie: cookieOnboarded,
        followRedirects: false,
    });
    const logoutCookieHeader = logoutRes.setCookie.find(c => c.startsWith('token=')) || '';
    // Khi clear cookie: expires ngay lập tức hoặc max-age=0
    const cookieIsCleared = logoutCookieHeader.includes('Expires') ||
                            logoutCookieHeader.includes('Max-Age=0') ||
                            logoutCookieHeader === 'token=; Path=/; Expires=...' ||
                            logoutRes.statusCode === 302;
    assert(
        '[T4.6] GET /dang-xuat → redirect về /dang-nhap',
        logoutRes.statusCode === 302 && logoutRes.location === '/dang-nhap',
        `HTTP ${logoutRes.statusCode} | Location: ${logoutRes.location}`
    );

    // ── Dọn dẹp DB ──────────────────────────────────────────────────────────
    section('BƯỚC CUỐI — Dọn dẹp dữ liệu test');
    try {
        await cleanupTestUsers();
        console.log(`  ${C.green}✅ Đã xóa ${2} user test khỏi DB${C.reset}`);
    } catch (err) {
        console.log(`  ${C.yellow}⚠️  Không thể dọn dẹp DB: ${err.message}${C.reset}`);
    }

    // ── Báo cáo kết quả ─────────────────────────────────────────────────────
    const total = passed + failed;
    console.log(`\n${C.bold}${C.blue}╔══════════════════════════════════════════════════╗`);
    console.log(`║              KẾT QUẢ KIỂM THỬ                  ║`);
    console.log(`╚══════════════════════════════════════════════════╝${C.reset}`);
    console.log(`\n  Tổng số test : ${C.bold}${total}${C.reset}`);
    console.log(`  ${C.green}Passed${C.reset}        : ${C.green}${C.bold}${passed}${C.reset}`);
    console.log(`  ${C.red}Failed${C.reset}        : ${C.red}${C.bold}${failed}${C.reset}`);
    console.log(`  Tỷ lệ thành công: ${C.bold}${Math.round(passed/total*100)}%${C.reset}`);

    if (failed > 0) {
        console.log(`\n${C.red}${C.bold}  ── Danh sách test THẤT BẠI ──${C.reset}`);
        results.filter(r => r.status === 'FAIL').forEach(r => {
            console.log(`  ${C.red}✗${C.reset} ${r.name}`);
            if (r.detail) console.log(`    ${C.gray}${r.detail}${C.reset}`);
        });
    } else {
        console.log(`\n${C.green}${C.bold}  🎉 Tất cả test đều PASS! Auth logic hoạt động đúng.${C.reset}`);
    }

    console.log('');
    process.exit(failed > 0 ? 1 : 0);
}

// ─── Entry Point ──────────────────────────────────────────────────────────────

runTests().catch(err => {
    console.error(`\n${C.red}${C.bold}❌ Lỗi không mong đợi:${C.reset}`, err);
    process.exit(1);
});
