/* --- 1. CONFIG & INIT --- */
const supabaseClient = window.supabase.createClient(
    "https://ebraxafpawypwmntoglw.supabase.co",
    "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"
);

let allProducts = [];
const shopEl = document.getElementById("shop");
const recommendEl = document.getElementById("recommend"); // Thêm để đổ vào phần Gợi ý
const shopLoading = document.getElementById("shop-loading");

async function init() {
    setupWelcomeLogic();
    await Promise.all([loadSettings(), loadProducts()]);
}

/* --- 2. SETTINGS & PROFILE --- */
async function loadSettings() {
    try {
        const { data: settings } = await supabaseClient.from("Settings").select("*");
        if (!settings) return;

        const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

        // Cập nhật Profile - Fix lỗi ID và chính tả
        if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
        if (config.bio) document.getElementById("display-bio").innerText = config.bio;
        if (config.status) document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;
        
        // FIX LỖI GMAIL: Đổi từ display-mail sang display-email cho khớp HTML
        const emailEl = document.getElementById("display-email");
        if (config.email && emailEl) {
            emailEl.innerHTML = `📩 <a href="mailto:${config.email}">${config.email}</a>`;
            emailEl.style.display = "block";
        }

        // Social links
        ['fb', 'ig', 'tiktok', 'yt'].forEach(p => {
            const link = config[p + '_link'];
            const el = document.getElementById('link-' + p);
            if (el) {
                el.href = link || '#';
                el.style.display = link ? 'inline-block' : 'none';
            }
        });
    } catch (err) {
        console.error("Lỗi load settings:", err);
    }
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

/* --- 4. PRODUCT LOGIC & AI --- */
async function loadProducts() {
    try {
        // Load nhanh từ cache trước cho mượt
        const cached = localStorage.getItem("products_cache");
        if (cached) {
            allProducts = JSON.parse(cached);
            renderAllSections(allProducts);
        }

        const { data, error } = await supabaseClient.from("products").select("*");
        if (error) throw error;

        if (data) {
            allProducts = data;
            localStorage.setItem("products_cache", JSON.stringify(data));
            renderAllSections(allProducts);
        }
    } catch (err) {
        console.error("Load sản phẩm lỗi:", err);
    } finally {
        if (shopLoading) shopLoading.style.display = "none";
        if (document.getElementById("recommend-loading")) 
            document.getElementById("recommend-loading").style.display = "none";
    }
}

// Hàm render thẻ sản phẩm (Sửa lại UI cho chuyên nghiệp)
function renderCard(p) {
    return `
        <div class="card">
            <img src="${p.image}" alt="${p.name}" loading="lazy">
            <h4>${p.name}</h4>
            <p class="price">${p.price ? p.price.toLocaleString() + 'đ' : 'Giá liên hệ'}</p>
            <a href="javascript:void(0)" onclick="goLink('${p.id}')">Xem giá tốt nhất</a>
        </div>
    `;
}

async function renderAllSections(list) {
    // 1. Render mục Gợi ý (Dùng AI score)
    const profile = { tags: [localStorage.getItem("skin_type")].filter(Boolean) };
    const smartList = [...list].sort((a, b) => {
        let scoreA = (a.tags?.some(t => profile.tags.includes(t)) ? 5 : 0) + (a.verdict === 'good' ? 2 : 0);
        let scoreB = (b.tags?.some(t => profile.tags.includes(t)) ? 5 : 0) + (b.verdict === 'good' ? 2 : 0);
        return scoreB - scoreA;
    });

    if (recommendEl) {
        recommendEl.innerHTML = smartList.slice(0, 2).map(renderCard).join("");
    }

    // 2. Render tất cả sản phẩm
    if (shopEl) {
        shopEl.innerHTML = list.map(renderCard).join("");
    }
}

/* --- 5. INTERACTION --- */
async function goLink(id) {
    const product = allProducts.find(p => p.id == id);
    if (!product) return;

    // Lưu lịch sử xem để "cà khịa" ở lần sau
    let history = JSON.parse(localStorage.getItem("viewed") || "[]");
    if (!history.find(h => h.id === id)) {
        history.push({ id: product.id, name: product.name });
        localStorage.setItem("viewed", JSON.stringify(history.slice(-5)));
    }

    try {
        await supabaseClient.from("clicks").insert([{ product_id: id }]);
    } catch {}

    window.open(product.link, "_blank");
}

function filterProducts(category, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filtered = category === 'all' 
        ? allProducts 
        : allProducts.filter(p => p.category.toLowerCase() === category.toLowerCase());

    if (shopEl) shopEl.innerHTML = filtered.map(renderCard).join("");
}

function setFilter(tag) {
    // Hàm này để lọc nhanh theo tag (Da dầu, mụn...)
    const filtered = tag === 'all' 
        ? allProducts 
        : allProducts.filter(p => p.tags && p.tags.includes(tag));
    
    if (shopEl) shopEl.innerHTML = filtered.map(renderCard).join("");
    document.getElementById("filter-title").innerText = tag === 'all' ? "" : `Đang lọc theo: ${tag}`;
}

// ================= LUỒNG TƯ VẤN THÔNG MINH (QUIZ) =================
let quizStep = 1;
let userAnswers = {};

// Hàm này để kích hoạt lại Quiz nếu m muốn (ví dụ khách bấm vào con Lép)
function startQuiz() {
    quizStep = 1;
    userAnswers = {};
    const quizBox = document.getElementById("quizBox");
    if (quizBox) {
        quizBox.style.display = "block";
        showQuizStep();
    }
}

function showQuizStep() {
    const quizBox = document.getElementById("quizBox");
    if (!quizBox) return;
    let html = "";

    switch(quizStep) {
        case 1:
            html = `
                <h3 style="margin-bottom:10px">Chào m! 🌱</h3>
                <p>M muốn Lép hỗ trợ <b>tư vấn chọn đồ</b> phù hợp hay muốn <b>tự đi dạo</b> xem tiệm?</p>
                <div class="quiz-options-vertical">
                    <button onclick="handleQuiz(1, 'auto')">Nhờ Lép tư vấn giúp</button>
                    <button onclick="handleQuiz(1, 'manual')">Để t tự xem nhé</button>
                </div>
            `;
            break;

        case 2:
            html = `
                <p>M đang quan tâm đến nhóm sản phẩm nào nhất? 🌱</p>
                <div class="quiz-options-vertical">
                    <button onclick="handleQuiz(2, 'beauty')">Làm đẹp & Chăm sóc bản thân</button>
                    <button onclick="handleQuiz(2, 'study')">Học tập & Kiến thức</button>
                    <button onclick="handleQuiz(2, 'lifestyle')">Phong cách sống & Decor</button>
                </div>
            `;
            break;

        case 3:
            if (userAnswers.goal === 'beauty') {
                html = `<p>Cụ thể hơn về nhu cầu làm đẹp của m là gì?</p>
                        <div class="quiz-options-vertical">
                            <button onclick="handleQuiz(3, 'mỹ phẩm')">Mỹ phẩm (Skincare/Dưỡng da)</button>
                            <button onclick="handleQuiz(3, 'makeup')">Trang điểm (Makeup)</button>
                            <button onclick="handleQuiz(3, 'quần áo')">Thời trang & Phối đồ</button>
                        </div>`;
            } else if (userAnswers.goal === 'study') {
                html = `<p>Lép nên tìm loại nội dung nào cho m?</p>
                        <div class="quiz-options-vertical">
                            <button onclick="handleQuiz(3, 'sách kỹ năng')">Sách Kỹ năng & Phát triển</button>
                            <button onclick="handleQuiz(3, 'sách chữa lành')">Sách Chữa lành & Tản văn</button>
                            <button onclick="handleQuiz(3, 'học tập')">Dụng cụ học tập cute</button>
                        </div>`;
            } else {
                html = `<p>M muốn làm mới không gian hay tâm hồn?</p>
                        <div class="quiz-options-vertical">
                            <button onclick="handleQuiz(3, 'decor')">Đồ Decor phòng ốc</button>
                            <button onclick="handleQuiz(3, 'nến thơm')">Nến thơm & Thư giãn</button>
                        </div>`;
            }
            break;

        case 4:
            html = `
                <p>M muốn Lép lọc sản phẩm trong tầm giá nào? 🌱</p>
                <div class="quiz-options-vertical">
                    <button onclick="handleQuiz(4, 'u200')">Dưới 200.000đ</button>
                    <button onclick="handleQuiz(4, 'u500')">Từ 200.000đ - 500.000đ</button>
                    <button onclick="handleQuiz(4, 'u1000')">Từ 500.000đ - 1.000.000đ</button>
                    <button onclick="handleQuiz(4, 'o1000')">Trên 1.000.000đ</button>
                    <button onclick="handleQuiz(4, 'all')">Tất cả mức giá</button>
                </div>
            `;
            break;
    }

    quizBox.innerHTML = `<div class="quiz-content animate-slide">${html}</div>`;
}

function handleQuiz(step, value) {
    if (step === 1) {
        if (value === 'manual') {
            document.getElementById("quizBox").style.display = "none";
            return;
        }
        quizStep = 2;
    } else if (step === 2) {
        userAnswers.goal = value;
        quizStep = 3;
    } else if (step === 3) {
        userAnswers.subCat = value;
        quizStep = 4;
    } else if (step === 4) {
        userAnswers.priceRange = value;
        finishQuiz();
        return;
    }
    showQuizStep();
}

function finishQuiz() {
    const filtered = allProducts.filter(p => {
        // Lọc danh mục (không phân biệt hoa thường)
        const matchCat = p.category && p.category.toLowerCase().includes(userAnswers.subCat.toLowerCase());
        
        // Lọc giá
        let matchPrice = true;
        const price = Number(p.price) || 0;
        if (userAnswers.priceRange === 'u200') matchPrice = price <= 200000;
        else if (userAnswers.priceRange === 'u500') matchPrice = price > 200000 && price <= 500000;
        else if (userAnswers.priceRange === 'u1000') matchPrice = price > 500000 && price <= 1000000;
        else if (userAnswers.priceRange === 'o1000') matchPrice = price > 1000000;
        else if (userAnswers.priceRange === 'all') matchPrice = true;

        return matchCat && matchPrice;
    });

    // Render lại danh sách đã lọc vào phần Tất cả sản phẩm
    if (shopEl) {
        shopEl.innerHTML = filtered.length > 0 
            ? filtered.map(renderCard).join("") 
            : "<p style='grid-column: 1/-1; text-align:center; padding:20px;'>Hic, Lép chưa có món nào đúng tầm giá này, m xem tầm giá khác nhé! 🌿</p>";
    }
    
    document.getElementById("quizBox").style.display = "none";
    
    // Cuộn xuống phần kết quả để khách thấy luôn
    shopEl.scrollIntoView({ behavior: 'smooth' });

    const welcomeEl = document.getElementById("welcome-msg");
    if (welcomeEl) welcomeEl.innerHTML = `Lép đã lọc các món <b>${userAnswers.subCat}</b> theo đúng ý m rồi đấy!`;
}

// Chạy quiz ngay khi load trang (tùy chọn)
setTimeout(() => {
    const quizBox = document.getElementById("quizBox");
    if (quizBox) showQuizStep();
}, 1000);

// ================= START =================
init();
