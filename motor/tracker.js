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

function esTraficoAutomatico() {
    const ua = navigator.userAgent.toLowerCase();

    return (
        ua.includes("facebookexternalhit") ||
        ua.includes("facebot")
    );
}


// ===============================
// IDENTIFICADOR ANÓNIMO DEL NAVEGADOR
// ===============================

function obtenerVisitorId() {

    const CLAVE_VISITOR =
        "omegahub_visitor_id";

    try {

        let visitorId =
            localStorage.getItem(
                CLAVE_VISITOR
            );

        if (!visitorId) {

            if (
                window.crypto &&
                typeof window.crypto.randomUUID === "function"
            ) {

                visitorId =
                    window.crypto.randomUUID();

            } else {

                visitorId =
                    "visitor-" +
                    Date.now() +
                    "-" +
                    Math.random()
                        .toString(36)
                        .substring(2, 15);
            }

            localStorage.setItem(
                CLAVE_VISITOR,
                visitorId
            );
        }

        return visitorId;

    } catch (error) {

        console.warn(
            "No se pudo usar localStorage para visitor_id:",
            error
        );

        return null;
    }
}


// ===============================
// REGISTRO DE CAMPAÑA
// ===============================

async function registrarCampania(campania) {

    if (esTraficoAutomatico()) {
        console.log(
            "🤖 Tráfico automático de Meta ignorado."
        );
        return true;
    }

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
        navegador: detectarNavegador(),
        visitor_id: obtenerVisitorId()
    };

    console.log(
        "Registrando campaña:",
        visita
    );

    const { error } = await supabaseClient
        .from("visitas")
        .insert([visita]);

    if (error) {
        console.error(
            "Error al registrar campaña:",
            error
        );
        return false;
    }

    console.log(
        "Campaña registrada correctamente"
    );

    return true;
}