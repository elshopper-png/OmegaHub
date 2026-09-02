// ===============================
// APP PRINCIPAL - OMEGAHUB
// ===============================

async function iniciarOmegaHub() {

    const campania = obtenerCampania();

    console.log("Campaña detectada:", campania);

    if (!campania || !campania.destino) {
        console.error("No se encontró una campaña válida.");
        return;
    }

    try {

        const limiteDeEspera = new Promise((resolve) => {
            setTimeout(() => {
                console.warn(
                    "Supabase demoró demasiado. Continuando al destino."
                );

                resolve(false);
            }, 1200);
        });

        const registroCompletado = await Promise.race([
            registrarCampania(campania),
            limiteDeEspera
        ]);

        if (registroCompletado) {
            console.log("✅ Registro confirmado.");
        } else {
            console.warn(
                "⚠️ Registro no confirmado. Continuando al destino."
            );
        }

    } catch (error) {
        console.error(
            "Error durante el registro de campaña:",
            error
        );
    }

    // El usuario nunca queda atrapado en OmegaHub.
    window.location.replace(campania.destino);
}

iniciarOmegaHub();