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

const LINEAS_COMERCIALES = {
  lanzamiento_app: "App Lanzamiento",
  app: "App Lanzamiento",

  app_usuarios: "App Usuarios",
app_screenshots: "Mes Gratis",

  renova: "Renova",
  videos_tiktok: "Videos para TikTok"
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

function obtenerLineaComercial(visita) {
  const campania = String(
    visita?.campania || ""
  ).trim().toLowerCase();

  if (LINEAS_COMERCIALES[campania]) {
    return LINEAS_COMERCIALES[campania];
  }

  if (campania.includes("renova")) {
    return "Renova";
  }

  if (
    campania.includes("tiktok") &&
    campania.includes("video")
  ) {
    return "Videos para TikTok";
  }

  if (
    campania.includes("app") ||
    campania.includes("shopper")
  ) {
    return "App";
  }

  return campania
    ? campania
        .replaceAll("_", " ")
        .replaceAll("-", " ")
        .replace(/\b\w/g, letra => letra.toUpperCase())
    : "Sin línea";
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
  const esMovil = window.matchMedia(
  "(max-width: 768px)"
).matches;

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

          backgroundColor: segmentos.map(segmento =>
  segmento.clave === principal.clave
    ? segmento.color
    : "#d7dde5"
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
  enabled: !esMovil,

  callbacks: {
    title(elementos) {
      const indice = elementos[0]?.dataIndex;

      if (indice === undefined) {
        return "";
      }

      return `${labels[indice]} de julio`;
    },

    label(contexto) {
      const valor = Number(contexto.raw || 0);

      return `${numero(valor)} ${
        valor === 1 ? "visita" : "visitas"
      }`;
    }
  }
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

  const TAMANO_PAGINA = 1000;
  const MAXIMO_PAGINAS = 50;

  let todasLasVisitas = [];
  let pagina = 0;

  while (pagina < MAXIMO_PAGINAS) {
    const desde = pagina * TAMANO_PAGINA;
    const hasta = desde + TAMANO_PAGINA - 1;

    let consulta = supabaseClient
      .from("visitas")
      .select("*")
      .order("created_at", { ascending: false })
      .range(desde, hasta);

    if (OmegaHub.modoCliente) {
      consulta = consulta.eq(
        "cliente",
        OmegaHub.clienteActivo
      );
    }

    const { data, error } = await consulta;

    if (error) {
      console.error(
        `Error cargando visitas en página ${pagina + 1}:`,
        error
      );
      setEstado("Error de conexión", "error");
      return;
    }

    const lote = data || [];
    todasLasVisitas.push(...lote);

    if (lote.length < TAMANO_PAGINA) {
      break;
    }

    pagina++;
  }

  console.log("Registros descargados:", todasLasVisitas.length);
  OmegaHub.visitas = todasLasVisitas.map(normalizarVisita);
  console.log("Registros normalizados:", OmegaHub.visitas.length);

  console.log(
    `Picapiedra cargó ${OmegaHub.visitas.length} visitas`
  );

  setEstado("OmegaHub conectado", "ok");
  renderTodo();
}

function renderTodo() {
  if (typeof renderFechaHora === "function") {
    renderFechaHora();
  }

  renderSelectorClientes();
  renderHeaderCliente();
  renderKPIs();
  renderGraficoDias();
  renderCanales();
  renderGraficoHorario();
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
  const visitas = visitasDelPeriodoSeleccionado();
  const detallePorPeriodo = {
  hoy: "Registrado hoy en OmegaHub",
  semana: "Registrado esta semana en OmegaHub",
  mes: "Registrado este mes en OmegaHub",
  anio: "Registrado este año en OmegaHub"
};

setText(
  "detallePeriodoKpi",
  detallePorPeriodo[OmegaHub.periodoActivo] ||
    "Registrado hoy en OmegaHub"
);
  const hoy = fechaISOEnPeru();

  const visitasHoy = visitas.filter(
    visita => fechaISOEnPeru(visita.fecha) === hoy
  ).length;

  const porLinea = contarPor(
  visitas,
  visita => obtenerLineaComercial(visita)
);

const lider = Object.entries(porLinea)
  .sort((a, b) => b[1] - a[1])[0];
  const clientesActivos = new Set(
    visitas.map(visita => visita.cliente).filter(Boolean)
  ).size;

  setText("totalVisitas", numero(visitas.length));
  setText("visitasHoy", numero(visitasHoy));
  setText(
  "canalLider",
  lider ? lider[0] : "Sin datos"
);

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
function renderLeyendaGrafico() {
  const contenedor = $("chartLegend");
  if (!contenedor) return;

  const visitasPeriodo =
    visitasDelPeriodoSeleccionado();

  const visitasGenerales =
    visitasFiltradas();

  const coloresCampanias = [
    "#38bdf8",
    "#f59e0b",
    "#8b5cf6",
    "#22c55e"
  ];

  /*
   * Orden histórico permanente:
   * cada campaña conserva siempre su color,
   * aunque cambie el período seleccionado.
   */
  const totalesGenerales = contarPor(
    visitasGenerales,
    visita => obtenerLineaComercial(visita)
  );

  const ordenGeneralCampanias =
    Object.entries(totalesGenerales)
      .filter(([, total]) => total > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([campania]) => campania)
      .slice(0, 4);

  /*
   * Totales correspondientes al período visible.
   */
  const totalesPeriodo = contarPor(
    visitasPeriodo,
    visita => obtenerLineaComercial(visita)
  );

  const campaniasActivas =
    ordenGeneralCampanias
      .filter(campania =>
        Number(totalesPeriodo[campania] || 0) > 0
      )
      .map(campania => [
        campania,
        Number(totalesPeriodo[campania] || 0)
      ]);

  if (!campaniasActivas.length) {
    contenedor.innerHTML = `
      <span class="chart-legend-name">
        Sin campañas registradas en este período
      </span>
    `;

    contenedor.style.display = "flex";
    return;
  }

  contenedor.innerHTML = campaniasActivas
    .map(([campania, total]) => {
      const posicionColor =
        ordenGeneralCampanias.indexOf(campania);

      const color =
        coloresCampanias[
          posicionColor % coloresCampanias.length
        ];

      return `
        <span class="chart-legend-item">

          <span
            class="chart-legend-color"
            style="background-color:${color}"
          ></span>

          <span class="chart-legend-name">
            ${escapeHTML(campania)}
          </span>

          <strong>
            ${numero(total)}
            ${total === 1 ? "visita" : "visitas"}
          </strong>

        </span>
      `;
    })
    .join("");

  contenedor.style.display = "flex";
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

/*
 * Muestra sobre cada grupo de barras el total exacto
 * de visitas registradas durante ese día.
 */
/*
 * Muestra encima de cada barra
 * el valor individual de esa campaña.
 */
const etiquetasTotalesPorDia = {
  id: "etiquetasTotalesPorDia",

  afterDatasetsDraw(chart) {
    const { ctx, data } = chart;

    if (!data.labels?.length || !data.datasets?.length) {
      return;
    }

    ctx.save();

    ctx.fillStyle = "#f8fafc";
    ctx.font = "700 12px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";

    data.datasets.forEach((dataset, indiceDataset) => {
      if (!chart.isDatasetVisible(indiceDataset)) {
        return;
      }

      const meta = chart.getDatasetMeta(indiceDataset);

      meta.data.forEach((barra, indiceDia) => {
        const valor = Number(dataset.data[indiceDia] || 0);

        if (!barra || valor <= 0) {
          return;
        }

        ctx.fillText(
          String(valor),
          barra.x,
          barra.y - 7
        );
      });
    });

    ctx.restore();
  }
};

    

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

  const periodo = OmegaHub.periodoActivo;
  const hoyPeru = fechaISOEnPeru();

  /*
   * Solo utilizamos las visitas correspondientes
   * al período actualmente seleccionado.
   */
  const visitasPeriodo =
    visitasDelPeriodoSeleccionado();

  /*
   * Las visitas generales del cliente se usan únicamente
   * para conservar siempre el mismo orden y color
   * de las campañas.
   */
  const visitasGenerales =
    visitasFiltradas();

  const categorias = [];

  /*
   * HOY:
   * una única categoría correspondiente al día actual.
   */
  if (periodo === "hoy") {
    categorias.push({
      clave: hoyPeru,
      etiqueta: formatearEtiquetaHoy(hoyPeru)
    });
  }

  /*
   * SEMANA:
   * siete categorías, de lunes a domingo.
   */
  if (periodo === "semana") {
    const fechaHoy = new Date(
      `${hoyPeru}T12:00:00-05:00`
    );

    const diaSemana = fechaHoy.getDay();

    const retroceso =
      diaSemana === 0
        ? 6
        : diaSemana - 1;

    const inicioSemana = new Date(fechaHoy);

    inicioSemana.setDate(
      inicioSemana.getDate() - retroceso
    );

    for (
      let indice = 0;
      indice < 7;
      indice += 1
    ) {
      const fechaCategoria =
        new Date(inicioSemana);

      fechaCategoria.setDate(
        inicioSemana.getDate() + indice
      );

      const fechaISO =
        fechaISOEnPeru(fechaCategoria);

      categorias.push({
        clave: fechaISO,
        etiqueta: formatearEtiquetaSemana(
          fechaISO
        )
      });
    }
  }

  /*
   * MES:
   * una categoría por cada día del mes actual.
   */
  if (periodo === "mes") {
    const [anioActual, mesActual] =
      hoyPeru.split("-").map(Number);

    const ultimoDiaDelMes = new Date(
      anioActual,
      mesActual,
      0
    ).getDate();

    for (
      let numeroDia = 1;
      numeroDia <= ultimoDiaDelMes;
      numeroDia += 1
    ) {
      const fechaISO =
        `${anioActual}-` +
        `${String(mesActual).padStart(2, "0")}-` +
        `${String(numeroDia).padStart(2, "0")}`;

      categorias.push({
        clave: fechaISO,
        etiqueta:
          String(numeroDia).padStart(2, "0")
      });
    }
  }

  /*
   * AÑO:
   * exactamente doce categorías, una por mes.
   */
  if (periodo === "anio") {
    const anioActual =
      hoyPeru.slice(0, 4);

    const nombresMeses = [
      "Ene", "Feb", "Mar", "Abr",
      "May", "Jun", "Jul", "Ago",
      "Sep", "Oct", "Nov", "Dic"
    ];

    for (
      let mes = 1;
      mes <= 12;
      mes += 1
    ) {
      const mesTexto =
        String(mes).padStart(2, "0");

      categorias.push({
        clave: `${anioActual}-${mesTexto}`,
        etiqueta: nombresMeses[mes - 1]
      });
    }
  }

  /*
   * Máximo operativo aprobado: cuatro campañas.
   */
  const coloresCampanias = [
    "#38bdf8",
    "#f59e0b",
    "#8b5cf6",
    "#22c55e"
  ];

  /*
   * Orden general y permanente de las campañas.
   * Esto evita que una campaña cambie de color
   * al seleccionar otro período.
   */
  const totalesGenerales = contarPor(
    visitasGenerales,
    visita => obtenerLineaComercial(visita)
  );

  const ordenGeneralCampanias =
    Object.entries(totalesGenerales)
      .filter(([, total]) => total > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([campania]) => campania)
      .slice(0, 4);

  /*
   * Campañas con actividad dentro del período.
   */
  const campaniasDelPeriodo = [
    ...new Set(
      visitasPeriodo
        .map(visita =>
          obtenerLineaComercial(visita)
        )
        .filter(Boolean)
    )
  ];

  const campaniasActivas =
    ordenGeneralCampanias.filter(
      campania =>
        campaniasDelPeriodo.includes(campania)
    );

  /*
   * Inicializamos la matriz de tráfico.
   */
  const traficoPorCategoria = {};

  categorias.forEach(categoria => {
    traficoPorCategoria[categoria.clave] =
      Object.fromEntries(
        campaniasActivas.map(campania => [
          campania,
          0
        ])
      );
  });

  /*
   * Sumamos cada visita en la categoría correcta.
   *
   * Hoy, Semana y Mes: YYYY-MM-DD
   * Año: YYYY-MM
   */
  visitasPeriodo.forEach(visita => {
    if (!visita.fecha) return;

    const fecha =
      fechaISOEnPeru(visita.fecha);

    const clave =
      periodo === "anio"
        ? fecha.slice(0, 7)
        : fecha;

    const campania =
      obtenerLineaComercial(visita);

    if (
      traficoPorCategoria[clave] &&
      campaniasActivas.includes(campania)
    ) {
      traficoPorCategoria[clave][campania] += 1;
    }
  });

  /*
   * Actualiza la tarjeta de campañas.
   */
  renderLeyendaGrafico();

  const labels = categorias.map(
    categoria => categoria.etiqueta
  );

  const datasets = campaniasActivas.map(
    campania => {
      const posicionColor =
        ordenGeneralCampanias.indexOf(campania);

      const indiceColor =
        posicionColor >= 0
          ? posicionColor %
            coloresCampanias.length
          : 0;

      const color =
        coloresCampanias[indiceColor];

      return {
        label: campania,

        data: categorias.map(categoria =>
          Number(
            traficoPorCategoria[
              categoria.clave
            ]?.[campania] || 0
          )
        ),

        backgroundColor: color,
        borderColor: color,

        borderWidth: 0,
        borderRadius: 3,

        barThickness: esMovil ? 22 : 32,
        maxBarThickness: esMovil ? 24 : 34,

        categoryPercentage:
          esMovil ? 0.84 : 0.9,

        barPercentage:
          esMovil ? 0.86 : 0.9
      };
    }
  );

  /*
   * La escala se calcula usando el total combinado
   * de todas las campañas en cada categoría.
   */
  const maximoReal = Math.max(
    0,
    ...categorias.map(categoria =>
      campaniasActivas.reduce(
        (total, campania) =>
          total +
          Number(
            traficoPorCategoria[
              categoria.clave
            ]?.[campania] || 0
          ),
        0
      )
    )
  );

  const escala =
    calcularEscalaVisitas(maximoReal);

  renderEscalaVertical(
    escala.maximo,
    escala.paso
  );

  /*
   * Control del desplazamiento horizontal.
   * Hoy, Semana y Año caben en una vista.
   * El mes conserva el desplazamiento.
   */
  const anchoMinimo =
    esMovil ? 360 : 700;

  const anchoVisible = Math.max(
    scroll.clientWidth,
    anchoMinimo
  );

  let multiplicador = 1;

  if (periodo === "mes") {
    const gruposVisibles =
      esMovil ? 7 : 16;

    multiplicador = Math.max(
      1,
      Math.ceil(
        categorias.length / gruposVisibles
      )
    );
  }

  canvasWrap.style.width =
    `${anchoVisible * multiplicador}px`;

  if (OmegaHub.chartDias) {
    OmegaHub.chartDias.destroy();
  }

  OmegaHub.chartDias = new Chart(canvas, {
    type: "bar",

    plugins: [
  // etiquetasTotalesPorDia
],

    data: {
      labels,
      datasets
    },

    options: {
      responsive: true,
      maintainAspectRatio: false,

      layout: {
        padding: {
          top: 26
        }
      },

      resizeDelay:
        esMovil ? 400 : 150,

      devicePixelRatio:
        esMovil
          ? 1
          : Math.min(
              window.devicePixelRatio || 1,
              2
            ),

      animation:
        esMovil
          ? false
          : {
              duration: 300
            },

      events:
        esMovil
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
            color:
              "rgba(148,163,184,.22)"
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
            color:
              "rgba(148,163,184,.12)"
          },

          border: {
            display: false
          }
        }
      }
    }
  });

  scroll.scrollLeft = 0;

  /*
   * Funciones internas de formato.
   */
  function formatearEtiquetaHoy(fechaISO) {
    const nombresMeses = [
      "Ene", "Feb", "Mar", "Abr",
      "May", "Jun", "Jul", "Ago",
      "Sep", "Oct", "Nov", "Dic"
    ];

    const dia =
      fechaISO.slice(8, 10);

    const indiceMes =
      Number(fechaISO.slice(5, 7)) - 1;

    return `${dia} ${nombresMeses[indiceMes]}`;
  }

  function formatearEtiquetaSemana(fechaISO) {
    const nombresDias = [
      "Dom", "Lun", "Mar", "Mié",
      "Jue", "Vie", "Sáb"
    ];

    const fecha = new Date(
      `${fechaISO}T12:00:00-05:00`
    );

    const nombreDia =
      nombresDias[fecha.getDay()];

    const dia =
      fechaISO.slice(8, 10);

    return `${nombreDia} ${dia}`;
  }
}

function renderCanales() {
  const contenedor = $("canalesResumen");
  if (!contenedor) return;

  /*
   * Todos los canales utilizan exactamente
   * el período seleccionado en el dashboard.
   */
  const visitasPeriodo =
    visitasDelPeriodoSeleccionado();

  const datos = contarPor(
    visitasPeriodo,
    visita => visita.canal
  );

  const canalesMostrar = Object.keys(datos)
    .filter(canal => datos[canal] > 0)
    .sort((a, b) => datos[b] - datos[a]);

  const textosPeriodo = {
    hoy: {
      singular: "visita registrada hoy",
      plural: "visitas registradas hoy"
    },

    semana: {
      singular: "visita registrada esta semana",
      plural: "visitas registradas esta semana"
    },

    mes: {
      singular: "visita registrada este mes",
      plural: "visitas registradas este mes"
    },

    anio: {
      singular: "visita registrada este año",
      plural: "visitas registradas este año"
    }
  };

  const textoPeriodo =
    textosPeriodo[OmegaHub.periodoActivo] ||
    textosPeriodo.hoy;

  if (!canalesMostrar.length) {
    contenedor.innerHTML = `
      <div class="empty-state">
        No hay tráfico por canal en este período.
      </div>
    `;

    return;
  }

  contenedor.innerHTML = canalesMostrar
    .map(canal => {
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

          <strong>
            ${numero(total)}
          </strong>

          <small>
            ${
              total === 1
                ? textoPeriodo.singular
                : textoPeriodo.plural
            }
          </small>
        </article>
      `;
    })
    .join("");
}

function renderActividad() {
  /*
   * La actividad utiliza el mismo período
   * seleccionado en todo el dashboard.
   */
  const visitas =
    visitasDelPeriodoSeleccionado();

  if (!visitas.length) {
    setText(
      "ultimaVisitaTiempo",
      "Sin registro"
    );

    setText(
      "ultimaVisitaDetalle",
      "Esperando actividad"
    );

    setText(
      "visitasEnVivo",
      "0 personas"
    );

    return;
  }

  const ultima = visitas[0];

  setText(
    "ultimaVisitaTiempo",
    fechaPeru(ultima.fecha)
  );

  setText(
    "ultimaVisitaDetalle",
    `${ultima.cliente} · ` +
    `${etiquetaCanal(ultima.canal)} · ` +
    `${ultima.campania}`
  );

  /*
   * El dato “en vivo” continúa considerando
   * únicamente los últimos cinco minutos.
   */
  const limite =
    Date.now() - (5 * 60 * 1000);

  const activas = visitas.filter(
    visita =>
      new Date(visita.fecha).getTime() >= limite
  ).length;

  setText(
    "visitasEnVivo",
    `${numero(activas)} ${
      activas === 1
        ? "persona"
        : "personas"
    }`
  );
}

function renderTabla() {
  const tbody = $("ultimasVisitasBody");
  if (!tbody) return;

  /*
   * La tabla respeta el mismo período
   * seleccionado en todo el dashboard.
   */
  const visitas = visitasDelPeriodoSeleccionado()
    .slice(0, 5);

  if (!visitas.length) {
    tbody.innerHTML = `
      <tr>
        <td
          colspan="6"
          class="empty-state"
        >
          No hay visitas registradas en este período.
        </td>
      </tr>
    `;

    return;
  }

  tbody.innerHTML = visitas
    .map(visita => {
      const destino = visita.destino
        ? `
          <a
            href="${escapeHTML(visita.destino)}"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir
          </a>
        `
        : "Sin destino";

      return `
        <tr>
          <td>
            ${escapeHTML(fechaPeru(visita.fecha))}
          </td>

          <td>
            ${escapeHTML(visita.cliente)}
          </td>

          <td>
            ${escapeHTML(
              etiquetaCanal(visita.canal)
            )}
          </td>

          <td>
            ${escapeHTML(visita.campania)}
          </td>

          <td>
            ${escapeHTML(visita.dispositivo)}
          </td>

          <td>
            ${destino}
          </td>
        </tr>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  if (typeof renderFechaHora === "function") {
    renderFechaHora();
    setInterval(() => {
      renderFechaHora();
    }, 1000);
  }

  const selectorPeriodo = $("selectorPeriodo");

  if (selectorPeriodo) {
    selectorPeriodo.onchange = () => {
  OmegaHub.periodoActivo = selectorPeriodo.value;

  renderKPIs();
  renderGraficoDias();
  renderCanales();
  renderGraficoHorario();
  renderActividad();
  renderTabla();
};
  }

  await cargarDatos();

  setInterval(() => {
    cargarDatos();
  }, OmegaHub.refrescoMs);
});