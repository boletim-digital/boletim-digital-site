
// v202 - usa a imagem real do cabeçalho como base na impressão do boletim.
// Mantém somente o texto do boletim e FL. X como sobreposição.

function aplicarCabecalhoImagemExataV202() {
  const area = document.getElementById("areaImpressao");
  if (!area) return;

  // Só atua no boletim paginado da v201.
  if (!document.body.classList.contains("impressao-boletim-completo-v201")) return;

  area.querySelectorAll(".cabecalho-modelo-v201").forEach(cab => {
    if (cab.dataset.v202 === "1") return;
    cab.dataset.v202 = "1";

    // Remove os elementos desenhados em CSS da v201, mantendo só título e folha.
    cab.querySelectorAll(
      ".logo-defesa-civil-v201, .brasao-bombeiros-v201, .defesa-civil-topo-v201, .defesa-civil-miolo-v201, .defesa-civil-base-v201"
    ).forEach(el => el.remove());

    cab.classList.add("cabecalho-imagem-exata-v202");

    const titulo = cab.querySelector(".titulo-boletim-v201");
    if (titulo) titulo.classList.add("titulo-sobre-imagem-v202");

    const folha = cab.querySelector(".folha-v201");
    if (folha) folha.classList.add("folha-sobre-imagem-v202");
  });
}

(function reforcarCabecalhoImagemExataV202() {
  try {
    if (typeof montarPaginasBoletimV201 === "function" && !window.montarPaginasBoletimOriginalV202) {
      window.montarPaginasBoletimOriginalV202 = montarPaginasBoletimV201;

      montarPaginasBoletimV201 = function(...args) {
        const r = window.montarPaginasBoletimOriginalV202.apply(this, args);
        setTimeout(aplicarCabecalhoImagemExataV202, 0);
        setTimeout(aplicarCabecalhoImagemExataV202, 120);
        return r;
      };

      window.montarPaginasBoletimV201 = montarPaginasBoletimV201;
    }
  } catch {}
})();

document.addEventListener("beforeprint", aplicarCabecalhoImagemExataV202);

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(aplicarCabecalhoImagemExataV202, 300);
});
