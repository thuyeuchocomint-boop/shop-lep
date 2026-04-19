/* --- 1. CONFIG & INIT --- */
const supabaseClient = window.supabase.createClient(
    "https://ebraxafpawypwmntoglw.supabase.co",
    "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"
);

let allProducts = [];
let quizQuestions = []; // Lưu câu hỏi từ Supabase
const shopEl = document.getElementById("shop");
const recommendEl = document.getElementById("recommend");
const shopLoading = document.getElementById("shop-loading");

async function init() {
    setupWelcomeLogic();
    // Load đồng thời cả settings, sản phẩm và câu hỏi Quiz
    await Promise.all([loadSettings(), loadProducts(), fetchQuizData()]);
}

/* --- 2. SETTINGS & PROFILE --- */
async function loadSettings() {
    try {
        const { data: settings, error } = await supabaseClient.from("Settings").select("*");
        if (error) throw error;
        if (!settings) return;

        const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

        // Load Profile
        if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
        if (config.bio) document.getElementById("display-bio").innerText = config.bio;
        if (config.status) document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;
        
        // Load Social Links (Sửa lại logic ID)
        ['fb_link', 'ig_link', 'tiktok_link', 'threads_link'].forEach(key => {
            const el = document.getElementById('link-' + key);
            if (el) {
                el.href = config[key] || '#';
                el.style.display = config[key] ? 'inline-block' : 'none';
            }
        });
    } catch (err) {
        console.error("Lỗi load settings:", err);
    }
}

// Trong hàm renderCard, sửa lại cấu trúc cho chuyên nghiệp
function renderCard(p) {
    return `
        <div class="card animate-fadeIn">
            <img src="${p.image || 'placeholder.jpg'}" alt="${p.name}" loading="lazy">
            <h4>${p.name}</h4>
            <p class="price">${p.price ? p.price.toLocaleString() + 'đ' : 'Giá liên hệ'}</p>
            <button class="btn-go" onclick="goLink('${p.id}')">Xem giá tốt nhất</button>
        </div>
    `;
}

/* --- 3. WELCOME LOGIC (CÀ KHỊA) --- */
function setupWelcomeLogic() {
    const welcomeEl = document.getElementById("welcome-msg");
    if (!welcomeEl) return;

    let visitCount = parseInt(localStorage.getItem("visit_count") || "0");
    visitCount++;
    localStorage.setItem("visit_count", visitCount);

    const history = JSON.parse(localStorage.getItem("viewed") || "[]");
    const lastItem = history.length > 0 ? history[history.length - 1].name : null;

    if (visitCount === 1) {
        welcomeEl.innerHTML = "Chào m! Lần đầu ghé tiệm Lép à? 🌱";
    } else if (visitCount > 15) {
        welcomeEl.innerHTML = "Lại là m à? Nghiện Lép rồi đúng không? 🙄";
    } else if (lastItem) {
        welcomeEl.innerHTML = `Vẫn đang tia <b>${lastItem}</b> à? Múc đi đừng ngại!`;
    } else {
        welcomeEl.innerHTML = "Chào mừng m quay lại với hệ tư tưởng Lép! ✨";
    }
}

/* --- 4. PRODUCT LOGIC & TRACKING --- */
async function loadProducts() {
    try {
        // Tạm thời comment đoạn cached này lại để test data thật
        // const cached = localStorage.getItem("products_cache"); ...

        const { data, error } = await supabaseClient.from("products").select("*");
        if (error) {
            console.error("Lỗi Supabase:", error.message);
            return;
        }

        if (data && data.length > 0) {
            allProducts = data;
            renderAllSections(allProducts);
        } else {
            console.log("Bảng products đang trống m ơi!");
        }
    } catch (err) {
        console.error("Lỗi hệ thống:", err);
    } finally {
        if (shopLoading) shopLoading.style.display = "none";
        document.getElementById("recommend-loading").style.display = "none";
    }
}

function renderCard(p) {
    return `
        <div class="card">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
            <h4>${p.name}</h4>
            <p class="price">${p.price ? p.price.toLocaleString() + 'đ' : 'Giá liên hệ'}</p>
            <button class="btn-go" onclick="goLink('${p.id}')">Xem giá tốt nhất</button>
        </div>
    `;
}

async function renderAllSections(list) {
    const profileTags = [localStorage.getItem("skin_type")].filter(Boolean);
    const smartList = [...list].sort((a, b) => {
        let scoreA = (a.tags?.some(t => profileTags.includes(t)) ? 5 : 0) + (a.verdict === 'good' ? 2 : 0);
        let scoreB = (b.tags?.some(t => profileTags.includes(t)) ? 5 : 0) + (b.verdict === 'good' ? 2 : 0);
        return scoreB - scoreA;
    });

    if (recommendEl) recommendEl.innerHTML = smartList.slice(0, 2).map(renderCard).join("");
    if (shopEl) shopEl.innerHTML = list.map(renderCard).join("");
}

// Hàm xử lý Click chuyên nghiệp cho cả PC và Mobile
async function goLink(id) {
    const product = allProducts.find(p => p.id == id);
    if (!product) return;

    // Lưu lịch sử
    let history = JSON.parse(localStorage.getItem("viewed") || "[]");
    if (!history.find(h => h.id === id)) {
        history.push({ id: product.id, name: product.name });
        localStorage.setItem("viewed", JSON.stringify(history.slice(-5)));
    }

    // Ghi nhận click vào database (Sử dụng cột clicks trong bảng products)
    try {
        const newClickCount = (product.clicks || 0) + 1;
        await supabaseClient
            .from("products")
            .update({ clicks: newClickCount })
            .eq('id', id);
    } catch (e) {
        console.error("Lỗi đếm click:", e);
    }

    // Mở link (Xử lý cho Mobile ổn định hơn)
    const newWindow = window.open(product.link, "_blank");
    if (!newWindow || newWindow.closed || typeof newWindow.closed == 'undefined') {
        window.location.href = product.link; // Fallback nếu bị chặn popup
    }
}

/* --- 5. HỆ THỐNG QUIZ THÔNG MINH (NO-CODE) --- */
let currentStep = 0;
let userChoices = {};

async function fetchQuizData() {
    try {
        const { data, error } = await supabaseClient
            .from("quizzes")
            .select("*")
            .order("step", { ascending: true });
        if (data) quizQuestions = data;
    } catch (err) {
        console.error("Lỗi tải Quiz:", err);
    }
}

function showQuiz() {
    const quizBox = document.getElementById("quizBox");
    quizBox.style.display = "block"; // Cho hiện cái hộp lên trước
    if (quizQuestions.length === 0) {
        quizBox.innerHTML = "<h3>Đợi Lép tí, đang load câu hỏi...</h3>";
        return;
    }
    renderStep();
}

function renderStep() {
    const quizBox = document.getElementById("quizBox");
    const q = quizQuestions[currentStep];
    
    if (!q) {
        finishQuiz();
        return;
    }

    // Options trong database nên để định dạng JSON: [{"text": "Dưới 200k", "value": "u200"}]
    const optionsHtml = q.options.map(opt => `
        <button onclick="handleSelect('${q.key}', '${opt.value}')">${opt.text}</button>
    `).join("");

    quizBox.innerHTML = `
        <div class="quiz-content animate-slide">
            <h3>${q.question}</h3>
            <div class="quiz-options-vertical">
                ${optionsHtml}
            </div>
        </div>
    `;
}

function handleSelect(key, value) {
    userChoices[key] = value;
    currentStep++;
    if (currentStep < quizQuestions.length) {
        renderStep();
    } else {
        finishQuiz();
    }
}

function finishQuiz() {
    // Logic lọc sản phẩm dựa trên userChoices
    const filtered = allProducts.filter(p => {
        let match = true;
        if (userChoices.category && p.category) {
            match = p.category.toLowerCase().includes(userChoices.category.toLowerCase());
        }
        // Thêm các logic lọc giá hoặc tag tùy m muốn ở đây
        return match;
    });

    if (shopEl) {
        shopEl.innerHTML = filtered.length > 0 
            ? filtered.map(renderCard).join("") 
            : "<p>Lép tìm không ra món nào như ý m rồi... 🌿</p>";
    }
    
    document.getElementById("quizBox").style.display = "none";
    shopEl.scrollIntoView({ behavior: 'smooth' });
}

/* --- 6. KHỞI CHẠY --- */
init();
