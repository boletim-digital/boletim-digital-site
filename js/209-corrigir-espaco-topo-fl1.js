
// v209 - corrige espaço grande acima do cabeçalho na FL. 1.

function prepararPrimeiraFolhaSemEspacoV209() {
  if (!document.body.classList.contains("impressao-boletim-completo-v201")) return;

  const area = document.getElementById("areaImpressao");
  if (!area) return;

  // Garante que a área de impressão seja o primeiro elemento relevante do body.
  // Isso evita que algum container/controle visual ocupe espaço antes dela na primeira página.
  if (document.body.firstElementChild !== area) {
    document.body.insertBefore(area, document.body.firstElementChild);
  }

  area.classList.add("area-impressao-topo-v209");

  const primeiraPagina = area.querySelector(".pagina-boletim-v201:first-child");
  if (primeiraPagina) primeiraPagina.classList.add("primeira-folha-v209");

  const primeiroCabecalho = area.querySelector(".pagina-boletim-v201:first-child .cabecalho-pagina-boletim-v201");
  if (primeiroCabecalho) primeiroCabecalho.classList.add("primeiro-cabecalho-v209");
}

document.addEventListener("beforeprint", prepararPrimeiraFolhaSemEspacoV209);

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(prepararPrimeiraFolhaSemEspacoV209, 300);
});

(function reforcarMontagemV209() {
  try {
    if (typeof montarAreaImpressao === "function" && !window.montarAreaImpressaoOriginalV209) {
      window.montarAreaImpressaoOriginalV209 = montarAreaImpressao;

      montarAreaImpressao = function(...args) {
        const r = window.montarAreaImpressaoOriginalV209.apply(this, args);
        setTimeout(prepararPrimeiraFolhaSemEspacoV209, 0);
        setTimeout(prepararPrimeiraFolhaSemEspacoV209, 80);
        return r;
      };

      window.montarAreaImpressao = montarAreaImpressao;
    }
  } catch {}
})();
