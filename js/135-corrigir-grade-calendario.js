
// v135 - reforço final para corrigir a grade de dias do calendário.
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try { configurarCorrecaoGradeDiasCalendarioV135(); } catch {}
    try { corrigirGradeDiasCalendarioV135(); } catch {}
  }, 1100);
});
