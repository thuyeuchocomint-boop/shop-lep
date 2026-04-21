import { supabase } from "./api.js";




let socialLinksState = [];

function drawSocialLinksRows() {
    const list = document.getElementById("social-links-list");
    if (!list) return;

    list.innerHTML = socialLinksState.map((item, index) => `
        <div class="social-row">
            <input
                type="text"
                placeholder="Tên Social (vd: TikTok)"
                value="${(item.name || "").replace(/"/g, "&quot;")}"
                onchange="updateSocialLinkField(${index}, 'name', this.value)"
            />
            <input
                type="url"
                placeholder="Link URL"
                value="${(item.url || "").replace(/"/g, "&quot;")}"
                onchange="updateSocialLinkField(${index}, 'url', this.value)"
            />
            <button type="button" class="btn btn-danger" onclick="removeSocialLinkRow(${index})">Xóa</button>
        </div>
    `).join("");
}

window.addSocialLinkRow = () => {
    socialLinksState.push({ name: "", url: "" });
    drawSocialLinksRows();
};

window.removeSocialLinkRow = (index) => {
    socialLinksState = socialLinksState.filter((_, i) => i !== index);
    drawSocialLinksRows();
};

window.updateSocialLinkField = (index, field, value) => {
    if (!socialLinksState[index]) return;
    socialLinksState[index][field] = value;
};

window.saveSocialLinks = async () => {
    const msg = document.getElementById("social-links-msg");
    if (!msg) return;

    const cleaned = socialLinksState
        .map((item) => ({
            name: (item.name || "").trim(),
            url: (item.url || "").trim()
        }))
        .filter((item) => item.name && item.url);

    msg.innerText = "Đang lưu social links...";
    msg.style.color = "blue";

    try {
        const payload = [{ key: "social_links", value: JSON.stringify(cleaned) }];
        const { error } = await supabase.from("configs").upsert(payload, { onConflict: "key" });
        if (error) throw error;
        msg.innerText = "Lưu social links thành công!";
        msg.style.color = "#558b2f";
    } catch (err) {
        msg.innerText = "LỖI: " + err.message;
        msg.style.color = "red";
    }
};

window.saveStatusUpdate = async () => {
    const msg = document.getElementById("status-msg-admin");
    const statusInput = document.getElementById("status-text");
    if (!msg || !statusInput) return;

    const statusText = (statusInput.value || "").trim();
    if (!statusText) {
        msg.innerText = "Nhập nội dung status trước khi đăng.";
        msg.style.color = "#a35f2a";
        return;
    }
    msg.innerText = "Đang đăng status...";
    msg.style.color = "blue";

    try {
        const { data: currentRows } = await supabase
            .from("configs")
            .select("key, value")
            .in("key", ["status_history"]);

        let history = [];
        const historyRaw = (currentRows || []).find((item) => item.key === "status_history");
        if (historyRaw && historyRaw.value) {
            try {
                const parsed = JSON.parse(historyRaw.value);
                if (Array.isArray(parsed)) history = parsed;
            } catch (err) {
                history = [];
            }
        }

        const nowIso = new Date().toISOString();
        const nextHistory = [{ text: statusText, created_at: nowIso }, ...history]
            .filter((item) => item && item.text)
            .slice(0, 5);

        const payload = [
            { key: "status_text", value: statusText },
            { key: "status_updated_at", value: nowIso },
            { key: "status_history", value: JSON.stringify(nextHistory) }
        ];
        const { error } = await supabase.from("configs").upsert(payload, { onConflict: "key" });
        if (error) throw error;
        msg.innerText = "Đăng trạng thái thành công!";
        msg.style.color = "#558b2f";
    } catch (err) {
        msg.innerText = "LỖI: " + err.message;
        msg.style.color = "red";
    }
};

window.previewAppearanceImage = (input, imgId, placeholderId) => {
    const previewImg = document.getElementById(imgId);
    const placeholder = document.getElementById(placeholderId);
    if (!previewImg || !placeholder) return;

    const file = input && input.files ? input.files[0] : null;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        previewImg.src = e.target.result;
        previewImg.style.display = "block";
        placeholder.style.display = "none";
    };
    reader.readAsDataURL(file);
};

async function uploadAppearanceImage(file, prefix) {
    const fileExt = (file.name && file.name.includes(".")) ? file.name.split(".").pop() : "jpg";
    const fileName = `${prefix}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
    if (uploadError) throw uploadError;
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(fileName);
    return urlData.publicUrl;
}

async function saveAppearanceUrlsToDb(payload) {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData && authData.user ? authData.user.id : null;
    let lastError = null;

    if (userId) {
        const profilePayload = { id: userId, updated_at: new Date().toISOString() };
        if (payload.avatar_url) profilePayload.avatar_url = payload.avatar_url;
        if (payload.cover_url) profilePayload.cover_url = payload.cover_url;
        const { error: profileError } = await supabase.from("profiles").upsert([profilePayload], { onConflict: "id" });
        if (!profileError) return "profiles";
        lastError = profileError;
    }

    const settingsPayload = [];
    if (payload.avatar_url) settingsPayload.push({ key: "avatar_url", value: payload.avatar_url });
    if (payload.cover_url) settingsPayload.push({ key: "cover_url", value: payload.cover_url });
    if (payload.animation_url) settingsPayload.push({ key: "animation_url", value: payload.animation_url });
    if (settingsPayload.length > 0) {
        const { error: settingsError } = await supabase.from("settings").upsert(settingsPayload, { onConflict: "key" });
        if (!settingsError) return "settings";
        lastError = settingsError;
    }

    const configsPayload = [];
    if (payload.avatar_url) configsPayload.push({ key: "avatar_url", value: payload.avatar_url });
    if (payload.cover_url) configsPayload.push({ key: "cover_url", value: payload.cover_url });
    if (payload.animation_url) configsPayload.push({ key: "animation_url", value: payload.animation_url });
    if (configsPayload.length > 0) {
        const { error: configsError } = await supabase.from("configs").upsert(configsPayload, { onConflict: "key" });
        if (!configsError) return "configs";
        lastError = configsError;
    }

    throw lastError || new Error("Không thể lưu ảnh vào database.");
}

window.saveAppearanceSettings = async () => {
    const msg = document.getElementById("appearance-msg");
    const coverFile = document.getElementById("cover-file").files[0];
    const avatarFile = document.getElementById("appearance-avatar-file").files[0];
    const animationFile = document.getElementById("animation-file").files[0];

    if (!msg) return;
    if (!coverFile && !avatarFile && !animationFile) {
        msg.innerText = "Chưa chọn file nào để lưu.";
        msg.style.color = "#a35f2a";
        return;
    }

    msg.innerText = "Đang tải lên...";
    msg.style.color = "blue";

    try {
        const appearancePayload = {};

        if (coverFile) {
            const coverUrl = await uploadAppearanceImage(coverFile, "cover");
            appearancePayload.cover_url = coverUrl;
        }

        if (avatarFile) {
            const avatarUrl = await uploadAppearanceImage(avatarFile, "avatar");
            appearancePayload.avatar_url = avatarUrl;
        }

        if (animationFile) {
            const animationUrl = await uploadAppearanceImage(animationFile, "lep-animation");
            appearancePayload.animation_url = animationUrl;
        }

        await saveAppearanceUrlsToDb(appearancePayload);
        msg.innerText = "Thành công";
        msg.style.color = "#558b2f";
    } catch (err) {
        msg.innerText = "LỖI: " + err.message;
        msg.style.color = "red";
    }
};

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
    const { data: configRows } = await supabase.from("configs").select("*");
    const data = configRows || [];

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

    const statusItem = data.find((item) => item.key === "status_text");
    const statusInput = document.getElementById("status-text");
    if (statusInput && statusItem) statusInput.value = statusItem.value || "";

    const socialLinksItem = data.find((item) => item.key === "social_links");
    if (socialLinksItem && socialLinksItem.value) {
        try {
            const parsed = JSON.parse(socialLinksItem.value);
            socialLinksState = Array.isArray(parsed) ? parsed : [];
        } catch (err) {
            socialLinksState = [];
        }
    } else {
        socialLinksState = [];
    }
    if (socialLinksState.length === 0) {
        socialLinksState.push({ name: "", url: "" });
    }
    drawSocialLinksRows();

    let coverUrl = "";
    let avatarUrl = "";

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData && authData.user ? authData.user.id : null;
    if (userId) {
        const { data: profileRow } = await supabase
            .from("profiles")
            .select("cover_url, avatar_url")
            .eq("id", userId)
            .maybeSingle();
        if (profileRow) {
            coverUrl = profileRow.cover_url || "";
            avatarUrl = profileRow.avatar_url || "";
        }
    }

    if (!coverUrl || !avatarUrl) {
        const { data: settingsRows } = await supabase
            .from("settings")
            .select("key, value")
            .in("key", ["cover_url", "avatar_url"]);
        if (settingsRows && settingsRows.length > 0) {
            const map = {};
            settingsRows.forEach((item) => {
                map[item.key] = item.value;
            });
            coverUrl = coverUrl || map.cover_url || "";
            avatarUrl = avatarUrl || map.avatar_url || "";
        }
    }

    if (!coverUrl) {
        const coverItem = data.find(item => item.key === "cover_url");
        if (coverItem && coverItem.value) coverUrl = coverItem.value;
    }
    if (!avatarUrl) {
        const avatarItem = data.find(item => item.key === "avatar_url");
        if (avatarItem && avatarItem.value) avatarUrl = avatarItem.value;
    }

    if (coverUrl) {
        const coverPreview = document.getElementById("cover-preview-img");
        const coverPlaceholder = document.getElementById("cover-preview-placeholder");
        if (coverPreview && coverPlaceholder) {
            coverPreview.src = coverUrl;
            coverPreview.style.display = "block";
            coverPlaceholder.style.display = "none";
        }
    }

    if (avatarUrl) {
        const avatarPreview = document.getElementById("avatar-preview-img");
        const avatarPlaceholder = document.getElementById("avatar-preview-placeholder");
        if (avatarPreview && avatarPlaceholder) {
            avatarPreview.src = avatarUrl;
            avatarPreview.style.display = "block";
            avatarPlaceholder.style.display = "none";
        }
    }

    let animationUrl = "";
    const animationItem = data.find(item => item.key === "animation_url");
    if (animationItem && animationItem.value) {
        animationUrl = animationItem.value;
    }
    if (!animationUrl) {
        const { data: settingsAnimation } = await supabase
            .from("settings")
            .select("value")
            .eq("key", "animation_url")
            .maybeSingle();
        if (settingsAnimation && settingsAnimation.value) animationUrl = settingsAnimation.value;
    }
    if (animationUrl) {
        const animationPreview = document.getElementById("animation-preview-img");
        const animationPlaceholder = document.getElementById("animation-preview-placeholder");
        if (animationPreview && animationPlaceholder) {
            animationPreview.src = animationUrl;
            animationPreview.style.display = "block";
            animationPlaceholder.style.display = "none";
        }
    }
}

checkUser();