
// v128 - reforço final para destacar dias no calendário de impressão.
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try { configurarMesCalendarioImpressaoV128(); } catch {}
    try { configurarBotaoCalendarioImpressaoV128(); } catch {}
    try { configurarNavegacaoCalendarioImpressaoV128(); } catch {}
    try { destacarDiasCalendarioImpressaoV128(); } catch {}
  }, 900);
});
