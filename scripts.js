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
// Load dữ liệu khảo sát cũ lên form
async function loadQuizData() {
    const { data } = await supabaseClient.from("Settings").select("*").eq("key", "quiz_config").maybeSingle();
    if (data) {
        const config = JSON.parse(data.value);
        document.getElementById("quiz-question").value = config.question || "";
        document.getElementById("opt-a").value = config.options[0].text || "";
        document.getElementById("val-a").value = config.options[0].value || "";
        document.getElementById("opt-b").value = config.options[1].text || "";
        document.getElementById("val-b").value = config.options[1].value || "";
    }
}

// Lưu cấu hình khảo sát mới
async function saveQuizConfig() {
    const config = {
        question: document.getElementById("quiz-question").value,
        options: [
            { text: document.getElementById("opt-a").value, value: document.getElementById("val-a").value },
            { text: document.getElementById("opt-b").value, value: document.getElementById("val-b").value }
        ]
    };

    const { error } = await supabaseClient
        .from("Settings")
        .upsert({ key: "quiz_config", value: JSON.stringify(config) });

    if (!error) {
        alert("Đã cập nhật khảo sát! Giờ con Lép sẽ hỏi khách theo ý mày.");
    } else {
        alert("Lỗi rồi m ơi: " + error.message);
    }
}

// Cập nhật hàm loadData chính để gọi thêm quiz
async function loadData() {
    // ... code cũ của t ...
    await loadQuizData();
}

// --- PHẦN AI CHAT MỚI ---
const URL_SB = 'URL_CUA_MAY';
const KEY_SB = 'KEY_CUA_MAY';
const _client = supabase.createClient(URL_SB, KEY_SB);

// Logic cho Admin
const btnSave = document.getElementById('save-flow-btn');
if (btnSave) {
    btnSave.onclick = async () => {
        const id = document.getElementById('node-id').value;
        const msg = document.getElementById('node-msg').value;
        const opts = document.getElementById('node-options').value.split(',').map(i => {
            const [t, n] = i.split('|');
            return { text: t.trim(), next: n.trim() };
        });
        await _client.from('bot_flows').upsert({ node_id: id, message: msg, options: opts }, { onConflict: 'node_id' });
        alert('Đã nạp kiến thức cho Lép!');
    };
}

// Logic cho Khách (Chat)
window.toggleChat = () => {
    const body = document.getElementById('chat-body');
    body.classList.toggle('hidden');
    if (!body.classList.contains('hidden')) loadAIChat('bat-dau');
};

async function loadAIChat(id) {
    const { data } = await _client.from('bot_flows').select('*').eq('node_id', id).single();
    if (data) {
        const content = document.getElementById('chat-content');
        content.innerHTML += `<div class="bot-msg"><b>Lép:</b> ${data.message}</div>`;
        
        const area = document.getElementById('options-area');
        area.innerHTML = '';
        data.options.forEach(o => {
            const b = document.createElement('button');
            b.innerText = o.text;
            b.onclick = () => {
                content.innerHTML += `<div class="user-msg"><b>Mày:</b> ${o.text}</div>`;
                loadAIChat(o.next);
            };
            area.appendChild(b);
        });
    }
}
/* =========================
   🚀 LÉP UPGRADE SYSTEM V2
   ========================= */

/* ---------- 1. CACHE DATA ---------- */
let cachedProducts = null;

async function loadProductsSmart() {
  if (cachedProducts) return cachedProducts;

  const { data, error } = await supabase
    .from("products")
    .select("*");

  if (error) {
    console.error("Lỗi load:", error);
    return [];
  }

  cachedProducts = data;
  return data;
}

/* ---------- 2. USER PROFILE ---------- */
function saveUserProfile(profile) {
  localStorage.setItem("lep_user_profile", JSON.stringify(profile));
}

function getUserProfile() {
  return JSON.parse(localStorage.getItem("lep_user_profile"));
}

function isNewUser() {
  return !localStorage.getItem("lep_user_profile");
}

/* ---------- 3. QUIZ SYSTEM ---------- */
let currentProfile = {};

function renderQuiz() {
  const app = document.getElementById("app");

  app.innerHTML = `
    <div class="quiz-box">
      <h2>👀 Tìm món hợp vibe bạn</h2>

      <p>Bạn đang cần gì?</p>
      <div class="quiz-options">
        <button onclick="selectNeed('beauty')">Làm đẹp</button>
        <button onclick="selectNeed('relax')">Thư giãn</button>
        <button onclick="selectNeed('study')">Học tập</button>
        <button onclick="selectNeed('gift')">Quà tặng</button>
      </div>

      <p>Ngân sách?</p>
      <div class="quiz-options">
        <button onclick="selectBudget(100)">Dưới 100k</button>
        <button onclick="selectBudget(300)">100–300k</button>
        <button onclick="selectBudget(9999)">Trên 300k</button>
      </div>

      <p>Phong cách?</p>
      <div class="quiz-options">
        <button onclick="selectVibe('cute')">Cute</button>
        <button onclick="selectVibe('chill')">Chill</button>
        <button onclick="selectVibe('lux')">Sang</button>
      </div>

      <button onclick="finishQuiz()" class="finish-btn">
        Xem gợi ý 🔥
      </button>
    </div>
  `;
}

function selectNeed(v) { currentProfile.need = v; }
function selectBudget(v) { currentProfile.budget = v; }
function selectVibe(v) { currentProfile.vibe = v; }

function finishQuiz() {
  saveUserProfile(currentProfile);
  location.reload();
}

/* ---------- 4. FILTER THÔNG MINH ---------- */
function filterProductsSmart(products, profile) {
  return products.filter(p => {
    return (
      (!profile.need || p.category === profile.need) &&
      (!profile.vibe || p.vibe === profile.vibe) &&
      (!profile.budget || p.price <= profile.budget)
    );
  });
}

/* ---------- 5. RENDER UI ---------- */
function renderProductsSmart(products, title = "✨ Gợi ý cho bạn") {
  const app = document.getElementById("app");

  if (!products.length) {
    app.innerHTML = `<p>😢 Chưa có sản phẩm phù hợp</p>`;
    return;
  }

  app.innerHTML = `
    <h2>${title}</h2>
    <div class="lep-grid">
      ${products.map(p => `
        <div class="lep-card">
          <img src="${p.image}" />
          <h3>${p.name}</h3>
          <p>${p.price}k</p>
          <a href="${p.link}" target="_blank">Xem ngay</a>
        </div>
      `).join("")}
    </div>

    <button onclick="resetProfile()" class="reset-btn">
      🔄 Chọn lại
    </button>
  `;
}

/* ---------- 6. RESET ---------- */
function resetProfile() {
  localStorage.removeItem("lep_user_profile");
  location.reload();
}

/* ---------- 7. TRACK HÀNH VI ---------- */
function trackClick(productName) {
  let history = JSON.parse(localStorage.getItem("lep_history")) || [];
  history.push(productName);
  localStorage.setItem("lep_history", JSON.stringify(history));
}

/* ---------- 8. INIT ---------- */
async function initLEP() {
  const products = await loadProductsSmart();

  if (isNewUser()) {
    renderQuiz();
  } else {
    const profile = getUserProfile();
    const filtered = filterProductsSmart(products, profile);

    renderProductsSmart(filtered);

    // fallback nếu lọc quá ít
    if (filtered.length < 2) {
      renderProductsSmart(products, "🔥 Hot cho bạn");
    }
  }
}

initLEP();
/* --- KHỞI CHẠY --- */
init();
