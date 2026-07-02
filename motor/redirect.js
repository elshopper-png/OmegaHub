// ===============================
// MOTOR REDIRECT - OMEGAHUB
// ===============================

function redirigirCampania(campania) {
    if (!campania || !campania.destino) {
        console.error("No existe destino para redirigir.");
        return;
    }

    setTimeout(() => {
        window.location.href = campania.destino;
    }, 300);
}