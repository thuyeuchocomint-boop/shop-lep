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

  // Đổ Profile & Social (Dữ liệu từ Dashboard của mày)
  if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
  if (config.bio) document.getElementById("display-bio").innerText = config.bio;
  if (config.status) document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;
  
  ['fb', 'ig', 'threads', 'tiktok', 'yt'].forEach(p => {
    const link = config[p + '_link'];
    const el = document.getElementById('link-' + p);
    if (el) { el.href = link || '#'; el.style.display = link ? 'inline-block' : 'none'; }
  });

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

  // 1. Nếu là khách mới tinh
  if (visitCount === 1 && history.length === 0) {
      welcomeEl.innerHTML = "Chào m! Lần đầu ghé tiệm Lép à? Xem đồ đi, ok lắm ^.^";
      return;
  }

  // 2. Tìm danh mục khách thích nhất (xuất hiện nhiều nhất trong history)
  const categories = history.map(h => h.category).filter(Boolean);
  let favoriteCat = "";
  if (categories.length > 0) {
      favoriteCat = categories.reduce((a, b, i, arr) => 
          (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b)
      );
  }

  // 3. Lấy món đồ cuối cùng khách vừa xem
  const lastItem = history.length > 0 ? history[history.length - 1].name : null;

  // --- TRẢ KẾT QUẢ DỰA TRÊN ĐỘ "THÂN THIẾT" ---
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

// Hàm ghi lại hành vi khách (Tăng Click Hot & Nhớ sở thích)
async function handleInteraction(id, name, category) {
    // Gửi báo cáo click về Dashboard để biết cái nào HOT
    await supabaseClient.rpc('increment_click', { row_id: id });

    let history = JSON.parse(localStorage.getItem("viewed")) || [];
    history.push({id, name, category, time: Date.now()});
    localStorage.setItem("viewed", JSON.stringify(history.slice(-15))); // Nhớ 15 lần gần nhất
    
    // Phản hồi tức thì khi khách bấm vào đồ
    document.getElementById("welcome-msg").innerHTML = `Thích món <b>${name}</b> này rồi chứ gì? Mua đi!`;
}

// Các hàm khác giữ nguyên...
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

function filterProducts(category, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(category === 'all' ? allProducts : allProducts.filter(p => p.category === category));
}

init();