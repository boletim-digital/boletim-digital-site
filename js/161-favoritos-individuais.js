
// v161 - reforço final: favoritos realmente individuais e estrela sem sobrepor o +.
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try { removerFavoritosCompartilhadosV161(); } catch {}
    try { aplicarFavoritosNaListaV159(); } catch {}
    try { reposicionarEstrelasFavoritosV161(); } catch {}
    try { atualizarBotaoFavoritosV161(); } catch {}
  }, 1600);
});
