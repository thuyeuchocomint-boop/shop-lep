import { getProducts, supabase } from "./api.js";
import { renderProducts } from "./ui.js";
// Thêm đoạn này vào đầu app.js để sửa lỗi "setMood is not defined"
window.setMood = function(mood) {
    console.log("Mood hiện tại của Lép:", mood);
    document.body.className = ''; // Xóa class cũ
    document.body.classList.add(`mood-${mood}`);
    
    const chat = document.getElementById("lep-text");
    if (mood === 'happy') chat.innerText = "Đang vui nha, mua gì Lép cũng duyệt! ✨";
    if (mood === 'tired') chat.innerText = "Hơi đuối... nhưng vẫn sale cho mày 💤";
};
let allProducts = [];
const THEME_OVERRIDE_KEY = "lep_dark_override";
const WEATHER_API_KEY = "104a914599fcdf41a1de827e9ef3a0f9";
const TIME_THEME = {
    morning: { bg: "#fff6d8", label: "Sáng nè, nhớ uống nước và chăm da nha ☀️" },
    noon: { bg: "#dff8ef", label: "Trưa mint mát mắt, lướt nhẹ vài món xinh nha 🌿" },
    afternoon: { bg: "#ffe7cf", label: "Chiều chill rồi, săn deal nhẹ cho vui nè 🌇" },
    night: { bg: "#1d2e45", label: "Tối rồi, Lép bật chế độ chill bán hàng nè 🌙" }
};

function getTimeSlot(hour = new Date().getHours()) {
    if (hour >= 5 && hour < 11) return "morning";
    if (hour >= 11 && hour < 15) return "noon";
    if (hour >= 15 && hour < 19) return "afternoon";
    return "night";
}

function hexToRgb(hex) {
    const value = hex.replace("#", "");
    const normalized = value.length === 3 ? value.split("").map((c) => c + c).join("") : value;
    const num = parseInt(normalized, 16);
    return {
        r: (num >> 16) & 255,
        g: (num >> 8) & 255,
        b: num & 255
    };
}

function luminanceFromHex(hex) {
    const { r, g, b } = hexToRgb(hex);
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

function applyReadableTextFromBg(bgColor) {
    const root = document.documentElement;
    const isLightBg = luminanceFromHex(bgColor) > 145;
    root.style.setProperty("--text", isLightBg ? "#152a25" : "#f5f8fa");
    root.style.setProperty("--text-soft", isLightBg ? "#5f756e" : "#c4d0d8");
}

function applyTimeTheme() {
    const slot = getTimeSlot();
    const root = document.documentElement;
    const theme = TIME_THEME[slot];
    root.style.setProperty("--bg", theme.bg);
    applyReadableTextFromBg(theme.bg);
    return theme.label;
}

function normalizeWeatherLabel(main = "") {
    const w = main.toLowerCase();
    if (w.includes("rain") || w.includes("drizzle") || w.includes("thunder")) return "rainy";
    if (w.includes("clear")) return "sunny";
    if (w.includes("cloud")) return "cloudy";
    return "normal";
}

function applyWeatherMood(weatherLabel, chatElement) {
    const body = document.body;
    body.classList.remove("is-rainy", "is-sunny");

    const root = document.documentElement;
    if (weatherLabel === "rainy") {
        body.classList.add("is-rainy");
        root.style.setProperty("--bg", "#dfe8f3");
        applyReadableTextFromBg("#dfe8f3");
        if (chatElement) chatElement.innerText = "Trời mưa đó, ở nhà chill với Lép và săn deal nhẹ nha 🌧️";
    } else if (weatherLabel === "sunny") {
        body.classList.add("is-sunny");
        root.style.setProperty("--bg", "#f8fbd7");
        applyReadableTextFromBg("#f8fbd7");
        if (chatElement) chatElement.innerText = "Nắng rực rỡ quá, nhớ chống nắng trước khi ra đường nha ☀️";
    }
}

function applyDarkModeOverride(enabled) {
    document.body.classList.toggle("dark-override", enabled);
    if (!enabled) return;
    const root = document.documentElement;
    root.style.setProperty("--text", "#f2f5f7");
    root.style.setProperty("--text-soft", "#b7c1c8");
}

function setupDarkModeToggle() {
    const btn = document.getElementById("dark-mode-toggle");
    if (!btn) return;

    const isEnabled = localStorage.getItem(THEME_OVERRIDE_KEY) === "1";
    applyDarkModeOverride(isEnabled);
    btn.innerText = isEnabled ? "☀️" : "🌙";

    btn.addEventListener("click", () => {
        const nextEnabled = localStorage.getItem(THEME_OVERRIDE_KEY) !== "1";
        localStorage.setItem(THEME_OVERRIDE_KEY, nextEnabled ? "1" : "0");
        applyDarkModeOverride(nextEnabled);
        btn.innerText = nextEnabled ? "☀️" : "🌙";
    });

function setupLepFloatingAssistant() {
    const fab = document.getElementById("lep-fab");
    const panel = document.getElementById("lep-assistant-panel");
    const closeBtn = document.getElementById("lep-panel-close");
    const startBtn = document.getElementById("lep-panel-start");
    if (!fab || !panel) return;

    const togglePanel = () => {
        panel.classList.toggle("hidden-panel");
    };

    fab.addEventListener("click", togglePanel);
    if (closeBtn) closeBtn.addEventListener("click", () => panel.classList.add("hidden-panel"));
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            const chat = document.getElementById("lep-text");
            if (chat) chat.innerText = "Sắp có Chat AI/Quiz tư vấn siêu xịn, đợi Lép chút nha 🐰";
            panel.classList.add("hidden-panel");
        });
    }

    let scrollTimer = null;
    window.addEventListener("scroll", () => {
        fab.classList.add("is-wiggle");
        if (scrollTimer) clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => fab.classList.remove("is-wiggle"), 340);
    }, { passive: true });
}

function getSocialIcon(name = "") {
    const key = name.toLowerCase();
    if (key.includes("facebook")) return "📘";
    if (key.includes("tiktok")) return "🎵";
    if (key.includes("instagram") || key.includes("insta")) return "📸";
    if (key.includes("youtube")) return "▶️";
    if (key.includes("telegram")) return "✈️";
    if (key.includes("zalo")) return "💬";
    if (key.includes("twitter") || key.includes("x")) return "𝕏";
    if (key.includes("email") || key.includes("mail")) return "✉️";
    if (key.includes("phone") || key.includes("call")) return "📞";
    return "🔗";
}

function renderDynamicSocialLinks(rawValue, fallbackConfig = {}) {
    const container = document.querySelector(".lep-socials");
    if (!container) return;

    let links = [];
    if (rawValue) {
        try {
            const parsed = JSON.parse(rawValue);
            if (Array.isArray(parsed)) links = parsed;
        } catch (err) {
            links = [];
        }
    }

    if (links.length === 0) {
        links = [
            { name: "Facebook", url: fallbackConfig.facebook_link || "" },
            { name: "TikTok", url: fallbackConfig.tiktok_link || "" },
            { name: "Email", url: fallbackConfig.email ? `mailto:${fallbackConfig.email}` : "" },
            { name: "Phone", url: fallbackConfig.phone ? `tel:${fallbackConfig.phone}` : "" }
        ].filter((item) => item.url);
    }

    container.innerHTML = links
        .filter((item) => item && item.name && item.url)
        .map((item) => {
            const icon = getSocialIcon(item.name);
            const safeName = String(item.name).replace(/</g, "&lt;");
            const safeUrl = String(item.url).replace(/"/g, "&quot;");
            return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer" title="${safeName}">${icon} ${safeName}</a>`;
        })
        .join("");
}

function renderStatusBoard(statusText, statusHistoryRaw) {
    const board = document.getElementById("lep-status-board");
    const content = document.getElementById("lep-status-text");
    if (!board || !content) return;

    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;
    let history = [];

    if (statusHistoryRaw) {
        try {
            const parsed = JSON.parse(statusHistoryRaw);
            if (Array.isArray(parsed)) history = parsed;
        } catch (err) {
            history = [];
        }
    }

    if (history.length === 0 && statusText) {
        history = [{ text: statusText, created_at: new Date().toISOString() }];
    }

    const validHistory = history
        .filter((item) => item && item.text && item.created_at)
        .filter((item) => (now - new Date(item.created_at).getTime()) <= oneDayMs)
        .slice(0, 5);

    if (validHistory.length === 0) {
        board.classList.add("hidden-panel");
        return;
    }

    content.innerHTML = validHistory.map((item, idx) => {
        const text = String(item.text).replace(/</g, "&lt;");
        const time = new Date(item.created_at);
        const timeLabel = `${time.getHours().toString().padStart(2, "0")}:${time.getMinutes().toString().padStart(2, "0")}`;
        return `<div class="status-item${idx === 0 ? " is-latest" : ""}">
            <div class="status-item-text">${text}</div>
            <div class="status-item-time">${timeLabel}</div>
        </div>`;
    }).join("");
    board.classList.remove("hidden-panel");
}
async function getImageAverageBrightness(imageUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.referrerPolicy = "no-referrer";
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            if (!ctx) {
                reject(new Error("Canvas context không khả dụng"));
                return;
            }

            const sampleSize = 48;
            canvas.width = sampleSize;
            canvas.height = sampleSize;
            ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
            const { data } = ctx.getImageData(0, 0, sampleSize, sampleSize);

            let totalLuminance = 0;
            let pixelCount = 0;
            for (let i = 0; i < data.length; i += 4) {
                const alpha = data[i + 3];
                if (alpha < 20) continue;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                totalLuminance += 0.299 * r + 0.587 * g + 0.114 * b;
                pixelCount += 1;
            }

            if (pixelCount === 0) {
                resolve(140);
                return;
            }
            resolve(totalLuminance / pixelCount);
        };
        img.onerror = () => reject(new Error("Không đọc được ảnh để phân tích màu"));
        img.src = imageUrl;
    });
}

async function applyCoverContrastForBrand(coverUrl) {
    const brandName = document.getElementById("lep-display-name");
    const logo = document.querySelector(".logo");
    const userName = document.querySelector(".lep-username");
    if (!coverUrl || (!brandName && !logo && !userName)) return;

    try {
        const brightness = await getImageAverageBrightness(coverUrl);
        const textColor = brightness >= 150 ? "#16231f" : "#ffffff";
        const textShadow = brightness >= 150 ? "0 1px 2px rgba(255,255,255,0.45)" : "0 2px 8px rgba(0,0,0,0.45)";

        if (brandName) {
            brandName.style.color = textColor;
            brandName.style.textShadow = textShadow;
        }
        if (userName) {
            userName.style.color = textColor;
            userName.style.textShadow = textShadow;
        }
        if (logo && brightness < 110) {
            logo.style.color = "#f2fff9";
        } else if (logo) {
            logo.style.color = "var(--primary-strong)";
        }
    } catch (err) {
        console.warn("Không thể tự động chỉnh tương phản theo ảnh bìa:", err.message);
    }
}

function setCoverImageAndContrast(coverUrl) {
    const coverImg = document.getElementById("lep-cover-img");
    if (!coverImg || !coverUrl) return;
    coverImg.src = coverUrl;
    applyCoverContrastForBrand(coverUrl);
}

function setLepAnimationImage(animationUrl) {
    if (!animationUrl) return;
    const fabImg = document.getElementById("lep-fab-img");
    if (fabImg) fabImg.src = animationUrl;
}

window.startQuiz = () => {
    const container = document.getElementById('quiz-container');
    container.style.display = 'block';
    const q = {
        question: "Mày muốn đẹp hay muốn thơm?",
        answers: [
            { text: "Muốn đẹp!", tag: "skincare" },
            { text: "Muốn thơm!", tag: "perfume" } // Giả sử m có tag này
            
        ]
    };
    
    document.getElementById('quiz-question').innerText = q.question;
    const ansDiv = document.getElementById('quiz-answers');
    ansDiv.innerHTML = q.answers.map(a => 
        `<button class="btn-small" onclick="window.filter('${a.tag}')"> ${a.text}</button>`
    ).join('');
};
async function init() {
    setupDarkModeToggle();
    setupLepFloatingAssistant();
    allProducts = await getProducts();
    renderProducts(allProducts);

    const savedName = localStorage.getItem("lep_user_name");
    if (savedName) {
        const greeting = document.getElementById("user-greeting");
        if (greeting) greeting.innerText = `Chào ${savedName} nhé!`;
    }

    await loadConfig();
}
async function loadConfig() {
    const { data } = await supabase.from('configs').select('*');
    if (!data) return;

    let config = {};
    data.forEach(item => { config[item.key] = item.value; });

    if (config.primary_color) {
        const color = config.primary_color;
        document.documentElement.style.setProperty('--primary', color);
        
        // CÁCH ĐỔI NỀN THÔNG MINH:
        // Nếu m muốn màu xanh mint mặc định:
        if (!config.primary_color) {
            document.documentElement.style.setProperty('--bg', '#e0f2f1'); 
        } else {
            // Lấy màu primary pha cực loãng (10% độ đậm) để làm nền
            // Mẹo: hex + '1a' là thêm 10% alpha (độ trong suốt)
            document.documentElement.style.setProperty('--bg', color + '1a'); 
        }
    }
    // ... các đoạn load bio, avatar giữ nguyên ...


    // 2. Load các thông tin khác
    if (config.avatar_url) document.getElementById('lep').src = config.avatar_url;
    if (config.avatar_url) {
        const avatarImg = document.getElementById("lep-avatar-img");
        if (avatarImg) avatarImg.src = config.avatar_url;
    }
    if (config.cover_url) {
        setCoverImageAndContrast(config.cover_url);
    }
    if (config.animation_url) {
        setLepAnimationImage(config.animation_url);
    }
    if (config.bio) document.getElementById('lep-bio').innerText = config.bio;
    if (config.bio) {
        const bioElement = document.getElementById("lep-display-bio");
        if (bioElement) bioElement.innerText = config.bio;
    }
    if (config.facebook_link) document.getElementById('link-fb').href = config.facebook_link;
    if (config.tiktok_link) document.getElementById('link-tiktok').href = config.tiktok_link;
    if (config.email) document.getElementById('link-email').href = `mailto:${config.email}`;
    if (config.phone) document.getElementById('link-phone').href = `tel:${config.phone}`;
    renderDynamicSocialLinks(config.social_links, config);
    renderStatusBoard(config.status_text, config.status_history);

    const { data: profileData } = await supabase
        .from("profiles")
        .select("cover_url, avatar_url")
        .order("updated_at", { ascending: false })
        .limit(1);
    if (profileData && profileData.length > 0) {
        const latest = profileData[0];
        if (latest.avatar_url) {
            document.getElementById("lep").src = latest.avatar_url;
            const avatarImg = document.getElementById("lep-avatar-img");
            if (avatarImg) avatarImg.src = latest.avatar_url;
        }
        if (latest.cover_url) {
            setCoverImageAndContrast(latest.cover_url);
        }
    } else {
        const { data: settingsData } = await supabase
            .from("settings")
            .select("key, value")
            .in("key", ["cover_url", "avatar_url"]);
        if (settingsData && settingsData.length > 0) {
            const map = {};
            settingsData.forEach((item) => {
                map[item.key] = item.value;
            });
            if (map.avatar_url) {
                document.getElementById("lep").src = map.avatar_url;
                const avatarImg = document.getElementById("lep-avatar-img");
                if (avatarImg) avatarImg.src = map.avatar_url;
            }
            if (map.cover_url) {
                setCoverImageAndContrast(map.cover_url);
            }
            if (map.animation_url) {
                setLepAnimationImage(map.animation_url);
            }
        }
    }

    if (!config.animation_url) {
        const { data: settingsAnimation } = await supabase
            .from("settings")
            .select("value")
            .eq("key", "animation_url")
            .maybeSingle();
        if (settingsAnimation && settingsAnimation.value) {
            setLepAnimationImage(settingsAnimation.value);
        }
    }

    const chat = document.getElementById("lep-text");
    const timeMsg = applyTimeTheme();
    if (chat && !chat.innerText) chat.innerText = timeMsg;

    // 3. Khởi chạy thời tiết sau khi đã có location
    if (config.weather_location) {
        loadWeather(config.weather_location);
    } else if (chat) {
        chat.innerText = timeMsg;
        applyWeatherMood("normal", chat);
        if (localStorage.getItem(THEME_OVERRIDE_KEY) === "1") applyDarkModeOverride(true);
    }
}

async function loadWeather(location) {
    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${WEATHER_API_KEY}&lang=vi`);
        const data = await res.json();
        if (!data.main) throw new Error("No weather payload");

        const weather = normalizeWeatherLabel(data.weather[0].main);
        const chat = document.getElementById("lep-text");
        const weatherText = document.getElementById("lep-weather");
        const weatherIcon = document.getElementById("lep-weather-icon");
        if (weatherText) weatherText.innerText = `${Math.round(data.main.temp)}°C • ${data.weather[0].description}`;
        if (weatherIcon) weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

        applyWeatherMood(weather, chat);
    } catch (err) {
        const chat = document.getElementById("lep-text");
        const fake = Math.random() > 0.5 ? "sunny" : "rainy";
        applyWeatherMood(fake, chat);
    }

    if (localStorage.getItem(THEME_OVERRIDE_KEY) === "1") applyDarkModeOverride(true);
}

window.filter = function (category) {
    document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
    // Nếu gọi từ HTML onclick, target sẽ là nút được nhấn
    if (event && event.target) event.target.classList.add('active');

    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderProducts(filtered);
    }
};

window.trackClick = async (productId) => {
    try {
        await supabase.from('clicks').insert([{ product_id: productId }]);
    } catch (err) { console.error(err); }
};

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab[data-category]');
    tabs.forEach(button => {
        button.onclick = (e) => {
            const cat = button.getAttribute('data-category');
            window.filter(cat);
        };
    });
});

init();


// DÁN CHÍNH XÁC VÀO ĐÂY NÈ:
async function debugData() {
    console.log("--- LÉP ĐANG KIỂM TRA HỆ THỐNG ---");
    try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
            console.error("LỖI KẾT NỐI:", error.message);
        } else {
            console.log("DỮ LIỆU TRONG BẢNG PRODUCTS:", data);
            if (data.length === 0) {
                console.warn("BẢNG TRỐNG: Mày chưa đăng sản phẩm nào hoặc RLS chưa mở đúng!");
            }
        }
        
        const container = document.getElementById("products");
        console.log("KIỂM TRA ID 'products' TRÊN WEB:", container ? "ĐÃ THẤY ✅" : "KHÔNG THẤY ❌ (LỖI Ở ĐÂY)");
    } catch (e) {
        console.error("LỖI CODE:", e);
    }
}
debugData();
// --- LOGIC AI CHAT & QUIZZ ---
window.toggleAIChat = () => {
    document.getElementById('ai-window').classList.toggle('hidden');
};

// Quiz đơn giản để lọc đồ theo sở thích
window.startProductQuiz = () => {
    const msgBox = document.getElementById('ai-messages');
    msgBox.innerHTML += `<p class="bot-msg">Mày định mua đồ để làm gì? (Chọn 1 cái thôi)</p>`;
    document.getElementById('quiz-options').innerHTML = `
        <button class="quiz-btn" onclick="finishQuiz('skincare')">Dưỡng da cho đẹp</button>
        <button class="quiz-btn" onclick="finishQuiz('decor')">Decor phòng cho chill</button>
        <button class="quiz-btn" onclick="finishQuiz('makeup')">Makeup để đi quẩy</button>
    `;
};

window.finishQuiz = (category) => {
    const msgBox = document.getElementById('ai-messages');
    msgBox.innerHTML += `<p class="user-msg">T chọn ${category}</p>`;
    msgBox.innerHTML += `<p class="bot-msg">Ok, có ngay. Đợi Lép lọc đống đồ ${category} cho mày nè!</p>`;
    
    window.filter(category); // Gọi hàm filter đã có sẵn
    setTimeout(() => toggleAIChat(), 1500); // Tự đóng chat sau khi lọc xong
};

// AI giải đáp thắc mắc (Tạm thời dùng logic nút bấm + từ khóa)
window.askLép = (type) => {
    const msgBox = document.getElementById('ai-messages');
    if(type === 'ship') {
        msgBox.innerHTML += `<p class="bot-msg">Mày đặt Shopee thì tùy shop, còn đồ in hình Lép thì 2-3 ngày nhé. Hỏi gì hỏi lắm! 🙄</p>`;
    }
};

window.handleUserChat = () => {
    const input = document.getElementById('user-ask');
    const msgBox = document.getElementById('ai-messages');
    if (!input.value) return;

    msgBox.innerHTML += `<p class="user-msg">${input.value}</p>`;
    
    // Logic AI đơn giản: Nếu không tìm thấy, gợi ý liên hệ Admin
    setTimeout(() => {
        msgBox.innerHTML += `<p class="bot-msg">Câu này khó quá, Lép chưa học tới. Mày bấm vào nút Facebook hỏi con Trang đi! 🐰</p>`;
    }, 1000);
    
    input.value = "";
};
window.setTheme = (type) => {
    const root = document.documentElement;
    if (type === 'dark') {
        root.style.setProperty('--bg', '#1a1a1a');
        root.style.setProperty('--text', '#ffffff');
        document.body.style.filter = "brightness(0.9)";
    } else if (type === 'light') {
        root.style.setProperty('--bg', '#fafaf9');
        root.style.setProperty('--text', '#2d3436');
    } else if (type === 'mint') {
        root.style.setProperty('--bg', '#e0f2f1');
        root.style.setProperty('--primary', '#558b2f');
    }
};
}