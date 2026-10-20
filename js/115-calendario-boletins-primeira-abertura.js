
// v115 - força o Calendário de Boletins a marcar os dias logo na primeira abertura.
// Problema corrigido: ao abrir o calendário após carregar o site, os dias com boletim
// só apareciam depois de mudar o mês e voltar.

(function () {
  function obterUltimaDataComNotaV115() {
    try {
      const datas = (window.dados?.notas || [])
        .map(nota => nota.data)
        .filter(Boolean)
        .map(dataBR => window.parseDataBR ? window.parseDataBR(dataBR) : null)
        .filter(Boolean)
        .sort((a, b) => b - a);

      return datas[0] || new Date();
    } catch {
      return new Date();
    }
  }

  function atualizarCalendarioBoletinsV115() {
    try {
      // Se o mês ainda não foi definido, define para o mês do último boletim/nota.
      if (!window.mesCalendario) {
        window.mesCalendario = obterUltimaDataComNotaV115();
      }

      if (typeof window.prepararCalendario === "function") {
        window.prepararCalendario();
      }

      if (typeof window.renderizarCalendario === "function") {
        window.renderizarCalendario();
      }
    } catch (erro) {
      console.warn("Não foi possível atualizar o calendário de boletins:", erro);
    }
  }

  function configurarPrimeiraAberturaCalendarioV115() {
    const btn = document.getElementById("btnCalendario");
    const painel = document.getElementById("painelCalendario");

    if (!btn || !painel || btn.dataset.calendarioV115 === "1") return;

    btn.dataset.calendarioV115 = "1";

    btn.addEventListener("click", () => {
      // Espera o clique original abrir o painel e, em seguida, redesenha os dias.
      setTimeout(() => {
        if (!painel.classList.contains("escondido")) {
          atualizarCalendarioBoletinsV115();
        }
      }, 0);

      // Segundo reforço para casos em que as notas locais ainda estejam terminando de carregar.
      setTimeout(() => {
        if (!painel.classList.contains("escondido")) {
          atualizarCalendarioBoletinsV115();
        }
      }, 120);
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    // Prepara o calendário depois que notas locais/importadas forem carregadas.
    setTimeout(atualizarCalendarioBoletinsV115, 100);
    setTimeout(configurarPrimeiraAberturaCalendarioV115, 150);
    setTimeout(configurarPrimeiraAberturaCalendarioV115, 600);
  });

  window.atualizarCalendarioBoletinsV115 = atualizarCalendarioBoletinsV115;
})();
