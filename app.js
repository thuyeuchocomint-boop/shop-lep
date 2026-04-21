import { getProducts, supabase } from "./api.js";
import { renderProducts } from "./ui.js";
// Thêm đoạn này vào đầu app.js để sửa lỗi "setMood is not defined"
window.setMood = function(mood) {
    console.log("Mood hiện tại của Lép:", mood);
    document.body.className = ''; // Xóa class cũ
    document.body.classList.add(`mood-${mood}`);
    
    const chat = document.getElementById("lep-text");
    if (mood === 'happy') chat.innerText = "Đang vui nha, mua gì Lép cũng duyệt! ✨";
    if (mood === 'tired') chat.innerText = "Hơi đuối... nhưng vẫn sale cho mày 💤";
};
let allProducts = [];
window.startQuiz = () => {
    const container = document.getElementById('quiz-container');
    container.style.display = 'block';
    const q = {
        question: "Mày muốn đẹp hay muốn thơm?",
        answers: [
            { text: "Muốn đẹp!", tag: "skincare" },
            { text: "Muốn thơm!", tag: "perfume" } // Giả sử m có tag này
        ]
    };
    
    document.getElementById('quiz-question').innerText = q.question;
    const ansDiv = document.getElementById('quiz-answers');
    ansDiv.innerHTML = q.answers.map(a => 
        `<button class="btn-small" onclick="window.filter('${a.tag}')"> ${a.text}</button>`
    ).join('');
};
async function init() {
    allProducts = await getProducts();
    renderProducts(allProducts);

    const savedName = localStorage.getItem("lep_user_name");
    if (savedName) {
        const greeting = document.getElementById("user-greeting");
        if (greeting) greeting.innerText = `Chào ${savedName} nhé!`;
    }

    await loadConfig();
}
async function loadConfig() {
    const { data } = await supabase.from('configs').select('*');
    if (!data) return;

    let config = {};
    data.forEach(item => { config[item.key] = item.value; });

    if (config.primary_color) {
        const color = config.primary_color;
        document.documentElement.style.setProperty('--primary', color);
        
        // CÁCH ĐỔI NỀN THÔNG MINH:
        // Nếu m muốn màu xanh mint mặc định:
        if (!config.primary_color) {
            document.documentElement.style.setProperty('--bg', '#e0f2f1'); 
        } else {
            // Lấy màu primary pha cực loãng (10% độ đậm) để làm nền
            // Mẹo: hex + '1a' là thêm 10% alpha (độ trong suốt)
            document.documentElement.style.setProperty('--bg', color + '1a'); 
        }
    }
    // ... các đoạn load bio, avatar giữ nguyên ...


    // 2. Load các thông tin khác
    if (config.avatar_url) document.getElementById('lep').src = config.avatar_url;
    if (config.bio) document.getElementById('lep-bio').innerText = config.bio;
    if (config.facebook_link) document.getElementById('link-fb').href = config.facebook_link;
    if (config.tiktok_link) document.getElementById('link-tiktok').href = config.tiktok_link;
    if (config.email) document.getElementById('link-email').href = `mailto:${config.email}`;
    if (config.phone) document.getElementById('link-phone').href = `tel:${config.phone}`;

    // 3. Khởi chạy thời tiết sau khi đã có location
    if (config.weather_location) {
        loadWeather(config.weather_location);
    }
}

async function loadWeather(location) {
    try {
        const API_KEY = "104a914599fcdf41a1de827e9ef3a0f9";
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${API_KEY}&lang=vi`);
        const data = await res.json();
        if (!data.main) return;

        const weather = data.weather[0].main;
        const root = document.documentElement;
        const chat = document.getElementById("lep-text");

        // Cập nhật giao diện thời tiết như cũ...
        document.getElementById("lep-weather").innerText = `${Math.round(data.main.temp)}°C • ${data.weather[0].description}`;
        document.getElementById("lep-weather-icon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

        // ĐỔI MÀU BACKGROUND THEO THỜI TIẾT
        if (weather.includes("Rain")) {
            root.style.setProperty('--bg', '#e3e9f0'); // Màu xanh xám khi mưa
            root.style.setProperty('--primary', '#457b9d'); // Đổi cả nút bấm sang màu xanh mưa
            if (chat) chat.innerText = "Trời mưa rồi, ở nhà chill với Lép cho ấm nha 🌧️🐰";
        } else if (weather.includes("Clear") || weather.includes("Clouds")) {
            // Nếu trời đẹp thì dùng màu người dùng đã chọn trong admin (load lại từ biến root)
        }
    } catch (err) { console.error(err); }
}

window.filter = function (category) {
    document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
    // Nếu gọi từ HTML onclick, target sẽ là nút được nhấn
    if (event && event.target) event.target.classList.add('active');

    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderProducts(filtered);
    }
};

window.trackClick = async (productId) => {
    try {
        await supabase.from('clicks').insert([{ product_id: productId }]);
    } catch (err) { console.error(err); }
};

document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tab[data-category]');
    tabs.forEach(button => {
        button.onclick = (e) => {
            const cat = button.getAttribute('data-category');
            window.filter(cat);
        };
    });
});

init();


// DÁN CHÍNH XÁC VÀO ĐÂY NÈ:
async function debugData() {
    console.log("--- LÉP ĐANG KIỂM TRA HỆ THỐNG ---");
    try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) {
            console.error("LỖI KẾT NỐI:", error.message);
        } else {
            console.log("DỮ LIỆU TRONG BẢNG PRODUCTS:", data);
            if (data.length === 0) {
                console.warn("BẢNG TRỐNG: Mày chưa đăng sản phẩm nào hoặc RLS chưa mở đúng!");
            }
        }
        
        const container = document.getElementById("products");
        console.log("KIỂM TRA ID 'products' TRÊN WEB:", container ? "ĐÃ THẤY ✅" : "KHÔNG THẤY ❌ (LỖI Ở ĐÂY)");
    } catch (e) {
        console.error("LỖI CODE:", e);
    }
}
debugData();
// --- LOGIC AI CHAT & QUIZZ ---
window.toggleAIChat = () => {
    document.getElementById('ai-window').classList.toggle('hidden');
};

// Quiz đơn giản để lọc đồ theo sở thích
window.startProductQuiz = () => {
    const msgBox = document.getElementById('ai-messages');
    msgBox.innerHTML += `<p class="bot-msg">Mày định mua đồ để làm gì? (Chọn 1 cái thôi)</p>`;
    document.getElementById('quiz-options').innerHTML = `
        <button class="quiz-btn" onclick="finishQuiz('skincare')">Dưỡng da cho đẹp</button>
        <button class="quiz-btn" onclick="finishQuiz('decor')">Decor phòng cho chill</button>
        <button class="quiz-btn" onclick="finishQuiz('makeup')">Makeup để đi quẩy</button>
    `;
};

window.finishQuiz = (category) => {
    const msgBox = document.getElementById('ai-messages');
    msgBox.innerHTML += `<p class="user-msg">T chọn ${category}</p>`;
    msgBox.innerHTML += `<p class="bot-msg">Ok, có ngay. Đợi Lép lọc đống đồ ${category} cho mày nè!</p>`;
    
    window.filter(category); // Gọi hàm filter đã có sẵn
    setTimeout(() => toggleAIChat(), 1500); // Tự đóng chat sau khi lọc xong
};

// AI giải đáp thắc mắc (Tạm thời dùng logic nút bấm + từ khóa)
window.askLép = (type) => {
    const msgBox = document.getElementById('ai-messages');
    if(type === 'ship') {
        msgBox.innerHTML += `<p class="bot-msg">Mày đặt Shopee thì tùy shop, còn đồ in hình Lép thì 2-3 ngày nhé. Hỏi gì hỏi lắm! 🙄</p>`;
    }
};

window.handleUserChat = () => {
    const input = document.getElementById('user-ask');
    const msgBox = document.getElementById('ai-messages');
    if (!input.value) return;

    msgBox.innerHTML += `<p class="user-msg">${input.value}</p>`;
    
    // Logic AI đơn giản: Nếu không tìm thấy, gợi ý liên hệ Admin
    setTimeout(() => {
        msgBox.innerHTML += `<p class="bot-msg">Câu này khó quá, Lép chưa học tới. Mày bấm vào nút Facebook hỏi con Trang đi! 🐰</p>`;
    }, 1000);
    
    input.value = "";
};
window.setTheme = (type) => {
    const root = document.documentElement;
    if (type === 'dark') {
        root.style.setProperty('--bg', '#1a1a1a');
        root.style.setProperty('--text', '#ffffff');
        document.body.style.filter = "brightness(0.9)";
    } else if (type === 'light') {
        root.style.setProperty('--bg', '#fafaf9');
        root.style.setProperty('--text', '#2d3436');
    } else if (type === 'mint') {
        root.style.setProperty('--bg', '#e0f2f1');
        root.style.setProperty('--primary', '#558b2f');
    }
};