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
