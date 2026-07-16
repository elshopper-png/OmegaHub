// ===============================
// APP PRINCIPAL - OMEGAHUB
// ===============================

async function iniciarOmegaHub() {
    const campania = obtenerCampania();

    console.log("Campaña detectada:", campania);

    if (!campania || !campania.destino) {
        console.error("No se encontró destino para esta campaña");
        return;
    }

    const destinoFinal = campania.destino;

    try {
        const limiteDeEspera = new Promise((resolve) => {
            setTimeout(() => {
                console.warn(
                    "Supabase demoró demasiado. Se continuará al destino."
                );

                resolve(false);
            }, 2500);
        });

        const registroCompletado = await Promise.race([
            registrarVisita(destinoFinal),
            limiteDeEspera
        ]);

        if (registroCompletado) {
            console.log("✅ Registro confirmado. Redireccionando...");
        } else {
            console.warn(
                "⚠️ No se confirmó el registro. Se redireccionará para no detener al visitante."
            );
        }

    } catch (error) {
        console.error("Error durante el proceso de registro:", error);
    }

    window.location.replace(destinoFinal);
}

iniciarOmegaHub();