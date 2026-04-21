const URL = "https://ebraxafpawypwmntoglw.supabase.co";
const KEY = "sb_publishable_DhXag1beuBobuA8n4580Eg_hPUZJ9P0"; 

export const supabase = window.supabase.createClient(URL, KEY);

async function compressImage(file, quality = 0.7, maxWidth = 800) {
    return new Promise((resolve) => {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = (e) => img.src = e.target.result;
        img.onload = () => {
            const canvas = document.createElement("canvas");
            const scale = Math.min(maxWidth / img.width, 1);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => resolve(blob), "image/jpeg", quality);
        };
        reader.readAsDataURL(file);
    });
}

export async function getProducts() {
    const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
    if (error) return [];
    return data;
}

export async function uploadProduct(productData, imageFile) {
    try {
        let image_url = "";
        if (imageFile) {
            const compressed = await compressImage(imageFile);
            const fileName = `${Date.now()}-${imageFile.name}`;
            const { error: storageError } = await supabase.storage
                .from("product-images")
                .upload(fileName, compressed);
            
            if (storageError) throw storageError;
            const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
            image_url = data.publicUrl;
        }

        const { error } = await supabase.from("products").insert([{
            name: productData.name,
            price: productData.price,
            link: productData.link,
            category: productData.category,
            image_url: image_url
        }]);

        if (error) throw error;
    } catch (err) {
        alert("Lỗi: " + err.message);
        throw err;
    }
}

window.uploadProduct = uploadProduct;