
// v131 - reforço final: data desc; dentro da data, inclusão mais recente em cima.
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try { ordenarDadosNotasV131(); } catch {}
    try { interceptarInclusaoNotasV131(); } catch {}
    try { renderizarNotas(); } catch {}
  }, 800);
});
