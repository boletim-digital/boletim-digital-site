
// v160 - reforço final: favoritos por militar/usuário.
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try { migrarFavoritosGlobaisParaUsuarioV160(); } catch {}
    try { aplicarFavoritosNaListaV159(); } catch {}
  }, 1500);
});
