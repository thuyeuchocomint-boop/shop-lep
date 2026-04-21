// ui.js
export function renderProducts(products) {
    const container = document.getElementById("products"); 
    if (!container) return;
    
    container.innerHTML = "";

    if (!products || products.length === 0) {
        container.innerHTML = `
            <div style='grid-column: 1/-1; text-align: center; padding: 40px;'>
                <p>Chưa có món này mày ơi, đợi Lép cập nhật nhé! 🐰</p>
                <button onclick="window.filter('all')" class="tab">Xem tất cả đi má</button>
            </div>`;
        return;
    }

    products.forEach(p => {
        const card = document.createElement("a");
        card.className = "product-card";
        card.href = p.link;
        card.target = "_blank";
        
        // Dùng template literal để cấu trúc lại cho sang
        card.innerHTML = `
            <div class="img-container" style="position:relative; overflow:hidden;">
                <img class="product-img" src="${p.image_url}" loading="lazy" onerror="this.src='https://via.placeholder.com/300'"/>
                ${p.category ? `<span class="badge" style="position:absolute; top:10px; left:10px; background:var(--primary); color:white; font-size:10px; padding:2px 8px; border-radius:10px;">${p.category}</span>` : ''}
            </div>
            <div class="product-info">
                <h3 class="product-name">${p.name}</h3>
                <div class="product-price">${p.price || 'Liên hệ Lép'}</div>
            </div>
        `;
        
        card.onclick = (e) => {
            if (window.trackClick) window.trackClick(p.id);
            // Thêm hiệu ứng rung nhẹ khi click cho vui
            card.style.transform = "scale(0.95)";
            setTimeout(() => card.style.transform = "", 100);
        };
        
        container.appendChild(card);
    });
}