const supabaseClient = window.supabase.createClient(
  "https://ebraxafpawypwmntoglw.supabase.co",
  "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"
);

let allProducts = [];

async function init() {
    await loadSettings(); // Load link mạng xã hội và profile
    await loadProducts(); // Load sản phẩm
}

// 1. Hàm load Link mạng xã hội và Profile
async function loadSettings() {
  const { data: settings, error } = await supabaseClient.from("Settings").select("*");
  if (error || !settings) return;

  // Chuyển mảng thành đối tượng để dễ gọi
  const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

  if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
  if (config.bio) document.getElementById("display-bio").innerText = config.bio;
  if (config.status) document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;

  // Đổ link vào các nút Facebook, TikTok...
  const platforms = ['fb', 'ig', 'threads', 'tiktok', 'yt'];
  platforms.forEach(p => {
    const link = config[p + '_link']; // Tìm key ví dụ: fb_link
    const el = document.getElementById('link-' + p);
    if (el && link) {
      el.href = link;
      el.style.display = "inline-block";
    } else if (el) {
      el.style.display = "none"; // Nếu không có link thì ẩn nút đó đi
    }
  });

  // Gmail
  if (config.email) {
    const mailEl = document.getElementById("display-mail");
    mailEl.innerHTML = `<a href="mailto:${config.email}" class="mail-link">📩 ${config.email}</a>`;
    mailEl.style.display = "block";
  }
}

// 2. Hàm load Sản phẩm
async function loadProducts() {
    const { data, error } = await supabaseClient.from("Products").select("*");
    if (error) {
        console.error("Lỗi load đồ:", error);
        return;
    }
    allProducts = data;
    renderProducts(allProducts); // Mặc định hiện tất cả
}

function renderProducts(products) {
    const shop = document.getElementById("shop");
    if (!products || products.length === 0) {
        shop.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #999;'>Lép chưa có đồ loại này m ơi...</p>";
        return;
    }
    shop.innerHTML = products.map(p => `
        <div class="card">
            <img src="${p.image}">
            <h4>${p.name}</h4>
            <p style="font-size: 12px; color: #999; margin-bottom: 8px;">${p.desc || ''}</p>
            <a href="${p.link}" target="_blank">Mua ngay</a>
        </div>
    `).join("");
}

// 3. Hàm lọc sản phẩm khi bấm nút
function filterProducts(category, btn) {
    // Đổi màu nút đang chọn
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderProducts(filtered);
    }
}

init();