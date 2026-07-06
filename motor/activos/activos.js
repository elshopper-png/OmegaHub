// ============================================================
// OMEGAHUB PLATFORM — MOTOR DE ACTIVOS DIGITALES
// Release 2.3.1 — Atlas Digital
// ============================================================

const ACTIVOS_OMEGA = {
  facebook: {
    nombre: "Facebook",
    icono: "📘",
    color: "#1877F2",
    categoria: "red_social",
    decision: "comunidad_alcance"
  },

  instagram: {
    nombre: "Instagram",
    icono: "📸",
    color: "#E4405F",
    categoria: "red_social",
    decision: "contenido_visual"
  },

  tiktok: {
    nombre: "TikTok",
    icono: "🎵",
    color: "#111111",
    categoria: "red_social",
    decision: "descubrimiento"
  },

  youtube: {
    nombre: "YouTube",
    icono: "▶️",
    color: "#FF0000",
    categoria: "video",
    decision: "contenido_largo"
  },

  whatsapp: {
    nombre: "WhatsApp",
    icono: "🟢",
    color: "#25D366",
    categoria: "contacto",
    decision: "conversion_directa"
  },

  google_business: {
    nombre: "Google Business",
    icono: "📍",
    color: "#4285F4",
    categoria: "busqueda_local",
    decision: "intencion_compra"
  },

  web: {
    nombre: "Página Web",
    icono: "🌐",
    color: "#2563EB",
    categoria: "propio",
    decision: "presencia_digital"
  },

  landing_page: {
    nombre: "Landing Page",
    icono: "🎯",
    color: "#7C3AED",
    categoria: "conversion",
    decision: "campaña_especifica"
  },

  shopper_digital: {
    nombre: "Shopper Digital",
    icono: "🛒",
    color: "#F59E0B",
    categoria: "directorio_comercial",
    decision: "ecosistema_local"
  },

  meta_ads: {
    nombre: "Campañas Meta",
    icono: "📣",
    color: "#0668E1",
    categoria: "publicidad",
    decision: "inversion_pagada"
  },

  google_ads: {
    nombre: "Campañas Google",
    icono: "🔎",
    color: "#34A853",
    categoria: "publicidad",
    decision: "demanda_activa"
  },

  tiktok_ads: {
    nombre: "Campañas TikTok",
    icono: "⚡",
    color: "#000000",
    categoria: "publicidad",
    decision: "descubrimiento_pagado"
  }
};

function obtenerActivoOmega(tipo) {
  return ACTIVOS_OMEGA[tipo] || {
    nombre: "Activo Digital",
    icono: "🔗",
    color: "#64748B",
    categoria: "general",
    decision: "medicion_general"
  };
}

function enriquecerCanalComoActivo(canal) {
  const tipo = canal.tipo || "general";
  const activo = obtenerActivoOmega(tipo);

  return {
    ...canal,
    activo_nombre: activo.nombre,
    activo_icono: activo.icono,
    activo_color: activo.color,
    activo_categoria: activo.categoria,
    activo_decision: activo.decision
  };
}