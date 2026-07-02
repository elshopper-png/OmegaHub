// ==========================================
// OMEGAHUB DASHBOARD
// ==========================================

// ===============================
// FECHA OFICIAL PERÚ (UTC-5)
// ===============================

function fechaPeru(fecha = new Date()) {
    return fecha.toLocaleDateString("en-CA", {
        timeZone: "America/Lima"
    });
}

async function cargarDashboard() {

    document.getElementById("estado").textContent = "Consultando...";

    const { data, error } = await supabaseClient
        .from("visitas")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        document.getElementById("estado").textContent = "Error";
        return;
    }

    // ===============================
    // FECHAS (Hora Perú)
    // ===============================

    const hoy = fechaPeru();

    const ayerDate = new Date();
    ayerDate.setDate(ayerDate.getDate() - 1);

    const ayer = fechaPeru(ayerDate);

    const hace7 = new Date();
    hace7.setDate(hace7.getDate() - 7);

    // ===============================
    // CONTADORES
    // ===============================

    const visitasHoy = data.filter(v =>
        fechaPeru(new Date(v.created_at)) === hoy
    ).length;

    const visitasAyer = data.filter(v =>
        fechaPeru(new Date(v.created_at)) === ayer
    ).length;

    const visitasSemana = data.filter(v =>
        new Date(v.created_at) >= hace7
    ).length;

    document.getElementById("hoy").textContent = visitasHoy;
    document.getElementById("ayer").textContent = visitasAyer;
    document.getElementById("semana").textContent = visitasSemana;
    document.getElementById("total").textContent = data.length;

    // ===============================
    // AGRUPACIONES
    // ===============================

    pintarGrupo("clientes", contarPorCampo(data, "cliente"));
    pintarGrupo("campanas", contarPorCampo(data, "campania"));
    pintarGrupo("origenes", contarPorCampo(data, "origen"));
    pintarGrupo("dispositivos", contarPorCampo(data, "dispositivo"));
    pintarGrupo("navegadores", contarPorCampo(data, "navegador"));

    document.getElementById("estado").textContent = "Actualizado";
}

// ==========================================
// CONTAR POR CAMPO
// ==========================================

function contarPorCampo(data, campo) {

    const resultado = {};

    data.forEach(item => {

        let valor = item[campo] || "Sin dato";

        if (campo === "origen") {
            valor = normalizarOrigen(valor);
        }

        resultado[valor] = (resultado[valor] || 0) + 1;

    });

    return resultado;

}

// ==========================================
// NORMALIZAR ORÍGENES
// ==========================================

function normalizarOrigen(valor) {

    const texto = String(valor).toLowerCase();

    if (texto.includes("tiktok")) return "tiktok";
    if (texto.includes("facebook")) return "facebook";
    if (texto.includes("instagram")) return "instagram";
    if (texto.includes("whatsapp")) return "whatsapp";
    if (texto.includes("google")) return "google";

    return valor;

}

// ==========================================
// PINTAR GRUPOS
// ==========================================

function pintarGrupo(id, datos) {

    const contenedor = document.getElementById(id);

    contenedor.innerHTML = "";

    Object.entries(datos).forEach(([nombre, cantidad]) => {

        contenedor.innerHTML += `
            <div class="fila">
                <span>${nombre}</span>
                <strong>${cantidad}</strong>
            </div>
        `;

    });

}

// ==========================================
// INICIO
// ==========================================

cargarDashboard();

setInterval(cargarDashboard, 10000);