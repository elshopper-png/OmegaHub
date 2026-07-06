// ============================================================
// OMEGAHUB PLATFORM — DASHBOARD V2
// Release 2.3.0 Oficial
// ============================================================

console.log("🚀 OmegaHub Dashboard 2.3.0 Oficial iniciado");

// ============================================================
// 1. CLIENTE SUPABASE
// ============================================================

const supabaseClient = window.supabaseClient;

if (!supabaseClient) {
  console.error("❌ window.supabaseClient no existe. Revisa supabase.js y el orden de scripts.");
}

// ============================================================
// 2. ESTADO GLOBAL
// ============================================================

const OmegaAdapters = window.OmegaAdapters || {
  adaptarCliente(cliente) {
    return cliente;
  },

  adaptarCanal(canal) {
    return canal;
  },

  adaptarVisita(visita) {
    return {
      ...visita,
      createdAt: visita.created_at || visita.createdAt,
      clienteId: visita.cliente_id || visita.clienteId,
      clienteCodigo: visita.cliente_codigo || visita.clienteCodigo,
      canalId: visita.canal_id || visita.canalId,
      canalNombre: visita.canal_nombre || visita.canalNombre || visita.canal || visita.origen || "directo"
    };
  },

  etiquetaCanal(valor) {
    const texto = String(valor || "directo").toLowerCase();

    if (texto.includes("facebook")) return "Facebook";
    if (texto.includes("instagram")) return "Instagram";
    if (texto.includes("tiktok")) return "TikTok";
    if (texto.includes("whatsapp")) return "WhatsApp";
    if (texto.includes("google")) return "Google";
    if (texto.includes("pauta") || texto.includes("ads") || texto.includes("meta")) return "Pauta";

    return texto.charAt(0).toUpperCase() + texto.slice(1);
  }
};const OmegaHub = {
  
  clientes: [],
  canales: [],
  visitas: [],
  clienteActivoId: "todos",
  charts: {
    origen: null,
    dispositivo: null,
    dias: null,
    clientes: null
  },
  refrescoMs: 60000
};
// ============================================================
// CONFIGURACIÓN VISUAL DE CANALES
// ============================================================

const OmegaCanalesVisual = {
  Facebook: {
    color: "#1877F2",
    logo: "📘"
  },
  Instagram: {
    color: "#E1306C",
    logo: "📷"
  },
  TikTok: {
    color: "#687280",
    logo: "🎵"
  },
  WhatsApp: {
    color: "#25D366",
    logo: "🟢"
  },
  YouTube: {
    color: "#FF0000",
    logo: "▶️"
  },
  "Google Business": {
    color: "#4285F4",
    logo: "🔵"
  },
  "Shopper Digital": {
    color: "#F97316",
    logo: "🛒"
  }
};

function visualCanal(nombre) {
  return OmegaCanalesVisual[nombre] || {
    color: "#64748B",
    logo: "●"
  };
}

// ============================================================
// 3. UTILIDADES
// ============================================================

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function setEstado(texto, clase = "") {
  const el = $("estado");
  if (!el) return;

  el.textContent = texto;
  el.className = clase ? `estado-${clase}` : "";
}

function numero(valor) {
  return new Intl.NumberFormat("es-PE").format(Number(valor || 0));
}

function fechaISO(valor) {
  if (!valor) return "";
  return new Date(valor).toISOString().slice(0, 10);
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

function horaPeruTexto() {
  return new Date().toLocaleTimeString("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function destruirChart(chart) {
  if (chart) chart.destroy();
}

function valorCampo(obj, campos, fallback = "") {
  for (const campo of campos) {
    if (
      obj &&
      obj[campo] !== undefined &&
      obj[campo] !== null &&
      obj[campo] !== ""
    ) {
      return obj[campo];
    }
  }
  function formatearTextoHumano(texto) {
  return String(texto || "")
    .replaceAll("_", " ")
    .replace(/\b\w/g, letra => letra.toUpperCase());
}

  return fallback;
}
function nombreCliente(cliente) {
  return valorCampo(
    cliente,
    ["nombre", "razon_social", "empresa", "cliente"],
    `Cliente ${cliente?.id ?? ""}`
  );
}

function nombreCanal(canal) {
  return valorCampo(
    canal,
    ["nombre", "canal", "titulo", "tipo"],
    `Canal ${canal?.id ?? ""}`
  );
}

function tipoCanal(canal) {
  return String(
    valorCampo(canal, ["tipo", "origen", "plataforma"], "general")
  ).toLowerCase();
}

function encontrarCliente(valor) {

    return OmegaHub.clientes.find(cliente =>

        String(cliente.id) === String(valor)

        ||

        String(cliente.codigo) === String(valor)

    );

}

function encontrarCanal(valor) {

    return OmegaHub.canales.find(canal =>

        String(canal.id) === String(valor)

        ||

        String(canal.nombre).toLowerCase() === String(valor).toLowerCase()

    );

}

function contarPor(lista, obtenerClave) {
  return lista.reduce((acc, item) => {
    const clave = obtenerClave(item) || "No identificado";
    acc[clave] = (acc[clave] || 0) + 1;
    return acc;
  }, {});
}

function ordenarObjetoPorValor(obj) {
  return Object.fromEntries(
    Object.entries(obj).sort((a, b) => b[1] - a[1])
  );
}

function ultimasVisitasOrdenadas(visitas) {
  return [...visitas].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

// ============================================================
// 4. CARGA DE DATOS
// ============================================================

async function cargarDatos() {
  if (!supabaseClient) {
    setEstado("Error Supabase", "error");
    return;
  }

  setEstado("Conectando...", "cargando");

  const [clientesRes, canalesRes, visitasRes] = await Promise.all([
    supabaseClient.from("clientes").select("*"),
    supabaseClient.from("canales").select("*"),
    supabaseClient.from("visitas").select("*").order("created_at", { ascending: false })
  ]);

  if (clientesRes.error) throw clientesRes.error;
  if (canalesRes.error) throw canalesRes.error;
  if (visitasRes.error) throw visitasRes.error;

  OmegaHub.clientes = clientesRes.data.map(OmegaAdapters.adaptarCliente);
  OmegaHub.canales = canalesRes.data.map(OmegaAdapters.adaptarCanal);
  OmegaHub.visitas = visitasRes.data.map(OmegaAdapters.adaptarVisita);

  console.log("✅ Clientes adaptados:", OmegaHub.clientes);
  console.log("✅ Canales adaptados:", OmegaHub.canales);
  console.log("✅ Visitas adaptadas:", OmegaHub.visitas);

  setEstado("OmegaHub conectado", "ok");

  renderDashboard();
}
// ============================================================
// 5. FILTROS
// ============================================================

function getClienteActivoId() {
  const selector = $("selectorCliente");
  return selector ? selector.value : OmegaHub.clienteActivoId;
}

function getVisitasFiltradas() {
  const clienteId = getClienteActivoId();

  if (clienteId === "todos") {
    return ultimasVisitasOrdenadas(OmegaHub.visitas);
  }

  const cliente = encontrarCliente(clienteId);

  return ultimasVisitasOrdenadas(
    OmegaHub.visitas.filter(v =>
      String(v.clienteId) === String(clienteId) ||
      String(v.clienteCodigo) === String(cliente?.codigo)
    )
  );
}

function getCanalesFiltrados() {
  const clienteId = getClienteActivoId();

  if (clienteId === "todos") {
    return OmegaHub.canales;
  }

  return OmegaHub.canales.filter(
    c => String(c.cliente_id) === String(clienteId)
  );
}

// ============================================================
// 6. RENDER GENERAL
// ============================================================
function renderDashboard() {
  renderFechaHoy();
  renderHoraPeru();
  renderSelectorClientes();
  renderKPIs();
  renderLive();
  renderEcosistema();
  renderGraficos();
}

function renderHoraPeru() {
    setText("horaPeru", horaPeruTexto());
}

function renderFechaHoy() {

    const fecha = new Date();

    const texto = fecha.toLocaleDateString("es-PE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Lima"
    });

    setText(
        "fechaHoy",
        texto.charAt(0).toUpperCase() + texto.slice(1)
    );
}

// ============================================================
// 7. SELECTOR DE CLIENTES
// ============================================================

function renderSelectorClientes() {
  const selector = $("selectorCliente");
  if (!selector) return;

  const valorActual = selector.value || OmegaHub.clienteActivoId || "todos";

  selector.innerHTML = "";

  const opcionTodos = document.createElement("option");
  opcionTodos.value = "todos";
  opcionTodos.textContent = "Todos";
  selector.appendChild(opcionTodos);

  OmegaHub.clientes.forEach(cliente => {
    const option = document.createElement("option");
    option.value = cliente.id;
    option.textContent = nombreCliente(cliente);
    selector.appendChild(option);
  });

  selector.value = valorActual;
  OmegaHub.clienteActivoId = selector.value;

  selector.onchange = () => {
    OmegaHub.clienteActivoId = selector.value;
    renderDashboard();
  };
}
// ============================================================
// 8. KPIs
// ============================================================

function renderKPIs() {
  const visitas = getVisitasFiltradas();

  const total = visitas.length;

  const hoy = visitas.filter(v =>
    fechaISO(v.createdAt || v.created_at) === hoyISO()
  ).length;

  const agrupadoCanales = {};

  visitas.forEach(v => {
    const nombre = OmegaAdapters.etiquetaCanal(
      v.canalNombre || v.origen || "directo"
    );

    agrupadoCanales[nombre] = (agrupadoCanales[nombre] || 0) + 1;
  });

  const canalLider = Object.entries(agrupadoCanales)
    .sort((a, b) => b[1] - a[1])[0];

  const clientesConVisitas = new Set(
    visitas
      .map(v => v.clienteId || v.clienteCodigo || v.cliente_id)
      .filter(Boolean)
  ).size;

  setText("totalVisitas", numero(total));
  setText("visitasHoy", numero(hoy));

  setText("campaniasActivas", canalLider ? canalLider[0] : "Sin datos");
  setText(
    "detalleCampanias",
    canalLider ? `${numero(canalLider[1])} visitas` : "Aún sin tráfico"
  );

  setText("clientesRegistrados", numero(clientesConVisitas));

  setText("detalleTotal", "Tráfico acumulado en OmegaHub");
  setText("detalleHoy", "Movimiento del día");
  setText("detalleClientes", "Clientes con actividad");
}

// ============================================================
// 9. PANEL LIVE
// ============================================================

function renderLive(){

    const visitas = getVisitasFiltradas();

    if(visitas.length===0){

        setText("ultimaVisitaTiempo","Sin registro");
        setText("ultimaVisitaDetalle","Esperando actividad");

        setText("visitasEnVivo","0 personas");

        setText("campaniaLider","Sin dato");
        setText("campaniaLiderDetalle","Aún sin tráfico");

        return;

    }

    const ultima = visitas[0];

    setText(
        "ultimaVisitaTiempo",
        new Date(ultima.createdAt).toLocaleString("es-PE")
    );

    const cliente = encontrarCliente(
    ultima.clienteId || ultima.clienteCodigo
);
    const canal = encontrarCanal(
    ultima.canalId || ultima.canalNombre
);

    const detalle = [];

    if(cliente) detalle.push(nombreCliente(cliente));

    if(canal) detalle.push(nombreCanal(canal));

    setText(
        "ultimaVisitaDetalle",
        detalle.join(" · ")
    );



    const limite = new Date(
        Date.now()-5*60*1000
    );

    const vivos = visitas.filter(v =>
        new Date(v.createdAt)>=limite
    ).length;

    setText(
        "visitasEnVivo",
        `${numero(vivos)} ${vivos===1?"persona":"personas"}`
    );



    const agrupado = {};

visitas.forEach(v => {
    const nombre = OmegaAdapters.etiquetaCanal(
        v.canalNombre || "directo"
    );

    agrupado[nombre] = (agrupado[nombre] || 0) + 1;
});

    const lider = Object.entries(agrupado)
        .sort((a,b)=>b[1]-a[1])[0];

    if(lider){

        setText("campaniaLider",lider[0]);

        setText(
            "campaniaLiderDetalle",
            `${numero(lider[1])} visitas`
        );

    }

}
// ============================================================
// 10. ECOSISTEMA COMERCIAL
// ============================================================

function renderEcosistema() {
  const contenedor = $("ecosistema");
  if (!contenedor) return;

  const visitas = getVisitasFiltradas();
  const canales = getCanalesFiltrados();

  contenedor.innerHTML = "";

  if (!canales.length) {
    contenedor.innerHTML = `
      <div class="ecosistema-empty">
        No hay canales registrados todavía.
      </div>
    `;
    return;
  }

  canales.forEach(canal => {
    const tipo = tipoCanal(canal);

const visitasCanal = visitas.filter(v =>
    String(v.canalNombre).toLowerCase() === tipo
);

    const card = crearCardEcosistema(canal, visitasCanal.length);
    contenedor.appendChild(card);
  });
}

function crearCardEcosistema(canal, totalVisitas) {
  const tipo = tipoCanal(canal);

  const activo =
    typeof obtenerActivoOmega === "function"
      ? obtenerActivoOmega(tipo)
      : {
          nombre: nombreCanal(canal),
          icono: "🔗",
          color: "#64748B",
          categoria: "general",
          decision: "medicion_general"
        };

  const url = valorCampo(canal, ["url", "enlace", "link"], "");

  const card = document.createElement("article");
  card.className = "ecosistema-card";
  card.style.borderColor = activo.color || "#64748B";

  card.innerHTML = `
    <div class="ecosistema-card-top">
      <span 
        class="ecosistema-icono" 
        style="background:${activo.color || "#64748B"}"
      >
        ${activo.icono || "🔗"}
      </span>

      <div>
        <strong>${escapeHTML(activo.nombre || nombreCanal(canal))}</strong>
        <p>${escapeHTML(nombreCanal(canal))}</p>
      </div>
    </div>

    <div class="ecosistema-card-body">
      <h4>${numero(totalVisitas)}</h4>
      <span>visitas registradas</span>
    </div>

    <div class="ecosistema-card-footer">
<small>${escapeHTML(String(activo.categoria || "activo digital").replaceAll("_", " ").replace(/\b\w/g, letra => letra.toUpperCase()))}</small>      ${
        url
          ? `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">Abrir</a>`
          : ""
      }
    </div>
  `;

  return card;
}
// ============================================================
// 11. GRÁFICOS
// ============================================================

function renderGraficos() {
    const visitas = getVisitasFiltradas();

    renderChartOrigen(visitas);
    renderChartDispositivo(visitas);
    renderChartDias(visitas);
    renderChartClientes(visitas);
}

// ------------------------------------------------------------
// ORIGEN
// ------------------------------------------------------------

function renderChartOrigen(visitas) {

    const canvas = $("chartOrigen");

    if (!canvas || typeof Chart === "undefined") return;

    destruirChart(OmegaHub.charts.origen);

    const datos = agruparVisitasPorCanal(visitas);

    const labels = Object.keys(datos);

    OmegaHub.charts.origen = new Chart(canvas, {

        type: "bar",

        data: {

            labels,

            datasets: [{

                label: "Visitas",

                data: Object.values(datos),

                backgroundColor: labels.map(nombre => visualCanal(nombre).color),

                borderColor: labels.map(nombre => visualCanal(nombre).color),

                borderWidth: 1

            }]

        },

        options: opcionesChartConEjes()

    });

}
// ------------------------------------------------------------
// DISPOSITIVO
// ------------------------------------------------------------

function renderChartDispositivo(visitas) {

    const canvas = $("chartDispositivo");

    if (!canvas || typeof Chart === "undefined") return;

    destruirChart(OmegaHub.charts.dispositivo);

    const datos = {};

    visitas.forEach(v => {

        const dispositivo =
            valorCampo(
                v,
                ["dispositivo", "device", "tipo_dispositivo"],
                "No identificado"
            );

        datos[dispositivo] =
            (datos[dispositivo] || 0) + 1;

    });

    OmegaHub.charts.dispositivo = new Chart(canvas, {

        type: "doughnut",

        data: {

            labels: Object.keys(datos),

            datasets: [{

                data: Object.values(datos)

            }]

        },

        options: opcionesChartSinEjes()

    });

}
// ------------------------------------------------------------
// VISITAS POR DÍA
// ------------------------------------------------------------

function renderChartDias(visitas) {

    const canvas = $("chartDias");

    if (!canvas || typeof Chart === "undefined") return;

    destruirChart(OmegaHub.charts.dias);

    const datos = {};

    visitas.forEach(v => {

        const dia = fechaISO(v.createdAt);

        datos[dia] = (datos[dia] || 0) + 1;

    });

    const labelsISO = Object.keys(datos).sort();

const labels = labelsISO.map(fecha => {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
});

    OmegaHub.charts.dias = new Chart(canvas, {

        type: "line",

        data: {

            labels,

            datasets: [{

                label: "Visitas por día",

                data: labelsISO.map(l => datos[l]),

                tension: 0.35,

                fill: true

            }]

        },

        options: opcionesChartConEjes()

    });

}



// ------------------------------------------------------------
// TOP CLIENTES
// ------------------------------------------------------------

function renderChartClientes(visitas) {

    const canvas = $("chartClientes");

    if (!canvas || typeof Chart === "undefined") return;

    destruirChart(OmegaHub.charts.clientes);

    const datos = {};

    visitas.forEach(v => {

        const cliente = encontrarCliente(
    v.clienteId || v.clienteCodigo
);

        const nombre = cliente
            ? nombreCliente(cliente)
            : "Cliente no identificado";

        datos[nombre] = (datos[nombre] || 0) + 1;

    });

    OmegaHub.charts.clientes = new Chart(canvas, {

        type: "bar",

        data: {

            labels: Object.keys(datos),

            datasets: [{

                label: "Visitas",

                data: Object.values(datos)

            }]

        },

        options: opcionesChartConEjes()

    });

}



// ------------------------------------------------------------
// AGRUPACIÓN POR CANAL
// ------------------------------------------------------------

function agruparVisitasPorCanal(visitas) {

    const datos = {};

    visitas.forEach(v => {

        const nombre =
            OmegaAdapters.etiquetaCanal(
                v.canalNombre || "directo"
            );
            // Ocultar "Directo" en la marcha blanca
if (nombre === "Directo") {
    return;
}

        datos[nombre] =
            (datos[nombre] || 0) + 1;

    });

    return datos;

}
// ============================================================
// 12. OPCIONES CHART.JS
// ============================================================

function opcionesChartConEjes() {

    return {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {

              display: false,

                labels: {

                    color: "#cbd5e1"

                }

            }

        },

        scales: {

            x: {

                ticks: {

                    color: "#cbd5e1"

                },

                grid: {

                    color: "rgba(148,163,184,.15)"

                }

            },

            y: {

                beginAtZero: true,

                ticks: {

                    color: "#cbd5e1",

                    precision: 0

                },

                grid: {

                    color: "rgba(148,163,184,.15)"

                }

            }

        }

    };

}

function opcionesChartSinEjes() {

    return {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

            legend: {

                labels: {

                    color: "#cbd5e1"

                }

            }

        }

    };

}



// ============================================================
// 13. SEGURIDAD HTML
// ============================================================

function escapeHTML(texto){

    return String(texto ?? "")

        .replaceAll("&","&amp;")

        .replaceAll("<","&lt;")

        .replaceAll(">","&gt;")

        .replaceAll('"',"&quot;")

        .replaceAll("'","&#039;");

}

function escapeAttr(texto){

    return escapeHTML(texto);

}



// ============================================================
// 14. INICIALIZACIÓN
// ============================================================

document.addEventListener("DOMContentLoaded",async()=>{

    try{

        renderFechaHoy();

renderHoraPeru();

setInterval(renderHoraPeru,1000);

await cargarDatos();

        setInterval(async()=>{

            try{

                await cargarDatos();

            }catch(error){

                console.error(error);

            }

        },OmegaHub.refrescoMs);

    }

    catch(error){

        console.error(error);

        setEstado("Error de conexión","error");

    }

});