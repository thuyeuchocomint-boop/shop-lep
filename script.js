const supabaseClient = window.supabase.createClient(
  "https://ebraxafpawypwmntoglw.supabase.co",
  "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"
);

let allProducts = [];

async function init() {
    await loadSettings(); 
    await loadProducts();   
}

// 1. LOAD SETTINGS: Profile, Social, Guessing Logic
async function loadSettings() {
  const { data: settings } = await supabaseClient.from("Settings").select("*");
  if (!settings) return;
  const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

  // Đổ Profile (Avatar, Bio, Status) từ Dashboard
  if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
  if (config.bio) document.getElementById("display-bio").innerText = config.bio;
  if (config.status) document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;
  
  // Đổ Social Links
  ['fb', 'ig', 'threads', 'tiktok', 'yt'].forEach(p => {
    const link = config[p + '_link'];
    const el = document.getElementById('link-' + p);
    if (el) { el.href = link || '#'; el.style.display = link ? 'inline-block' : 'none'; }
  });

  // Hiện Gmail
  if (config.email) {
    const mailEl = document.getElementById("display-mail");
    mailEl.innerHTML = `<a href="mailto:${config.email}" class="mail-link">📩 ${config.email}</a>`;
    mailEl.style.display = "block";
  }

  // --- SIÊU LOGIC ĐOÁN Ý KHÁCH (FULL) ---
  const welcomeEl = document.getElementById("welcome-msg");
  const history = JSON.parse(localStorage.getItem("viewed")) || [];
  let visitCount = parseInt(localStorage.getItem("visit_count") || "0");
  
  visitCount++;
  localStorage.setItem("visit_count", visitCount);

  if (visitCount === 1 && history.length === 0) {
      welcomeEl.innerHTML = "Chào m! Lần đầu ghé tiệm Lép à? Xem đồ đi, ok lắm ^.^";
      return;
  }

  const categories = history.map(h => h.category).filter(Boolean);
  let favoriteCat = categories.length > 0 ? categories.reduce((a, b, i, arr) => 
      (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b)) : "";
  const lastItem = history.length > 0 ? history[history.length - 1].name : null;

  if (visitCount > 10) {
      welcomeEl.innerHTML = `Lại là m à? Vào hơn 10 lần rồi mà chưa mua gì cho Lép giàu à? 🙄`;
  } else if (favoriteCat && visitCount > 3) {
      welcomeEl.innerHTML = `Quay lại rồi à? Nhìn m là biết vẫn đang mê mấy món <b>${favoriteCat}</b> rồi!`;
  } else if (lastItem) {
      welcomeEl.innerHTML = `Vẫn đang tia cái <b>${lastItem}</b> à? Thích thì nhích lẹ đi m!`;
  } else {
      welcomeEl.innerHTML = `Mới quay lại đó hả? Định tìm gì xịn xịn nữa đây?`;
  }
}

// 2. LOAD PRODUCTS: Nạp sản phẩm
async function loadProducts() {
    const { data } = await supabaseClient.from("Products").select("*");
    if (data) { allProducts = data; renderProducts(allProducts); }
}

function renderProducts(products) {
    const shop = document.getElementById("shop");
    if (!products || products.length === 0) {
        shop.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #999;'>Chưa có đồ loại này m ơi...</p>";
        return;
    }
    shop.innerHTML = products.map(p => `
        <div class="card" onclick="handleInteraction('${p.id}', '${p.name}', '${p.category}')">
            <img src="${p.image}">
            <h4>${p.name}</h4>
            <a href="${p.link}" target="_blank" onclick="event.stopPropagation(); handleInteraction('${p.id}', '${p.name}', '${p.category}')">Mua ngay</a>
        </div>
    `).join("");
}

// 3. INTERACTION: Thống kê Hot & Lưu sở thích
async function handleInteraction(id, name, category) {
    // Báo click về cho Dashboard xem cái nào Hot
    await supabaseClient.rpc('increment_click', { row_id: id });

    let history = JSON.parse(localStorage.getItem("viewed")) || [];
    history.push({id, name, category, time: Date.now()});
    localStorage.setItem("viewed", JSON.stringify(history.slice(-15))); 
    
    document.getElementById("welcome-msg").innerHTML = `Thích món <b>${name}</b> này rồi chứ gì? Mua đi!`;
}

function filterProducts(category, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(category === 'all' ? allProducts : allProducts.filter(p => p.category === category));
}

init();