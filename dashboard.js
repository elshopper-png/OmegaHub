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

    const ahora = new Date();
    const hoy = ahora.toISOString().slice(0, 10);

    const ayerDate = new Date();
    ayerDate.setDate(ayerDate.getDate() - 1);
    const ayer = ayerDate.toISOString().slice(0, 10);

    const hace7 = new Date();
    hace7.setDate(hace7.getDate() - 7);

    const visitasHoy = data.filter(v => v.created_at.slice(0, 10) === hoy).length;
    const visitasAyer = data.filter(v => v.created_at.slice(0, 10) === ayer).length;
    const visitasSemana = data.filter(v => new Date(v.created_at) >= hace7).length;

    document.getElementById("hoy").textContent = visitasHoy;
    document.getElementById("ayer").textContent = visitasAyer;
    document.getElementById("semana").textContent = visitasSemana;
    document.getElementById("total").textContent = data.length;

    pintarGrupo("clientes", contarPorCampo(data, "cliente"));
    pintarGrupo("campanas", contarPorCampo(data, "campania"));
    pintarGrupo("origenes", contarPorCampo(data, "origen"));
    pintarGrupo("dispositivos", contarPorCampo(data, "dispositivo"));
    pintarGrupo("navegadores", contarPorCampo(data, "navegador"));

    document.getElementById("estado").textContent = "Actualizado";
}

function contarPorCampo(data, campo) {
    const resultado = {};

    data.forEach(item => {
        const valor = item[campo] || "Sin dato";
        resultado[valor] = (resultado[valor] || 0) + 1;
    });

    return resultado;
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

cargarDashboard();
setInterval(cargarDashboard, 10000);