const lep = document.getElementById("lep");

setInterval(() => {
  lep.src = "assets/lep-blink.png";
  setTimeout(() => {
    lep.src = "assets/lep-idle.png";
  }, 200);
}, 4000);

export function lepSay(text) {
  document.getElementById("lep-text").innerText = text;
}