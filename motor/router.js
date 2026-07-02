// ===============================
// MOTOR ROUTER - OMEGAHUB
// ===============================

function obtenerIdCampania() {
    const path = window.location.pathname.replace("/", "").trim();
    const params = new URLSearchParams(window.location.search);

    return (
        params.get("id") ||
        path ||
        "directo"
    );
}

function obtenerCampania() {
    const id = obtenerIdCampania();

    if (typeof CAMPANIAS !== "undefined" && CAMPANIAS[id]) {
        return {
            id: id,
            ...CAMPANIAS[id]
        };
    }

    return {
        id: id,
        cliente: "sin_cliente",
        campania: "sin_campania",
        origen: "directo",
        destino: "https://bodaalexyluzdy.my.canva.site/cat-logo"
    };
}