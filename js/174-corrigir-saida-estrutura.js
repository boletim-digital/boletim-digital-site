
// v174 - corrige saída da Estrutura Organizacional e vazamento para Auditoria.
function sairDaEstruturaOrganizacionalV174(restaurarNotas) {
  document.body.classList.remove(
    "modo-estrutura-organizacional-v172",
    "modo-estrutura-sem-titulo-superior-v173",
    "modo-estrutura-organizacional-v174"
  );

  const pagina = document.getElementById("paginaEstruturaOrganizacional");
  if (pagina) pagina.classList.add("escondido");

  // Garante que blocos de estrutura não fiquem visíveis em outras páginas.
  document.querySelectorAll(
    "#paginaAuditoria .estrutura-org-layout-v172, " +
    "#paginaAuditoria .estrutura-org-layout-v173, " +
    "#paginaAuditoria .estrutura-card-v172, " +
    "#paginaAuditoria .estrutura-form-obm-v172, " +
    "#paginaAuditoria .estrutura-form-cba-v172, " +
    "#paginaAuditoria #btnAdicionarObm, " +
    "#paginaAuditoria #novaObmNome, " +
    "#paginaAuditoria #novaObmCba, " +
    "#paginaAuditoria #novaObmAliases, " +
    "#paginaAuditoria #btnAdicionarCba, " +
    "#paginaAuditoria #novoCbaNome"
  ).forEach(el => {
    el.style.display = "none";
  });

  if (restaurarNotas) {
    try { modoPagina = "boletim"; } catch {}

    document.getElementById("controlesNotas")?.classList.remove("escondido");
    document.getElementById("listaNotas")?.classList.remove("escondido");
    document.getElementById("paginacao")?.classList.remove("escondido");

    document.getElementById("paginaFatosHistoricos")?.classList.add("escondido");
    document.getElementById("paginaEstatistica")?.classList.add("escondido");
    document.getElementById("paginaAuditoria")?.classList.add("escondido");

    try { renderizarNotas(); } catch {}
  }
}

function entrarNaEstruturaOrganizacionalV174() {
  document.body.classList.add("modo-estrutura-organizacional-v172");
  document.body.classList.add("modo-estrutura-sem-titulo-superior-v173");
  document.body.classList.add("modo-estrutura-organizacional-v174");

  document.getElementById("controlesNotas")?.classList.add("escondido");
  document.getElementById("listaNotas")?.classList.add("escondido");
  document.getElementById("paginacao")?.classList.add("escondido");
  document.getElementById("paginaAuditoria")?.classList.add("escondido");
}

function configurarSaidaEstruturaV174() {
  // Botão Estrutura: marca modo estrutura depois de abrir.
  const btnEstrutura = document.getElementById("btnEstruturaOrganizacional");
  if (btnEstrutura && btnEstrutura.dataset.v174 !== "1") {
    btnEstrutura.dataset.v174 = "1";
    btnEstrutura.addEventListener("click", () => {
      setTimeout(entrarNaEstruturaOrganizacionalV174, 0);
      setTimeout(entrarNaEstruturaOrganizacionalV174, 120);
    }, true);
  }

  // Botões do menu lateral de notas: ao clicar, sai da estrutura e restaura notas.
  const menuLateral = document.getElementById("menuLateral");
  if (menuLateral && menuLateral.dataset.v174 !== "1") {
    menuLateral.dataset.v174 = "1";
    menuLateral.addEventListener("click", () => {
      setTimeout(() => sairDaEstruturaOrganizacionalV174(true), 0);
      setTimeout(() => sairDaEstruturaOrganizacionalV174(true), 120);
    }, true);
  }

  // Demais botões laterais: sai da estrutura, mas não força lista de notas em páginas extras.
  [
    "btnFatosHistoricos",
    "btnEstatistica",
    "btnAuditoria",
    "btnExportarNotas",
    "btnImportarNotas"
  ].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn || btn.dataset.sairEstruturaV174 === "1") return;

    btn.dataset.sairEstruturaV174 = "1";
    btn.addEventListener("click", () => {
      setTimeout(() => sairDaEstruturaOrganizacionalV174(false), 0);
      setTimeout(() => sairDaEstruturaOrganizacionalV174(false), 120);
    }, true);
  });
}

// Reforça funções centrais, caso a navegação use chamadas diretas.
(function corrigirFuncoesNavegacaoV174() {
  try {
    if (typeof mostrarBoletim === "function" && !window.mostrarBoletimOriginalV174) {
      window.mostrarBoletimOriginalV174 = mostrarBoletim;
      mostrarBoletim = function(...args) {
        sairDaEstruturaOrganizacionalV174(false);
        const r = window.mostrarBoletimOriginalV174.apply(this, args);
        setTimeout(() => sairDaEstruturaOrganizacionalV174(true), 0);
        return r;
      };
    }
  } catch {}

  try {
    if (typeof mostrarPaginaExtra === "function" && !window.mostrarPaginaExtraOriginalV174) {
      window.mostrarPaginaExtraOriginalV174 = mostrarPaginaExtra;
      mostrarPaginaExtra = function(...args) {
        sairDaEstruturaOrganizacionalV174(false);
        return window.mostrarPaginaExtraOriginalV174.apply(this, args);
      };
    }
  } catch {}

  try {
    if (typeof mostrarAuditoria === "function" && !window.mostrarAuditoriaOriginalV174) {
      window.mostrarAuditoriaOriginalV174 = mostrarAuditoria;
      mostrarAuditoria = function(...args) {
        sairDaEstruturaOrganizacionalV174(false);
        return window.mostrarAuditoriaOriginalV174.apply(this, args);
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarSaidaEstruturaV174();
  setTimeout(configurarSaidaEstruturaV174, 300);
  setTimeout(configurarSaidaEstruturaV174, 1000);
});
