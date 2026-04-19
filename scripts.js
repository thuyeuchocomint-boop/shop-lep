const supabaseClient = window.supabase.createClient(
    "https://ebraxafpawypwmntoglw.supabase.co",
    "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"
);

let allProducts = [];
let quizQuestions = [];
let userChoices = {};
let currentStep = 0;

async function init() {
    setupWelcomeLogic();
    await Promise.all([loadSettings(), loadProducts(), fetchQuizData()]);
}

/* --- 1. LOAD SETTINGS & SOCIAL --- */
async function loadSettings() {
    try {
        const { data, error } = await supabaseClient.from("Settings").select("*");
        if (error) throw error;
        const config = Object.fromEntries(data.map(s => [s.key, s.value]));

        // 1. Cập nhật Avatar & Status
        if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
        if (config.status) {
            document.getElementById("status-area").style.display = "flex";
            document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;
        }

        // 2. Hiện Gmail rõ ràng (Đúng ý m)
        if (config.email) {
            document.getElementById("display-gmail").innerText = config.email;
        }

        // 3. Tự động đổ Social Links (Không cần đụng vào HTML)
        const socialContainer = document.getElementById("social-links-container");
        socialContainer.innerHTML = ""; // Xóa trắng để nạp mới

        // Danh sách các key social m thường dùng trên Supabase
        const socialKeys = [
            { key: 'fb_link', label: 'Facebook' },
            { key: 'tiktok_link', label: 'TikTok' },
            { key: 'threads_link', label: 'Threads' },
            { key: 'ig_link', label: 'Instagram' },
            { key: 'youtube_link', label: 'Youtube' }
        ];

        socialKeys.forEach(item => {
            if (config[item.key]) {
                const linkIcon = document.createElement("a");
                linkIcon.href = config[item.key];
                linkIcon.target = "_blank";
                linkIcon.innerText = item.label;
                // Tận dụng class m đã viết trong style.css
                linkIcon.style.cssText = "text-decoration:none; background:white; padding:8px 15px; border-radius:50px; font-size:12px; font-weight:600; box-shadow: 0 4px 6px rgba(0,0,0,0.05); color: var(--text-dark); border: 1px solid #eee;";
                socialContainer.appendChild(linkIcon);
            }
        });

        // 4. Mood Theme (Giữ nguyên logic cũ của m)
        if (config.user_mood) {
            const moodMap = {
                'happy': { main: '#22c55e', bg: '#f0fdf4' },
                'sad': { main: '#3b82f6', bg: '#eff6ff' },
                'angry': { main: '#ef4444', bg: '#fef2f2' }
            };
            const theme = moodMap[config.user_mood] || moodMap['happy'];
            document.documentElement.style.setProperty('--main-color', theme.main);
            document.documentElement.style.setProperty('--bg-light', theme.bg);
        }

    } catch (err) { console.error("Lỗi Settings:", err); }
}
/* --- 2. PRODUCT LOGIC --- */
async function loadProducts() {
    try {
        const { data, error } = await supabaseClient.from("products").select("*");
        if (error) throw error;
        allProducts = data || [];
        renderAllSections(allProducts);
    } catch (err) { console.error("Lỗi Products:", err); }
    finally {
        document.getElementById("shop-loading").style.display = "none";
        document.getElementById("recommend-loading").style.display = "none";
    }
}

function renderCard(p) {
    // Thêm hiển thị danh mục (Category) vào thẻ card
    return `
        <div class="card">
            <div class="category-tag">${p.category || 'General'}</div>
            <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
            <h4>${p.name}</h4>
            <p class="price">${p.price ? p.price.toLocaleString() + 'đ' : 'Giá liên hệ'}</p>
            <button class="go-btn" onclick="goLink('${p.id}')">Xem ngay</button>
        </div>`;
}

function renderAllSections(list) {
    const shopEl = document.getElementById("shop");
    const recommendEl = document.getElementById("recommend");
    // Gợi ý 2 món hot nhất (dựa theo click hoặc 2 món đầu)
    if (recommendEl) recommendEl.innerHTML = list.slice(0, 2).map(renderCard).join("");
    if (shopEl) shopEl.innerHTML = list.map(renderCard).join("");
}

window.goLink = async (id) => {
    const product = allProducts.find(p => p.id == id);
    if (!product) return;
    window.open(product.link, "_blank");
    // Tăng click ẩn (nếu muốn)
    await supabaseClient.rpc('increment_clicks', { row_id: id }); 
};

/* --- 3. QUIZ LOGIC (Fix gợi ý test) --- */
async function fetchQuizData() {
    const { data } = await supabaseClient.from("quizzes").select("*").order("step", { ascending: true });
    if (data) quizQuestions = data;
}

window.showQuiz = () => {
    const qBox = document.getElementById("quizBox");
    qBox.style.display = "block";
    qBox.scrollIntoView({ behavior: 'smooth' });
    currentStep = 0;
    renderStep();
};

function renderStep() {
    const qBox = document.getElementById("quizBox");
    const q = quizQuestions[currentStep];
    if (!q) { finishQuiz(); return; }

    let options = q.options;
    if (typeof options === 'string') options = JSON.parse(options);

    const optionsHtml = options.map(opt => 
        `<button class="quiz-btn" onclick="handleSelect('${q.key}', '${opt.value}')">${opt.text}</button>`
    ).join("");

    qBox.innerHTML = `<h3>${q.question}</h3><div style="margin-top:20px;">${optionsHtml}</div>`;
}

window.handleSelect = (key, value) => {
    userChoices[key] = value;
    currentStep++;
    renderStep();
};

function finishQuiz() {
    // Lọc theo category hoặc tags
    const filtered = allProducts.filter(p => {
        const matchCat = !userChoices.category || p.category === userChoices.category;
        return matchCat;
    });

    const shopEl = document.getElementById("shop");
    if (filtered.length > 0) {
        shopEl.innerHTML = filtered.map(renderCard).join("");
    } else {
        shopEl.innerHTML = "<p style='grid-column: 1/-1;'>Hổng thấy món nào khớp hết, xem tạm mấy đồ này nha!</p>" + allProducts.slice(0, 4).map(renderCard).join("");
    }
    
    document.getElementById("quizBox").style.display = "none";
    shopEl.scrollIntoView({ behavior: 'smooth' });
}

function setupWelcomeLogic() {
    let visitCount = parseInt(localStorage.getItem("visit_count") || "0") + 1;
    localStorage.setItem("visit_count", visitCount);
    const welcomeEl = document.getElementById("welcome-msg");
    if (welcomeEl && visitCount > 10) welcomeEl.innerText = "Lại là m à? Nghiện Lép rồi đúng không? 🙄";
}

init();