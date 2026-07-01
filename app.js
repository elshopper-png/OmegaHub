// =======================================
// OMEGA HUB
// REDIRECCIÓN INTELIGENTE
// =======================================

const params = new URLSearchParams(window.location.search);

const destinos = {
    kuya: "https://bodaalexyluzdy.my.canva.site/cat-logo"
};

const cliente = params.get("cliente") || "kuya";
const destino = params.get("destino") || destinos[cliente] || destinos.kuya;

setTimeout(() => {
    window.location.href = destino;
}, 300);