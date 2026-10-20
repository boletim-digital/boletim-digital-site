
// v196 - reposiciona indicadores situacionais antes do Favorito e do +/−.
// Ordem desejada: indicadores situacionais → favorito → +/−.

function reposicionarIndicadoresNotasV196() {
  const cards = Array.from(document.querySelectorAll("#listaNotas article.nota, #listaNotas .nota"));

  cards.forEach(card => {
    const titulo = card.querySelector(".titulo-nota");
    if (!titulo) return;

    const grupo = titulo.querySelector(".grupo-indicadores-nota-v195");
    if (!grupo) return;

    const estrela =
      titulo.querySelector(".btn-favorito-v194") ||
      titulo.querySelector(".btn-favorito-nota-v159") ||
      titulo.querySelector(".btn-favorito-v193") ||
      titulo.querySelector(".btn-favorito-v192") ||
      titulo.querySelector(".btn-favorito-v191") ||
      titulo.querySelector(".btn-favorito-v190");

    const icone = titulo.querySelector(".icone");

    // Preferência: antes da estrela de favoritos.
    // Se por algum motivo a estrela ainda não existir, fica antes do +/−.
    if (estrela) {
      titulo.insertBefore(grupo, estrela);
    } else if (icone) {
      titulo.insertBefore(grupo, icone);
    } else {
      titulo.appendChild(grupo);
    }
  });
}

(function reforcarRenderReposicionamentoV196() {
  try {
    if (typeof aplicarIndicadoresNotasV195 === "function" && !window.aplicarIndicadoresNotasOriginalV196) {
      window.aplicarIndicadoresNotasOriginalV196 = aplicarIndicadoresNotasV195;

      aplicarIndicadoresNotasV195 = function(...args) {
        const r = window.aplicarIndicadoresNotasOriginalV196.apply(this, args);
        setTimeout(reposicionarIndicadoresNotasV196, 0);
        setTimeout(reposicionarIndicadoresNotasV196, 120);
        return r;
      };

      window.aplicarIndicadoresNotasV195 = aplicarIndicadoresNotasV195;
    }
  } catch {}

  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV196) {
      window.renderizarNotasOriginalV196 = renderizarNotas;

      renderizarNotas = function(...args) {
        const r = window.renderizarNotasOriginalV196.apply(this, args);
        setTimeout(reposicionarIndicadoresNotasV196, 80);
        setTimeout(reposicionarIndicadoresNotasV196, 220);
        return r;
      };
    }
  } catch {}

  try {
    if (typeof renderizarFavoritosV194 === "function" && !window.renderizarFavoritosOriginalV196) {
      window.renderizarFavoritosOriginalV196 = renderizarFavoritosV194;

      renderizarFavoritosV194 = function(...args) {
        const r = window.renderizarFavoritosOriginalV196.apply(this, args);
        setTimeout(reposicionarIndicadoresNotasV196, 80);
        setTimeout(reposicionarIndicadoresNotasV196, 220);
        return r;
      };

      window.renderizarFavoritosV194 = renderizarFavoritosV194;
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(reposicionarIndicadoresNotasV196, 400);
  setTimeout(reposicionarIndicadoresNotasV196, 1000);
});

document.addEventListener("click", event => {
  if (
    event.target?.closest?.("#btnFavoritosNotasV159") ||
    event.target?.closest?.(".menu button") ||
    event.target?.closest?.(".titulo-nota") ||
    event.target?.closest?.(".btn-favorito-v194")
  ) {
    setTimeout(reposicionarIndicadoresNotasV196, 80);
    setTimeout(reposicionarIndicadoresNotasV196, 220);
  }
}, true);
