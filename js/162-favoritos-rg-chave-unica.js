
// v162 - reforço final: favoritos por RG e chave única por nota.
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try { garantirChavesUnicasNotasV162(); } catch {}
    try { aplicarFavoritosNaListaV162(); } catch {}
    try { atualizarBotaoFavoritosV162(); } catch {}
  }, 1700);
});
