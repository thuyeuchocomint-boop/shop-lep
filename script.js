const supabaseClient = window.supabase.createClient(
  "https://ebraxafpawypwmntoglw.supabase.co",
  "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"
);

let allProducts = [];

async function init() {
    await loadSettings(); 
    await loadProducts();   
}

async function loadSettings() {
  const { data: settings } = await supabaseClient.from("Settings").select("*");
  if (!settings) return;
  const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

  // Đổ Profile (Avatar, Bio, Status)
  if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
  if (config.bio) document.getElementById("display-bio").innerText = config.bio;
  if (config.status) document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;

  // Đổ Social Links (Tự động cập nhật từ Dashboard)
  ['fb', 'ig', 'threads', 'tiktok', 'yt'].forEach(p => {
    const link = config[p + '_link'];
    const el = document.getElementById('link-' + p);
    if (el) { el.href = link || '#'; el.style.display = link ? 'inline-block' : 'none'; }
  });

  // Hiện Gmail & Tin mới
  if (config.email) {
    const mailEl = document.getElementById("display-mail");
    mailEl.innerHTML = `<a href="mailto:${config.email}" class="mail-link">📩 ${config.email}</a>`;
    mailEl.style.display = "block";
  }
  if (config.announcement) {
    const annEl = document.getElementById("announcement-bar");
    if(annEl) { annEl.innerText = config.announcement; annEl.style.display = "block"; }
  }

  // --- LOGIC ĐOÁN Ý KHÁCH ---
  const welcomeEl = document.getElementById("welcome-msg");
  const history = JSON.parse(localStorage.getItem("viewed")) || [];
  const visitCount = parseInt(localStorage.getItem("visit_count") || "0");
  localStorage.setItem("visit_count", visitCount + 1);

  if (visitCount > 0 && history.length > 0) {
    const categories = history.map(h => h.category).filter(Boolean);
    const fav = categories.length > 0 ? categories.reduce((a, b, i, arr) => 
      (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b)) : "";
    welcomeEl.innerHTML = fav ? `Vẫn đang mê mấy món <b>${fav}</b> à?` : "Lại là m à? Ngó gì nào?";
  } else {
    welcomeEl.innerHTML = "Chào m! Xem đồ đi, ok lắm ^.^";
  }
}

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
            <a href="${p.link}" target="_blank" onclick="event.stopPropagation()">Mua ngay</a>
        </div>
    `).join("");
}

async function handleInteraction(id, name, category) {
    // BÁO CLICK VỀ DASHBOARD
    await supabaseClient.rpc('increment_click', { row_id: id });

    let history = JSON.parse(localStorage.getItem("viewed")) || [];
    history.push({id, name, category, time: Date.now()});
    localStorage.setItem("viewed", JSON.stringify(history.slice(-15)));
    
    document.getElementById("welcome-msg").innerHTML = `Thích món <b>${name}</b> này rồi chứ gì?`;
}

function filterProducts(category, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(category === 'all' ? allProducts : allProducts.filter(p => p.category === category));
}

init();