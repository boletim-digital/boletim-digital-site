
// v208 - limpeza segura da impressão, sem ocultar containers principais.

function limparControlesImpressaoBoletimV208() {
  if (!document.body.classList.contains("impressao-boletim-completo-v201")) return;

  ["paginacao", "controlesNotas", "painelCalendario", "modalImpressao"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add("nao-imprimir-v208");
  });

  document.querySelectorAll(".paginacao, .controles-paginacao").forEach(el => {
    el.classList.add("nao-imprimir-v208");
  });
}

document.addEventListener("beforeprint", limparControlesImpressaoBoletimV208);
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(limparControlesImpressaoBoletimV208, 300);
});
