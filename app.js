import { supabase } from "./api.js";
import { renderProducts } from "./ui.js";

let allProducts = [];

async function init() {
    // 1. Lấy tất cả sản phẩm từ database
    const { data, error } = await supabase.from("products").select("*");
    if (data) allProducts = data;
    
    // Hiện tất cả sản phẩm lúc mới vào
    renderProducts(allProducts);

    // 2. Kiểm tra khách cũ
    const savedName = localStorage.getItem("lep_user_name");
    if (savedName) {
        document.getElementById("user-greeting").innerText = `Chào ${savedName} nhé!`;
    }

    // 3. Load cấu hình từ Admin (Avatar, Social...)
    loadConfig();
}

// Hàm lọc sản phẩm (Cho các nút Skincare, Decor...)
window.filter = function (category) {
    // Đổi trạng thái active cho nút
    document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    if (category === 'all') {
        renderProducts(allProducts);
    } else {
        const filtered = allProducts.filter(p => p.category === category);
        renderProducts(filtered);
    }
};

// Hàm đổi tâm trạng (Xoa dịu khách)
window.setMood = function (mood) {
    document.body.className = `mood-${mood}`;
    const chat = document.getElementById("lep-text");
    
    if (mood === 'tired') {
        chat.innerText = "Mệt à? Để t chỉnh màu dịu lại cho mày đỡ mỏi mắt nhé... 🌿";
    } else {
        chat.innerText = "Vui vẻ thì shopping thôi, đợi gì nữa! 🐰";
    }
    
    // Lưu thói quen tâm trạng của khách để lần sau "hỏi thăm"
    localStorage.setItem("user_last_mood", mood);
};

async function loadConfig() {
    const { data: settings } = await supabase.from('settings').select('*');
    if (settings) {
        const avatar = settings.find(s => s.key === 'lep_avatar')?.value;
        if (avatar) document.getElementById('lep').src = avatar;
    }
}
// Tự động gán sự kiện cho các nút lọc
document.querySelectorAll('.tab[data-category]').forEach(button => {
    button.addEventListener('click', () => {
        const cat = button.getAttribute('data-category');
        filter(cat); 
    });
});

init();