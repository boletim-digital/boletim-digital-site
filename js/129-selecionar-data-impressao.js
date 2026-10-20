
// v129 - reforço final para seleção de datas no calendário de impressão.
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try { configurarSelecaoCalendarioImpressaoV129(); } catch {}
    try { reforcarDiasSelecionaveisImpressaoV129(); } catch {}
  }, 1200);
});
