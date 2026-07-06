// ============================================================
// OMEGAHUB PLATFORM — DATABASE ADAPTERS
// Release 2.3.2
// Traduce Supabase al modelo interno de OmegaHub
// ============================================================

function adaptarCliente(row) {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre || row.razon_social || row.codigo || "Cliente",
    estado: row.estado || "activo",
    dashboardActivo: row.dashboard_activo ?? true,
    plan: row.plan || "",
    createdAt: row.created_at || null,
    raw: row
  };
}

function adaptarCanal(row) {
  const nombre = row.nombre || row.canal || row.tipo || "Canal digital";
  const tipo = normalizarTipoCanal(row.tipo || row.canal || nombre);

  return {
    id: row.id,
    clienteId: row.cliente_id || null,
    clienteCodigo: row.cliente_codigo || row.codigo_cliente || null,
    nombre,
    tipo,
    url: row.url || row.enlace || row.link || "",
    activo: row.activo ?? true,
    observaciones: row.observaciones || "",
    createdAt: row.created_at || null,
    raw: row
  };
}

function adaptarVisita(row) {
  const origen = row.origen || row.canal || row.source || "directo";
  const canalNormalizado = normalizarTipoCanal(origen);

  return {
    id: row.id,
    clienteId: row.cliente_id || null,
    clienteCodigo: row.cliente_codigo || row.codigo_cliente || row.cliente || null,

    canalId: row.canal_id || null,
    canalNombre: canalNormalizado,
    origen: canalNormalizado,

    campania: row.campania || row.campaña || null,
    destino: row.destino || row.pagina || null,

    dispositivo: row.dispositivo || row.device || row.tipo_dispositivo || "No identificado",
    navegador: row.navegador || null,

    createdAt: row.created_at || row.fecha || null,
    raw: row
  };
}

function normalizarTipoCanal(valor) {
  let texto = String(valor || "general")
    .trim()
    .toLowerCase();

// Elimina parámetros UTM o basura que venga en el origen
texto = texto.split("?")[0];
texto = texto.split("&")[0];
texto = texto.split("utm_")[0];
texto = texto.trim();

  const mapa = {
    facebook: "facebook",
    fb: "facebook",

    instagram: "instagram",
    ig: "instagram",

    tiktok: "tiktok",
    "tik tok": "tiktok",

    youtube: "youtube",
    yt: "youtube",

    whatsapp: "whatsapp",
    "whats app": "whatsapp",
    wa: "whatsapp",

    "google business": "google_business",
    "google my business": "google_business",
    google: "google_business",

    web: "web",
    "página web": "web",
    "pagina web": "web",

    "shopper digital": "shopper_digital",
    shopper: "shopper_digital",

    directo: "directo",
    direct: "directo",

    prueba: "prueba"
  };

  return mapa[texto] || texto.replaceAll(" ", "_");
}

function etiquetaCanal(tipo) {
  const mapa = {
    facebook: "Facebook",
    instagram: "Instagram",
    tiktok: "TikTok",
    youtube: "YouTube",
    whatsapp: "WhatsApp",
    google_business: "Google Business",
    shopper_digital: "Shopper Digital",
    web: "Página Web",
    directo: "Directo",
    prueba: "Prueba"
  };

  return mapa[tipo] || tipo;
}

window.OmegaAdapters = {
  adaptarCliente,
  adaptarCanal,
  adaptarVisita,
  normalizarTipoCanal,
  etiquetaCanal
};