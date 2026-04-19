const supabaseClient = window.supabase.createClient(
  "https://ebraxafpawypwmntoglw.supabase.co",
  "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"
);

let allProducts = [];

async function init() {
    await initShopeeMini(); 
    await loadProducts();   
}

async function initShopeeMini() {
  const { data: settings, error } = await supabaseClient.from("Settings").select("*");
  if (error || !settings) return;

  const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

  if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
  if (config.bio) document.getElementById("display-bio").innerText = config.bio;
  if (config.status) document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;

  // Đổ Social Links (Giữ nguyên logic của m)
  ['fb', 'ig', 'threads', 'tiktok', 'yt'].forEach(p => {
    const link = config[p + '_link'];
    const el = document.getElementById('link-' + p);
    if (el) { el.href = link || '#'; el.style.display = link ? 'inline-block' : 'none'; }
  });

  // --- LOGIC PHÂN LOẠI KHÁCH HÀNG ---
  const welcomeEl = document.getElementById("welcome-msg");
  const history = JSON.parse(localStorage.getItem("viewed")) || [];
  const visitCount = parseInt(localStorage.getItem("visit_count") || "0");
  
  // Tăng số lần vào web
  localStorage.setItem("visit_count", visitCount + 1);

  if (visitCount === 0 && history.length === 0) {
    // 1. Khách mới tinh
    welcomeEl.innerHTML = "Chào m! Lần đầu ghé tiệm Lép à? Xem đồ đi, ok lắm ^.^";
  } else {
    // 2. Khách cũ - Tìm sở thích (Danh mục xem nhiều nhất)
    const categories = history.map(h => h.category).filter(Boolean);
    let favoriteCat = "";
    if (categories.length > 0) {
      favoriteCat = categories.reduce((a, b, i, arr) => 
        (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b)
      );
    }

    if (favoriteCat) {
      welcomeEl.innerHTML = `Quay lại rồi à? Nhìn m là biết vẫn đang mê mấy món <b>${favoriteCat}</b> rồi!`;
    } else if (history.length > 0) {
      const lastItem = history[history.length - 1].name;
      welcomeEl.innerHTML = `Vẫn đang tia cái <b>${lastItem}</b> à? Mua lẹ đi !^^`;
    } else {
      welcomeEl.innerHTML = "Lại là m à? Lần này định vào ngó gì nào?";
    }
  }
}

async function loadProducts() {
    const { data, error } = await supabaseClient.from("Products").select("*");
    if (error) return;
    allProducts = data;
    renderProducts(allProducts);
}

function renderProducts(products) {
    const shop = document.getElementById("shop");
    if (products.length === 0) {
        shop.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #999; padding: 20px;'>Lép chưa có đồ loại này m ơi...</p>";
        return;
    }
    shop.innerHTML = products.map(p => `
        <div class="card" onclick="handleInteraction('${p.id}', '${p.name}', '${p.category}')">
            <img src="${p.image}">
            <h4>${p.name}</h4>
            <p>${p.desc}</p>
            <a href="${p.link}" target="_blank" onclick="event.stopPropagation(); buyNow('${p.id}', '${p.name}')">Mua ngay</a>
        </div>
    `).join("");
}

function filterProducts(category, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(category === 'all' ? allProducts : allProducts.filter(p => p.category === category));
}

async function handleInteraction(id, name, category) {
    await supabaseClient.rpc('increment_click', { row_id: id });

    let history = JSON.parse(localStorage.getItem("viewed")) || [];
    // Lưu cả category để sau này đoán sở thích
    history.push({id, name, category, time: Date.now()});
    localStorage.setItem("viewed", JSON.stringify(history.slice(-15))); // Lưu 15 món gần nhất
    
    const welcomeMsg = document.getElementById("welcome-msg");
    if(welcomeMsg) welcomeMsg.innerHTML = `Thích món <b>${name}</b> này rồi chứ gì? Mua đi!`;
}

function buyNow(id, name) {
    let bought = JSON.parse(localStorage.getItem("bought")) || [];
    bought.push({id, name, time: Date.now()});
    localStorage.setItem("bought", JSON.stringify(bought));
}

init();