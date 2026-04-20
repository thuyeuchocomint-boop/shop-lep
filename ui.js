export function renderProducts(products) {
    const container = document.getElementById("products");
    if (!container) return;
    
    container.innerHTML = "";

    if (products.length === 0) {
        container.innerHTML = "<p style='grid-column: 1/-1; text-align: center;'>Chưa có món này mày ơi, đợi Lép cập nhật nhé!</p>";
        return;
    }

    products.forEach(p => {
        const card = document.createElement("div");
        card.className = "product-card";
        card.innerHTML = `
            <img class="product-img" src="${p.image_url || p.image}" loading="lazy"/>
            <div class="product-info">
                <h3 class="product-name">${p.name || p.title}</h3>
                <div class="product-price">${p.price ? p.price.toLocaleString() + 'đ' : 'Ghé xem'}</div>
            </div>
        `;
        
        card.onclick = () => {
            // Tracking lượt click để admin thống kê
            window.open(p.affiliate_link || p.link, "_blank");
        };
        
        container.appendChild(card);
    });
}