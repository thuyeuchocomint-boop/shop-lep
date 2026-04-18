const supabaseClient = window.supabase.createClient(
  "https://ebraxafpawypwmntoglw.supabase.co",
  "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"
);

let allProducts = [];

// 1. Hàm khởi tạo chính
async function init() {
    await initShopeeMini(); // Load thông tin cá nhân Lép
    await loadProducts();   // Load danh sách sản phẩm
}

// 2. Hàm Load Profile, Social và Gmail
async function initShopeeMini() {
  const { data: settings, error } = await supabaseClient.from("Settings").select("*");
  if (error || !settings) return;

  const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

  // Đổ Avatar, Bio, Status
  if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
  if (config.bio) document.getElementById("display-bio").innerText = config.bio;
  if (config.status) document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;

  // Đổ Link mạng xã hội
  const platforms = ['fb', 'ig', 'threads', 'tiktok', 'yt'];
  platforms.forEach(p => {
    const link = config[p + '_link'];
    const el = document.getElementById('link-' + p);
    if (el) {
      if (link) {
        el.href = link;
        el.style.display = 'inline-block';
      } else {
        el.style.display = 'none';
      }
    }
  });

  // Hiển thị Gmail dạng chữ
  if (config.mail_link) {
    const mailEl = document.getElementById('display-mail');
    if (mailEl) {
      const cleanMail = config.mail_link.replace('mailto:', '');
      mailEl.innerText = `📧 Contact: ${cleanMail}`;
      mailEl.style.display = 'inline-block';
    }
  }

  // Nhận diện khách quen từ localStorage
  const history = JSON.parse(localStorage.getItem("viewed")) || [];
  if (history.length > 0) {
    const lastItem = history[history.length - 1].name;
    const welcomeEl = document.getElementById("welcome-msg");
    if (welcomeEl) welcomeEl.innerHTML = `Chào m quay lại! Vẫn đang tia cái <b>${lastItem}</b> à?`;
  }
}

// 3. Hàm lấy danh sách sản phẩm từ Supabase
async function loadProducts() {
    const { data, error } = await supabaseClient.from("Products").select("*");
    if (error) return;
    allProducts = data;
    renderProducts(allProducts);
}

// 4. Hàm hiển thị sản phẩm ra HTML
function renderProducts(products) {
    const shop = document.getElementById("shop");
    if (products.length === 0) {
        shop.innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: #999; padding: 20px;'>Lép chưa có đồ loại này m ơi...</p>";
        return;
    }
    shop.innerHTML = products.map(p => `
        <div class="card" onclick="handleInteraction('${p.id}', '${p.name}')">
            <img src="${p.image}">
            <h4>${p.name}</h4>
            <p>${p.desc}</p>
            <a href="${p.link}" target="_blank" onclick="event.stopPropagation(); buyNow('${p.id}', '${p.name}')">Mua ngay</a>
        </div>
    `).join("");
}

// 5. Hàm lọc sản phẩm theo danh mục
function filterProducts(category, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderProducts(filtered);
    }
}

// 6. Hàm xử lý khi khách click xem sản phẩm
async function handleInteraction(id, name) {
    // Tăng lượt click trên DB (RPC)
    await supabaseClient.rpc('increment_click', { row_id: id });

    // Lưu vào lịch sử máy khách
    let history = JSON.parse(localStorage.getItem("viewed")) || [];
    history.push({id, name, time: Date.now()});
    localStorage.setItem("viewed", JSON.stringify(history.slice(-10)));
    
    const welcomeMsg = document.getElementById("welcome-msg");
    if(welcomeMsg) welcomeMsg.innerHTML = `Vừa xem <b>${name}</b> xong đúng không? Mua đi!`;
}

// 7. Hàm khi bấm nút Mua ngay
function buyNow(id, name) {
    let bought = JSON.parse(localStorage.getItem("bought")) || [];
    bought.push({id, name, time: Date.now()});
    localStorage.setItem("bought", JSON.stringify(bought));
}

// CHẠY HÀM KHỞI TẠO
init();