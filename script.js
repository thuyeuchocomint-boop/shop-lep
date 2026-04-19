const supabaseClient = window.supabase.createClient(
  "https://ebraxafpawypwmntoglw.supabase.co",
  "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"
);

let allProducts = [];

async function init() {
    // Tách riêng 2 hàm này để lỗi cái này không ảnh hưởng cái kia
    await loadSettings(); 
    await loadProducts();   
}

async function loadSettings() {
  try {
    const { data: settings, error } = await supabaseClient.from("Settings").select("*");
    if (error || !settings) return;

    const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

    // Đổ Profile & Link Social
    if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
    if (config.bio) document.getElementById("display-bio").innerText = config.bio;
    if (config.status) document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;
    
    if (config.email) {
      const mailEl = document.getElementById("display-mail");
      mailEl.innerHTML = `<a href="mailto:${config.email}" class="mail-link">📩 ${config.email}</a>`;
      mailEl.style.display = "block";
    }

    ['fb', 'ig', 'threads', 'tiktok', 'yt'].forEach(p => {
      const link = config[p + '_link'];
      const el = document.getElementById('link-' + p);
      if (el) { 
        el.href = link || '#'; 
        el.style.display = link ? 'inline-block' : 'none'; 
      }
    });

    // Hiện Tin mới
    if (config.announcement) {
      const announceEl = document.getElementById("announcement-bar");
      if (announceEl) {
        announceEl.innerText = config.announcement;
        announceEl.style.display = "block";
      }
    }
  } catch (e) {
    console.log("Lỗi Settings nhưng vẫn sẽ load sản phẩm:", e);
  }
}

async function loadProducts() {
    const { data, error } = await supabaseClient.from("Products").select("*");
    if (error) {
        console.error("Lỗi Supabase:", error);
        return;
    }
    allProducts = data;
    renderProducts(allProducts); // Hiện tất cả khi vừa vào web
}

function renderProducts(products) {
    const shop = document.getElementById("shop");
    if (!products || products.length === 0) {
        shop.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #999; padding: 20px;'>Lép chưa có đồ loại này m ơi...</p>";
        return;
    }
    shop.innerHTML = products.map(p => `
        <div class="card">
            <img src="${p.image}">
            <h4>${p.name}</h4>
            <p style="font-size: 0.75rem; color: #7f8c8d;">${p.desc || ''}</p>
            <a href="${p.link}" target="_blank">Mua ngay</a>
        </div>
    `).join("");
}

function filterProducts(category, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProducts(category === 'all' ? allProducts : allProducts.filter(p => p.category === category));
}

init();