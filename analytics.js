// ===============================
// OMEGA HUB ANALYTICS LITE
// ===============================

function obtenerParametro(nombre) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nombre) || "directo";
}

const visit = {
    fecha: new Date().toISOString(),
    cliente: obtenerParametro("cliente") || "kuya",
    fuente: obtenerParametro("src"),
    campaña: obtenerParametro("campaña"),
    url: window.location.href,
    referencia: document.referrer || "directo",
    idioma: navigator.language,
    plataforma: navigator.platform,
    navegador: navigator.userAgent,
    anchoPantalla: window.screen.width,
    altoPantalla: window.screen.height
};

const visitasGuardadas = JSON.parse(localStorage.getItem("omega_visitas") || "[]");

visitasGuardadas.push(visit);

localStorage.setItem("omega_visitas", JSON.stringify(visitasGuardadas));

console.log("Nueva visita registrada");
console.table(visit);
console.log("Total visitas guardadas:", visitasGuardadas.length);