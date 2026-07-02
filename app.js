const destinos = {
  kuya: "https://bodaalexyluzdy.my.canva.site/cat-logo"
};

const params = new URLSearchParams(window.location.search);

const cliente = params.get("cliente") || "sin_cliente";
const campania = params.get("campania") || "sin_campania";
const origen = params.get("origen") || "directo";

const destino = params.get("destino") || destinos[cliente];

setTimeout(() => {
  window.location.href = destino;
}, 300);