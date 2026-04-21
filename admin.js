import { supabase } from "./api.js";

// --- 1. QUẢN LÝ ĐĂNG NHẬP (LOGIN/LOGOUT) ---
window.loginAdmin = async () => {
    const email = document.getElementById('login-email').value; 
    const password = document.getElementById('admin-pass').value;

    if (!email || !password) {
        alert("Nhập đủ mail với pass đi má! 🐰");
        return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        alert("Sai pass hoặc mail rồi má! 🐰: " + error.message);
    } else {
        alert("Chào mừng đại ca quay trở lại! 😎");
        location.reload(); 
    }
};

window.logout = async () => {
    await supabase.auth.signOut();
    location.reload();
};

// --- 2. QUẢN LÝ CẤU HÌNH (BIO, AVATAR, MÀU...) ---
window.saveConfig = async () => {
    const msg = document.getElementById('config-msg');
    const avatarFile = document.getElementById('avatar-file').files[0];
    
    msg.innerText = "Đang lưu... đợi Lép tí! 🐰";
    msg.style.color = "blue";

    try {
        let avatarUrl = "";
        // Lấy lại URL cũ phòng trường hợp không thay ảnh
        const { data: current } = await supabase.from('configs').select('value').eq('key', 'avatar_url').single();
        if (current) avatarUrl = current.value;

        if (avatarFile) {
            const fileName = `avatar-${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, avatarFile);
            if (uploadError) throw uploadError;
            const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
            avatarUrl = urlData.publicUrl;
        }

        const configData = [
            { key: 'bio', value: document.getElementById('bio').value },
            { key: 'avatar_url', value: avatarUrl },
            { key: 'facebook_link', value: document.getElementById('facebook').value },
            { key: 'tiktok_link', value: document.getElementById('tiktok').value },
            { key: 'email', value: document.getElementById('email-contact').value },
            { key: 'phone', value: document.getElementById('phone').value },
            { key: 'primary_color', value: document.getElementById('primary_color').value },
            { key: 'weather_location', value: document.getElementById('weather').value }
        ];

        const { error } = await supabase.from('configs').upsert(configData, { onConflict: 'key' });
        if (error) throw error;

        msg.innerText = "LƯU THÀNH CÔNG! ✨";
        msg.style.color = "#558b2f";
        alert("Lép đã nhớ hết rồi nhé!");
    } catch (err) {
        msg.innerText = "LỖI: " + err.message;
        msg.style.color = "red";
    }
};

// --- 3. QUẢN LÝ ĐĂNG SẢN PHẨM ---
window.uploadToSupabase = async () => {
    const name = document.getElementById('p-name').value;
    const price = document.getElementById('p-price').value;
    const link = document.getElementById('p-link').value;
    const category = document.getElementById('p-category').value;
    const file = document.getElementById('p-file').files[0];
    const statusMsg = document.getElementById('status-msg');

    if (!name || !link || !file) {
        alert("Điền tên, link với chọn ảnh sản phẩm đi má! 🐰");
        return;
    }

    statusMsg.innerText = "Đang đẩy hàng lên... 🚀";

    try {
        const fileName = `prod-${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(fileName);
        const imageUrl = urlData.publicUrl;

        const { error: insertError } = await supabase.from('products').insert([{ 
            name, price, link, category, image_url: imageUrl 
        }]);

        if (insertError) throw insertError;

        statusMsg.innerText = "ĐĂNG XONG RỒI! ✨";
        alert("Sản phẩm mới đã lên kệ!");
        location.reload(); 
    } catch (err) {
        statusMsg.innerText = "LỖI: " + err.message;
    }
};

// --- 4. KIỂM TRA TRẠNG THÁI KHI LOAD TRANG ---
async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession();
    const authDiv = document.getElementById('admin-auth');
    const contentDiv = document.getElementById('admin-content');

    if (session) {
        if(authDiv) authDiv.style.display = 'none';
        if(contentDiv) contentDiv.style.display = 'block';
        loadCurrentConfig();
    } else {
        if(authDiv) authDiv.style.display = 'flex';
        if(contentDiv) contentDiv.style.display = 'none';
    }
}

async function loadCurrentConfig() {
    const { data } = await supabase.from('configs').select('*');
    if (!data) return;

    data.forEach(item => {
        const idMap = {
            'avatar_url': 'avatar', 
            'facebook_link': 'facebook',
            'tiktok_link': 'tiktok',
            'email': 'email-contact',
            'weather_location': 'weather'
        };
        const inputId = idMap[item.key] || item.key;
        const input = document.getElementById(inputId);
        if (input) input.value = item.value;
    });
}

checkUser();