// 04-storage.js
function salvarNotasLocais() {
  const notasManuais = dados.notas.filter(n => String(n.id).startsWith("nota-manual-"));
  localStorage.setItem("boletimDigitalNotasManuaisV30", JSON.stringify(notasManuais));
}

function carregarNotasLocais() {
  try {
    const salvas = JSON.parse(localStorage.getItem("boletimDigitalNotasManuaisV30") || "[]");
    if (!Array.isArray(salvas) || !salvas.length) return;
    const idsAtuais = new Set(dados.notas.map(n => n.id));
    salvas.forEach(nota => { if (!idsAtuais.has(nota.id)) dados.notas.unshift(nota); });
  } catch {}
}

function exportarNotas() {
  if (!podeExportarNotas()) {
    negarAcesso("Você não tem permissão para exportar notas.");
    return;
  }

  const pacote = {
    exportadoEm: new Date().toLocaleString("pt-BR"),
    exportadoPor: {
      rg: rgAtual(),
      perfil: perfilAtual()
    },
    boletins: dados.boletins || [],
    notas: dados.notas || []
  };

  const blob = new Blob([JSON.stringify(pacote, null, 2)], {
    type: "application/json;charset=utf-8"
  });

  const data = new Date();
  const nomeArquivo = `boletim-digital-notas-${data.getFullYear()}-${String(data.getMonth()+1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}.json`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 500);

  registrarAuditoria("EXPORTOU_NOTAS", {
    arquivo: nomeArquivo,
    quantidadeNotas: (dados.notas || []).length
  });
}

function importarNotas(event) {
  if (!podeImportarNotas()) {
    negarAcesso("Você não tem permissão para importar notas.");
    return;
  }

  const arquivo = event.target.files?.[0];
  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = function(e) {
    try {
      const conteudo = JSON.parse(e.target.result);

      const novasNotas = Array.isArray(conteudo.notas) ? conteudo.notas : null;
      const novosBoletins = Array.isArray(conteudo.boletins) ? conteudo.boletins : [];

      if (!novasNotas) {
        alert("Arquivo inválido. O JSON precisa conter uma lista chamada 'notas'.");
        event.target.value = "";
        return;
      }

      const confirmar = confirm(
        `Importar ${novasNotas.length} nota(s)?\n\n` +
        "Isso substituirá as notas atualmente carregadas neste navegador."
      );

      if (!confirmar) {
        event.target.value = "";
        return;
      }

      dados.notas = novasNotas;
      dados.boletins = novosBoletins;

      localStorage.setItem("boletimDigitalNotasManuaisV30", JSON.stringify(novasNotas));

      registrarAuditoria("IMPORTOU_NOTAS", {
        arquivo: arquivo.name,
        quantidadeNotas: novasNotas.length,
        quantidadeBoletins: novosBoletins.length
      });

      prepararTopo();
      prepararCalendario();

      filtroAtual = { parte: "", secao: "", subsecao: "", label: "Todas as notas" };
      boletimSelecionado = "";
      dataNotaSelecionadaCalendario = "";
      paginaAtual = 1;

      document.querySelectorAll(".menu button, .menu-rodape button").forEach(b => b.classList.remove("ativo"));
      const btnTodas = document.querySelector('.menu button[data-id="todas"]');
      if (btnTodas) btnTodas.classList.add("ativo");

      document.getElementById("tituloPagina").textContent = "Boletim Digital";

      mostrarBoletim();
      renderizarNotas();

      alert("Notas importadas com sucesso.");
      event.target.value = "";
    } catch (erro) {
      alert("Não foi possível importar o arquivo. Verifique se ele é um JSON válido.");
      event.target.value = "";
    }
  };

  leitor.readAsText(arquivo, "utf-8");
}


/* v65 - Exportar/Importar backup completo: notas, fatos históricos e estatísticas */
function obterFatosHistoricosParaBackup() {
  try {
    const salvos = JSON.parse(localStorage.getItem("boletimDigitalFatosHistoricos") || "null");
    if (Array.isArray(salvos)) return salvos;
    if (salvos && typeof salvos === "object") return salvos;
  } catch {}

  try {
    if (typeof fatosHistoricos !== "undefined") return fatosHistoricos;
  } catch {}

  return [];
}

function salvarFatosHistoricosImportados(fatos) {
  if (fatos === undefined || fatos === null) return;

  try {
    localStorage.setItem("boletimDigitalFatosHistoricos", JSON.stringify(fatos));
  } catch {}

  try {
    if (typeof fatosHistoricos !== "undefined") {
      fatosHistoricos = fatos;
    }
  } catch {}

  try {
    if (typeof salvarEstadoCompartilhadoSupabase === "function") {
      void salvarEstadoCompartilhadoSupabase("fatos_historicos", fatos);
    }
  } catch {}
}

function obterEstatisticasParaBackup() {
  try {
    if (typeof estatisticas !== "undefined" && Array.isArray(estatisticas)) {
      return estatisticas;
    }
  } catch {}

  const chavesPossiveis = [
    "boletimDigitalEstatisticasV50",
    "boletimDigitalEstatisticasV44",
    "boletimDigitalEstatisticasV34",
    "boletimDigitalEstatisticasV31"
  ];

  for (const chave of chavesPossiveis) {
    try {
      const salvas = JSON.parse(localStorage.getItem(chave) || "[]");
      if (Array.isArray(salvas) && salvas.length) return salvas;
    } catch {}
  }

  return [];
}

function salvarEstatisticasImportadas(listaEstatisticas) {
  if (!Array.isArray(listaEstatisticas)) return;

  try {
    estatisticas = listaEstatisticas;
  } catch {}

  const chavesPossiveis = [
    "boletimDigitalEstatisticasV50",
    "boletimDigitalEstatisticasV44",
    "boletimDigitalEstatisticasV34",
    "boletimDigitalEstatisticasV31"
  ];

  for (const chave of chavesPossiveis) {
    try {
      localStorage.setItem(chave, JSON.stringify(listaEstatisticas));
    } catch {}
  }

  try {
    if (typeof salvarEstadoCompartilhadoSupabase === "function") {
      void salvarEstadoCompartilhadoSupabase("estatisticas", listaEstatisticas);
    }
  } catch {}
}

function exportarNotas() {
  if (!podeExportarNotas()) {
    negarAcesso("Você não tem permissão para exportar dados.");
    return;
  }

  const pacote = {
    tipo: "boletimDigitalBackup",
    versaoBackup: 2,
    exportadoEm: new Date().toLocaleString("pt-BR"),
    exportadoPor: {
      rg: rgAtual(),
      perfil: perfilAtual()
    },
    boletins: dados.boletins || [],
    notas: dados.notas || [],
    fatosHistoricos: obterFatosHistoricosParaBackup(),
    estatisticasSocorrosPrestados: obterEstatisticasParaBackup()
  };

  const blob = new Blob([JSON.stringify(pacote, null, 2)], {
    type: "application/json;charset=utf-8"
  });

  const data = new Date();
  const nomeArquivo = `boletim-digital-backup-${data.getFullYear()}-${String(data.getMonth()+1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}.json`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();

  setTimeout(() => {
    URL.revokeObjectURL(link.href);
    link.remove();
  }, 500);

  registrarAuditoria("EXPORTOU_BACKUP_COMPLETO", {
    arquivo: nomeArquivo,
    quantidadeNotas: (dados.notas || []).length,
    quantidadeFatosHistoricos: Array.isArray(pacote.fatosHistoricos) ? pacote.fatosHistoricos.length : 0,
    quantidadeEstatisticas: Array.isArray(pacote.estatisticasSocorrosPrestados) ? pacote.estatisticasSocorrosPrestados.length : 0
  });
}

function importarNotas(event) {
  if (!podeImportarNotas()) {
    negarAcesso("Você não tem permissão para importar dados.");
    return;
  }

  const arquivo = event.target.files?.[0];
  if (!arquivo) return;

  const leitor = new FileReader();

  leitor.onload = function(e) {
    try {
      const conteudo = JSON.parse(e.target.result);

      const novasNotas = Array.isArray(conteudo.notas) ? conteudo.notas : null;
      const novosBoletins = Array.isArray(conteudo.boletins) ? conteudo.boletins : [];
      const novosFatosHistoricos = conteudo.fatosHistoricos;
      const novasEstatisticas = Array.isArray(conteudo.estatisticasSocorrosPrestados)
        ? conteudo.estatisticasSocorrosPrestados
        : (Array.isArray(conteudo.estatisticas) ? conteudo.estatisticas : []);

      if (!novasNotas) {
        alert("Arquivo inválido. O JSON precisa conter uma lista chamada 'notas'.");
        event.target.value = "";
        return;
      }

      const confirmar = confirm(
        `Importar backup?\n\n` +
        `Notas: ${novasNotas.length}\n` +
        `Fatos Históricos: ${Array.isArray(novosFatosHistoricos) ? novosFatosHistoricos.length : 0}\n` +
        `Estatísticas de Socorros Prestados: ${novasEstatisticas.length}\n\n` +
        "Isso substituirá os dados atualmente carregados neste navegador."
      );

      if (!confirmar) {
        event.target.value = "";
        return;
      }

      dados.notas = novasNotas;
      dados.boletins = novosBoletins;

      localStorage.setItem("boletimDigitalNotasManuaisV30", JSON.stringify(novasNotas));
      localStorage.setItem("boletimDigitalNotasManuais", JSON.stringify(novasNotas));

      salvarFatosHistoricosImportados(novosFatosHistoricos);
      salvarEstatisticasImportadas(novasEstatisticas);
      try {
        if (typeof agendarSincronizacaoSupabase === "function") {
          agendarSincronizacaoSupabase();
        }
      } catch {}

      registrarAuditoria("IMPORTOU_BACKUP_COMPLETO", {
        arquivo: arquivo.name,
        quantidadeNotas: novasNotas.length,
        quantidadeBoletins: novosBoletins.length,
        quantidadeFatosHistoricos: Array.isArray(novosFatosHistoricos) ? novosFatosHistoricos.length : 0,
        quantidadeEstatisticas: novasEstatisticas.length
      });

      try { prepararTopo(); } catch {}
      try { prepararCalendario(); } catch {}
      try { prepararPaginaEstatistica(); } catch {}

      filtroAtual = { parte: "", secao: "", subsecao: "", label: "Todas as notas" };
      boletimSelecionado = "";
      if (typeof dataNotaSelecionadaCalendario !== "undefined") dataNotaSelecionadaCalendario = "";
      paginaAtual = 1;

      document.querySelectorAll(".menu button, .menu-rodape button").forEach(b => b.classList.remove("ativo"));
      const btnTodas = document.querySelector('.menu button[data-id="todas"]');
      if (btnTodas) btnTodas.classList.add("ativo");

      const titulo = document.getElementById("tituloPagina");
      if (titulo) titulo.textContent = "Boletim Digital";

      try { mostrarBoletim(); } catch {}
      try { renderizarNotas(); } catch {}

      alert("Backup importado com sucesso.");
      event.target.value = "";
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível importar o arquivo. Verifique se ele é um JSON válido.");
      event.target.value = "";
    }
  };

  leitor.readAsText(arquivo, "utf-8");
}


/* v104 - ordenação das notas: mais recente primeiro */
function obterTimestampNotaParaOrdenacao(nota) {
  if (!nota) return 0;

  const candidatos = [
    nota.data,
    nota.dataNota,
    nota.dataBoletim,
    nota.boletimData,
    nota.criadoEm,
    nota.atualizadoEm,
    nota.timestamp
  ].filter(Boolean);

  for (const valor of candidatos) {
    const texto = String(valor);

    // dd/mm/aaaa ou dd/mm/aaaa hh:mm
    const br = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
    if (br) {
      const dia = Number(br[1]);
      const mes = Number(br[2]) - 1;
      const ano = Number(br[3]);
      const hora = Number(br[4] || 0);
      const minuto = Number(br[5] || 0);
      return new Date(ano, mes, dia, hora, minuto).getTime();
    }

    // yyyy-mm-dd
    const iso = texto.match(/(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2}))?/);
    if (iso) {
      const ano = Number(iso[1]);
      const mes = Number(iso[2]) - 1;
      const dia = Number(iso[3]);
      const hora = Number(iso[4] || 0);
      const minuto = Number(iso[5] || 0);
      return new Date(ano, mes, dia, hora, minuto).getTime();
    }

    const parsed = Date.parse(texto);
    if (!Number.isNaN(parsed)) return parsed;
  }

  // Fallback por id numérico/ordem de criação, se existir.
  const id = Number(nota.id || nota.numero || 0);
  return Number.isFinite(id) ? id : 0;
}

function ordenarNotasMaisRecentesPrimeiro(lista) {
  if (!Array.isArray(lista)) return lista;

  return lista.sort((a, b) => {
    const dataB = obterTimestampNotaParaOrdenacao(b);
    const dataA = obterTimestampNotaParaOrdenacao(a);

    if (dataB !== dataA) return dataB - dataA;

    // Desempate: maior id/registro primeiro.
    const idB = Number(b?.id || b?.numero || 0);
    const idA = Number(a?.id || a?.numero || 0);

    return idB - idA;
  });
}

function ordenarDadosNotas() {
  try {
    if (typeof dados !== "undefined" && Array.isArray(dados.notas)) {
      ordenarNotasMaisRecentesPrimeiro(dados.notas);
    }
  } catch {}
}
