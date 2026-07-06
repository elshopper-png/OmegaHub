// ============================================================
// OMEGAHUB PLATFORM
// Clase Base de Activos Digitales
// Release 2.3.1
// ============================================================

class ActivoDigital {
  constructor(config = {}) {
    this.id = config.id ?? null;
    this.clienteId = config.clienteId ?? config.cliente_id ?? null;
    this.tipo = config.tipo ?? "general";
    this.nombre = config.nombre ?? "Activo Digital";
    this.url = config.url ?? config.enlace ?? "";
    this.estado = config.estado ?? "activo";
    this.icono = config.icono ?? "🔗";
    this.color = config.color ?? "#64748B";
    this.categoria = config.categoria ?? "general";
    this.decision = config.decision ?? "medicion_general";

    this.metricas = {
      visitas: 0,
      clics: 0,
      conversiones: 0,
      impresiones: 0,
      alcance: 0,
      engagement: 0,
      ...config.metricas
    };

    this.ultimaActualizacion = config.ultimaActualizacion ?? null;
  }

  actualizarMetricas(metricas = {}) {
    this.metricas = { ...this.metricas, ...metricas };
    this.ultimaActualizacion = new Date();
  }

  getTasaConversion() {
    if (this.metricas.visitas === 0) return 0;
    return (this.metricas.conversiones / this.metricas.visitas) * 100;
  }

  getEstadoSalud() {
    if (this.metricas.visitas === 0) return "sin_datos";

    const tasa = this.getTasaConversion();

    if (tasa >= 10) return "excelente";
    if (tasa >= 5) return "buena";
    if (tasa >= 2) return "regular";

    return "atencion";
  }

  generarResumen() {
    return {
      id: this.id,
      clienteId: this.clienteId,
      tipo: this.tipo,
      nombre: this.nombre,
      visitas: this.metricas.visitas,
      conversiones: this.metricas.conversiones,
      tasaConversion: this.getTasaConversion(),
      salud: this.getEstadoSalud(),
      ultimaActualizacion: this.ultimaActualizacion
    };
  }
}

window.ActivoDigital = ActivoDigital;