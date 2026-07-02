// ===============================
// MOTOR ROUTER - OMEGAHUB
// ===============================

function obtenerIdCampania() {
    const params = new URLSearchParams(window.location.search);

    return (
        params.get("id") ||
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

    console.warn("Campaña no encontrada:", id);

    return null;
}