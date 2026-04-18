const supabaseClient = window.supabase.createClient(
  "https://ebraxafpawypwmntoglw.supabase.co",
  "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"
);

const shop = document.getElementById("shop");

// 1. Hàm khởi tạo giao diện Profile, Social và Gmail (Dán đè phần này vào initShopeeMini của m)
async function initShopeeMini() {
  const { data: settings, error } = await supabaseClient.from("Settings").select("*");
  if (error || !settings) return;

  const config = Object.fromEntries(settings.map(s => [s.key, s.value]));

  // Đổ Avatar, Bio, Status
  if (config.avatar) document.getElementById("display-avatar").src = config.avatar;
  if (config.bio) document.getElementById("display-bio").innerText = config.bio;
  if (config.status) document.getElementById("display-status").innerText = `💬 Lép nói: ${config.status}`;

  // Đổ Link mạng xã hội (Facebook, TikTok, Threads...)
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

  // Xử lý hiện Gmail dạng chữ (Không cần click)
  if (config.mail_link) {
    const mailEl = document.getElementById('display-mail');
    if (mailEl) {
      const cleanMail = config.mail_link.replace('mailto:', '');
      mailEl.innerText = `📧 Contact: ${cleanMail}`;
      mailEl.style.display = 'inline-block';
    }
  }

  // Nhận diện khách quen
  const history = JSON.parse(localStorage.getItem("viewed")) || [];
  if (history.length > 0) {
    const lastItem = history[history.length - 1].name;
    const welcomeEl = document.getElementById("welcome-msg");
    if (welcomeEl) welcomeEl.innerHTML = `Chào m quay lại! Vẫn đang tia cái <b>${lastItem}</b> à?`;
  }
}

// 2. Hàm lấy danh sách sản phẩm (M bị thiếu đoạn này)
async function loadProducts() {
  const { data, error } = await supabaseClient.from("Products").select("*");
  if (error) {
    console.error("Lỗi load sản phẩm:", error);
    return;
  }

  shop.innerHTML = data.map(p => `
    <div class="card" onclick="handleInteraction('${p.id}', '${p.name}')">
      <img src="${p.image}">
      <h4>${p.name}</h4>
      <p>${p.desc}</p>
      <a href="${p.link}" target="_blank" onclick="event.stopPropagation(); buyNow('${p.id}', '${p.name}')">Mua ngay</a>
    </div>
  `).join("");
}

// 3. Hàm xử lý khi khách xem sản phẩm (M bị thiếu đoạn này)
async function handleInteraction(id, name) {
  // Tăng lượt click trên DB để thống kê cho m
  await supabaseClient.rpc('increment_click', { row_id: id });

  // Lưu lịch sử xem vào máy khách để làm lời chào cá nhân hoá
  let history = JSON.parse(localStorage.getItem("viewed")) || [];
  history.push({id, name, time: Date.now()});
  localStorage.setItem("viewed", JSON.stringify(history.slice(-10)));
  
  const welcomeMsg = document.getElementById("welcome-msg");
  if(welcomeMsg) welcomeMsg.innerHTML = `Vừa xem <b>${name}</b> xong đúng không? Mua đi!`;
}

// 4. Hàm xử lý khi bấm nút "Mua ngay"
function buyNow(id, name) {
  let bought = JSON.parse(localStorage.getItem("bought")) || [];
  bought.push({id, name, time: Date.now()});
  localStorage.setItem("bought", JSON.stringify(bought));
}

// --- GỌI HÀM ĐỂ WEB CHẠY ---
initShopeeMini();
loadProducts();