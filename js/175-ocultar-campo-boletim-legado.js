
// v175 - oculta o campo legado Boletim, mantendo seu valor interno.
function ocultarCampoBoletimLegadoV175() {
  const campo = document.getElementById("notaBoletim");
  if (!campo) return;

  campo.classList.add("campo-boletim-legado-v175");
  campo.style.display = "none";

  const label = campo.closest("label");
  if (label) {
    label.classList.add("campo-boletim-legado-v164");
    label.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ocultarCampoBoletimLegadoV175();
  setTimeout(ocultarCampoBoletimLegadoV175, 300);
  setTimeout(ocultarCampoBoletimLegadoV175, 1000);
});
