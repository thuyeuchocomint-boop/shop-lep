


const lep = document.getElementById("lep");
const DEFAULT_LEP_IMG = "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=400&q=80";

setInterval(() => {
  lep.src = DEFAULT_LEP_IMG;
  setTimeout(() => {
    lep.src = DEFAULT_LEP_IMG;
  }, 200);
}, 4000);

export function lepSay(text) {
  document.getElementById("lep-text").innerText = text;
}