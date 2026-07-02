// ===============================
// OMEGA HUB ANALYTICS CLOUD
// ===============================

function obtenerParametro(nombre, valorPorDefecto = "directo") {
    const params = new URLSearchParams(window.location.search);
    return params.get(nombre) || valorPorDefecto;
}

function detectarDispositivo() {
    const ua = navigator.userAgent.toLowerCase();

    if (/android|iphone|ipad|ipod|mobile/i.test(ua)) {
        return "movil";
    }

    return "desktop";
}

function detectarNavegador() {
    const ua = navigator.userAgent;

    if (ua.includes("Edg")) return "Edge";
    if (ua.includes("Chrome")) return "Chrome";
    if (ua.includes("Firefox")) return "Firefox";
    if (ua.includes("Safari")) return "Safari";

    return "otro";
}

async function registrarVisita() {
    const params = new URLSearchParams(window.location.search);

    const cliente = obtenerParametro("cliente", "kuya");
    const campania =
        params.get("campania") ||
        params.get("campaña") ||
        params.get("utm_campaign") ||
        "sin_campania";

    const origen =
    params.get("origen") ||
    params.get("src") ||
    params.get("utm_source") ||
    "directo";

    const destino =
        params.get("destino") ||
        "https://bodaalexyluzdy.my.canva.site/cat-logo";

    const visit = {
        pagina: window.location.href,
        origen: origen,
        referer: document.referrer || "directo",
        user_agent: navigator.userAgent,
        idioma: navigator.language,
        ancho: window.screen.width,
        alto: window.screen.height,
        cliente: cliente,
        campania: campania,
        destino: destino,
        dispositivo: detectarDispositivo(),
        navegador: detectarNavegador()
    };

    console.log("Enviando visita a Supabase...");
    console.table(visit);

    const { error } = await supabaseClient
        .from("visitas")
        .insert([visit]);

    if (error) {
        console.error("Error al guardar visita:", error);
        return;
    }

    console.log("Visita guardada en Supabase");
}

registrarVisita();