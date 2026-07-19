// ============================================================
// OMEGAHUB — PICAPIEDRA 2.0
// Datos reales desde Supabase, sin analítica inventada
// ============================================================

console.log("🚀 OmegaHub Picapiedra 2.0 iniciado");

const supabaseClient = window.supabaseClient;

// ============================================================
// MODO DE ACCESO AL DASHBOARD
// ============================================================

const PARAMETROS_DASHBOARD =
  new URLSearchParams(window.location.search);

const CLIENTE_SOLICITADO = String(
  PARAMETROS_DASHBOARD.get("cliente") || ""
).trim().toLowerCase();

const VISTA_MAESTRA =
  PARAMETROS_DASHBOARD.get("vista") === "maestra";

const CLIENTES_CONFIG = {
  shopper: {
    nombre: "Shopper Digital"
  }
};

const CLIENTE_VALIDO =
  Boolean(CLIENTES_CONFIG[CLIENTE_SOLICITADO]);

const OmegaHub = {
  visitas: [],

  clienteActivo: CLIENTE_VALIDO
    ? CLIENTE_SOLICITADO
    : "todos",

  modoCliente: CLIENTE_VALIDO,
  vistaMaestra: VISTA_MAESTRA,

  periodoActivo: "hoy",

  chartDias: null,
  chartHorario: null,

  refrescoMs: 60000
};

const CANALES = {
  meta: { nombre: "Meta", color: "#5B5BD6" },

  facebook: { nombre: "Facebook", color: "#1877F2" },

  instagram: { nombre: "Instagram", color: "#E1306C" },

  tiktok: { nombre: "TikTok", color: "#94A3B8" },

  youtube: { nombre: "YouTube", color: "#FF0000" },

  whatsapp: { nombre: "WhatsApp", color: "#25D366" },

  google: { nombre: "Google", color: "#4285F4" },

  linktree: { nombre: "Linktree", color: "#43E660" },

  qr: { nombre: "Código QR", color: "#F59E0B" },

  directo: { nombre: "Directo", color: "#64748B" }
};

const REDES_SOCIALES = [
  "facebook",
  "instagram",
  "tiktok",
  "youtube"
];

const ICONOS_RRSS = {
  facebook: "f",
  instagram: "◎",
  tiktok: "♪",
  youtube: "▶"
};

function $(id) {
  return document.getElementById(id);
}

function setText(id, value) {
  const el = $(id);
  if (el) el.textContent = value;
}

function numero(valor) {
  return new Intl.NumberFormat("es-PE").format(Number(valor || 0));
}

function setEstado(texto, tipo = "") {
  const el = $("estado");
  if (!el) return;
  el.textContent = texto;
  el.className = tipo ? `estado-${tipo}` : "";
}

function fechaPeru(valor) {
  if (!valor) return "Sin fecha";

  return new Date(valor).toLocaleString("es-PE", {
    timeZone: "America/Lima",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function fechaISOEnPeru(valor = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date(valor));
}

function normalizarVisita(visita) {
  return {
    ...visita,
    fecha: visita.created_at || visita.createdAt || visita.fecha || null,
    cliente: String(
      visita.cliente ||
      visita.cliente_codigo ||
      visita.clienteCodigo ||
      visita.cliente_id ||
      visita.clienteId ||
      "sin-cliente"
    ).trim(),
    canal: normalizarCanal(
      visita.origen ||
      visita.canal ||
      visita.canal_nombre ||
      visita.canalNombre ||
      "directo"
    ),
    campania: visita.campania || visita.campaña || "Sin campaña",
    dispositivo: visita.dispositivo || visita.device || "No identificado",
    destino: visita.destino || visita.pagina || ""
  };
}

function normalizarCanal(valor) {
  const texto = String(valor || "directo").toLowerCase();

  if (texto.includes("facebook")) return "facebook";
  if (texto.includes("instagram")) return "instagram";
  if (texto.includes("tiktok")) return "tiktok";
  if (texto.includes("youtube")) return "youtube";
  if (texto.includes("whatsapp")) return "whatsapp";
  if (texto.includes("google")) return "google";

  return texto || "directo";
}

function etiquetaCanal(canal) {
  return CANALES[canal]?.nombre ||
    canal.replaceAll("_", " ").replace(/\b\w/g, letra => letra.toUpperCase());
}

function escapeHTML(texto) {
  return String(texto ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function visitasFiltradas() {
  if (OmegaHub.clienteActivo === "todos") {
    return [...OmegaHub.visitas];
  }

  return OmegaHub.visitas.filter(
    visita => visita.cliente === OmegaHub.clienteActivo
  );
}

function visitasDelPeriodoSeleccionado() {
  const visitas = visitasFiltradas();
  const hoy = fechaISOEnPeru();
  const periodo = OmegaHub.periodoActivo;

  if (periodo === "hoy") {
    return visitas.filter(
      visita => fechaISOEnPeru(visita.fecha) === hoy
    );
  }

  if (periodo === "mes") {
    const mesActual = hoy.slice(0, 7);

    return visitas.filter(
      visita =>
        fechaISOEnPeru(visita.fecha).slice(0, 7) === mesActual
    );
  }

  if (periodo === "anio") {
    const anioActual = hoy.slice(0, 4);

    return visitas.filter(
      visita =>
        fechaISOEnPeru(visita.fecha).slice(0, 4) === anioActual
    );
  }

  if (periodo === "semana") {
    const fechaHoy = new Date(`${hoy}T12:00:00-05:00`);
    const diaSemana = fechaHoy.getDay();
    const retroceso = diaSemana === 0 ? 6 : diaSemana - 1;

    fechaHoy.setDate(fechaHoy.getDate() - retroceso);

    const inicioSemana = fechaISOEnPeru(fechaHoy);

    return visitas.filter(visita => {
      const fechaVisita = fechaISOEnPeru(visita.fecha);

      return fechaVisita >= inicioSemana &&
        fechaVisita <= hoy;
    });
  }

  return visitas;
}

function nombrePeriodoSeleccionado() {
  const nombres = {
    hoy: "Hoy",
    semana: "Esta semana",
    mes: "Este mes",
    anio: "Este año"
  };

  return nombres[OmegaHub.periodoActivo] || "Hoy";
}

function horaEnPeru(valor) {
  if (!valor) return 0;

  const partes = new Intl.DateTimeFormat("es-PE", {
    timeZone: "America/Lima",
    hour: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(valor));

  return Number(
    partes.find(parte => parte.type === "hour")?.value || 0
  );
}

function renderGraficoHorario() {
  const canvas = $("chartHorario");
  const leyenda = $("horarioLegend");

  if (
    !canvas ||
    !leyenda ||
    typeof Chart === "undefined"
  ) {
    return;
  }

  const visitas = visitasDelPeriodoSeleccionado();

  const horarios = {
  madrugada: 0,
  manana: 0,
  tarde: 0,
  noche: 0
};

  visitas.forEach(visita => {
  const hora = horaEnPeru(visita.fecha);

  if (hora >= 0 && hora < 6) {
    horarios.madrugada += 1;
  } else if (hora >= 6 && hora < 12) {
    horarios.manana += 1;
  } else if (hora >= 12 && hora < 18) {
    horarios.tarde += 1;
  } else {
    horarios.noche += 1;
  }
});

  const segmentos = [
  {
    clave: "madrugada",
    nombre: "Madrugada",
    rango: "00:00–05:59",
    icono: "🌙",
    color: "#64748b"
  },
  {
    clave: "manana",
    nombre: "Mañana",
    rango: "06:00–11:59",
    icono: "🌅",
    color: "#38bdf8"
  },
  {
    clave: "tarde",
    nombre: "Tarde",
    rango: "12:00–17:59",
    icono: "☀️",
    color: "#f59e0b"
  },
  {
    clave: "noche",
    nombre: "Noche",
    rango: "18:00–23:59",
    icono: "🌃",
    color: "#8b5cf6"
  }
];

  const total = segmentos.reduce(
    (suma, segmento) =>
      suma + horarios[segmento.clave],
    0
  );

  leyenda.innerHTML = segmentos.map(segmento => {
    const cantidad = horarios[segmento.clave];

    const porcentaje = total
      ? Math.round((cantidad / total) * 100)
      : 0;

    return `
      <div class="horario-legend-item">

        <span
          class="horario-color"
          style="background:${segmento.color}"
        ></span>

        <div>
          <strong>
            ${segmento.icono}
            ${segmento.nombre}
          </strong>

          <small>
            ${segmento.rango}
          </small>
        </div>

        <b>${porcentaje}%</b>

      </div>
    `;
  }).join("");

  const principal = [...segmentos].sort(
    (a, b) =>
      horarios[b.clave] - horarios[a.clave]
  )[0];

  const cantidadPrincipal =
    principal ? horarios[principal.clave] : 0;

  const porcentajePrincipal = total
    ? Math.round((cantidadPrincipal / total) * 100)
    : 0;

  setText(
    "detallePeriodoHorario",
    `Período seleccionado: ${nombrePeriodoSeleccionado()}`
  );

  setText(
    "horarioPrincipal",
    total
      ? `${principal.icono} ${principal.nombre}`
      : "Sin datos"
  );

  setText(
    "horarioPrincipalDetalle",
    total
      ? `${porcentajePrincipal}% del tráfico`
      : "Esperando tráfico"
  );

  if (OmegaHub.chartHorario) {
    OmegaHub.chartHorario.destroy();
  }

  OmegaHub.chartHorario = new Chart(canvas, {
    type: "doughnut",

    data: {
      labels: segmentos.map(segmento =>
        segmento.nombre
      ),

      datasets: [
        {
          data: segmentos.map(segmento =>
            horarios[segmento.clave]
          ),

          backgroundColor: segmentos.map(
            segmento => segmento.color
          ),

          borderColor: "#0d1a2b",
          borderWidth: 4,
          hoverOffset: 0
        }
      ]
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",

      animation: false,
      events: [],

      plugins: {
        legend: {
          display: false
        },

        tooltip: {
          enabled: false
        }
      }
    }
  });
}

async function cargarDatos() {
  if (!supabaseClient) {
    setEstado("Error Supabase", "error");
    return;
  }

  setEstado("Conectando...", "cargando");

  let consulta = supabaseClient
    .from("visitas")
    .select("*")
    .order("created_at", { ascending: false });

  if (OmegaHub.modoCliente) {
    consulta = consulta.eq(
      "cliente",
      OmegaHub.clienteActivo
    );
  }

  const { data, error } = await consulta;

  if (error) {
    console.error("Error cargando visitas:", error);
    setEstado("Error de conexión", "error");
    return;
  }

  OmegaHub.visitas = (data || []).map(normalizarVisita);
  setEstado("OmegaHub conectado", "ok");
  renderTodo();
}

function renderTodo() {
    renderFechaHora();
    renderSelectorClientes();
    renderHeaderCliente();
    renderKPIs();
    renderGraficoDias();
    renderCanales();
    renderGraficoHorario();   // ← nueva línea
    renderActividad();
    renderTabla();
}

function renderFechaHora() {
  const ahora = new Date();

  const fecha = ahora.toLocaleDateString("es-PE", {
    timeZone: "America/Lima",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  setText("fechaHoy", fecha.charAt(0).toUpperCase() + fecha.slice(1));

  setText(
    "horaPeru",
    ahora.toLocaleTimeString("es-PE", {
      timeZone: "America/Lima",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })
  );
}

function renderSelectorClientes() {
  const selector = $("selectorCliente");

  if (OmegaHub.modoCliente) {
    const contenedor =
      selector?.closest(".cliente-selector");

    if (contenedor) {
      contenedor.style.display = "none";
    }

    return;
  }

  if (!selector) return;

  const clientes = [
    ...new Set(
      OmegaHub.visitas
        .map(visita => visita.cliente)
        .filter(Boolean)
    )
  ].sort();

  selector.innerHTML =
    `<option value="todos">Todos</option>`;

  clientes.forEach(cliente => {
    const option =
      document.createElement("option");

    option.value = cliente;

    option.textContent = cliente
      .replaceAll("-", " ")
      .replace(/\b\w/g, letra =>
        letra.toUpperCase()
      );

    selector.appendChild(option);
  });

  selector.value =
    clientes.includes(OmegaHub.clienteActivo)
      ? OmegaHub.clienteActivo
      : "todos";

  OmegaHub.clienteActivo =
    selector.value;

  selector.onchange = () => {
    OmegaHub.clienteActivo =
      selector.value;

    renderHeaderCliente();
    renderKPIs();
    renderGraficoDias();
    renderCanales();
    renderActividad();
    renderTabla();
  };
}

function renderHeaderCliente() {
  if (OmegaHub.modoCliente) {
    const configuracion =
      CLIENTES_CONFIG[OmegaHub.clienteActivo];

    setText(
      "nombreClienteHeader",
      configuracion?.nombre || "Cliente"
    );

    document.title =
      `${configuracion?.nombre || "Cliente"} | Picapiedra`;

    return;
  }

  if (OmegaHub.clienteActivo === "todos") {
    setText(
      "nombreClienteHeader",
      "Todos los clientes"
    );

    return;
  }

  const nombre = OmegaHub.clienteActivo
    .replaceAll("-", " ")
    .replaceAll("_", " ")
    .replace(/\b\w/g, letra => letra.toUpperCase());

  setText("nombreClienteHeader", nombre);
}

function renderKPIs() {
  const visitas = visitasFiltradas();
  const hoy = fechaISOEnPeru();

  const visitasHoy = visitas.filter(
    visita => fechaISOEnPeru(visita.fecha) === hoy
  ).length;

  const porCanal = contarPor(visitas, visita => visita.canal);
  const lider = Object.entries(porCanal).sort((a, b) => b[1] - a[1])[0];

  const clientesActivos = new Set(
    visitas.map(visita => visita.cliente).filter(Boolean)
  ).size;

  setText("totalVisitas", numero(visitas.length));
  setText("visitasHoy", numero(visitasHoy));
  setText("canalLider", lider ? etiquetaCanal(lider[0]) : "Sin datos");
  setText(
  "detalleCanalLider",
  lider ? `${numero(lider[1])} visitas en OmegaHub` : "Aún sin tráfico registrado"
);
  setText("clientesActivos", numero(clientesActivos));
}

function contarPor(lista, obtenerClave) {
  return lista.reduce((acc, item) => {
    const clave = obtenerClave(item) || "sin-dato";
    acc[clave] = (acc[clave] || 0) + 1;
    return acc;
  }, {});
}
function renderLeyendaGrafico(canalesActivos) {
  const contenedor = $("chartLegend");
  if (!contenedor) return;

  if (canalesActivos.length <= 1) {

    contenedor.innerHTML = "";

    contenedor.style.display = "none";

    return;

}

  contenedor.innerHTML = canalesActivos.map(canal => {

  const visual = CANALES[canal];

  return `
    <span class="chart-legend-item">

      <span
        class="chart-legend-color"
        style="background-color:${visual.color}"
      ></span>

      <span class="chart-legend-icon">
        ${escapeHTML(ICONOS_RRSS[canal] || "•")}
      </span>

      <span class="chart-legend-name">
        ${escapeHTML(visual.nombre)}
      </span>

    </span>
  `;

}).join("");
}

function calcularEscalaVisitas(maximoReal) {
  const maximo = Number(maximoReal || 0);

  if (maximo <= 5) {
    return {
      maximo: 5,
      paso: 1
    };
  }

  if (maximo <= 50) {
    return {
      maximo: Math.ceil(maximo / 10) * 10,
      paso: 10
    };
  }

  if (maximo <= 100) {
    return {
      maximo: 100,
      paso: 20
    };
  }

  if (maximo <= 500) {
    return {
      maximo: Math.ceil(maximo / 100) * 100,
      paso: 100
    };
  }

  if (maximo <= 1000) {
    return {
      maximo: Math.ceil(maximo / 200) * 200,
      paso: 200
    };
  }

  return {
    maximo: Math.ceil(maximo / 500) * 500,
    paso: 500
  };
}

function renderEscalaVertical(maximo, paso) {
  const contenedor = $("chartYFixed");
  if (!contenedor) return;

  const valores = [];

  for (let valor = maximo; valor >= 0; valor -= paso) {
    valores.push(valor);
  }

  contenedor.innerHTML = `

    <div class="chart-y-values">
      ${valores.map(valor => `
        <span>${numero(valor)}</span>
      `).join("")}
    </div>
  `;
}

function renderGraficoDias() {
  console.log("Entró a renderGraficoDias");
 const canvas = $("chartDias");
const scroll = $("chartScroll");
const canvasWrap = $("chartCanvasWrap");

const esMovil = window.matchMedia(
  "(max-width: 768px)"
).matches;

  if (
    !canvas ||
    !scroll ||
    !canvasWrap ||
    typeof Chart === "undefined"
  ) {
    return;
  }

  const visitas = visitasFiltradas();
const dias = [];

/*
 * Construimos todos los días del mes actual
 * en horario de Perú: 01, 02, 03... hasta 30 o 31.
 */
const hoyPeru = fechaISOEnPeru();
const [anioActual, mesActual] = hoyPeru
  .split("-")
  .map(Number);

const ultimoDiaDelMes = new Date(
  anioActual,
  mesActual,
  0
).getDate();

for (let numeroDia = 1; numeroDia <= ultimoDiaDelMes; numeroDia += 1) {
  dias.push(
    `${anioActual}-${String(mesActual).padStart(2, "0")}-${String(numeroDia).padStart(2, "0")}`
  );
}

  /*
   * Matriz:
   *
   * 2026-07-01:
   *   facebook: 0
   *   instagram: 0
   *   tiktok: 0
   *   youtube: 0
  /*
 * Detectamos automáticamente los canales que realmente
 * tienen visitas durante el mes mostrado.
 */
const canalesActivos = [
  ...new Set(
    visitas
      .filter(visita => {
        const dia = fechaISOEnPeru(visita.fecha);
        return dias.includes(dia);
      })
      .map(visita => visita.canal)
      .filter(Boolean)
  )
];

/*
 * Matriz diaria dinámica:
 * cada día contiene únicamente los canales existentes.
 */
const traficoPorDia = {};

dias.forEach(dia => {
  traficoPorDia[dia] = Object.fromEntries(
    canalesActivos.map(canal => [canal, 0])
  );
});

/*
 * Sumamos cada visita en su día y canal correspondiente.
 */
visitas.forEach(visita => {
  const dia = fechaISOEnPeru(visita.fecha);
  const canal = visita.canal;

  if (
    traficoPorDia[dia] &&
    canalesActivos.includes(canal)
  ) {
    traficoPorDia[dia][canal] += 1;
  }
});
  /*
   * Solo aparecen las redes que realmente tienen registros
   * para el cliente y período seleccionados.
   */
 

  renderLeyendaGrafico(canalesActivos);

  /*
   * El eje inferior muestra únicamente el número del día.
   */
  const labels = dias.map(dia => dia.slice(-2));

  /*
   * Construimos un conjunto de barras por cada red activa.
   */
  const datasets = canalesActivos.map(canal => {
    const visual = CANALES[canal];

    return {
      label: visual.nombre,

      data: dias.map(dia =>
        traficoPorDia[dia][canal]
      ),

      backgroundColor: visual.color,
      borderColor: visual.color,

      borderWidth: 0,
      borderRadius: 3,

      /*
 * Barras más visibles.
 */

barThickness: esMovil ? 28 : 38,
maxBarThickness: esMovil ? 30 : 40,

categoryPercentage: esMovil ? 0.82 : 0.96,
barPercentage: esMovil ? 0.86 : 1
    };
  });

  const maximoReal = Math.max(
  0,
  ...dias.flatMap(dia =>
    canalesActivos.map(canal =>
      traficoPorDia[dia][canal]
    )
  )
);

const escala = calcularEscalaVisitas(maximoReal);

renderEscalaVertical(
  escala.maximo,
  escala.paso
);

  /*
   * Aproximadamente 15 días visibles por pantalla.
   *
   * 30 días = dos anchos de pantalla:
   * primera vista 01–15;
   * segundo desplazamiento 16–30.
   */
  const anchoMinimo = esMovil ? 360 : 700;

const anchoVisible = Math.max(
  scroll.clientWidth,
  anchoMinimo
);

  const gruposVisibles = esMovil ? 7 : 15;

  const multiplicador = Math.max(
    1,
    Math.ceil(dias.length / gruposVisibles)
  );

  canvasWrap.style.width =
    `${anchoVisible * multiplicador}px`;

  if (OmegaHub.chartDias) {
    OmegaHub.chartDias.destroy();
  }

  OmegaHub.chartDias = new Chart(canvas, {
    type: "bar",

    data: {
      labels,
      datasets
    },

    options: {
  responsive: true,
  maintainAspectRatio: false,

  /*
   * Evita redibujos continuos cuando las barras del navegador
   * móvil aparecen o desaparecen durante el desplazamiento.
   */
  resizeDelay: esMovil ? 400 : 150,

  /*
   * En celulares evitamos renderizar el canvas a una densidad
   * excesiva. En algunos equipos el DPR puede ser 3 o superior.
   */
  devicePixelRatio: esMovil
    ? 1
    : Math.min(window.devicePixelRatio || 1, 2),

  /*
   * En móvil eliminamos animaciones e interacción porque no
   * utilizamos tooltips. Esto reduce bastante el trabajo gráfico.
   */
  animation: esMovil
    ? false
    : {
        duration: 300
      },

  events: esMovil
    ? []
    : [
        "mousemove",
        "mouseout",
        "click",
        "touchstart",
        "touchmove"
      ],

  interaction: {
    mode: "nearest",
    intersect: true
  },

      plugins: {
  legend: {
    display: false
  },

  tooltip: {
    enabled: false
  }
},
      scales: {
        x: {
          stacked: false,
          offset: true,

          ticks: {
            color: "#cbd5e1",
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0
          },

          grid: {
            display: false
          },

          border: {
            color: "rgba(148,163,184,.22)"
          }
        },

        y: {
  beginAtZero: true,
  min: 0,
  max: escala.maximo,
  grace: 0,

  ticks: {
    display: false,
    stepSize: escala.paso
  },

  grid: {
    color: "rgba(148,163,184,.12)"
  },

  border: {
    display: false
  }
}
      }
    }
  });

  /*
   * Cada vez que cambia de cliente, regresamos al día inicial.
   */
  scroll.scrollLeft = 0;
}

function renderCanales() {
  const contenedor = $("canalesResumen");
  if (!contenedor) return;

  /*
   * Tomamos únicamente los registros del cliente seleccionado
   * correspondientes al mes actual en horario de Perú.
   */
  const hoyPeru = fechaISOEnPeru();
  const mesActual = hoyPeru.slice(0, 7);

  const visitasDelMes = visitasFiltradas().filter(visita => {
    if (!visita.fecha) return false;

    return fechaISOEnPeru(visita.fecha).slice(0, 7) === mesActual;
  });

  const datos = contarPor(
    visitasDelMes,
    visita => visita.canal
  );

  /*
   * Las cuatro redes aparecen siempre y mantienen
   * permanentemente el mismo orden.
   */
  const canalesMostrar = Object.keys(datos)
  .filter(canal => datos[canal] > 0)
  .sort((a, b) => datos[b] - datos[a]);

  contenedor.innerHTML = canalesMostrar.map(canal => {
const visual = CANALES[canal] || {
  nombre: etiquetaCanal(canal),
  color: "#64748B"
};    

const total = datos[canal] || 0;

    return `
      <article
        class="channel-card"
        style="--channel-color:${visual.color}"
      >
        <div class="channel-name">
          <span class="channel-dot"></span>
          ${escapeHTML(visual.nombre)}
        </div>

        <strong>${numero(total)}</strong>

        <small>
          <small>
  ${total === 1
    ? "visita registrada"
    : "visitas registradas en el mes"}
</small>
      </article>
    `;
  }).join("");
}

function renderActividad() {
  const visitas = visitasFiltradas();

  if (!visitas.length) {
    setText("ultimaVisitaTiempo", "Sin registro");
    setText("ultimaVisitaDetalle", "Esperando actividad");
    setText("visitasEnVivo", "0 personas");
    return;
  }

  const ultima = visitas[0];

  setText("ultimaVisitaTiempo", fechaPeru(ultima.fecha));
  setText(
    "ultimaVisitaDetalle",
    `${ultima.cliente} · ${etiquetaCanal(ultima.canal)} · ${ultima.campania}`
  );

  const limite = Date.now() - (5 * 60 * 1000);
  const activas = visitas.filter(
    visita => new Date(visita.fecha).getTime() >= limite
  ).length;

  setText(
    "visitasEnVivo",
    `${numero(activas)} ${activas === 1 ? "persona" : "personas"}`
  );
}

function renderTabla() {
  const tbody = $("ultimasVisitasBody");
  if (!tbody) return;

  const visitas = visitasFiltradas().slice(0, 5);

  if (!visitas.length) {
    tbody.innerHTML = `<tr><td colspan="6" class="empty-state">No hay visitas registradas.</td></tr>`;
    return;
  }

  tbody.innerHTML = visitas.map(visita => {
    const destino = visita.destino
      ? `<a href="${escapeHTML(visita.destino)}" target="_blank" rel="noopener noreferrer">Abrir</a>`
      : "Sin destino";

    return `
      <tr>
        <td>${escapeHTML(fechaPeru(visita.fecha))}</td>
        <td>${escapeHTML(visita.cliente)}</td>
        <td>${escapeHTML(etiquetaCanal(visita.canal))}</td>
        <td>${escapeHTML(visita.campania)}</td>
        <td>${escapeHTML(visita.dispositivo)}</td>
        <td>${destino}</td>
      </tr>
    `;
  }).join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  renderFechaHora();
  setInterval(renderFechaHora, 1000);

  const selectorPeriodo = $("selectorPeriodo");

if (selectorPeriodo) {
  selectorPeriodo.onchange = () => {
    OmegaHub.periodoActivo =
      selectorPeriodo.value;

    renderGraficoHorario();
  };
}

  await cargarDatos();

  setInterval(cargarDatos, OmegaHub.refrescoMs);
});
