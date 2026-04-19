/* --- 1. KHỞI TẠO & KẾT NỐI SUPABASE --- */
const supabaseClient = window.supabase.createClient(
    "https://ebraxafpawypwmntoglw.supabase.co",
    "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"
);

let allProducts = [];
let userChoices = {};

async function init() {
    setupWelcomeLogic(); // Ghi nhớ khách cũ/mới và cà khịa
    await Promise.all([loadSettings(), loadProducts()]); // Load data từ Supabase
}

/* --- 2. QUẢN LÝ CẤU HÌNH (NO-CODE) --- */
async function loadSettings() {
    try {
        const { data } = await supabaseClient.from("Settings").select("*");
        if (!data) return;
        const config = Object.fromEntries(data.map(s => [s.key, s.value]));

        // Cập nhật Profile từ Database
        if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
        if (config.status) {
            document.getElementById("status-area").style.display = "flex";
            document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;
        }
        if (config.email) document.getElementById("display-gmail").innerText = config.email;

        // Tự động đổ Social Links mà không cần sửa HTML
        const socialContainer = document.getElementById("social-links-container");
        if (socialContainer) {
            socialContainer.innerHTML = "";
            const links = [
                { key: 'fb_link', label: 'FB' },
                { key: 'tiktok_link', label: 'TikTok' },
                { key: 'threads_link', label: 'Threads' },
                { key: 'ig_link', label: 'IG' }
            ];
            links.forEach(item => {
                if (config[item.key]) {
                    const a = document.createElement("a");
                    a.href = config[item.key];
                    a.target = "_blank";
                    a.innerText = item.label;
                    a.style.cssText = "text-decoration:none; background:white; padding:8px 15px; border-radius:50px; font-size:12px; font-weight:600; box-shadow: 0 4px 6px rgba(0,0,0,0.05); color: #2c3e50; border: 1px solid #eee;";
                    socialContainer.appendChild(a);
                }
            });
        }
    } catch (err) { console.error("Lỗi load settings:", err); }
}

/* --- 3. LOGIC CHĂM SÓC KHÁCH (CRM & CÀ KHỊA) --- */
function setupWelcomeLogic() {
    let visitCount = parseInt(localStorage.getItem("visit_count") || "0") + 1;
    localStorage.setItem("visit_count", visitCount);
    
    const welcomeEl = document.getElementById("welcome-msg");
    const lastSeen = localStorage.getItem("last_product_name");

    // Logic cà khịa dựa trên số lần vào và sản phẩm đã xem
    if (visitCount > 10) {
        welcomeEl.innerHTML = "Lại là m à? Nghiện Lép rồi đúng không? 🙄";
    } else if (lastSeen) {
        welcomeEl.innerHTML = `Vẫn đang tia <b>${lastSeen}</b> à? Múc đi đừng ngại!`;
    } else if (visitCount === 1) {
        welcomeEl.innerHTML = "Chào m! Lần đầu ghé tiệm Lép à? 🌱";
    }
}

/* --- 4. HỆ THỐNG QUIZ TRỊ LIỆU & PHÂN NHÁNH --- */
window.showQuiz = () => {
    const qBox = document.getElementById("quizBox");
    qBox.style.display = "block";
    qBox.scrollIntoView({ behavior: 'smooth' });
    renderMoodStep(); // Bước 1: Hỏi tâm trạng để đổi màu web
};

function renderMoodStep() {
    const qBox = document.getElementById("quizBox");
    qBox.innerHTML = `
        <h3 style="margin-bottom:15px">Hôm nay m thấy thế nào? 🌱</h3>
        <div class="quiz-options-vertical">
            <button onclick="setMood('happy')">Vui vẻ, yêu đời ✨</button>
            <button onclick="setMood('sad')">Hơi deep, cần chữa lành 🌊</button>
            <button onclick="setMood('angry')">Đang cọc, đừng động vào 💢</button>
        </div>
    `;
}

window.setMood = (mood) => {
    // Đổi màu web theo hướng trị liệu tâm trạng
    document.body.className = `mood-${mood}`;
    userChoices.mood = mood;
    
    const welcomeEl = document.getElementById("welcome-msg");
    // Phản hồi của Lép dựa trên mood
    if (mood === 'sad') {
        welcomeEl.innerHTML = "Nhìn thảm thế m? T bật tone <b>hồng ấm</b> cho m bớt buồn rồi đấy. Kiếm đồ xịn mà múc đi! 🌸";
    } else if (mood === 'angry') {
        welcomeEl.innerHTML = "Cọc gì? Hạ hỏa đi m. T đổi sang màu <b>xanh mát</b> cho m dễ thở rồi đấy, chọn đồ đi! 🧊";
    } else {
        welcomeEl.innerHTML = "Đang vui à? Hưởng thụ màu <b>xanh tươi</b> này đi rồi xem tiệm t có gì mới không nhé! ✨";
    }
    
    renderSuggestionStep();
};

function renderSuggestionStep() {
    const qBox = document.getElementById("quizBox");
    qBox.innerHTML = `
        <h3 style="margin-bottom:15px">M muốn Lép gợi ý đồ xịn cho m không? 🌿</h3>
        <div class="quiz-options-vertical">
            <button onclick="renderCategoryStep()">Có, chọn hộ t cái</button>
            <button onclick="closeQuiz()">Không, t tự xem</button>
        </div>
    `;
}

function renderCategoryStep() {
    const qBox = document.getElementById("quizBox");
    qBox.innerHTML = `
        <h3 style="margin-bottom:15px">M muốn tìm đồ hệ nào?</h3>
        <div class="quiz-options-vertical">
            <button onclick="selectStep('category', 'mỹ phẩm')">Làm đẹp (Makeup/Skincare)</button>
            <button onclick="selectStep('category', 'học tập')">Học tập & Sách</button>
            <button onclick="selectStep('category', 'decor')">Decor & Lifestyle</button>
        </div>
    `;
}

function selectStep(key, value) {
    userChoices[key] = value;
    renderPriceStep();
}

function renderPriceStep() {
    const qBox = document.getElementById("quizBox");
    qBox.innerHTML = `
        <h3 style="margin-bottom:15px">Ngân sách của m khoảng bao nhiêu?</h3>
        <div class="quiz-options-vertical">
            <button onclick="finishSmartQuiz(200000)">Dưới 200k (Hạt dẻ)</button>
            <button onclick="finishSmartQuiz(500000)">Dưới 500k (Vừa miếng)</button>
            <button onclick="finishSmartQuiz(1000000)">Dưới 1 triệu (Đồ xịn)</button>
            <button onclick="finishSmartQuiz(999999999)">Đại gia, không quan tâm giá</button>
        </div>
    `;
}

function finishSmartQuiz(maxPrice) {
    const filtered = allProducts.filter(p => {
        const matchCat = p.category?.toLowerCase().includes(userChoices.category.toLowerCase());
        const price = Number(p.price) || 0;
        const matchPrice = price <= maxPrice;
        return matchCat && matchPrice;
    });

    renderAllSections(filtered.length > 0 ? filtered : allProducts);
    
    if (filtered.length === 0) {
        alert("Hic, Lép chưa có món nào đúng tầm giá này, xem tạm mấy đồ xịn khác nhé! 🌿");
    }

    closeQuiz();
    document.getElementById("shop").scrollIntoView({ behavior: 'smooth' });
}

function closeQuiz() {
    document.getElementById("quizBox").style.display = "none";
}

/* --- 5. LOGIC SẢN PHẨM --- */
async function loadProducts() {
    try {
        const { data } = await supabaseClient.from("products").select("*");
        allProducts = data || [];
        renderAllSections(allProducts);
    } catch (err) { console.error("Lỗi load sản phẩm:", err); }
    finally {
        if (document.getElementById("shop-loading")) 
            document.getElementById("shop-loading").style.display = "none";
    }
}

function renderAllSections(list) {
    const shopEl = document.getElementById("shop");
    const recommendEl = document.getElementById("recommend");
    
    const html = list.map(p => `
        <div class="card">
            <div class="category-tag">${p.category || 'Lép chọn'}</div>
            <img src="${p.image || 'https://via.placeholder.com/150'}" alt="${p.name}">
            <h4>${p.name}</h4>
            <p class="price">${p.price ? p.price.toLocaleString() + 'đ' : 'Giá liên hệ'}</p>
            <button class="go-btn" onclick="goLink('${p.id}', '${p.name}', '${p.link}')">Xem ngay</button>
        </div>
    `).join("");

    if (shopEl) shopEl.innerHTML = html;
    // Gợi ý 2 món hot ở phần trên
    if (recommendEl && list.length >= 2) recommendEl.innerHTML = list.slice(0, 2).map(p => `
        <div class="card">
            <div class="category-tag">Hot 🔥</div>
            <img src="${p.image}" alt="${p.name}">
            <h4>${p.name}</h4>
            <button class="go-btn" onclick="goLink('${p.id}', '${p.name}', '${p.link}')">Xem món này</button>
        </div>
    `).join("");
}

window.goLink = async (id, name, link) => {
    // Lưu tên sản phẩm để lần sau con Lép còn cà khịa
    localStorage.setItem("last_product_name", name); 
    window.open(link, "_blank");
    
    // Tăng click sản phẩm trên database (Tính năng cũ)
    try {
        await supabaseClient.rpc('increment_clicks', { row_id: id });
    } catch (e) { console.log("Lỗi đếm click"); }
};
async function init() {
    setupWelcomeLogic(); // Ghi nhớ khách cũ/mới
    await Promise.all([loadSettings(), loadProducts()]); // Load data từ Supabase
    
    // Tự động hiện câu hỏi "Nay m thế nào" ngay khi vừa vào web
    setTimeout(() => {
        showQuiz();
    }, 1000); // Đợi 1 giây cho mượt rồi mới hiện
}
/* --- KHỞI CHẠY --- */
init();