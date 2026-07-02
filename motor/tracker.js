// ===============================
// MOTOR TRACKER - OMEGAHUB
// ===============================

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

async function registrarCampania(campania) {
    const visita = {
        pagina: window.location.href,
        origen: campania.origen,
        referer: document.referrer || "directo",
        user_agent: navigator.userAgent,
        idioma: navigator.language,
        ancho: window.screen.width,
        alto: window.screen.height,
        cliente: campania.cliente,
        campania: campania.campania,
        destino: campania.destino,
        dispositivo: detectarDispositivo(),
        navegador: detectarNavegador()
    };

    console.log("Registrando campaña:", visita);

    const { error } = await supabaseClient
        .from("visitas")
        .insert([visita]);

    if (error) {
        console.error("Error al registrar campaña:", error);
        return false;
    }

    console.log("Campaña registrada correctamente");
    return true;
}