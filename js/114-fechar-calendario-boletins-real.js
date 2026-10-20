
// v114 - fecha o Calendário de Boletins ao clicar fora do popup.
// Usa os IDs reais do sistema: painelCalendario e btnCalendario.

(function () {
  function painelCalendarioBoletins() {
    return document.getElementById("painelCalendario");
  }

  function botaoCalendarioBoletins() {
    return document.getElementById("btnCalendario");
  }

  function fecharCalendarioBoletins() {
    const painel = painelCalendarioBoletins();
    if (painel) {
      painel.classList.add("escondido");
    }
  }

  function cliqueFoiNoBotaoCalendario(alvo) {
    const botao = botaoCalendarioBoletins();

    return Boolean(
      (botao && (alvo === botao || botao.contains(alvo))) ||
      alvo.closest?.("#btnCalendario") ||
      alvo.closest?.("button")?.textContent?.toLowerCase().includes("calendário de boletins") ||
      alvo.closest?.("button")?.textContent?.toLowerCase().includes("calendario de boletins")
    );
  }

  function cliqueFoiDentroDoPainel(alvo) {
    const painel = painelCalendarioBoletins();
    return Boolean(painel && (alvo === painel || painel.contains(alvo)));
  }

  function configurarFechamentoCalendarioBoletinsV114() {
    if (document.body.dataset.fechaCalendarioBoletinsV114 === "1") return;
    document.body.dataset.fechaCalendarioBoletinsV114 = "1";

    document.addEventListener("click", function (event) {
      const painel = painelCalendarioBoletins();
      if (!painel) return;

      // Se já está fechado, não faz nada.
      if (painel.classList.contains("escondido")) return;

      const alvo = event.target;

      // Clicar no botão não fecha aqui, porque o próprio botão abre/fecha.
      if (cliqueFoiNoBotaoCalendario(alvo)) return;

      // Clicar dentro do calendário não fecha.
      if (cliqueFoiDentroDoPainel(alvo)) return;

      // Qualquer outro clique fecha.
      fecharCalendarioBoletins();
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        fecharCalendarioBoletins();
      }
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    configurarFechamentoCalendarioBoletinsV114();
  });

  // Reforço caso o script seja carregado depois do DOM.
  setTimeout(configurarFechamentoCalendarioBoletinsV114, 300);

  window.fecharCalendarioBoletinsV114 = fecharCalendarioBoletins;
})();
