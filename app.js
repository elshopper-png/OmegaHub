const campania = obtenerCampania();

console.log("Campaña detectada:", campania);

if (campania && campania.destino) {
  setTimeout(() => {
    window.location.href = campania.destino;
  }, 300);
} else {
  console.error("No se encontró destino para esta campaña");
}