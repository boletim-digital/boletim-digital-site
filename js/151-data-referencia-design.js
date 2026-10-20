
// v151 - deixa o botão Data de referência visualmente igual ao select de Ano de referência.
function ajustarTextoDataReferenciaV151() {
  const btn = document.getElementById("btnCalendarioReferenciaEstatistica");
  if (!btn) return;

  // Remove emoji/ícone de calendário caso esteja como texto no botão.
  const texto = (btn.textContent || "").replace(/📅|🗓️|🗓/g, "").replace(/\s+/g, " ").trim();

  if (texto && texto !== btn.textContent.trim()) {
    btn.textContent = texto;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ajustarTextoDataReferenciaV151();
  setTimeout(ajustarTextoDataReferenciaV151, 300);
  setTimeout(ajustarTextoDataReferenciaV151, 1000);
});
