// ==========================================
// OMEGAHUB DASHBOARD 2.0
// ==========================================

let chartOrigen = null;
let chartDispositivo = null;

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

    const datos = prepararDatos(data);

    actualizarKPIs(datos);
    actualizarTablas(datos);
    actualizarGraficos(datos);

    document.getElementById("estado").textContent = "Actualizado";
}

function prepararDatos(data) {
    const hoy = fechaPeru();

    const ayerDate = new Date();
    ayerDate.setDate(ayerDate.getDate() - 1);
    const ayer = fechaPeru(ayerDate);

    const hace7 = new Date();
    hace7.setDate(hace7.getDate() - 7);

    return {
        raw: data,
        hoy: data.filter(v => fechaPeru(new Date(v.created_at)) === hoy),
        ayer: data.filter(v => fechaPeru(new Date(v.created_at)) === ayer),
        semana: data.filter(v => new Date(v.created_at) >= hace7),
        clientes: contarPorCampo(data, "cliente"),
        campanas: contarPorCampo(data, "campania"),
        origenes: contarPorCampo(data, "origen"),
        dispositivos: contarPorCampo(data, "dispositivo"),
        navegadores: contarPorCampo(data, "navegador")
    };
}

function actualizarKPIs(datos) {
    document.getElementById("hoy").textContent = datos.hoy.length;
    document.getElementById("ayer").textContent = datos.ayer.length;
    document.getElementById("semana").textContent = datos.semana.length;
    document.getElementById("total").textContent = datos.raw.length;
}

function actualizarTablas(datos) {
    pintarGrupo("clientes", datos.clientes);
    pintarGrupo("campanas", datos.campanas);
    pintarGrupo("origenes", datos.origenes);
    pintarGrupo("dispositivos", datos.dispositivos);
    pintarGrupo("navegadores", datos.navegadores);
}

function actualizarGraficos(datos) {
    chartOrigen = crearGraficoBarra(
        "chartOrigen",
        chartOrigen,
        datos.origenes,
        "Visitas"
    );

    chartDispositivo = crearGraficoDona(
        "chartDispositivo",
        chartDispositivo,
        datos.dispositivos
    );
}

function contarPorCampo(data, campo) {
    const resultado = {};

    data.forEach(item => {
        let valor = item[campo] || "Sin dato";

        if (campo === "origen") {
            valor = normalizarOrigen(valor);
        }

        resultado[valor] = (resultado[valor] || 0) + 1;
    });

    return ordenarObjeto(resultado);
}

function normalizarOrigen(valor) {
    const texto = String(valor).toLowerCase();

    if (texto.includes("tiktok")) return "tiktok";
    if (texto.includes("facebook")) return "facebook";
    if (texto.includes("instagram")) return "instagram";
    if (texto.includes("whatsapp")) return "whatsapp";
    if (texto.includes("google")) return "google";

    return valor;
}

function ordenarObjeto(objeto) {
    return Object.fromEntries(
        Object.entries(objeto).sort((a, b) => b[1] - a[1])
    );
}

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

function crearGraficoBarra(canvasId, instancia, datos, etiqueta) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return instancia;

    if (instancia) instancia.destroy();

    return new Chart(canvas, {
        type: "bar",
        data: {
            labels: Object.keys(datos),
            datasets: [{
                label: etiqueta,
                data: Object.values(datos)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

function crearGraficoDona(canvasId, instancia, datos) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return instancia;

    if (instancia) instancia.destroy();

    return new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: Object.keys(datos),
            datasets: [{
                data: Object.values(datos)
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

cargarDashboard();
setInterval(cargarDashboard, 10000);