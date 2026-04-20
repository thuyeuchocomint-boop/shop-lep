import { supabase } from "./api.js";

// 1. Hàm đăng nội dung (Mày dùng cái này thay vì vào Supabase)
window.saveContent = async () => {
    const contentData = {
        type: document.getElementById('post-type').value,
        title: document.getElementById('post-title').value,
        body: document.getElementById('post-body').value,
        image_url: document.getElementById('post-image').value,
        link: document.getElementById('post-link').value
    };

    const { error } = await supabase.from('content').insert([contentData]);
    if (!error) {
        alert("Đã đăng thành công! Ra trang chủ check đi mày.");
        location.reload();
    } else {
        alert("Lỗi rồi: " + error.message);
    }
};

// 2. Hàm thay đổi Avatar/Cấu hình
window.saveSettings = async () => {
    const avatarUrl = document.getElementById('set-avatar').value;
    const { error } = await supabase.from('settings').upsert({ key: 'lep_avatar', value: avatarUrl });
    if (!error) alert("Đã đổi diện mạo cho Lép!");
};

// 3. Load thống kê cho mày xem
async function loadDashboard() {
    const { data: events } = await supabase.from('events').select('*');
    document.getElementById('total-clicks').innerText = events.length;
    // Tự tính tiền theo logic của mày
    document.getElementById('total-money').innerText = (events.length * 500).toLocaleString() + "đ";
}

loadDashboard();