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

  // Đổ dữ liệu cơ bản
  if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
  if (config.bio) document.getElementById("display-bio").innerText = config.bio;
  if (config.status) document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;

  // Hiện thông báo/Tin mới
  if (config.announcement) {
    const announceEl = document.getElementById("announcement-bar");
    announceEl.innerText = config.announcement;
    announceEl.style.display = "block";
  }

  // Hiện Gmail
  if (config.email) {
    const mailEl = document.getElementById("display-mail");
    mailEl.innerHTML = `<a href="mailto:${config.email}" class="mail-link">📩 ${config.email}</a>`;
    mailEl.style.display = "inline-block";
  }

  // Đổ Social Links
  ['fb', 'ig', 'threads', 'tiktok', 'yt'].forEach(p => {
    const link = config[p + '_link'];
    const el = document.getElementById('link-' + p);
    if (el) { 
      el.href = link || '#'; 
      el.style.display = link ? 'inline-block' : 'none'; 
    }
  });

  // Logic chào mừng khách (Giữ nguyên của m)
  const welcomeEl = document.getElementById("welcome-msg");
  const history = JSON.parse(localStorage.getItem("viewed")) || [];
  const visitCount = parseInt(localStorage.getItem("visit_count") || "0");
  localStorage.setItem("visit_count", visitCount + 1);

  if (visitCount === 0 && history.length === 0) {
    welcomeEl.innerHTML = "Chào m! Lần đầu ghé tiệm Lép à? Xem đồ đi, ok lắm ^.^";
  } else {
    const categories = history.map(h => h.category).filter(Boolean);
    let favoriteCat = categories.length > 0 ? categories.reduce((a, b, i, arr) => 
        (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b)) : "";

    if (favoriteCat) {
      welcomeEl.innerHTML = `Quay lại rồi à? Nhìn m là biết vẫn đang mê mấy món <b>${favoriteCat}</b> rồi!`;
    } else if (history.length > 0) {
      welcomeEl.innerHTML = `Vẫn đang tia cái <b>${history[history.length - 1].name}</b> à? Mua lẹ đi !^^`;
    } else {
      welcomeEl.innerHTML = "Lại là m à? Lần này định vào ngó gì nào?";
    }
  }
}

// Các hàm loadProducts, renderProducts, filterProducts... giữ nguyên như cũ
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
    history.push({id, name, category, time: Date.now()});
    localStorage.setItem("viewed", JSON.stringify(history.slice(-15)));
    const welcomeMsg = document.getElementById("welcome-msg");
    if(welcomeMsg) welcomeMsg.innerHTML = `Thích món <b>${name}</b> này rồi chứ gì? Mua đi!`;
}

function buyNow(id, name) {
    let bought = JSON.parse(localStorage.getItem("bought")) || [];
    bought.push({id, name, time: Date.now()});
    localStorage.setItem("bought", JSON.stringify(bought));
}

init();