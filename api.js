const supabase = window.supabase.createClient(URL, KEY);

export async function getProducts() {
  const { data } = await supabase.from("products").select("*");
  return data;
}

export async function track(type, product) {
  const userId = localStorage.getItem("user_id") || crypto.randomUUID();
  localStorage.setItem("user_id", userId);

  await supabase.from("events").insert([{
    user_id: userId,
    product_id: product.id,
    type: type
  }]);
}