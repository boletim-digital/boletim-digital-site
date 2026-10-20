
// v180 - reforço final: número do boletim e ordem da lista.
function configurarBoletimEOrdemV180() {
  const legado = document.getElementById("notaBoletim");
  if (legado) {
    legado.required = false;
    legado.removeAttribute("required");
  }

  ["notaBoletimTipo", "notaBoletimCba", "notaBoletimObmBusca", "notaBoletimNumero"].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.v180 === "1") return;
    el.dataset.v180 = "1";
    el.addEventListener("input", () => {
      try { prepararBoletimAntesDaInclusaoV180(); } catch {}
    }, true);
    el.addEventListener("change", () => {
      try { prepararBoletimAntesDaInclusaoV180(); } catch {}
    }, true);
  });

  try { prepararBoletimAntesDaInclusaoV180(); } catch {}
}

(function reforcarRenderV180() {
  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalFinalV180) {
      window.renderizarNotasOriginalFinalV180 = renderizarNotas;
      renderizarNotas = function(...args) {
        try { ordenarNotasPorDataEInsercaoV180(); } catch {}
        return window.renderizarNotasOriginalFinalV180.apply(this, args);
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarBoletimEOrdemV180();
  setTimeout(configurarBoletimEOrdemV180, 300);
  setTimeout(configurarBoletimEOrdemV180, 1000);
});

document.addEventListener("submit", event => {
  if (event.target && event.target.id === "formNota") {
    try { prepararBoletimAntesDaInclusaoV180(); } catch {}
  }
}, true);
