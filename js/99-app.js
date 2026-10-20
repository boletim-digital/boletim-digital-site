// 99-app.js
async function iniciar() {
  const resposta = await fetch("notas.json");
  dados = await resposta.json();
  carregarNotasLocais();

  const sessao = await inicializarAutenticacaoSupabase();
  if (sessao) await carregarDadosSupabase();

  prepararTopo();
  montarMenu();
  prepararCalendario();
  prepararFormularioNovaNota();
  prepararModalTabela();
  prepararTopo();
  renderizarNotas();

  document.getElementById("btnExportarNotas")?.addEventListener("click", exportarNotas);
  document.getElementById("btnImportarNotas")?.addEventListener("click", () => {
    if (!podeImportarNotas()) {
      negarAcesso("Você não tem permissão para importar notas.");
      return;
    }
    document.getElementById("inputImportarNotas").click();
  });
  document.getElementById("inputImportarNotas")?.addEventListener("change", importarNotas);
  document.getElementById("btnImprimir").addEventListener("click", abrirModalImpressao);

  document.getElementById("campoBusca").addEventListener("input", (e) => {
    termoBusca = e.target.value.trim();
    paginaAtual = 1;
    mostrarBoletim();
    renderizarNotas();
  });

  document.getElementById("btnLimpar").addEventListener("click", () => {
    termoBusca = "";
    document.getElementById("campoBusca").value = "";
    paginaAtual = 1;
    renderizarNotas();
  });

  document.getElementById("itensPorPagina").addEventListener("change", (e) => {
    itensPorPagina = Number(e.target.value);
    paginaAtual = 1;
    renderizarNotas();
  });

  document.getElementById("btnCalendario").addEventListener("click", () => {
    document.getElementById("painelCalendario").classList.toggle("escondido");
  });

  document.getElementById("mesAnterior").addEventListener("click", () => {
    mesCalendario.setMonth(mesCalendario.getMonth() - 1);
    renderizarCalendario();
  });

  document.getElementById("mesProximo").addEventListener("click", () => {
    mesCalendario.setMonth(mesCalendario.getMonth() + 1);
    renderizarCalendario();
  });

  document.getElementById("btnFatosHistoricos").addEventListener("click", () => mostrarPaginaExtra("fatos"));
  document.getElementById("btnEstatistica").addEventListener("click", () => mostrarPaginaExtra("estatistica"));
}

iniciar();


/* v104 - ordena notas após inicialização */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try { ordenarDadosNotas(); } catch {}
    try { renderizarNotas(); } catch {}
  }, 150);
});


/* v105 - reforço final de ordenação */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try { aplicarOrdenacaoNotasV105(); } catch {}
    try { renderizarNotas(); } catch {}
    try { reordenarCardsNotasV105(); } catch {}
  }, 700);
});


/* v106 - reforço final para nota mais recente no topo */
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try { ordenarDadosNotasTopoV106(); } catch {}
    try { interceptarInclusaoNotasV106(); } catch {}
    try { renderizarNotas(); } catch {}
    try { reordenarDOMNotasTopoV106(); } catch {}
  }, 700);
});
