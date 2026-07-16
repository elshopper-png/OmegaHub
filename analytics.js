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

async function registrarVisita(destinoReal = "") {
    try {
        const params = new URLSearchParams(window.location.search);

        const cliente = obtenerParametro("cliente", "shopper");

        const campania =
            params.get("campania") ||
            params.get("campaña") ||
            params.get("utm_campaign") ||
            "sin_campania";

        let origen =
            params.get("origen") ||
            params.get("src") ||
            params.get("utm_source") ||
            "directo";

        origen = origen.toLowerCase();

        if (origen.includes("tiktok")) {
            origen = "tiktok";
        } else if (
            origen.includes("facebook") ||
            origen.includes("fb")
        ) {
            origen = "facebook";
        } else if (
            origen.includes("instagram") ||
            origen.includes("ig")
        ) {
            origen = "instagram";
        } else if (
            origen.includes("meta")
        ) {
            origen = "meta";
        }

        const destino =
            destinoReal ||
            params.get("destino") ||
            "sin_destino";

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
            return false;
        }

        console.log("✅ Visita guardada en Supabase");
        return true;

    } catch (error) {
        console.error("Error inesperado al registrar visita:", error);
        return false;
    }
}