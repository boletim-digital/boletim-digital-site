// 06-editor.js
function prepararFormularioNovaNota() {
  const modal = document.getElementById("modalNota");
  const form = document.getElementById("formNota");

  document.getElementById("btnNovaNota").addEventListener("click", () => {
    if (!podeIncluirNota()) {
      negarAcesso("Você não tem permissão para incluir notas.");
      return;
    }
    modal.classList.remove("escondido");
    preencherPadroesNovaNota();
  });

  document.getElementById("btnFecharModal").addEventListener("click", fecharModalNota);
  document.getElementById("btnCancelarNota").addEventListener("click", fecharModalNota);
  modal.addEventListener("click", (event) => { if (event.target === modal) fecharModalNota(); });
  document.getElementById("btnAdicionarAnexo").addEventListener("click", adicionarCampoAnexo);

  document.getElementById("notaParte").addEventListener("change", atualizarCamposHierarquia);
  document.getElementById("notaSecao").addEventListener("change", atualizarCampoSubsecao);

  document.querySelectorAll(".barra-editor button[data-cmd]").forEach(btn => {
    btn.addEventListener("click", () => aplicarComandoEditor("notaTextoEditor", btn.dataset.cmd, btn.dataset.value));
  });

  document.getElementById("btnInserirTab").addEventListener("click", () => inserirTabNoEditor("notaTextoEditor"));
  document.getElementById("btnInserirTabela").addEventListener("click", () => inserirTabelaNoEditor("notaTextoEditor"));

  prepararEditorAvancado(document.getElementById("notaTextoEditor"));

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    incluirNotaPeloFormulario();
  });
}

function atualizarCamposHierarquia() {
  const parte = document.getElementById("notaParte").value;
  const campoSecao = document.getElementById("campoSecao");
  const secao = document.getElementById("notaSecao");
  const campoSubsecao = document.getElementById("campoSubsecao");
  const subsecao = document.getElementById("notaSubsecao");

  secao.innerHTML = '<option value="">Selecione...</option>';
  subsecao.value = "";
  campoSubsecao.classList.add("escondido");

  if (parte === "2ª Parte - Operações e Instrução") {
    campoSecao.classList.remove("escondido");
    secao.required = true;
    secao.innerHTML += '<option>I - Operações</option><option>II - Instrução</option>';
  } else if (parte === "3ª Parte - Assuntos Gerais e Administrativos") {
    campoSecao.classList.remove("escondido");
    secao.required = true;
    secao.innerHTML += '<option>I - Assuntos Gerais</option><option>II - Assuntos Administrativos</option>';
  } else {
    campoSecao.classList.add("escondido");
    secao.required = false;
    secao.value = "";
  }
}

function atualizarCampoSubsecao() {
  const secao = document.getElementById("notaSecao").value;
  const campoSubsecao = document.getElementById("campoSubsecao");
  const subsecao = document.getElementById("notaSubsecao");

  if (secao === "I - Assuntos Gerais") {
    campoSubsecao.classList.remove("escondido");
    subsecao.required = true;
  } else {
    campoSubsecao.classList.add("escondido");
    subsecao.required = false;
    subsecao.value = "";
  }
}

function aplicarComandoEditor(editorId, comando, valor = null) {
  document.getElementById(editorId).focus();
  document.execCommand(comando, false, valor || null);
}

function inserirTabelaNoEditor(editorId) {
  editorTabelaAtivo = editorId;
  abrirModalTabela();
}

function abrirModalTabela() {
  document.getElementById("modalTabela").classList.remove("escondido");
  document.getElementById("tipoTabela").value = "simples";
  atualizarOpcoesTabela();
}

function fecharModalTabela() {
  document.getElementById("modalTabela").classList.add("escondido");
}

function atualizarOpcoesTabela() {
  const tipo = document.getElementById("tipoTabela").value;
  document.getElementById("opcoesTabelaNormal").classList.toggle("escondido", tipo === "converter");
  document.getElementById("opcoesConverterTabela").classList.toggle("escondido", tipo !== "converter");
}

function confirmarInsercaoTabela() {
  const tipo = document.getElementById("tipoTabela").value;

  let htmlTabela = "";

  if (tipo === "converter") {
    htmlTabela = converterTextoParaTabela();
  } else {
    const linhas = Math.max(1, Number(document.getElementById("tabelaLinhas").value || 3));
    const colunas = Math.max(1, Number(document.getElementById("tabelaColunas").value || 3));
    const alinhamento = document.getElementById("tabelaAlinhamento").value || "center";
    const largura = document.getElementById("tabelaLargura").value;
    const usarCabecalho = tipo === "cabecalho" || tipo === "compacta";
    const classe = tipo === "compacta" || largura === "auto" ? ' class="tabela-compacta"' : "";
    const style = alinhamento ? ` style="text-align: ${alinhamento};"` : "";

    htmlTabela = `<table${classe}${style}><tbody>`;

    for (let i = 0; i < linhas; i++) {
      htmlTabela += "<tr>";
      for (let j = 0; j < colunas; j++) {
        if (usarCabecalho && i === 0) {
          htmlTabela += "<th>Campo</th>";
        } else {
          htmlTabela += "<td>Texto</td>";
        }
      }
      htmlTabela += "</tr>";
    }

    htmlTabela += "</tbody></table><p><br></p>";
  }

  const editor = document.getElementById(editorTabelaAtivo);
  editor.focus();
  document.execCommand("insertHTML", false, htmlTabela);
  fecharModalTabela();
}

function converterTextoParaTabela() {
  const texto = document.getElementById("textoConverterTabela").value.trim();
  const separador = document.getElementById("separadorTabela").value;
  const primeiraLinhaCabecalho = document.getElementById("converterPrimeiraLinhaCabecalho").checked;

  if (!texto) return "<p></p>";

  const linhas = texto.split(/\r?\n/).filter(l => l.trim());

  const matriz = linhas.map(linha => {
    if (separador === "tab") return linha.split("\t");
    if (separador === "semicolon") return linha.split(";");
    if (separador === "spaces") return linha.trim().split(/\s{2,}/);

    if (linha.includes("\t")) return linha.split("\t");
    if (linha.includes(";")) return linha.split(";");
    return linha.trim().split(/\s{2,}/);
  });

  const largura = document.getElementById("converterTabelaLargura")?.value || "100";
  const classeLargura = largura === "auto" ? " tabela-compacta" : "";
  let html = `<table class="tabela-centralizada${classeLargura}"><tbody>`;

  matriz.forEach((linha, i) => {
    html += "<tr>";
    linha.forEach(celula => {
      const tag = primeiraLinhaCabecalho && i === 0 ? "th" : "td";
      html += `<${tag}>${escapeHtml(celula.trim())}</${tag}>`;
    });
    html += "</tr>";
  });

  html += "</tbody></table><p><br></p>";
  return html;
}

function prepararModalTabela() {
  const modal = document.getElementById("modalTabela");
  document.getElementById("btnFecharTabela").addEventListener("click", fecharModalTabela);
  document.getElementById("btnCancelarTabela").addEventListener("click", fecharModalTabela);
  document.getElementById("tipoTabela").addEventListener("change", atualizarOpcoesTabela);
  document.getElementById("btnInserirTabelaConfirmar").addEventListener("click", confirmarInsercaoTabela);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) fecharModalTabela();
  });
}

function numeroJaExiste(numero, ignorarId = "") {
  const parte = document.getElementById("notaParte").value.trim();
  const secao = document.getElementById("notaSecao").value.trim();
  const subsecao = document.getElementById("notaSubsecao").value.trim();
  const boletim = document.getElementById("notaBoletim").value.trim();

  return dados.notas.some(nota => {
    if (ignorarId && nota.id === ignorarId) return false;

    return String(nota.numero || "").trim() === numero &&
      String(nota.boletim || "").trim() === boletim &&
      String(nota.parte || "").trim() === parte &&
      String(nota.secao || "").trim() === secao &&
      String(nota.subsecao || "").trim() === subsecao;
  });
}

function inserirTabNoEditor(editorId) {
  const editor = document.getElementById(editorId);
  if (!editor) return;

  editor.focus();

  const selecao = window.getSelection();
  const node = selecao && selecao.anchorNode;
  const elemento = node && (node.nodeType === 1 ? node : node.parentElement);
  const dentroTabela = elemento && elemento.closest && elemento.closest("td, th");

  // Dentro de tabela, insere espaços para diagramação sem trocar de célula.
  // Fora da tabela, também insere espaços para recuo visual.
  document.execCommand("insertHTML", false, "&nbsp;&nbsp;&nbsp;&nbsp;");
}

function prepararEditorAvancado(editor) {
  if (!editor || editor.dataset.editorPreparado === "true") return;
  editor.dataset.editorPreparado = "true";

  editor.addEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        document.execCommand("outdent", false, null);
      } else {
        document.execCommand("insertText", false, "    ");
      }
    }
  });

  editor.addEventListener("paste", (e) => {
    e.preventDefault();

    const clipboard = e.clipboardData || window.clipboardData;
    const html = clipboard.getData("text/html");
    const texto = clipboard.getData("text/plain");

    if (html && html.includes("<table")) {
      document.execCommand("insertHTML", false, limparHtmlColado(html));
    } else if (html && origemProvavelWord(html)) {
      document.execCommand("insertHTML", false, limparHtmlColado(html));
    } else {
      document.execCommand("insertText", false, texto);
    }
  });
}

function origemProvavelWord(html) {
  return /class="?Mso|mso-|<o:p>|urn:schemas-microsoft-com/i.test(html);
}

function limparHtmlColado(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");

  doc.querySelectorAll("script, style, meta, link").forEach(el => el.remove());

  doc.body.querySelectorAll("*").forEach(el => {
    [...el.attributes].forEach(attr => {
      const nome = attr.name.toLowerCase();
      if (nome.startsWith("on")) el.removeAttribute(attr.name);
      if (nome === "style") {
        const permitido = attr.value
          .split(";")
          .map(s => s.trim())
          .filter(s => /^(font-weight|font-style|text-decoration|text-align)\s*:/i.test(s))
          .join("; ");
        if (permitido) el.setAttribute("style", permitido);
        else el.removeAttribute("style");
      }
      if (nome === "class") el.removeAttribute("class");
    });
  });

  return doc.body.innerHTML;
}

function criarToolbarAnexo(editorId) {
  return `
    <div class="barra-editor">
      <button type="button" onclick="aplicarComandoEditor('${editorId}', 'formatBlock', 'p')">Texto</button>
      <button type="button" onclick="aplicarComandoEditor('${editorId}', 'formatBlock', 'h2')">Título 2</button>
      <button type="button" onclick="aplicarComandoEditor('${editorId}', 'formatBlock', 'h3')">Título 3</button>
      <button type="button" onclick="aplicarComandoEditor('${editorId}', 'bold')"><b>N</b></button>
      <button type="button" onclick="aplicarComandoEditor('${editorId}', 'italic')"><i>I</i></button>
      <button type="button" onclick="aplicarComandoEditor('${editorId}', 'underline')"><u>S</u></button>
      <button type="button" onclick="inserirTabNoEditor('${editorId}')">Tab/Recuo</button>
      <button type="button" onclick="inserirTabelaNoEditor('${editorId}')">Tabela</button>
    </div>`;
}

function adicionarCampoAnexo() {
  const lista = document.getElementById("listaCamposAnexos");
  const indice = lista.children.length + 1;
  const editorId = `anexoEditor${Date.now()}`;
  const bloco = document.createElement("div");
  bloco.className = "campo-anexo";
  bloco.innerHTML = `
    <div class="campo-anexo-topo">
      <strong>Anexo ${indice}</strong>
      <button type="button" class="btn-remover-anexo">Remover</button>
    </div>
    <label>Título do anexo<input type="text" class="anexo-titulo" placeholder="Ex.: Anexo I"></label>
    <label>Texto do anexo</label>
    <div class="editor">
      ${criarToolbarAnexo(editorId)}
      <div id="${editorId}" class="editor-area anexo-editor" contenteditable="true" data-placeholder="Cole o texto do anexo..."></div>
    </div>
  `;
  bloco.querySelector(".btn-remover-anexo").addEventListener("click", () => bloco.remove());
  lista.appendChild(bloco);
  prepararEditorAvancado(document.getElementById(editorId));
}

function preencherPadroesNovaNota() {
  const boletins = dados.boletins || [dados.boletim];
  const ordenados = [...boletins].sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));
  const ultimo = ordenados[0];
  document.getElementById("notaBoletim").value = `Boletim da SEDEC/CBMERJ nº ${ultimo.numero}`;
  document.getElementById("notaData").value = dataBRParaInput(ultimo.data);
}

function fecharModalNota() {
  document.getElementById("modalNota").classList.add("escondido");
}

function editarNota(id) {
  if (!podeEditarOuExcluirNota()) return negarAcesso("Você não tem permissão para editar notas.");

  const nota = dados.notas.find(n => n.id === id);
  if (!nota) return;

  document.getElementById("modalNota").classList.remove("escondido");
  document.getElementById("formNota").dataset.editandoId = id;

  document.getElementById("notaNumero").value = nota.numero || "";
  document.getElementById("notaTitulo").value = nota.titulo || "";
  document.getElementById("notaParte").value = nota.parte || "";
  atualizarCamposHierarquia();
  document.getElementById("notaSecao").value = nota.secao || "";
  atualizarCampoSubsecao();
  document.getElementById("notaSubsecao").value = nota.subsecao || "";
  document.getElementById("notaBoletim").value = nota.boletim || "";
  document.getElementById("notaData").value = dataBRParaInput(nota.data || "");
  document.getElementById("notaTextoEditor").innerHTML = nota.texto || "";

  document.getElementById("listaCamposAnexos").innerHTML = "";
  (nota.anexos || []).forEach(anexo => {
    adicionarCampoAnexo();
    const ultimo = document.querySelector("#listaCamposAnexos .campo-anexo:last-child");
    ultimo.querySelector(".anexo-titulo").value = anexo.titulo || "";
    ultimo.querySelector(".anexo-editor").innerHTML = anexo.texto || "";
  });
}

function excluirNota(id) {
  const nota = dados.notas.find(n => n.id === id);
  registrarAuditoria("EXCLUIU_NOTA", nota || {});

  if (!podeEditarOuExcluirNota()) return negarAcesso("Você não tem permissão para excluir notas.");

  if (!confirm("Deseja realmente excluir esta nota?")) return;

  dados.notas = dados.notas.filter(n => n.id !== id);
  salvarNotasLocais();
  renderizarNotas();
}


/* v78 - controles de tabela por célula em hover, com inserir/excluir linha e coluna */
let tabelaSelecionadaEditor = null;
let celulaHoverTabelaEditor = null;

function editorEhAreaDeNota(el) {
  if (!el) return false;

  return Boolean(
    el.closest("#notaTextoEditor") ||
    el.closest("#notaAnexoEditor") ||
    el.closest('[contenteditable="true"]')
  );
}

function criarControlesGradeTabelaEditor() {
  if (document.getElementById("controlesGradeTabelaEditor")) return;

  const controles = document.createElement("div");
  controles.id = "controlesGradeTabelaEditor";
  controles.className = "controles-grade-tabela-editor escondido";

  document.body.appendChild(controles);

  controles.addEventListener("mousedown", (event) => {
    event.preventDefault();
  });

  controles.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-acao]");
    if (!btn) return;

    event.preventDefault();
    event.stopPropagation();

    const acao = btn.dataset.acao;
    const indice = Number(btn.dataset.indice);

    if (acao === "inserir-linha") inserirLinhaNaTabelaPorIndice(indice);
    if (acao === "inserir-coluna") inserirColunaNaTabelaPorIndice(indice);
    if (acao === "excluir-linha") excluirLinhaTabelaPorIndice(indice);
    if (acao === "excluir-coluna") excluirColunaTabelaPorIndice(indice);
    if (acao === "fechar") ocultarControlesGradeTabelaEditor();
  });
}

function ocultarControlesGradeTabelaEditor() {
  const controles = document.getElementById("controlesGradeTabelaEditor");
  if (controles) controles.classList.add("escondido");

  document.querySelectorAll(".tabela-editor-selecionada").forEach(el => {
    el.classList.remove("tabela-editor-selecionada");
  });

  document.querySelectorAll(".celula-hover-tabela-editor").forEach(el => {
    el.classList.remove("celula-hover-tabela-editor");
  });

  tabelaSelecionadaEditor = null;
  celulaHoverTabelaEditor = null;
}

function selecionarTabelaEditorPorCelula(celula) {
  const tabela = celula?.closest("table");
  if (!tabela || !editorEhAreaDeNota(tabela)) return;

  criarControlesGradeTabelaEditor();

  document.querySelectorAll(".tabela-editor-selecionada").forEach(el => {
    el.classList.remove("tabela-editor-selecionada");
  });

  document.querySelectorAll(".celula-hover-tabela-editor").forEach(el => {
    el.classList.remove("celula-hover-tabela-editor");
  });

  tabelaSelecionadaEditor = tabela;
  celulaHoverTabelaEditor = celula;

  tabela.classList.add("tabela-editor-selecionada");
  celula.classList.add("celula-hover-tabela-editor");

  renderizarControlesGradeTabelaEditor();
}

function obterMatrizTabelaBasica(tabela) {
  const linhas = Array.from(tabela.querySelectorAll("tr"));
  const maxColunas = Math.max(0, ...linhas.map(linha => linha.children.length));
  return { linhas, maxColunas };
}

function obterIndiceLinhaColunaDaCelula(celula) {
  const linha = celula.closest("tr");
  const tabela = celula.closest("table");
  const linhas = Array.from(tabela.querySelectorAll("tr"));

  return {
    linhaIndex: linhas.indexOf(linha),
    colunaIndex: Array.from(linha.children).indexOf(celula)
  };
}

function criarBotaoControleTabela({ classe, acao, indice, titulo, texto, left, top }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = classe;
  btn.dataset.acao = acao;
  btn.dataset.indice = String(indice);
  btn.title = titulo;
  btn.textContent = texto;
  btn.style.left = `${left}px`;
  btn.style.top = `${top}px`;
  return btn;
}

function renderizarControlesGradeTabelaEditor() {
  const controles = document.getElementById("controlesGradeTabelaEditor");
  const tabela = tabelaSelecionadaEditor;
  const celula = celulaHoverTabelaEditor;

  if (!controles || !tabela || !celula || !document.body.contains(tabela) || !document.body.contains(celula)) {
    ocultarControlesGradeTabelaEditor();
    return;
  }

  const rectTabela = tabela.getBoundingClientRect();
  const rectCelula = celula.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;

  controles.innerHTML = "";
  controles.classList.remove("escondido");

  const { linhas, maxColunas } = obterMatrizTabelaBasica(tabela);
  if (!linhas.length || !maxColunas) return;

  const { linhaIndex, colunaIndex } = obterIndiceLinhaColunaDaCelula(celula);

  controles.style.left = `${rectTabela.left + scrollX}px`;
  controles.style.top = `${rectTabela.top + scrollY}px`;
  controles.style.width = `${rectTabela.width}px`;
  controles.style.height = `${rectTabela.height}px`;

  const xInicioCelula = rectCelula.left - rectTabela.left;
  const xFimCelula = rectCelula.right - rectTabela.left;
  const yInicioCelula = rectCelula.top - rectTabela.top;
  const yFimCelula = rectCelula.bottom - rectTabela.top;
  const xCentroCelula = xInicioCelula + rectCelula.width / 2;
  const yCentroCelula = yInicioCelula + rectCelula.height / 2;

  // Inserir coluna à esquerda/direita da célula em hover
  controles.appendChild(criarBotaoControleTabela({
    classe: "grade-tabela-btn grade-tabela-plus",
    acao: "inserir-coluna",
    indice: colunaIndex,
    titulo: "Adicionar coluna à esquerda desta coluna",
    texto: "+",
    left: xInicioCelula,
    top: -14
  }));

  controles.appendChild(criarBotaoControleTabela({
    classe: "grade-tabela-btn grade-tabela-plus",
    acao: "inserir-coluna",
    indice: colunaIndex + 1,
    titulo: "Adicionar coluna à direita desta coluna",
    texto: "+",
    left: xFimCelula,
    top: -14
  }));

  // Inserir linha acima/abaixo da célula em hover
  controles.appendChild(criarBotaoControleTabela({
    classe: "grade-tabela-btn grade-tabela-plus",
    acao: "inserir-linha",
    indice: linhaIndex,
    titulo: "Adicionar linha acima desta linha",
    texto: "+",
    left: -14,
    top: yInicioCelula
  }));

  controles.appendChild(criarBotaoControleTabela({
    classe: "grade-tabela-btn grade-tabela-plus",
    acao: "inserir-linha",
    indice: linhaIndex + 1,
    titulo: "Adicionar linha abaixo desta linha",
    texto: "+",
    left: -14,
    top: yFimCelula
  }));

  // Excluir coluna/linha correspondente à célula em hover
  controles.appendChild(criarBotaoControleTabela({
    classe: "grade-tabela-btn grade-tabela-delete grade-tabela-delete-coluna",
    acao: "excluir-coluna",
    indice: colunaIndex,
    titulo: "Excluir esta coluna",
    texto: "−",
    left: xCentroCelula,
    top: -40
  }));

  controles.appendChild(criarBotaoControleTabela({
    classe: "grade-tabela-btn grade-tabela-delete grade-tabela-delete-linha",
    acao: "excluir-linha",
    indice: linhaIndex,
    titulo: "Excluir esta linha",
    texto: "−",
    left: -40,
    top: yCentroCelula
  }));

  const fechar = document.createElement("button");
  fechar.type = "button";
  fechar.className = "grade-tabela-fechar";
  fechar.dataset.acao = "fechar";
  fechar.title = "Ocultar controles da tabela";
  fechar.textContent = "×";
  fechar.style.right = `-14px`;
  fechar.style.top = `-14px`;
  controles.appendChild(fechar);
}

function criarCelulaVazia(modelo) {
  const tag = modelo?.tagName?.toLowerCase() === "th" ? "th" : "td";
  const nova = document.createElement(tag);
  nova.innerHTML = "<br>";
  return nova;
}

function limparLinhaTabela(linha) {
  linha.querySelectorAll("td, th").forEach(celula => {
    celula.innerHTML = "<br>";
  });

  return linha;
}

function inserirLinhaNaTabelaPorIndice(indice) {
  const tabela = tabelaSelecionadaEditor;
  if (!tabela) return;

  const { linhas } = obterMatrizTabelaBasica(tabela);
  if (!linhas.length) return;

  const linhaModelo = linhas[Math.min(Math.max(indice - 1, 0), linhas.length - 1)];
  const novaLinha = limparLinhaTabela(linhaModelo.cloneNode(true));

  const tbody = linhaModelo.parentNode;
  const referencia = linhas[indice] || null;
  tbody.insertBefore(novaLinha, referencia);

  const celulaNova = novaLinha.children[Math.min(celulaHoverTabelaEditor ? obterIndiceLinhaColunaDaCelula(celulaHoverTabelaEditor).colunaIndex : 0, novaLinha.children.length - 1)];
  if (celulaNova) selecionarTabelaEditorPorCelula(celulaNova);
  else renderizarControlesGradeTabelaEditor();
}

function inserirColunaNaTabelaPorIndice(indice) {
  const tabela = tabelaSelecionadaEditor;
  if (!tabela) return;

  const { linhas } = obterMatrizTabelaBasica(tabela);

  linhas.forEach(linha => {
    const celulas = Array.from(linha.children);
    const modelo = celulas[Math.min(Math.max(indice - 1, 0), celulas.length - 1)] || celulas[0];
    const novaCelula = criarCelulaVazia(modelo);
    const referencia = celulas[indice] || null;
    linha.insertBefore(novaCelula, referencia);
  });

  const linhaAtual = celulaHoverTabelaEditor?.closest("tr");
  const novaCelula = linhaAtual?.children[indice] || linhaAtual?.children[linhaAtual.children.length - 1];

  if (novaCelula) selecionarTabelaEditorPorCelula(novaCelula);
  else renderizarControlesGradeTabelaEditor();
}

function excluirLinhaTabelaPorIndice(indice) {
  const tabela = tabelaSelecionadaEditor;
  if (!tabela) return;

  const { linhas } = obterMatrizTabelaBasica(tabela);
  if (linhas.length <= 1) {
    alert("A tabela precisa ter pelo menos uma linha.");
    return;
  }

  const linha = linhas[indice];
  if (!linha) return;

  const proximaLinha = linhas[indice + 1] || linhas[indice - 1];
  const colunaAtual = celulaHoverTabelaEditor ? obterIndiceLinhaColunaDaCelula(celulaHoverTabelaEditor).colunaIndex : 0;

  linha.remove();

  const novaCelula = proximaLinha?.children[Math.min(colunaAtual, proximaLinha.children.length - 1)];
  if (novaCelula) selecionarTabelaEditorPorCelula(novaCelula);
  else renderizarControlesGradeTabelaEditor();
}

function excluirColunaTabelaPorIndice(indice) {
  const tabela = tabelaSelecionadaEditor;
  if (!tabela) return;

  const { linhas, maxColunas } = obterMatrizTabelaBasica(tabela);
  if (maxColunas <= 1) {
    alert("A tabela precisa ter pelo menos uma coluna.");
    return;
  }

  linhas.forEach(linha => {
    const celula = linha.children[indice];
    if (celula) celula.remove();
  });

  const linhaAtual = celulaHoverTabelaEditor?.closest("tr") || linhas[0];
  const novaCelula = linhaAtual?.children[Math.min(indice, linhaAtual.children.length - 1)] || linhaAtual?.children[0];

  if (novaCelula) selecionarTabelaEditorPorCelula(novaCelula);
  else renderizarControlesGradeTabelaEditor();
}

function prepararControlesGradeTabelaEditor() {
  criarControlesGradeTabelaEditor();

  document.addEventListener("mouseover", (event) => {
    const celula = event.target.closest("td, th");

    if (celula && editorEhAreaDeNota(celula)) {
      selecionarTabelaEditorPorCelula(celula);
    }
  });

  document.addEventListener("click", (event) => {
    if (event.target.closest("#controlesGradeTabelaEditor")) return;

    const celula = event.target.closest("td, th");

    if (celula && editorEhAreaDeNota(celula)) {
      selecionarTabelaEditorPorCelula(celula);
      return;
    }

    const tabela = event.target.closest("table");
    if (tabela && editorEhAreaDeNota(tabela)) return;

    ocultarControlesGradeTabelaEditor();
  });

  window.addEventListener("scroll", () => {
    if (tabelaSelecionadaEditor && celulaHoverTabelaEditor && document.body.contains(tabelaSelecionadaEditor)) {
      renderizarControlesGradeTabelaEditor();
    }
  }, true);

  window.addEventListener("resize", () => {
    if (tabelaSelecionadaEditor && celulaHoverTabelaEditor && document.body.contains(tabelaSelecionadaEditor)) {
      renderizarControlesGradeTabelaEditor();
    }
  });
}

document.addEventListener("DOMContentLoaded", prepararControlesGradeTabelaEditor);


/* v80 - dropdown de estilo de texto semelhante ao Trello */
function encontrarToolbarNota() {
  const editor = document.getElementById("notaTextoEditor");
  if (!editor) return null;

  const candidatos = [
    editor.previousElementSibling,
    document.querySelector(".toolbar-editor"),
    document.querySelector(".barra-editor"),
    document.querySelector(".editor-toolbar"),
    document.querySelector(".botoes-editor")
  ].filter(Boolean);

  return candidatos.find(el => el.querySelector("button")) || candidatos[0] || null;
}

function obterEditorAtivoNota() {
  const ativo = document.activeElement;
  if (ativo && ativo.closest && ativo.closest("#notaAnexoEditor, #notaTextoEditor, [contenteditable='true']")) {
    return ativo.closest("#notaAnexoEditor, #notaTextoEditor, [contenteditable='true']");
  }

  return document.getElementById("notaTextoEditor");
}

function aplicarBlocoEditor(tag) {
  const editor = obterEditorAtivoNota();
  if (editor) editor.focus();

  if (tag === "P") {
    document.execCommand("formatBlock", false, "p");
  } else {
    document.execCommand("formatBlock", false, tag.toLowerCase());
  }

  atualizarRotuloDropdownEstiloTexto(tag);
}

function atualizarRotuloDropdownEstiloTexto(tag) {
  const botao = document.getElementById("btnDropdownEstiloTexto");
  if (!botao) return;

  const rotulos = {
    P: "Texto normal",
    H1: "Título 1",
    H2: "Título 2",
    H3: "Título 3",
    H4: "Título 4",
    H5: "Título 5",
    H6: "Título 6"
  };

  botao.innerHTML = `<span class="icone-estilo-texto">Tt</span><span class="rotulo-estilo-texto">${rotulos[tag] || "Texto normal"}</span><span class="seta-estilo-texto">⌄</span>`;
}

function aplicarFundoCinzaTabelaEditor() {
  const editor = obterEditorAtivoNota();
  if (editor) editor.focus();

  const selecao = window.getSelection();
  let alvo = selecao?.anchorNode;

  if (alvo && alvo.nodeType === Node.TEXT_NODE) alvo = alvo.parentElement;

  const celulas = [];

  if (alvo?.closest) {
    const celula = alvo.closest("td, th");
    if (celula) celulas.push(celula);
  }

  if (selecao && selecao.rangeCount) {
    const range = selecao.getRangeAt(0);
    const tabela = alvo?.closest?.("table");
    if (tabela) {
      tabela.querySelectorAll("td, th").forEach(celula => {
        try {
          if (range.intersectsNode(celula) && !celulas.includes(celula)) celulas.push(celula);
        } catch {}
      });
    }
  }

  if (!celulas.length) {
    alert("Clique dentro de uma célula da tabela para aplicar o fundo cinza.");
    return;
  }

  celulas.forEach(celula => {
    celula.classList.toggle("celula-fundo-cinza");
  });
}

function criarDropdownEstiloTextoTrello() {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-estilo-texto";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.id = "btnDropdownEstiloTexto";
  botao.className = "btn-dropdown-estilo-texto";

  const menu = document.createElement("div");
  menu.className = "menu-estilo-texto-trello escondido";

  const opcoes = [
    { tag: "P", rotulo: "Texto normal", atalho: "Ctrl+Alt+0", classe: "opcao-texto-normal" },
    { tag: "H1", rotulo: "Título 1", atalho: "Ctrl+Alt+1", classe: "opcao-titulo-1" },
    { tag: "H2", rotulo: "Título 2", atalho: "Ctrl+Alt+2", classe: "opcao-titulo-2" },
    { tag: "H3", rotulo: "Título 3", atalho: "Ctrl+Alt+3", classe: "opcao-titulo-3" },
    { tag: "H4", rotulo: "Título 4", atalho: "Ctrl+Alt+4", classe: "opcao-titulo-4" },
    { tag: "H5", rotulo: "Título 5", atalho: "Ctrl+Alt+5", classe: "opcao-titulo-5" },
    { tag: "H6", rotulo: "Título 6", atalho: "Ctrl+Alt+6", classe: "opcao-titulo-6" }
  ];

  opcoes.forEach(opcao => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `item-estilo-texto ${opcao.classe}`;
    item.innerHTML = `
      <span class="item-estilo-rotulo">${opcao.rotulo}</span>
      <span class="item-estilo-atalho">${opcao.atalho}</span>
    `;

    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      aplicarBlocoEditor(opcao.tag);
      menu.classList.add("escondido");
    });

    menu.appendChild(item);
  });

  botao.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    document.querySelectorAll(".menu-estilo-texto-trello").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });

    menu.classList.toggle("escondido");
  });

  wrapper.appendChild(botao);
  wrapper.appendChild(menu);

  atualizarRotuloDropdownEstiloTexto("P");

  return wrapper;
}

function prepararDropdownEstiloTextoEditor() {
  const toolbar = encontrarToolbarNota();
  if (!toolbar || toolbar.dataset.v80 === "1") return;

  toolbar.dataset.v80 = "1";
  toolbar.classList.add("toolbar-editor-avancada");

  // Remove menus antigos de Texto/Título adicionados na v79, se ainda existirem.
  toolbar.querySelectorAll(".menu-cascata-editor").forEach(el => el.remove());

  const dropdown = criarDropdownEstiloTextoTrello();

  const btnFundo = document.createElement("button");
  btnFundo.type = "button";
  btnFundo.className = "btn-editor-fundo-cinza";
  btnFundo.title = "Aplicar/remover fundo cinza na célula da tabela";
  btnFundo.textContent = "Fundo cinza";
  btnFundo.addEventListener("click", (event) => {
    event.preventDefault();
    aplicarFundoCinzaTabelaEditor();
  });

  toolbar.insertBefore(dropdown, toolbar.firstChild);

  if (!toolbar.querySelector(".btn-editor-fundo-cinza")) {
    toolbar.appendChild(btnFundo);
  }

  document.addEventListener("click", () => {
    document.querySelectorAll(".menu-estilo-texto-trello").forEach(menu => {
      menu.classList.add("escondido");
    });
  });

  document.addEventListener("keydown", (event) => {
    if (!event.ctrlKey || !event.altKey) return;

    const mapa = {
      "0": "P",
      "1": "H1",
      "2": "H2",
      "3": "H3",
      "4": "H4",
      "5": "H5",
      "6": "H6"
    };

    if (mapa[event.key]) {
      event.preventDefault();
      aplicarBlocoEditor(mapa[event.key]);
    }
  });
}

document.addEventListener("DOMContentLoaded", prepararDropdownEstiloTextoEditor);


/* v81 - ajuste do botão Tt e remoção dos botões antigos */
function atualizarRotuloDropdownEstiloTexto(tag) {
  const botao = document.getElementById("btnDropdownEstiloTexto");
  if (!botao) return;

  botao.innerHTML = `<span class="icone-estilo-texto">Tt</span><span class="seta-estilo-texto">⌄</span>`;
}

function removerBotoesAntigosTituloTexto(toolbar) {
  if (!toolbar) return;

  const textosRemover = new Set([
    "Texto",
    "Título",
    "Título 1",
    "Título 2",
    "Título 3",
    "Titulo",
    "Titulo 1",
    "Titulo 2",
    "Titulo 3"
  ]);

  Array.from(toolbar.children).forEach(el => {
    if (el.id === "btnDropdownEstiloTexto") return;
    if (el.classList?.contains("dropdown-estilo-texto")) return;

    const texto = (el.textContent || "").replace(/\s+/g, " ").trim();

    if (textosRemover.has(texto)) {
      el.remove();
    }
  });

  toolbar.querySelectorAll(".menu-cascata-editor").forEach(el => el.remove());
}

function prepararDropdownEstiloTextoEditor() {
  const toolbar = encontrarToolbarNota();
  if (!toolbar) return;

  toolbar.classList.add("toolbar-editor-avancada");

  removerBotoesAntigosTituloTexto(toolbar);

  if (!toolbar.querySelector(".dropdown-estilo-texto")) {
    const dropdown = criarDropdownEstiloTextoTrello();
    toolbar.insertBefore(dropdown, toolbar.firstChild);
  }

  atualizarRotuloDropdownEstiloTexto("P");

  if (!toolbar.querySelector(".btn-editor-fundo-cinza")) {
    const btnFundo = document.createElement("button");
    btnFundo.type = "button";
    btnFundo.className = "btn-editor-fundo-cinza";
    btnFundo.title = "Aplicar/remover fundo cinza na célula da tabela";
    btnFundo.textContent = "Fundo cinza";
    btnFundo.addEventListener("click", (event) => {
      event.preventDefault();
      aplicarFundoCinzaTabelaEditor();
    });
    toolbar.appendChild(btnFundo);
  }

  if (toolbar.dataset.v81 !== "1") {
    toolbar.dataset.v81 = "1";

    document.addEventListener("click", () => {
      document.querySelectorAll(".menu-estilo-texto-trello").forEach(menu => {
        menu.classList.add("escondido");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (!event.ctrlKey || !event.altKey) return;

      const mapa = {
        "0": "P",
        "1": "H1",
        "2": "H2",
        "3": "H3",
        "4": "H4",
        "5": "H5",
        "6": "H6"
      };

      if (mapa[event.key]) {
        event.preventDefault();
        aplicarBlocoEditor(mapa[event.key]);
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(prepararDropdownEstiloTextoEditor, 0);
  setTimeout(prepararDropdownEstiloTextoEditor, 300);
});


/* v82 - Fundo cinza usa o mesmo estilo do cabeçalho de tabela */
function aplicarFundoCinzaTabelaEditor() {
  const editor = obterEditorAtivoNota();
  if (editor) editor.focus();

  const selecao = window.getSelection();
  let alvo = selecao?.anchorNode;

  if (alvo && alvo.nodeType === Node.TEXT_NODE) alvo = alvo.parentElement;

  const celulas = [];

  if (alvo?.closest) {
    const celula = alvo.closest("td, th");
    if (celula) celulas.push(celula);
  }

  if (selecao && selecao.rangeCount) {
    const range = selecao.getRangeAt(0);
    const tabela = alvo?.closest?.("table");
    if (tabela) {
      tabela.querySelectorAll("td, th").forEach(celula => {
        try {
          if (range.intersectsNode(celula) && !celulas.includes(celula)) {
            celulas.push(celula);
          }
        } catch {}
      });
    }
  }

  if (!celulas.length) {
    alert("Clique dentro de uma célula da tabela para aplicar o estilo de cabeçalho.");
    return;
  }

  celulas.forEach(celula => {
    celula.classList.toggle("celula-fundo-cinza");
    celula.classList.toggle("celula-estilo-cabecalho-tabela");
  });
}


/* v83 - Fundo cinza converte célula para TH, igual cabeçalho real */
function trocarTagCelulaTabela(celula, novoTag) {
  if (!celula || celula.tagName.toLowerCase() === novoTag.toLowerCase()) return celula;

  const nova = document.createElement(novoTag);
  Array.from(celula.attributes).forEach(attr => {
    nova.setAttribute(attr.name, attr.value);
  });
  nova.innerHTML = celula.innerHTML;

  celula.parentNode.replaceChild(nova, celula);
  return nova;
}

function aplicarFundoCinzaTabelaEditor() {
  const editor = obterEditorAtivoNota();
  if (editor) editor.focus();

  const selecao = window.getSelection();
  let alvo = selecao?.anchorNode;

  if (alvo && alvo.nodeType === Node.TEXT_NODE) alvo = alvo.parentElement;

  const celulas = [];

  if (alvo?.closest) {
    const celula = alvo.closest("td, th");
    if (celula) celulas.push(celula);
  }

  if (selecao && selecao.rangeCount) {
    const range = selecao.getRangeAt(0);
    const tabela = alvo?.closest?.("table");
    if (tabela) {
      tabela.querySelectorAll("td, th").forEach(celula => {
        try {
          if (range.intersectsNode(celula) && !celulas.includes(celula)) {
            celulas.push(celula);
          }
        } catch {}
      });
    }
  }

  if (!celulas.length) {
    alert("Clique dentro de uma célula da tabela para aplicar o estilo de cabeçalho.");
    return;
  }

  celulas.forEach(celulaOriginal => {
    const jaEhCabecalho =
      celulaOriginal.tagName.toLowerCase() === "th" ||
      celulaOriginal.classList.contains("celula-estilo-cabecalho-tabela");

    if (jaEhCabecalho) {
      const celula = trocarTagCelulaTabela(celulaOriginal, "td");
      celula.classList.remove("celula-fundo-cinza", "celula-estilo-cabecalho-tabela");
      celula.style.backgroundColor = "";
      celula.style.fontFamily = "";
      celula.style.fontWeight = "";
      celula.style.textAlign = "";
      celula.style.verticalAlign = "";
    } else {
      const celula = trocarTagCelulaTabela(celulaOriginal, "th");
      celula.classList.add("celula-fundo-cinza", "celula-estilo-cabecalho-tabela");
      celula.style.backgroundColor = "#e5e7eb";
      celula.style.fontFamily = "Arial, sans-serif";
      celula.style.fontWeight = "700";
      celula.style.textAlign = "center";
      celula.style.verticalAlign = "middle";
    }
  });
}


/* v85 - popup do Tt em camada fixa, sem ser cortado pelo campo de texto */
function posicionarMenuEstiloTextoFixo() {
  const botao = document.getElementById("btnDropdownEstiloTexto");
  const menu = document.querySelector(".menu-estilo-texto-trello");

  if (!botao || !menu || menu.classList.contains("escondido")) return;

  const rect = botao.getBoundingClientRect();
  const larguraMenu = 245;
  const margem = 10;

  let left = rect.left;
  if (left + larguraMenu > window.innerWidth - margem) {
    left = window.innerWidth - larguraMenu - margem;
  }
  if (left < margem) left = margem;

  const alturaEstimativa = Math.min(360, window.innerHeight - 30);
  const espacoAbaixo = window.innerHeight - rect.bottom;
  const espacoAcima = rect.top;

  let top;

  if (espacoAbaixo < alturaEstimativa && espacoAcima > espacoAbaixo) {
    top = Math.max(margem, rect.top - alturaEstimativa - 6);
    menu.classList.add("abre-para-cima");
  } else {
    top = rect.bottom + 6;
    menu.classList.remove("abre-para-cima");
  }

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.style.maxHeight = `${Math.min(alturaEstimativa, window.innerHeight - top - margem)}px`;
}

function prepararPopupFixoTt() {
  const botao = document.getElementById("btnDropdownEstiloTexto");
  if (!botao || botao.dataset.v85 === "1") return;

  botao.dataset.v85 = "1";

  botao.addEventListener("click", () => {
    setTimeout(posicionarMenuEstiloTextoFixo, 0);
  });

  window.addEventListener("resize", posicionarMenuEstiloTextoFixo);
  window.addEventListener("scroll", posicionarMenuEstiloTextoFixo, true);
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(prepararPopupFixoTt, 50);
  setTimeout(prepararPopupFixoTt, 400);
});


/* v87 - organiza botões de tabela na barra do editor */
function encontrarBotaoToolbarPorTexto(toolbar, textos) {
  if (!toolbar) return null;

  const lista = textos.map(t => t.toLowerCase());

  return Array.from(toolbar.querySelectorAll("button")).find(btn => {
    const texto = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    return lista.includes(texto);
  });
}

function prepararGrupoFerramentasTabelaEditor() {
  const toolbar = encontrarToolbarNota();
  if (!toolbar || toolbar.dataset.v87 === "1") return;

  toolbar.dataset.v87 = "1";
  toolbar.classList.add("toolbar-editor-avancada");

  const botaoTabela = encontrarBotaoToolbarPorTexto(toolbar, ["Tabela", "Inserir Tabela"]);
  const botaoFundo = toolbar.querySelector(".btn-editor-fundo-cinza") || encontrarBotaoToolbarPorTexto(toolbar, ["Fundo cinza", "Fundo Cinza"]);

  if (!botaoTabela && !botaoFundo) return;

  if (botaoTabela) {
    botaoTabela.textContent = "Inserir Tabela";
    botaoTabela.classList.add("btn-editor-tabela");
  }

  if (botaoFundo) {
    botaoFundo.textContent = "Fundo cinza";
    botaoFundo.classList.add("btn-editor-tabela");
  }

  let grupo = toolbar.querySelector(".grupo-ferramentas-tabela");
  if (!grupo) {
    grupo = document.createElement("div");
    grupo.className = "grupo-ferramentas-tabela";
    grupo.innerHTML = `<span class="rotulo-grupo-tabela">Tabela</span>`;

    const primeiroBotao = botaoTabela || botaoFundo;
    toolbar.insertBefore(grupo, primeiroBotao);
  }

  if (botaoTabela && botaoTabela.parentElement !== grupo) {
    grupo.appendChild(botaoTabela);
  }

  if (botaoFundo && botaoFundo.parentElement !== grupo) {
    grupo.appendChild(botaoFundo);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(prepararGrupoFerramentasTabelaEditor, 0);
  setTimeout(prepararGrupoFerramentasTabelaEditor, 350);
});


/* v88 - renomeia Fundo cinza para Cabeçalho */
function ajustarBotaoCabecalhoTabelaEditor() {
  const toolbar = encontrarToolbarNota();
  if (!toolbar) return;

  const botoes = Array.from(toolbar.querySelectorAll("button"));
  const botaoCabecalho = botoes.find(btn => {
    const texto = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    return texto === "fundo cinza" || texto === "cabeçalho" || texto === "cabecalho";
  });

  if (!botaoCabecalho) return;

  botaoCabecalho.textContent = "Cabeçalho";
  botaoCabecalho.title = "Aplicar/remover estilo de cabeçalho na célula da tabela";
  botaoCabecalho.classList.add("btn-editor-cabecalho-tabela");
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(ajustarBotaoCabecalhoTabelaEditor, 0);
  setTimeout(ajustarBotaoCabecalhoTabelaEditor, 350);
  setTimeout(ajustarBotaoCabecalhoTabelaEditor, 800);
});


/* v89 - botão Limpar na janela Incluir Nova Nota */
function limparFormularioNovaNota() {
  const confirmar = confirm("Limpar todos os campos da nota e começar de novo?");
  if (!confirmar) return;

  const camposTexto = [
    "notaNumero",
    "notaBoletim",
    "notaData",
    "notaTitulo",
    "notaTexto",
    "notaTextoEditor",
    "notaAnexo",
    "notaAnexoEditor"
  ];

  camposTexto.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.isContentEditable) {
      el.innerHTML = "";
    } else {
      el.value = "";
    }
  });

  const selects = [
    "notaParte",
    "notaSecao",
    "notaSubsecao"
  ];

  selects.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.selectedIndex = 0;
  });

  // Limpa campos de anexos dinâmicos, se houver.
  document.querySelectorAll(".campo-anexo, .anexo-item, .anexo-extra").forEach((el, index) => {
    if (index === 0) {
      el.querySelectorAll("input, textarea").forEach(campo => campo.value = "");
      el.querySelectorAll("[contenteditable='true']").forEach(campo => campo.innerHTML = "");
    } else {
      el.remove();
    }
  });

  // Remove seleção/controles de tabela.
  try { ocultarControlesGradeTabelaEditor(); } catch {}
  try { ocultarControlesTabelaEditor(); } catch {}

  // Se houver modo de edição ativo, mantém o formulário como nova nota.
  try {
    notaEditandoId = null;
  } catch {}

  const tituloModal = document.getElementById("tituloModalNota");
  if (tituloModal) tituloModal.textContent = "Incluir Nova Nota";

  const btnSalvar = document.getElementById("btnSalvarNota");
  if (btnSalvar) btnSalvar.textContent = "Salvar nota";

  try { atualizarCamposHierarquia(); } catch {}
  try { preencherPadroesNovaNota(); } catch {}

  const primeiroCampo = document.getElementById("notaNumero") || document.getElementById("notaTitulo");
  if (primeiroCampo) primeiroCampo.focus();
}

function prepararBotaoLimparNota() {
  const modal = document.getElementById("modalNota");
  if (!modal) return;

  if (document.getElementById("btnLimparNota")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btnLimparNota";
  btn.className = "btn-limpar-nota";
  btn.textContent = "Limpar";
  btn.title = "Limpar os campos da nota";

  btn.addEventListener("click", limparFormularioNovaNota);

  const btnCancelar = document.getElementById("btnCancelarNota");
  const btnSalvar = document.getElementById("btnSalvarNota");

  if (btnCancelar && btnCancelar.parentNode) {
    btnCancelar.parentNode.insertBefore(btn, btnCancelar);
  } else if (btnSalvar && btnSalvar.parentNode) {
    btnSalvar.parentNode.insertBefore(btn, btnSalvar);
  } else {
    const rodape = modal.querySelector(".modal-rodape, .botoes-formulario, .form-acoes, .acoes-modal");
    if (rodape) rodape.appendChild(btn);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(prepararBotaoLimparNota, 0);
  setTimeout(prepararBotaoLimparNota, 350);
  setTimeout(prepararBotaoLimparNota, 800);
});


/* v92 - reorganiza Tachado, listas em cascata e alinhamentos */
function executarComandoEditorBarra(comando, valor = null) {
  const editor = obterEditorAtivoNota();
  if (editor) editor.focus();
  document.execCommand(comando, false, valor);
}

function criarBotaoFormatacaoBarra({ texto, titulo, comando, classe }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn-editor-formatacao ${classe || ""}`.trim();
  btn.title = titulo;
  btn.innerHTML = texto;
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    executarComandoEditorBarra(comando);
  });
  return btn;
}

function encontrarBotaoSublinhado(toolbar) {
  if (!toolbar) return null;

  return Array.from(toolbar.querySelectorAll("button")).find(btn => {
    const texto = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const title = (btn.title || "").toLowerCase();
    const html = (btn.innerHTML || "").toLowerCase();

    return (
      texto === "u" ||
      texto.includes("sublinhado") ||
      title.includes("sublinhado") ||
      html.includes("underline")
    );
  });
}

function criarBotaoTachadoIndividual() {
  return criarBotaoFormatacaoBarra({
    texto: "<s>S</s>",
    titulo: "Tachado",
    comando: "strikeThrough",
    classe: "btn-tachado"
  });
}

function criarDropdownListaEditor() {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-lista-editor";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-dropdown-lista-editor";
  botao.title = "Listas";
  botao.innerHTML = `<span class="icone-lista-editor">☷</span><span class="seta-lista-editor">⌄</span>`;

  const menu = document.createElement("div");
  menu.className = "menu-lista-editor escondido";

  const btnMarcadores = document.createElement("button");
  btnMarcadores.type = "button";
  btnMarcadores.innerHTML = `<span class="icone-menu-lista">•</span><span>Lista com marcadores</span>`;
  btnMarcadores.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    executarComandoEditorBarra("insertUnorderedList");
    menu.classList.add("escondido");
  });

  const btnNumerada = document.createElement("button");
  btnNumerada.type = "button";
  btnNumerada.innerHTML = `<span class="icone-menu-lista">1.</span><span>Lista numerada</span>`;
  btnNumerada.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    executarComandoEditorBarra("insertOrderedList");
    menu.classList.add("escondido");
  });

  menu.appendChild(btnMarcadores);
  menu.appendChild(btnNumerada);

  botao.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    document.querySelectorAll(".menu-lista-editor, .menu-estilo-texto-trello").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });

    menu.classList.toggle("escondido");
  });

  wrapper.appendChild(botao);
  wrapper.appendChild(menu);

  return wrapper;
}

function encontrarPontoAntesTabela(toolbar) {
  if (!toolbar) return null;

  return toolbar.querySelector(".grupo-ferramentas-tabela, .dropdown-tabela-editor");
}

function prepararBotoesFormatacaoForaDoTt() {
  const toolbar = encontrarToolbarNota();
  if (!toolbar || toolbar.dataset.v92 === "1") return;

  toolbar.dataset.v92 = "1";
  toolbar.classList.add("toolbar-editor-avancada");

  // Remove grupo anterior da v91 se existir.
  toolbar.querySelectorAll(".grupo-formatacao-extra").forEach(el => el.remove());

  // Remove opções antigas de dentro do menu Tt se alguma restar.
  const menuTt = document.querySelector(".menu-estilo-texto-trello");
  if (menuTt) {
    menuTt.querySelectorAll(
      ".separador-menu-estilo-texto, .item-comando-texto, .opcao-tachado, .opcao-lista-marcadores, .opcao-lista-numerada, .opcao-alinhar-esquerda, .opcao-centralizar, .opcao-justificar"
    ).forEach(el => el.remove());
  }

  // Tachado ao lado do Sublinhado.
  if (!toolbar.querySelector(".btn-tachado")) {
    const btnSublinhado = encontrarBotaoSublinhado(toolbar);
    const btnTachado = criarBotaoTachadoIndividual();

    if (btnSublinhado && btnSublinhado.parentNode === toolbar) {
      toolbar.insertBefore(btnTachado, btnSublinhado.nextSibling);
    } else {
      toolbar.appendChild(btnTachado);
    }
  }

  // Grupo das listas + alinhamentos fica antes de Tabela.
  if (!toolbar.querySelector(".grupo-listas-alinhamento")) {
    const grupo = document.createElement("div");
    grupo.className = "grupo-listas-alinhamento";

    grupo.appendChild(criarDropdownListaEditor());

    grupo.appendChild(criarBotaoFormatacaoBarra({
      texto: '<span class="icone-alinhar-esquerda" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
      titulo: "Alinhar à esquerda",
      comando: "justifyLeft",
      classe: "btn-alinhar-esquerda"
    }));

    grupo.appendChild(criarBotaoFormatacaoBarra({
      texto: '<span class="icone-centralizar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
      titulo: "Centralizar",
      comando: "justifyCenter",
      classe: "btn-centralizar"
    }));

    grupo.appendChild(criarBotaoFormatacaoBarra({
      texto: '<span class="icone-justificar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
      titulo: "Justificar",
      comando: "justifyFull",
      classe: "btn-justificar"
    }));

    const ponto = encontrarPontoAntesTabela(toolbar);
    if (ponto) toolbar.insertBefore(grupo, ponto);
    else toolbar.appendChild(grupo);
  }

  document.addEventListener("click", () => {
    document.querySelectorAll(".menu-lista-editor").forEach(menu => {
      menu.classList.add("escondido");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(prepararBotoesFormatacaoForaDoTt, 0);
  setTimeout(prepararBotoesFormatacaoForaDoTt, 350);
  setTimeout(prepararBotoesFormatacaoForaDoTt, 900);
});


/* v93 - posiciona Tachado entre Sublinhado e Tab/Recuo e muda ícone de lista */
function encontrarBotaoPorTextoOuTitulo(toolbar, termos) {
  if (!toolbar) return null;

  const lista = termos.map(t => t.toLowerCase());

  return Array.from(toolbar.querySelectorAll("button")).find(btn => {
    const texto = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const title = (btn.title || "").toLowerCase();
    const aria = (btn.getAttribute("aria-label") || "").toLowerCase();
    const html = (btn.innerHTML || "").toLowerCase();

    return lista.some(t =>
      texto.includes(t) ||
      title.includes(t) ||
      aria.includes(t) ||
      html.includes(t)
    );
  });
}

function encontrarBotaoSublinhadoV93(toolbar) {
  return encontrarBotaoPorTextoOuTitulo(toolbar, ["sublinhado", "underline"]) ||
    Array.from(toolbar.querySelectorAll("button")).find(btn => {
      const texto = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      return texto === "u";
    });
}

function encontrarBotaoTabRecuoV93(toolbar) {
  return encontrarBotaoPorTextoOuTitulo(toolbar, ["tab/recuo", "tab", "recuo"]);
}

function criarOuObterBotaoTachadoV93(toolbar) {
  let btn = toolbar.querySelector(".btn-tachado");

  if (!btn) {
    btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-editor-formatacao btn-tachado";
    btn.title = "Tachado";
    btn.innerHTML = "<s>S</s>";
    btn.addEventListener("click", (event) => {
      event.preventDefault();
      executarComandoEditorBarra("strikeThrough");
    });
  }

  return btn;
}

function reposicionarTachadoV93() {
  const toolbar = encontrarToolbarNota();
  if (!toolbar) return;

  const btnTachado = criarOuObterBotaoTachadoV93(toolbar);
  const btnSublinhado = encontrarBotaoSublinhadoV93(toolbar);
  const btnTabRecuo = encontrarBotaoTabRecuoV93(toolbar);

  // Remove do local atual antes de reinserir.
  if (btnTachado.parentNode) {
    btnTachado.parentNode.removeChild(btnTachado);
  }

  if (btnSublinhado && btnSublinhado.parentNode === toolbar) {
    toolbar.insertBefore(btnTachado, btnSublinhado.nextSibling);
  } else if (btnTabRecuo && btnTabRecuo.parentNode === toolbar) {
    toolbar.insertBefore(btnTachado, btnTabRecuo);
  } else {
    toolbar.appendChild(btnTachado);
  }
}

function ajustarIconeListaV93() {
  document.querySelectorAll(".btn-dropdown-lista-editor").forEach(botao => {
    botao.innerHTML = `
      <span class="icone-lista-pontos" aria-hidden="true">
        <i></i><i></i><i></i>
      </span>
      <span class="seta-lista-editor">⌄</span>
    `;
    botao.title = "Listas";
  });
}

function aplicarAjustesV93BarraEditor() {
  reposicionarTachadoV93();
  ajustarIconeListaV93();
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(aplicarAjustesV93BarraEditor, 0);
  setTimeout(aplicarAjustesV93BarraEditor, 350);
  setTimeout(aplicarAjustesV93BarraEditor, 900);
});


/* v94 - barra de Anexos igual à barra de Texto */
function obterToolbarPorEditorId(editorId) {
  const editor = document.getElementById(editorId);
  if (!editor) return null;

  if (editorId === "notaAnexoEditor") {
    return document.getElementById("toolbarEditorAnexo") ||
      editor.previousElementSibling ||
      document.querySelector(".toolbar-editor-anexo");
  }

  return encontrarToolbarNota();
}

function executarComandoToolbarEspecifica(editorId, comando, valor = null) {
  const editor = document.getElementById(editorId) || obterEditorAtivoNota();
  if (editor) editor.focus();

  if (comando === "inserirTab") {
    document.execCommand("insertText", false, "\t");
    return;
  }

  if (comando === "insertTable") {
    if (typeof abrirModalTabela === "function") {
      editorTabelaAtivo = editorId;
      abrirModalTabela(editorId);
    } else if (typeof inserirTabelaNoEditor === "function") {
      editorTabelaAtivo = editorId;
      inserirTabelaNoEditor(editorId);
    }
    return;
  }

  document.execCommand(comando, false, valor);
}

function criarDropdownEstiloTextoParaEditor(editorId) {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-estilo-texto";
  wrapper.dataset.editorId = editorId;

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-dropdown-estilo-texto";
  botao.innerHTML = `<span class="icone-estilo-texto">Tt</span><span class="seta-estilo-texto">⌄</span>`;

  const menu = document.createElement("div");
  menu.className = "menu-estilo-texto-trello escondido";

  const opcoes = [
    { tag: "P", rotulo: "Texto normal", atalho: "Ctrl+Alt+0", classe: "opcao-texto-normal" },
    { tag: "H1", rotulo: "Título 1", atalho: "Ctrl+Alt+1", classe: "opcao-titulo-1" },
    { tag: "H2", rotulo: "Título 2", atalho: "Ctrl+Alt+2", classe: "opcao-titulo-2" },
    { tag: "H3", rotulo: "Título 3", atalho: "Ctrl+Alt+3", classe: "opcao-titulo-3" },
    { tag: "H4", rotulo: "Título 4", atalho: "Ctrl+Alt+4", classe: "opcao-titulo-4" },
    { tag: "H5", rotulo: "Título 5", atalho: "Ctrl+Alt+5", classe: "opcao-titulo-5" },
    { tag: "H6", rotulo: "Título 6", atalho: "Ctrl+Alt+6", classe: "opcao-titulo-6" }
  ];

  opcoes.forEach(opcao => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `item-estilo-texto ${opcao.classe}`;
    item.innerHTML = `
      <span class="item-estilo-rotulo">${opcao.rotulo}</span>
      <span class="item-estilo-atalho">${opcao.atalho}</span>
    `;

    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const editor = document.getElementById(editorId);
      if (editor) editor.focus();

      if (opcao.tag === "P") {
        document.execCommand("formatBlock", false, "p");
      } else {
        document.execCommand("formatBlock", false, opcao.tag.toLowerCase());
      }

      menu.classList.add("escondido");
    });

    menu.appendChild(item);
  });

  botao.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    document.querySelectorAll(".menu-estilo-texto-trello").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });

    menu.classList.toggle("escondido");
    setTimeout(() => posicionarMenuEstiloTextoGenerico(botao, menu), 0);
  });

  wrapper.appendChild(botao);
  wrapper.appendChild(menu);

  return wrapper;
}

function posicionarMenuEstiloTextoGenerico(botao, menu) {
  if (!botao || !menu || menu.classList.contains("escondido")) return;

  const rect = botao.getBoundingClientRect();
  const larguraMenu = 245;
  const margem = 10;

  let left = rect.left;
  if (left + larguraMenu > window.innerWidth - margem) {
    left = window.innerWidth - larguraMenu - margem;
  }
  if (left < margem) left = margem;

  const alturaEstimativa = Math.min(360, window.innerHeight - 30);
  const espacoAbaixo = window.innerHeight - rect.bottom;
  const espacoAcima = rect.top;

  let top;

  if (espacoAbaixo < alturaEstimativa && espacoAcima > espacoAbaixo) {
    top = Math.max(margem, rect.top - alturaEstimativa - 6);
    menu.classList.add("abre-para-cima");
  } else {
    top = rect.bottom + 6;
    menu.classList.remove("abre-para-cima");
  }

  menu.style.left = `${left}px`;
  menu.style.top = `${top}px`;
  menu.style.maxHeight = `${Math.min(alturaEstimativa, window.innerHeight - top - margem)}px`;
}

function criarBotaoFormatacaoParaEditor(editorId, { html, titulo, comando, classe }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn-editor-formatacao ${classe || ""}`.trim();
  btn.title = titulo;
  btn.innerHTML = html;
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    executarComandoToolbarEspecifica(editorId, comando);
  });
  return btn;
}

function criarDropdownListaParaEditor(editorId) {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-lista-editor";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-dropdown-lista-editor";
  botao.title = "Listas";
  botao.innerHTML = `
    <span class="icone-lista-pontos" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="seta-lista-editor">⌄</span>
  `;

  const menu = document.createElement("div");
  menu.className = "menu-lista-editor escondido";

  const btnMarcadores = document.createElement("button");
  btnMarcadores.type = "button";
  btnMarcadores.innerHTML = `<span class="icone-menu-lista">•</span><span>Lista com marcadores</span>`;
  btnMarcadores.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    executarComandoToolbarEspecifica(editorId, "insertUnorderedList");
    menu.classList.add("escondido");
  });

  const btnNumerada = document.createElement("button");
  btnNumerada.type = "button";
  btnNumerada.innerHTML = `<span class="icone-menu-lista">1.</span><span>Lista numerada</span>`;
  btnNumerada.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    executarComandoToolbarEspecifica(editorId, "insertOrderedList");
    menu.classList.add("escondido");
  });

  menu.appendChild(btnMarcadores);
  menu.appendChild(btnNumerada);

  botao.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    document.querySelectorAll(".menu-lista-editor, .menu-estilo-texto-trello").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });

    menu.classList.toggle("escondido");
  });

  wrapper.appendChild(botao);
  wrapper.appendChild(menu);

  return wrapper;
}

function criarGrupoListasAlinhamentoParaEditor(editorId) {
  const grupo = document.createElement("div");
  grupo.className = "grupo-listas-alinhamento";

  grupo.appendChild(criarDropdownListaParaEditor(editorId));

  grupo.appendChild(criarBotaoFormatacaoParaEditor(editorId, {
    html: '<span class="icone-alinhar-esquerda" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
    titulo: "Alinhar à esquerda",
    comando: "justifyLeft",
    classe: "btn-alinhar-esquerda"
  }));

  grupo.appendChild(criarBotaoFormatacaoParaEditor(editorId, {
    html: '<span class="icone-centralizar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
    titulo: "Centralizar",
    comando: "justifyCenter",
    classe: "btn-centralizar"
  }));

  grupo.appendChild(criarBotaoFormatacaoParaEditor(editorId, {
    html: '<span class="icone-justificar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
    titulo: "Justificar",
    comando: "justifyFull",
    classe: "btn-justificar"
  }));

  return grupo;
}

function criarGrupoTabelaParaEditor(editorId) {
  const grupo = document.createElement("div");
  grupo.className = "grupo-ferramentas-tabela";

  const rotulo = document.createElement("span");
  rotulo.className = "rotulo-grupo-tabela";
  rotulo.textContent = "Tabela";
  grupo.appendChild(rotulo);

  const btnInserir = document.createElement("button");
  btnInserir.type = "button";
  btnInserir.className = "btn-editor-tabela";
  btnInserir.textContent = "Inserir Tabela";
  btnInserir.title = "Inserir tabela";
  btnInserir.addEventListener("click", (event) => {
    event.preventDefault();
    executarComandoToolbarEspecifica(editorId, "insertTable");
  });

  const btnCabecalho = document.createElement("button");
  btnCabecalho.type = "button";
  btnCabecalho.className = "btn-editor-tabela btn-editor-cabecalho-tabela";
  btnCabecalho.textContent = "Cabeçalho";
  btnCabecalho.title = "Aplicar/remover estilo de cabeçalho na célula da tabela";
  btnCabecalho.addEventListener("click", (event) => {
    event.preventDefault();
    const editor = document.getElementById(editorId);
    if (editor) editor.focus();
    aplicarFundoCinzaTabelaEditor();
  });

  grupo.appendChild(btnInserir);
  grupo.appendChild(btnCabecalho);

  return grupo;
}

function prepararToolbarCompletaParaEditor(editorId) {
  const toolbar = obterToolbarPorEditorId(editorId);
  const editor = document.getElementById(editorId);

  if (!toolbar || !editor || toolbar.dataset[`v94${editorId}`] === "1") return;

  toolbar.dataset[`v94${editorId}`] = "1";
  toolbar.classList.add("toolbar-editor-avancada");

  // Limpa botões duplicados criados em tentativas anteriores, somente para a toolbar de anexos.
  if (editorId === "notaAnexoEditor") {
    toolbar.innerHTML = "";
  }

  // Tt
  toolbar.appendChild(criarDropdownEstiloTextoParaEditor(editorId));

  // básicos
  toolbar.appendChild(criarBotaoFormatacaoParaEditor(editorId, {
    html: "<strong>N</strong>",
    titulo: "Negrito",
    comando: "bold",
    classe: "btn-negrito"
  }));

  toolbar.appendChild(criarBotaoFormatacaoParaEditor(editorId, {
    html: "<em>I</em>",
    titulo: "Itálico",
    comando: "italic",
    classe: "btn-italico"
  }));

  toolbar.appendChild(criarBotaoFormatacaoParaEditor(editorId, {
    html: "<u>U</u>",
    titulo: "Sublinhado",
    comando: "underline",
    classe: "btn-sublinhado"
  }));

  toolbar.appendChild(criarBotaoFormatacaoParaEditor(editorId, {
    html: "<s>S</s>",
    titulo: "Tachado",
    comando: "strikeThrough",
    classe: "btn-tachado"
  }));

  toolbar.appendChild(criarBotaoFormatacaoParaEditor(editorId, {
    html: "Tab/Recuo",
    titulo: "Tab/Recuo",
    comando: "inserirTab",
    classe: "btn-tab-recuo"
  }));

  toolbar.appendChild(criarGrupoListasAlinhamentoParaEditor(editorId));
  toolbar.appendChild(criarGrupoTabelaParaEditor(editorId));

  document.addEventListener("click", () => {
    document.querySelectorAll(".menu-lista-editor, .menu-estilo-texto-trello").forEach(menu => {
      menu.classList.add("escondido");
    });
  });
}

function prepararToolbarAnexosIgualTexto() {
  prepararToolbarCompletaParaEditor("notaAnexoEditor");
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(prepararToolbarAnexosIgualTexto, 0);
  setTimeout(prepararToolbarAnexosIgualTexto, 350);
  setTimeout(prepararToolbarAnexosIgualTexto, 900);
});


/* v95 - substitui a barra antiga do Texto do Anexo pela barra completa igual à de Texto */
function obterEditorAnexoTexto() {
  return document.getElementById("notaAnexoEditor") ||
         document.querySelector("[data-editor-anexo='texto']") ||
         document.querySelector(".editor-anexo[contenteditable='true']");
}

function obterToolbarTextoAnexoCompleta() {
  let toolbar = document.getElementById("toolbarTextoAnexoCompleta");
  const editorAnexo = obterEditorAnexoTexto();

  if (!editorAnexo) return null;

  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.id = "toolbarTextoAnexoCompleta";
    toolbar.className = "toolbar-editor toolbar-editor-anexo toolbar-editor-avancada";
    toolbar.dataset.toolbarAnexoCompleta = "1";
    editorAnexo.parentNode.insertBefore(toolbar, editorAnexo);
  }

  return toolbar;
}

function esconderToolbarAntigaAnexo() {
  const editorAnexo = obterEditorAnexoTexto();
  if (!editorAnexo) return;

  const toolbarNova = obterToolbarTextoAnexoCompleta();

  // Esconde barras antigas próximas ao editor de anexo, mas preserva a nova.
  let anterior = toolbarNova?.previousElementSibling || editorAnexo.previousElementSibling;

  for (let i = 0; anterior && i < 4; i++) {
    const pareceToolbar =
      anterior.classList?.contains("toolbar-editor") ||
      anterior.classList?.contains("barra-editor") ||
      anterior.classList?.contains("editor-toolbar") ||
      anterior.querySelector?.("button");

    if (pareceToolbar && anterior !== toolbarNova) {
      anterior.classList.add("toolbar-anexo-antiga-escondida");
    }

    anterior = anterior.previousElementSibling;
  }

  document.querySelectorAll("#toolbarEditorAnexo").forEach(el => {
    if (el !== toolbarNova) el.classList.add("toolbar-anexo-antiga-escondida");
  });
}

function executarComandoAnexo(comando, valor = null) {
  const editor = obterEditorAnexoTexto();
  if (editor) editor.focus();

  if (comando === "inserirTab") {
    document.execCommand("insertText", false, "\t");
    return;
  }

  if (comando === "insertTable") {
    if (typeof abrirModalTabela === "function") {
      editorTabelaAtivo = "notaAnexoEditor";
      abrirModalTabela("notaAnexoEditor");
    } else if (typeof inserirTabelaNoEditor === "function") {
      editorTabelaAtivo = "notaAnexoEditor";
      inserirTabelaNoEditor("notaAnexoEditor");
    } else {
      const tabela = '<table><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>';
      document.execCommand("insertHTML", false, tabela);
    }
    return;
  }

  document.execCommand(comando, false, valor);
}

function criarBotaoAnexo({ html, titulo, comando, classe }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn-editor-formatacao ${classe || ""}`.trim();
  btn.title = titulo;
  btn.innerHTML = html;
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    executarComandoAnexo(comando);
  });
  return btn;
}

function criarDropdownTtAnexo() {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-estilo-texto";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-dropdown-estilo-texto";
  botao.innerHTML = `<span class="icone-estilo-texto">Tt</span><span class="seta-estilo-texto">⌄</span>`;

  const menu = document.createElement("div");
  menu.className = "menu-estilo-texto-trello escondido";

  const opcoes = [
    ["P", "Texto normal", "Ctrl+Alt+0", "opcao-texto-normal"],
    ["H1", "Título 1", "Ctrl+Alt+1", "opcao-titulo-1"],
    ["H2", "Título 2", "Ctrl+Alt+2", "opcao-titulo-2"],
    ["H3", "Título 3", "Ctrl+Alt+3", "opcao-titulo-3"],
    ["H4", "Título 4", "Ctrl+Alt+4", "opcao-titulo-4"],
    ["H5", "Título 5", "Ctrl+Alt+5", "opcao-titulo-5"],
    ["H6", "Título 6", "Ctrl+Alt+6", "opcao-titulo-6"]
  ];

  opcoes.forEach(([tag, rotulo, atalho, classe]) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `item-estilo-texto ${classe}`;
    item.innerHTML = `
      <span class="item-estilo-rotulo">${rotulo}</span>
      <span class="item-estilo-atalho">${atalho}</span>
    `;

    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const editor = obterEditorAnexoTexto();
      if (editor) editor.focus();

      document.execCommand("formatBlock", false, tag === "P" ? "p" : tag.toLowerCase());
      menu.classList.add("escondido");
    });

    menu.appendChild(item);
  });

  botao.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    document.querySelectorAll(".menu-estilo-texto-trello").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });

    menu.classList.toggle("escondido");

    if (typeof posicionarMenuEstiloTextoGenerico === "function") {
      setTimeout(() => posicionarMenuEstiloTextoGenerico(botao, menu), 0);
    } else if (typeof posicionarMenuEstiloTextoFixo === "function") {
      setTimeout(posicionarMenuEstiloTextoFixo, 0);
    }
  });

  wrapper.appendChild(botao);
  wrapper.appendChild(menu);

  return wrapper;
}

function criarDropdownListaAnexo() {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-lista-editor";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-dropdown-lista-editor";
  botao.title = "Listas";
  botao.innerHTML = `
    <span class="icone-lista-pontos" aria-hidden="true"><i></i><i></i><i></i></span>
    <span class="seta-lista-editor">⌄</span>
  `;

  const menu = document.createElement("div");
  menu.className = "menu-lista-editor escondido";

  const itens = [
    ["•", "Lista com marcadores", "insertUnorderedList"],
    ["1.", "Lista numerada", "insertOrderedList"]
  ];

  itens.forEach(([icone, rotulo, comando]) => {
    const item = document.createElement("button");
    item.type = "button";
    item.innerHTML = `<span class="icone-menu-lista">${icone}</span><span>${rotulo}</span>`;
    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      executarComandoAnexo(comando);
      menu.classList.add("escondido");
    });
    menu.appendChild(item);
  });

  botao.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    document.querySelectorAll(".menu-lista-editor, .menu-estilo-texto-trello").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });

    menu.classList.toggle("escondido");
  });

  wrapper.appendChild(botao);
  wrapper.appendChild(menu);
  return wrapper;
}

function criarGrupoAlinhamentoAnexo() {
  const grupo = document.createElement("div");
  grupo.className = "grupo-listas-alinhamento";

  grupo.appendChild(criarDropdownListaAnexo());

  grupo.appendChild(criarBotaoAnexo({
    html: '<span class="icone-alinhar-esquerda" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
    titulo: "Alinhar à esquerda",
    comando: "justifyLeft",
    classe: "btn-alinhar-esquerda"
  }));

  grupo.appendChild(criarBotaoAnexo({
    html: '<span class="icone-centralizar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
    titulo: "Centralizar",
    comando: "justifyCenter",
    classe: "btn-centralizar"
  }));

  grupo.appendChild(criarBotaoAnexo({
    html: '<span class="icone-justificar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
    titulo: "Justificar",
    comando: "justifyFull",
    classe: "btn-justificar"
  }));

  return grupo;
}

function criarGrupoTabelaAnexo() {
  const grupo = document.createElement("div");
  grupo.className = "grupo-ferramentas-tabela";

  const rotulo = document.createElement("span");
  rotulo.className = "rotulo-grupo-tabela";
  rotulo.textContent = "Tabela";
  grupo.appendChild(rotulo);

  const btnTabela = document.createElement("button");
  btnTabela.type = "button";
  btnTabela.className = "btn-editor-tabela";
  btnTabela.textContent = "Inserir Tabela";
  btnTabela.title = "Inserir tabela";
  btnTabela.addEventListener("click", (event) => {
    event.preventDefault();
    executarComandoAnexo("insertTable");
  });

  const btnCabecalho = document.createElement("button");
  btnCabecalho.type = "button";
  btnCabecalho.className = "btn-editor-tabela btn-editor-cabecalho-tabela";
  btnCabecalho.textContent = "Cabeçalho";
  btnCabecalho.title = "Aplicar/remover estilo de cabeçalho na célula da tabela";
  btnCabecalho.addEventListener("click", (event) => {
    event.preventDefault();
    const editor = obterEditorAnexoTexto();
    if (editor) editor.focus();
    aplicarFundoCinzaTabelaEditor();
  });

  grupo.appendChild(btnTabela);
  grupo.appendChild(btnCabecalho);

  return grupo;
}

function montarToolbarAnexoCompleta() {
  const toolbar = obterToolbarTextoAnexoCompleta();
  const editorAnexo = obterEditorAnexoTexto();

  if (!toolbar || !editorAnexo) return;

  toolbar.innerHTML = "";
  toolbar.className = "toolbar-editor toolbar-editor-anexo toolbar-editor-avancada";
  toolbar.dataset.toolbarAnexoCompleta = "1";

  toolbar.appendChild(criarDropdownTtAnexo());

  toolbar.appendChild(criarBotaoAnexo({
    html: "<strong>N</strong>",
    titulo: "Negrito",
    comando: "bold",
    classe: "btn-negrito"
  }));

  toolbar.appendChild(criarBotaoAnexo({
    html: "<em>I</em>",
    titulo: "Itálico",
    comando: "italic",
    classe: "btn-italico"
  }));

  toolbar.appendChild(criarBotaoAnexo({
    html: "<u>U</u>",
    titulo: "Sublinhado",
    comando: "underline",
    classe: "btn-sublinhado"
  }));

  toolbar.appendChild(criarBotaoAnexo({
    html: "<s>S</s>",
    titulo: "Tachado",
    comando: "strikeThrough",
    classe: "btn-tachado"
  }));

  toolbar.appendChild(criarBotaoAnexo({
    html: "Tab/Recuo",
    titulo: "Tab/Recuo",
    comando: "inserirTab",
    classe: "btn-tab-recuo"
  }));

  toolbar.appendChild(criarGrupoAlinhamentoAnexo());
  toolbar.appendChild(criarGrupoTabelaAnexo());

  esconderToolbarAntigaAnexo();
}

function prepararToolbarAnexoCompletaFinal() {
  montarToolbarAnexoCompleta();

  document.addEventListener("click", () => {
    document.querySelectorAll(".menu-lista-editor, .menu-estilo-texto-trello").forEach(menu => {
      menu.classList.add("escondido");
    });
  }, { once: true });
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(prepararToolbarAnexoCompletaFinal, 0);
  setTimeout(prepararToolbarAnexoCompletaFinal, 350);
  setTimeout(prepararToolbarAnexoCompletaFinal, 900);
});


/* v96 - força barra completa no Texto do Anexo */
let editorToolbarAtivoV96 = "notaTextoEditor";

function localizarEditorTextoAnexoV96() {
  return document.getElementById("notaAnexoEditor") ||
         document.querySelector("#modalNota [data-editor='anexo']") ||
         document.querySelector("#modalNota .editor-anexo[contenteditable='true']") ||
         document.querySelector("#modalNota [aria-label*='Anexo'][contenteditable='true']");
}

function focarEditorV96(editorId) {
  const editor = editorId === "notaAnexoEditor" ? localizarEditorTextoAnexoV96() : document.getElementById(editorId);
  if (editor) {
    editor.focus();
    editorToolbarAtivoV96 = editor.id || editorId;
  }
  return editor;
}

function executarComandoV96(editorId, comando, valor = null) {
  focarEditorV96(editorId);

  if (comando === "inserirTab") {
    document.execCommand("insertText", false, "\t");
    return;
  }

  if (comando === "formatBlock") {
    document.execCommand("formatBlock", false, valor);
    return;
  }

  if (comando === "insertTable") {
    const editor = focarEditorV96(editorId);

    // Usa o modal/função original de tabela, se existir.
    try {
      editorTabelaAtivo = editor?.id || editorId;
    } catch {}

    if (typeof abrirModalTabela === "function") {
      abrirModalTabela(editor?.id || editorId);
      return;
    }

    if (typeof inserirTabelaNoEditor === "function") {
      inserirTabelaNoEditor(editor?.id || editorId);
      return;
    }

    const tabela = '<table><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>';
    document.execCommand("insertHTML", false, tabela);
    return;
  }

  document.execCommand(comando, false, valor);
}

function aplicarCabecalhoTabelaV96(editorId) {
  focarEditorV96(editorId);
  aplicarFundoCinzaTabelaEditor();
}

function botaoV96({ html, title, comando, valor, classe, editorId }) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn-editor-formatacao ${classe || ""}`.trim();
  btn.title = title;
  btn.innerHTML = html;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    executarComandoV96(editorId, comando, valor);
  });
  return btn;
}

function dropdownTtV96(editorId) {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-estilo-texto";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-dropdown-estilo-texto";
  botao.innerHTML = '<span class="icone-estilo-texto">Tt</span><span class="seta-estilo-texto">⌄</span>';

  const menu = document.createElement("div");
  menu.className = "menu-estilo-texto-trello escondido";

  [
    ["p", "Texto normal", "Ctrl+Alt+0", "opcao-texto-normal"],
    ["h1", "Título 1", "Ctrl+Alt+1", "opcao-titulo-1"],
    ["h2", "Título 2", "Ctrl+Alt+2", "opcao-titulo-2"],
    ["h3", "Título 3", "Ctrl+Alt+3", "opcao-titulo-3"],
    ["h4", "Título 4", "Ctrl+Alt+4", "opcao-titulo-4"],
    ["h5", "Título 5", "Ctrl+Alt+5", "opcao-titulo-5"],
    ["h6", "Título 6", "Ctrl+Alt+6", "opcao-titulo-6"]
  ].forEach(([tag, rotulo, atalho, classe]) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `item-estilo-texto ${classe}`;
    item.innerHTML = `<span class="item-estilo-rotulo">${rotulo}</span><span class="item-estilo-atalho">${atalho}</span>`;
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      executarComandoV96(editorId, "formatBlock", tag);
      menu.classList.add("escondido");
    });
    menu.appendChild(item);
  });

  botao.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll(".menu-estilo-texto-trello, .menu-lista-editor").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });
    menu.classList.toggle("escondido");

    if (typeof posicionarMenuEstiloTextoGenerico === "function") {
      setTimeout(() => posicionarMenuEstiloTextoGenerico(botao, menu), 0);
    } else {
      const r = botao.getBoundingClientRect();
      menu.style.position = "fixed";
      menu.style.left = `${r.left}px`;
      menu.style.top = `${r.bottom + 6}px`;
      menu.style.zIndex = "5000";
    }
  });

  wrapper.appendChild(botao);
  wrapper.appendChild(menu);
  return wrapper;
}

function dropdownListaV96(editorId) {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-lista-editor";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-dropdown-lista-editor";
  botao.title = "Listas";
  botao.innerHTML = '<span class="icone-lista-pontos" aria-hidden="true"><i></i><i></i><i></i></span><span class="seta-lista-editor">⌄</span>';

  const menu = document.createElement("div");
  menu.className = "menu-lista-editor escondido";

  [
    ["•", "Lista com marcadores", "insertUnorderedList"],
    ["1.", "Lista numerada", "insertOrderedList"]
  ].forEach(([icone, texto, comando]) => {
    const item = document.createElement("button");
    item.type = "button";
    item.innerHTML = `<span class="icone-menu-lista">${icone}</span><span>${texto}</span>`;
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      executarComandoV96(editorId, comando);
      menu.classList.add("escondido");
    });
    menu.appendChild(item);
  });

  botao.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll(".menu-lista-editor, .menu-estilo-texto-trello").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });
    menu.classList.toggle("escondido");
  });

  wrapper.appendChild(botao);
  wrapper.appendChild(menu);
  return wrapper;
}

function grupoAlinhamentoV96(editorId) {
  const grupo = document.createElement("div");
  grupo.className = "grupo-listas-alinhamento";

  grupo.appendChild(dropdownListaV96(editorId));
  grupo.appendChild(botaoV96({
    html: '<span class="icone-alinhar-esquerda" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
    title: "Alinhar à esquerda",
    comando: "justifyLeft",
    classe: "btn-alinhar-esquerda",
    editorId
  }));
  grupo.appendChild(botaoV96({
    html: '<span class="icone-centralizar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
    title: "Centralizar",
    comando: "justifyCenter",
    classe: "btn-centralizar",
    editorId
  }));
  grupo.appendChild(botaoV96({
    html: '<span class="icone-justificar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>',
    title: "Justificar",
    comando: "justifyFull",
    classe: "btn-justificar",
    editorId
  }));

  return grupo;
}

function grupoTabelaV96(editorId) {
  const grupo = document.createElement("div");
  grupo.className = "grupo-ferramentas-tabela";

  const rotulo = document.createElement("span");
  rotulo.className = "rotulo-grupo-tabela";
  rotulo.textContent = "Tabela";
  grupo.appendChild(rotulo);

  const inserir = document.createElement("button");
  inserir.type = "button";
  inserir.className = "btn-editor-tabela";
  inserir.textContent = "Inserir Tabela";
  inserir.title = "Inserir tabela";
  inserir.addEventListener("click", (e) => {
    e.preventDefault();
    executarComandoV96(editorId, "insertTable");
  });

  const cabecalho = document.createElement("button");
  cabecalho.type = "button";
  cabecalho.className = "btn-editor-tabela btn-editor-cabecalho-tabela";
  cabecalho.textContent = "Cabeçalho";
  cabecalho.title = "Aplicar/remover cabeçalho";
  cabecalho.addEventListener("click", (e) => {
    e.preventDefault();
    aplicarCabecalhoTabelaV96(editorId);
  });

  grupo.appendChild(inserir);
  grupo.appendChild(cabecalho);
  return grupo;
}

function montarToolbarCompletaV96(toolbar, editorId) {
  toolbar.innerHTML = "";
  toolbar.className = "toolbar-editor toolbar-editor-anexo toolbar-editor-avancada toolbar-v96";

  toolbar.appendChild(dropdownTtV96(editorId));
  toolbar.appendChild(botaoV96({ html: "<strong>N</strong>", title: "Negrito", comando: "bold", classe: "btn-negrito", editorId }));
  toolbar.appendChild(botaoV96({ html: "<em>I</em>", title: "Itálico", comando: "italic", classe: "btn-italico", editorId }));
  toolbar.appendChild(botaoV96({ html: "<u>U</u>", title: "Sublinhado", comando: "underline", classe: "btn-sublinhado", editorId }));
  toolbar.appendChild(botaoV96({ html: "<s>S</s>", title: "Tachado", comando: "strikeThrough", classe: "btn-tachado", editorId }));
  toolbar.appendChild(botaoV96({ html: "Tab/Recuo", title: "Tab/Recuo", comando: "inserirTab", classe: "btn-tab-recuo", editorId }));
  toolbar.appendChild(grupoAlinhamentoV96(editorId));
  toolbar.appendChild(grupoTabelaV96(editorId));
}

function substituirToolbarTextoAnexoV96() {
  const editorAnexo = localizarEditorTextoAnexoV96();
  if (!editorAnexo) return;

  if (!editorAnexo.id) editorAnexo.id = "notaAnexoEditor";

  let toolbarNova = document.getElementById("toolbarTextoAnexoCompleta");
  if (!toolbarNova) {
    toolbarNova = document.createElement("div");
    toolbarNova.id = "toolbarTextoAnexoCompleta";
    editorAnexo.parentNode.insertBefore(toolbarNova, editorAnexo);
  }

  // Esconde todas as barras antigas que estejam imediatamente antes do editor do anexo, exceto a nova.
  let el = toolbarNova.previousElementSibling || editorAnexo.previousElementSibling;
  let limite = 0;
  while (el && limite < 6) {
    const pareceToolbar = el.querySelector?.("button") || /toolbar|barra|editor/i.test(el.className || "");
    const anterior = el.previousElementSibling;
    if (pareceToolbar && el !== toolbarNova) {
      el.classList.add("toolbar-anexo-antiga-escondida");
      el.style.display = "none";
    }
    el = anterior;
    limite++;
  }

  document.querySelectorAll("#toolbarEditorAnexo").forEach(t => {
    if (t !== toolbarNova) {
      t.classList.add("toolbar-anexo-antiga-escondida");
      t.style.display = "none";
    }
  });

  montarToolbarCompletaV96(toolbarNova, editorAnexo.id);
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(substituirToolbarTextoAnexoV96, 0);
  setTimeout(substituirToolbarTextoAnexoV96, 400);
  setTimeout(substituirToolbarTextoAnexoV96, 1000);
});


/* v97 - Texto do Anexo com as mesmas opções da caixa Texto */
function localizarEditorTextoPrincipalV97() {
  return document.getElementById("notaTextoEditor") ||
         document.querySelector("[data-editor-texto-principal='1']") ||
         document.querySelector("#modalNota [contenteditable='true']");
}

function localizarEditorTextoAnexoV97() {
  return document.querySelector("[data-editor-anexo-texto='1']") ||
         document.getElementById("notaAnexoTextoEditor") ||
         document.getElementById("notaAnexoEditor") ||
         Array.from(document.querySelectorAll("#modalNota [contenteditable='true'], #modalNota textarea")).find(el => {
           const perto = (el.closest("label, div, section, fieldset")?.textContent || "").toLowerCase();
           return perto.includes("texto do anexo") || perto.includes("anexos");
         });
}

function localizarToolbarTextoPrincipalV97() {
  const editor = localizarEditorTextoPrincipalV97();
  if (!editor) return null;

  const prev = editor.previousElementSibling;
  if (prev && prev.querySelector("button")) return prev;

  return document.querySelector(".toolbar-editor:not(.toolbar-editor-anexo):not(#toolbarTextoAnexoIgualTexto)") ||
         document.querySelector(".barra-editor:not(.toolbar-editor-anexo)");
}

function localizarToolbarTextoAnexoV97() {
  const editor = localizarEditorTextoAnexoV97();
  if (!editor) return null;

  let toolbar = document.getElementById("toolbarTextoAnexoIgualTexto");

  if (!toolbar) {
    toolbar = document.createElement("div");
    toolbar.id = "toolbarTextoAnexoIgualTexto";
    toolbar.className = "toolbar-editor toolbar-editor-anexo toolbar-editor-avancada";
    editor.parentNode.insertBefore(toolbar, editor);
  }

  return toolbar;
}

function clonarBarraTextoParaAnexoV97() {
  const toolbarTexto = localizarToolbarTextoPrincipalV97();
  const toolbarAnexo = localizarToolbarTextoAnexoV97();
  const editorAnexo = localizarEditorTextoAnexoV97();

  if (!toolbarTexto || !toolbarAnexo || !editorAnexo) return;

  if (!editorAnexo.id) editorAnexo.id = "notaAnexoTextoEditor";
  editorAnexo.setAttribute("data-editor-anexo-texto", "1");

  // Esconde barras antigas imediatamente ligadas ao anexo, preservando a nova.
  let el = toolbarAnexo.previousElementSibling;
  let count = 0;
  while (el && count < 8) {
    const txt = (el.textContent || "").toLowerCase();
    const temBotao = !!el.querySelector?.("button");
    const pareceBarra = temBotao && (txt.includes("negrito") || txt.includes("tabela") || txt.includes("tab") || el.className.includes("toolbar") || el.className.includes("barra"));
    const anterior = el.previousElementSibling;
    if (pareceBarra && el !== toolbarAnexo) {
      el.classList.add("toolbar-anexo-antiga-escondida");
      el.style.display = "none";
    }
    el = anterior;
    count++;
  }

  // Reconstrói a barra do anexo a partir da barra do Texto, com os mesmos botões/estrutura visual.
  toolbarAnexo.innerHTML = toolbarTexto.innerHTML;
  toolbarAnexo.className = toolbarTexto.className + " toolbar-editor-anexo";
  toolbarAnexo.id = "toolbarTextoAnexoIgualTexto";

  // Remove ids duplicados no clone para não conflitar com a barra do Texto.
  toolbarAnexo.querySelectorAll("[id]").forEach((node, i) => {
    node.id = `${node.id}AnexoV97_${i}`;
  });

  // Reconecta todos os botões clonados para atuarem no editor do anexo.
  toolbarAnexo.querySelectorAll("button").forEach(btn => {
    const texto = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const title = (btn.title || "").toLowerCase();
    const html = (btn.innerHTML || "").toLowerCase();

    const novo = btn.cloneNode(true);
    btn.parentNode.replaceChild(novo, btn);

    novo.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      editorAnexo.focus();

      if (novo.closest(".dropdown-estilo-texto")) {
        // Mantém dropdown Tt abrindo; itens internos serão tratados abaixo.
        const menu = novo.parentElement.querySelector(".menu-estilo-texto-trello");
        if (menu) {
          document.querySelectorAll(".menu-estilo-texto-trello, .menu-lista-editor").forEach(m => {
            if (m !== menu) m.classList.add("escondido");
          });
          menu.classList.toggle("escondido");
          if (typeof posicionarMenuEstiloTextoGenerico === "function") {
            setTimeout(() => posicionarMenuEstiloTextoGenerico(novo, menu), 0);
          }
          return;
        }
      }

      if (texto.includes("negrito") || title.includes("negrito") || html.includes("<strong")) document.execCommand("bold");
      else if (texto.includes("itálico") || texto.includes("italico") || title.includes("itálico") || title.includes("italico") || html.includes("<em")) document.execCommand("italic");
      else if (texto.includes("sublinhado") || title.includes("sublinhado") || html.includes("<u")) document.execCommand("underline");
      else if (texto.includes("tachado") || title.includes("tachado") || html.includes("<s")) document.execCommand("strikeThrough");
      else if (texto.includes("tab") || texto.includes("recuo") || title.includes("tab") || title.includes("recuo")) document.execCommand("insertText", false, "\t");
      else if (texto.includes("inserir tabela") || title.includes("inserir tabela") || texto === "tabela") {
        try { editorTabelaAtivo = editorAnexo.id; } catch {}
        if (typeof abrirModalTabela === "function") abrirModalTabela(editorAnexo.id);
        else if (typeof inserirTabelaNoEditor === "function") inserirTabelaNoEditor(editorAnexo.id);
        else document.execCommand("insertHTML", false, '<table><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>');
      }
      else if (texto.includes("cabeçalho") || texto.includes("cabecalho") || title.includes("cabeçalho") || title.includes("cabecalho")) {
        aplicarFundoCinzaTabelaEditor();
      }
      else if (title.includes("alinhar à esquerda") || title.includes("alinhar a esquerda")) document.execCommand("justifyLeft");
      else if (title.includes("centralizar")) document.execCommand("justifyCenter");
      else if (title.includes("justificar")) document.execCommand("justifyFull");
    });
  });

  // Itens dos menus Tt e Lista no anexo.
  toolbarAnexo.querySelectorAll(".menu-estilo-texto-trello .item-estilo-texto").forEach(item => {
    const rotulo = (item.textContent || "").toLowerCase();
    const novo = item.cloneNode(true);
    item.parentNode.replaceChild(novo, item);

    novo.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      editorAnexo.focus();

      if (rotulo.includes("texto normal")) document.execCommand("formatBlock", false, "p");
      else if (rotulo.includes("título 1") || rotulo.includes("titulo 1")) document.execCommand("formatBlock", false, "h1");
      else if (rotulo.includes("título 2") || rotulo.includes("titulo 2")) document.execCommand("formatBlock", false, "h2");
      else if (rotulo.includes("título 3") || rotulo.includes("titulo 3")) document.execCommand("formatBlock", false, "h3");
      else if (rotulo.includes("título 4") || rotulo.includes("titulo 4")) document.execCommand("formatBlock", false, "h4");
      else if (rotulo.includes("título 5") || rotulo.includes("titulo 5")) document.execCommand("formatBlock", false, "h5");
      else if (rotulo.includes("título 6") || rotulo.includes("titulo 6")) document.execCommand("formatBlock", false, "h6");

      novo.closest(".menu-estilo-texto-trello")?.classList.add("escondido");
    });
  });

  toolbarAnexo.querySelectorAll(".menu-lista-editor button").forEach(item => {
    const rotulo = (item.textContent || "").toLowerCase();
    const novo = item.cloneNode(true);
    item.parentNode.replaceChild(novo, item);

    novo.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      editorAnexo.focus();

      if (rotulo.includes("marcadores")) document.execCommand("insertUnorderedList");
      else if (rotulo.includes("numerada")) document.execCommand("insertOrderedList");

      novo.closest(".menu-lista-editor")?.classList.add("escondido");
    });
  });

  toolbarAnexo.dataset.v97 = "1";
}

function prepararBarraTextoAnexoIgualTextoV97() {
  clonarBarraTextoParaAnexoV97();
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(prepararBarraTextoAnexoIgualTextoV97, 0);
  setTimeout(prepararBarraTextoAnexoIgualTextoV97, 500);
  setTimeout(prepararBarraTextoAnexoIgualTextoV97, 1200);
});


/* v98 - substitui barras antigas dos Textos de Anexo pela mesma barra de Texto */
function localizarToolbarTextoModeloV98() {
  // A toolbar de cima é a que tem o grupo Tabela e botão Tt.
  const toolbars = Array.from(document.querySelectorAll(".toolbar-editor, .barra-editor, .editor-toolbar"));
  return toolbars.find(tb =>
    tb.querySelector(".dropdown-estilo-texto") &&
    tb.querySelector(".grupo-ferramentas-tabela") &&
    !tb.closest(".anexo-item") &&
    !tb.closest("[data-anexo]")
  ) || toolbars.find(tb =>
    tb.textContent.includes("Tab/Recuo") &&
    tb.textContent.includes("Inserir Tabela") &&
    !tb.textContent.includes("Título 2")
  );
}

function localizarEditoresTextoAnexoV98() {
  const possiveis = Array.from(document.querySelectorAll("#modalNota [contenteditable='true'], #modalNota textarea"));

  return possiveis.filter(el => {
    const bloco = el.closest(".anexo-item, .campo-anexo, fieldset, .anexo, [data-anexo]") || el.parentElement;
    const textoBloco = (bloco?.textContent || "").toLowerCase();
    const idNome = `${el.id || ""} ${el.name || ""} ${el.className || ""}`.toLowerCase();

    return (
      textoBloco.includes("texto do anexo") ||
      idNome.includes("anexo")
    ) && !idNome.includes("titulo");
  });
}

function encontrarToolbarAntigaDoAnexoV98(editorAnexo) {
  if (!editorAnexo) return null;

  let el = editorAnexo.previousElementSibling;
  let limite = 0;

  while (el && limite < 5) {
    if (el.querySelector?.("button")) return el;
    el = el.previousElementSibling;
    limite++;
  }

  return null;
}

function acionarComandoAnexoV98(editorAnexo, comando, valor = null) {
  if (!editorAnexo) return;
  editorAnexo.focus();

  if (comando === "inserirTab") {
    document.execCommand("insertText", false, "\t");
    return;
  }

  if (comando === "formatBlock") {
    document.execCommand("formatBlock", false, valor);
    return;
  }

  if (comando === "insertTable") {
    try { editorTabelaAtivo = editorAnexo.id || "notaAnexoEditor"; } catch {}

    if (typeof abrirModalTabela === "function") {
      abrirModalTabela(editorAnexo.id || "notaAnexoEditor");
      return;
    }

    if (typeof inserirTabelaNoEditor === "function") {
      inserirTabelaNoEditor(editorAnexo.id || "notaAnexoEditor");
      return;
    }

    document.execCommand("insertHTML", false, '<table><tbody><tr><td><br></td><td><br></td></tr><tr><td><br></td><td><br></td></tr></tbody></table><p><br></p>');
    return;
  }

  if (comando === "cabecalho") {
    aplicarFundoCinzaTabelaEditor();
    return;
  }

  document.execCommand(comando, false, valor);
}

function criarDropdownTtAnexoV98(editorAnexo) {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-estilo-texto";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-dropdown-estilo-texto";
  botao.innerHTML = '<span class="icone-estilo-texto">Tt</span><span class="seta-estilo-texto">⌄</span>';

  const menu = document.createElement("div");
  menu.className = "menu-estilo-texto-trello escondido";

  [
    ["p", "Texto normal", "Ctrl+Alt+0", "opcao-texto-normal"],
    ["h1", "Título 1", "Ctrl+Alt+1", "opcao-titulo-1"],
    ["h2", "Título 2", "Ctrl+Alt+2", "opcao-titulo-2"],
    ["h3", "Título 3", "Ctrl+Alt+3", "opcao-titulo-3"],
    ["h4", "Título 4", "Ctrl+Alt+4", "opcao-titulo-4"],
    ["h5", "Título 5", "Ctrl+Alt+5", "opcao-titulo-5"],
    ["h6", "Título 6", "Ctrl+Alt+6", "opcao-titulo-6"]
  ].forEach(([tag, rotulo, atalho, classe]) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = `item-estilo-texto ${classe}`;
    item.innerHTML = `<span class="item-estilo-rotulo">${rotulo}</span><span class="item-estilo-atalho">${atalho}</span>`;
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      acionarComandoAnexoV98(editorAnexo, "formatBlock", tag);
      menu.classList.add("escondido");
    });
    menu.appendChild(item);
  });

  botao.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();

    document.querySelectorAll(".menu-estilo-texto-trello, .menu-lista-editor").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });

    menu.classList.toggle("escondido");

    const rect = botao.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.left = `${rect.left}px`;
    menu.style.top = `${rect.bottom + 6}px`;
    menu.style.zIndex = "5000";
    menu.style.maxHeight = "360px";
    menu.style.overflowY = "auto";
  });

  wrapper.appendChild(botao);
  wrapper.appendChild(menu);
  return wrapper;
}

function criarBotaoAnexoV98(editorAnexo, html, title, comando, classe = "", valor = null) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = `btn-editor-formatacao ${classe}`.trim();
  btn.title = title;
  btn.innerHTML = html;
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    acionarComandoAnexoV98(editorAnexo, comando, valor);
  });
  return btn;
}

function criarDropdownListaAnexoV98(editorAnexo) {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-lista-editor";

  const botao = document.createElement("button");
  botao.type = "button";
  botao.className = "btn-dropdown-lista-editor";
  botao.title = "Listas";
  botao.innerHTML = '<span class="icone-lista-pontos" aria-hidden="true"><i></i><i></i><i></i></span><span class="seta-lista-editor">⌄</span>';

  const menu = document.createElement("div");
  menu.className = "menu-lista-editor escondido";

  const opcoes = [
    ["•", "Lista com marcadores", "insertUnorderedList"],
    ["1.", "Lista numerada", "insertOrderedList"]
  ];

  opcoes.forEach(([icone, texto, comando]) => {
    const item = document.createElement("button");
    item.type = "button";
    item.innerHTML = `<span class="icone-menu-lista">${icone}</span><span>${texto}</span>`;
    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      acionarComandoAnexoV98(editorAnexo, comando);
      menu.classList.add("escondido");
    });
    menu.appendChild(item);
  });

  botao.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    document.querySelectorAll(".menu-lista-editor, .menu-estilo-texto-trello").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });
    menu.classList.toggle("escondido");
  });

  wrapper.appendChild(botao);
  wrapper.appendChild(menu);
  return wrapper;
}

function criarGrupoListasAlinhamentoAnexoV98(editorAnexo) {
  const grupo = document.createElement("div");
  grupo.className = "grupo-listas-alinhamento";

  grupo.appendChild(criarDropdownListaAnexoV98(editorAnexo));
  grupo.appendChild(criarBotaoAnexoV98(editorAnexo, '<span class="icone-alinhar-esquerda" aria-hidden="true"><i></i><i></i><i></i><i></i></span>', "Alinhar à esquerda", "justifyLeft", "btn-alinhar-esquerda"));
  grupo.appendChild(criarBotaoAnexoV98(editorAnexo, '<span class="icone-centralizar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>', "Centralizar", "justifyCenter", "btn-centralizar"));
  grupo.appendChild(criarBotaoAnexoV98(editorAnexo, '<span class="icone-justificar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>', "Justificar", "justifyFull", "btn-justificar"));

  return grupo;
}

function criarGrupoTabelaAnexoV98(editorAnexo) {
  const grupo = document.createElement("div");
  grupo.className = "grupo-ferramentas-tabela";

  const rotulo = document.createElement("span");
  rotulo.className = "rotulo-grupo-tabela";
  rotulo.textContent = "Tabela";
  grupo.appendChild(rotulo);

  const inserir = document.createElement("button");
  inserir.type = "button";
  inserir.className = "btn-editor-tabela";
  inserir.textContent = "Inserir Tabela";
  inserir.title = "Inserir tabela";
  inserir.addEventListener("click", (e) => {
    e.preventDefault();
    acionarComandoAnexoV98(editorAnexo, "insertTable");
  });

  const cabecalho = document.createElement("button");
  cabecalho.type = "button";
  cabecalho.className = "btn-editor-tabela btn-editor-cabecalho-tabela";
  cabecalho.textContent = "Cabeçalho";
  cabecalho.title = "Aplicar/remover cabeçalho";
  cabecalho.addEventListener("click", (e) => {
    e.preventDefault();
    acionarComandoAnexoV98(editorAnexo, "cabecalho");
  });

  grupo.appendChild(inserir);
  grupo.appendChild(cabecalho);
  return grupo;
}

function montarToolbarAnexoIgualTextoV98(editorAnexo) {
  const antiga = encontrarToolbarAntigaDoAnexoV98(editorAnexo);
  if (!antiga) return;

  if (antiga.dataset.v98 === "1") return;

  antiga.dataset.v98 = "1";
  antiga.innerHTML = "";
  antiga.className = "toolbar-editor toolbar-editor-anexo toolbar-editor-avancada toolbar-anexo-igual-texto-v98";
  antiga.style.display = "";

  antiga.appendChild(criarDropdownTtAnexoV98(editorAnexo));
  antiga.appendChild(criarBotaoAnexoV98(editorAnexo, "<strong>N</strong>", "Negrito", "bold", "btn-negrito"));
  antiga.appendChild(criarBotaoAnexoV98(editorAnexo, "<em>I</em>", "Itálico", "italic", "btn-italico"));
  antiga.appendChild(criarBotaoAnexoV98(editorAnexo, "<u>S</u>", "Sublinhado", "underline", "btn-sublinhado"));
  antiga.appendChild(criarBotaoAnexoV98(editorAnexo, "<s>S</s>", "Tachado", "strikeThrough", "btn-tachado"));
  antiga.appendChild(criarBotaoAnexoV98(editorAnexo, "Tab/Recuo", "Tab/Recuo", "inserirTab", "btn-tab-recuo"));
  antiga.appendChild(criarGrupoListasAlinhamentoAnexoV98(editorAnexo));
  antiga.appendChild(criarGrupoTabelaAnexoV98(editorAnexo));
}

function substituirBarrasAnexoV98() {
  localizarEditoresTextoAnexoV98().forEach(editorAnexo => {
    if (!editorAnexo.id) editorAnexo.id = `notaAnexoEditor_${Math.random().toString(36).slice(2)}`;
    editorAnexo.setAttribute("data-editor-anexo-texto", "1");
    montarToolbarAnexoIgualTextoV98(editorAnexo);
  });
}

const observerAnexoToolbarV98 = new MutationObserver(() => {
  substituirBarrasAnexoV98();
});

document.addEventListener("DOMContentLoaded", () => {
  substituirBarrasAnexoV98();
  observerAnexoToolbarV98.observe(document.body, { childList: true, subtree: true });
  setTimeout(substituirBarrasAnexoV98, 300);
  setTimeout(substituirBarrasAnexoV98, 900);
  setTimeout(substituirBarrasAnexoV98, 1600);
});


/* v121 - Tab/Recuo passa a aplicar recuo real de parágrafo de 2 cm */
let ultimaSelecaoEditorV121 = null;
let ultimoEditorAtivoV121 = null;

function ehEditorDeNotaV121(el) {
  return Boolean(
    el &&
    el.closest &&
    el.closest("#notaTextoEditor, #notaAnexoEditor, #notaAnexoTextoEditor, [data-editor-anexo-texto='1'], [contenteditable='true']")
  );
}

function salvarSelecaoEditorV121() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const node = sel.anchorNode;
  const el = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;

  const editor = el?.closest?.("#notaTextoEditor, #notaAnexoEditor, #notaAnexoTextoEditor, [data-editor-anexo-texto='1'], [contenteditable='true']");
  if (!editor) return;

  ultimoEditorAtivoV121 = editor;
  ultimaSelecaoEditorV121 = sel.getRangeAt(0).cloneRange();
}

function restaurarSelecaoEditorV121() {
  if (!ultimaSelecaoEditorV121) return false;

  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(ultimaSelecaoEditorV121);
  return true;
}

function obterBlocoParagrafoV121(node, editor) {
  if (!node) return null;

  let el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;

  while (el && el !== editor) {
    if (/^(P|DIV|LI|H1|H2|H3|H4|H5|H6|TD|TH|BLOCKQUOTE)$/i.test(el.tagName)) {
      return el;
    }
    el = el.parentElement;
  }

  return null;
}

function obterBlocosSelecionadosV121(editor, range) {
  if (!editor || !range) return [];

  const blocos = Array.from(editor.querySelectorAll("p, div, li, h1, h2, h3, h4, h5, h6, td, th, blockquote"))
    .filter(bloco => {
      try {
        return range.intersectsNode(bloco);
      } catch {
        return false;
      }
    });

  if (blocos.length) return blocos;

  const blocoAtual = obterBlocoParagrafoV121(range.startContainer, editor);
  return blocoAtual ? [blocoAtual] : [];
}

function aplicarRecuoParagrafo1cmV121() {
  const editor =
    ultimoEditorAtivoV121 ||
    document.activeElement?.closest?.("#notaTextoEditor, #notaAnexoEditor, #notaAnexoTextoEditor, [data-editor-anexo-texto='1'], [contenteditable='true']") ||
    document.getElementById("notaTextoEditor");

  if (!editor) return;

  editor.focus();
  restaurarSelecaoEditorV121();

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);

  let blocos = obterBlocosSelecionadosV121(editor, range);

  // Se o texto estiver solto direto no contenteditable, força virar parágrafo.
  if (!blocos.length) {
    try {
      document.execCommand("formatBlock", false, "p");
      salvarSelecaoEditorV121();
      const novoRange = window.getSelection()?.rangeCount ? window.getSelection().getRangeAt(0) : null;
      blocos = novoRange ? obterBlocosSelecionadosV121(editor, novoRange) : [];
    } catch {}
  }

  blocos.forEach(bloco => {
    const recuoAtual = parseFloat(bloco.dataset.recuoCm || bloco.style.textIndent || "0") || 0;
    const novoRecuo = recuoAtual + 1;
    bloco.dataset.recuoCm = String(novoRecuo);
    bloco.style.textIndent = `${novoRecuo}cm`;
    bloco.style.setProperty("--recuo-progressivo", `${novoRecuo}cm`);
  });

  salvarSelecaoEditorV121();
}

function ehBotaoTabRecuoV121(alvo) {
  const btn = alvo.closest?.("button");
  if (!btn) return false;

  const texto = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
  const title = (btn.title || "").toLowerCase();

  return texto.includes("tab/recuo") || title.includes("tab/recuo") || title.includes("recuo");
}

document.addEventListener("selectionchange", salvarSelecaoEditorV121);

document.addEventListener("keyup", salvarSelecaoEditorV121);
document.addEventListener("mouseup", salvarSelecaoEditorV121);

document.addEventListener("click", (event) => {
  if (!ehBotaoTabRecuoV121(event.target)) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  aplicarRecuoParagrafo1cmV121();
}, true);


/* v125 - Tab/Recuo insere recuo de 1 cm apagável pelo Backspace */
function inserirRecuoApagavel1cmV125() {
  const editor =
    ultimoEditorAtivoV121 ||
    document.activeElement?.closest?.("#notaTextoEditor, #notaAnexoEditor, #notaAnexoTextoEditor, [data-editor-anexo-texto='1'], [contenteditable='true']") ||
    document.getElementById("notaTextoEditor");

  if (!editor) return;

  editor.focus();

  try { restaurarSelecaoEditorV121(); } catch {}

  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);

  const span = document.createElement("span");
  span.className = "recuo-apagavel-1cm-v125";
  span.setAttribute("data-recuo-apagavel", "1");
  span.setAttribute("contenteditable", "false");
  span.innerHTML = "&nbsp;";

  range.deleteContents();
  range.insertNode(span);

  // Coloca o cursor depois do recuo inserido.
  const novoRange = document.createRange();
  novoRange.setStartAfter(span);
  novoRange.collapse(true);

  sel.removeAllRanges();
  sel.addRange(novoRange);

  try { salvarSelecaoEditorV121(); } catch {}
}

// Sobrescreve a função usada pelo clique do botão Tab/Recuo.
// Agora ela não aplica mais text-indent; ela insere um bloco de 1 cm apagável.
function aplicarRecuoParagrafo1cmV121() {
  inserirRecuoApagavel1cmV125();
}

function removerBotoesRecuoMenosV125() {
  document.querySelectorAll(".btn-recuo-menos-v124").forEach(btn => btn.remove());

  document.querySelectorAll("button").forEach(btn => {
    const texto = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const title = (btn.title || "").toLowerCase();

    if (texto === "recuo −" || texto === "recuo -" || title === "diminuir recuo") {
      btn.remove();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  removerBotoesRecuoMenosV125();
  setTimeout(removerBotoesRecuoMenosV125, 300);
  setTimeout(removerBotoesRecuoMenosV125, 900);
});


/* v126 - tecla Tab do teclado também insere recuo apagável de 1 cm */
function alvoEhEditorTextoV126(alvo) {
  return Boolean(
    alvo &&
    alvo.closest &&
    alvo.closest("#notaTextoEditor, #notaAnexoEditor, #notaAnexoTextoEditor, [data-editor-anexo-texto='1'], [contenteditable='true']")
  );
}

function configurarTeclaTabRecuoV126() {
  if (document.body.dataset.tabRecuoV126 === "1") return;
  document.body.dataset.tabRecuoV126 = "1";

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    if (!alvoEhEditorTextoV126(event.target)) return;

    event.preventDefault();
    event.stopPropagation();

    if (typeof inserirRecuoApagavel1cmV125 === "function") {
      inserirRecuoApagavel1cmV125();
    }
  }, true);
}

document.addEventListener("DOMContentLoaded", () => {
  configurarTeclaTabRecuoV126();
  setTimeout(configurarTeclaTabRecuoV126, 300);
});


/* v127 - barra da caixa Texto igual ao visual da barra de Anexos */
function localizarToolbarTextoPrincipalV127() {
  const editorTexto = document.getElementById("notaTextoEditor");
  if (!editorTexto) return null;

  let el = editorTexto.previousElementSibling;
  for (let i = 0; el && i < 5; i++) {
    if (el.querySelector?.("button")) return el;
    el = el.previousElementSibling;
  }

  return encontrarToolbarNota?.() || null;
}

function configurarVisualToolbarTextoPrincipalV127() {
  const toolbar = localizarToolbarTextoPrincipalV127();
  if (!toolbar || toolbar.dataset.visualIgualAnexoV127 === "1") return;

  toolbar.dataset.visualIgualAnexoV127 = "1";
  toolbar.classList.add("toolbar-texto-principal-v127", "toolbar-anexo-igual-texto-v98");

  // Padroniza botões básicos para ficarem com a mesma leitura visual dos anexos.
  toolbar.querySelectorAll("button").forEach(btn => {
    const texto = (btn.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    const title = (btn.title || "").toLowerCase();
    const html = (btn.innerHTML || "").toLowerCase();

    btn.classList.add("btn-editor-formatacao");

    if (texto === "n" || title.includes("negrito") || html.includes("<strong")) {
      btn.classList.add("btn-negrito");
      btn.innerHTML = "<strong>N</strong>";
      btn.title = "Negrito";
    }

    if (texto === "i" || title.includes("itálico") || title.includes("italico") || html.includes("<em")) {
      btn.classList.add("btn-italico");
      btn.innerHTML = "<em>I</em>";
      btn.title = "Itálico";
    }

    if (texto === "u" || title.includes("sublinhado") || html.includes("<u")) {
      btn.classList.add("btn-sublinhado");
      btn.innerHTML = "<u>S</u>";
      btn.title = "Sublinhado";
    }

    if (texto.includes("tab/recuo") || title.includes("tab/recuo")) {
      btn.classList.add("btn-tab-recuo");
      btn.textContent = "Tab/Recuo";
      btn.title = "Tab/Recuo";
    }
  });

  // Garante o ícone de lista com três pontos, igual ao anexo.
  toolbar.querySelectorAll(".btn-dropdown-lista-editor").forEach(botao => {
    botao.innerHTML = `
      <span class="icone-lista-pontos" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="seta-lista-editor">⌄</span>
    `;
  });

  // Garante botão Tt compacto, igual ao anexo.
  toolbar.querySelectorAll(".btn-dropdown-estilo-texto").forEach(botao => {
    botao.innerHTML = `<span class="icone-estilo-texto">Tt</span><span class="seta-estilo-texto">⌄</span>`;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(configurarVisualToolbarTextoPrincipalV127, 0);
  setTimeout(configurarVisualToolbarTextoPrincipalV127, 400);
  setTimeout(configurarVisualToolbarTextoPrincipalV127, 1000);
});


/* v138 - botão Inserir Imagem no campo Texto da nota */
function localizarEditorTextoPrincipalV138() {
  return document.getElementById("notaTextoEditor");
}

function localizarToolbarTextoPrincipalV138() {
  const editorTexto = localizarEditorTextoPrincipalV138();
  if (!editorTexto) return null;

  let el = editorTexto.previousElementSibling;
  for (let i = 0; el && i < 6; i++) {
    if (el.querySelector?.("button")) return el;
    el = el.previousElementSibling;
  }

  try {
    return localizarToolbarTextoPrincipalV127?.() || encontrarToolbarNota?.() || null;
  } catch {
    return null;
  }
}

function inserirImagemNoTextoNotaV138(dataUrl, nomeArquivo = "Imagem") {
  const editor = localizarEditorTextoPrincipalV138();
  if (!editor || !dataUrl) return;

  editor.focus();

  try { restaurarSelecaoEditorV121(); } catch {}

  const img = document.createElement("img");
  img.src = dataUrl;
  img.alt = nomeArquivo;
  img.className = "imagem-inserida-nota-v138";
  img.style.maxWidth = "100%";
  img.style.height = "auto";
  img.style.display = "block";
  img.style.margin = "8px auto";

  const wrapper = document.createElement("p");
  wrapper.className = "paragrafo-imagem-nota-v138";
  wrapper.appendChild(img);

  const sel = window.getSelection();
  if (sel && sel.rangeCount > 0) {
    const range = sel.getRangeAt(0);
    range.deleteContents();
    range.insertNode(wrapper);

    const depois = document.createElement("p");
    depois.innerHTML = "<br>";
    wrapper.after(depois);

    const novoRange = document.createRange();
    novoRange.setStart(depois, 0);
    novoRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(novoRange);
  } else {
    editor.appendChild(wrapper);
  }

  try { salvarSelecaoEditorV121(); } catch {}
}

function abrirSeletorImagemNotaV138() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.addEventListener("change", () => {
    const arquivo = input.files && input.files[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      alert("Selecione um arquivo de imagem.");
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      inserirImagemNoTextoNotaV138(leitor.result, arquivo.name || "Imagem");
    };

    leitor.readAsDataURL(arquivo);
  });

  input.click();
}

function criarBotaoInserirImagemV138() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btnInserirImagemTextoNotaV138";
  btn.className = "btn-editor-formatacao btn-inserir-imagem-v138";
  btn.title = "Inserir imagem";
  btn.innerHTML = `
    <span class="icone-imagem-v138" aria-hidden="true">
      <span class="icone-imagem-sol-v138"></span>
      <span class="icone-imagem-morro-v138"></span>
    </span>
    <span class="texto-botao-imagem-v138">Imagem</span>
  `;

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    abrirSeletorImagemNotaV138();
  });

  return btn;
}

function adicionarBotaoImagemToolbarTextoV138() {
  const toolbar = localizarToolbarTextoPrincipalV138();
  if (!toolbar || toolbar.querySelector("#btnInserirImagemTextoNotaV138")) return;

  const botaoImagem = criarBotaoInserirImagemV138();

  // Posição intuitiva: antes do grupo Tabela, porque também é inserção de conteúdo.
  const grupoTabela = toolbar.querySelector(".grupo-ferramentas-tabela");
  if (grupoTabela) {
    toolbar.insertBefore(botaoImagem, grupoTabela);
    return;
  }

  const btnTabela = Array.from(toolbar.querySelectorAll("button")).find(btn => {
    const texto = (btn.textContent || "").toLowerCase();
    const title = (btn.title || "").toLowerCase();
    return texto.includes("tabela") || title.includes("tabela");
  });

  if (btnTabela) {
    toolbar.insertBefore(botaoImagem, btnTabela);
    return;
  }

  toolbar.appendChild(botaoImagem);
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(adicionarBotaoImagemToolbarTextoV138, 0);
  setTimeout(adicionarBotaoImagemToolbarTextoV138, 400);
  setTimeout(adicionarBotaoImagemToolbarTextoV138, 1000);
});


/* v139 - alinhamento também funciona em imagens inseridas */
let imagemSelecionadaEditorV139 = null;

function marcarImagemSelecionadaV139(img) {
  document.querySelectorAll(".imagem-selecionada-v139").forEach(el => {
    el.classList.remove("imagem-selecionada-v139");
  });

  imagemSelecionadaEditorV139 = img || null;

  if (img) {
    img.classList.add("imagem-selecionada-v139");
  }
}

function configurarSelecaoImagemEditorV139() {
  if (document.body.dataset.selecaoImagemV139 === "1") return;
  document.body.dataset.selecaoImagemV139 = "1";

  document.addEventListener("click", (event) => {
    const img = event.target.closest?.("img.imagem-inserida-nota-v138, .print-texto img, #notaTextoEditor img, #notaAnexoEditor img, #notaAnexoTextoEditor img, [contenteditable='true'] img");

    if (img && img.closest("[contenteditable='true']")) {
      event.stopPropagation();
      marcarImagemSelecionadaV139(img);
      return;
    }

    const clicouToolbar = event.target.closest?.(".toolbar-editor, .barra-editor, .editor-toolbar, .toolbar-editor-avancada");
    if (!clicouToolbar) {
      marcarImagemSelecionadaV139(null);
    }
  }, true);
}

function obterContainerImagemV139(img) {
  if (!img) return null;

  const container = img.closest(".paragrafo-imagem-nota-v138, p, div, figure");
  if (container && container.closest("[contenteditable='true']")) return container;

  return img.parentElement;
}

function alinharImagemSelecionadaV139(tipo) {
  const img = imagemSelecionadaEditorV139;

  if (!img || !document.body.contains(img)) return false;

  const container = obterContainerImagemV139(img);
  if (!container) return false;

  container.classList.add("paragrafo-imagem-nota-v138");

  img.style.display = "block";
  img.style.maxWidth = "100%";
  img.style.height = "auto";

  if (tipo === "left") {
    container.style.textAlign = "left";
    img.style.marginLeft = "0";
    img.style.marginRight = "auto";
  }

  if (tipo === "center") {
    container.style.textAlign = "center";
    img.style.marginLeft = "auto";
    img.style.marginRight = "auto";
  }

  if (tipo === "justify") {
    // Para imagem, "justificar" fica como ocupar a largura disponível.
    // Assim o botão tem efeito visual útil.
    container.style.textAlign = "justify";
    img.style.marginLeft = "0";
    img.style.marginRight = "0";
    img.style.width = "100%";
    img.style.maxWidth = "100%";
  }

  try { salvarSelecaoEditorV121(); } catch {}

  return true;
}

function tipoAlinhamentoBotaoV139(btn) {
  if (!btn) return "";

  const title = (btn.title || "").toLowerCase();
  const texto = (btn.textContent || "").toLowerCase();
  const classe = (btn.className || "").toLowerCase();

  if (title.includes("esquerda") || texto.includes("esquerda") || classe.includes("alinhar-esquerda")) return "left";
  if (title.includes("centralizar") || texto.includes("centralizar") || classe.includes("centralizar")) return "center";
  if (title.includes("justificar") || texto.includes("justificar") || classe.includes("justificar")) return "justify";

  return "";
}

function configurarAlinhamentoImagemV139() {
  configurarSelecaoImagemEditorV139();

  if (document.body.dataset.alinhamentoImagemV139 === "1") return;
  document.body.dataset.alinhamentoImagemV139 = "1";

  document.addEventListener("click", (event) => {
    const btn = event.target.closest?.("button");
    if (!btn) return;

    const tipo = tipoAlinhamentoBotaoV139(btn);
    if (!tipo) return;

    if (imagemSelecionadaEditorV139 && document.body.contains(imagemSelecionadaEditorV139)) {
      const alinhou = alinharImagemSelecionadaV139(tipo);

      if (alinhou) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
      }
    }
  }, true);
}

document.addEventListener("DOMContentLoaded", () => {
  configurarAlinhamentoImagemV139();
  setTimeout(configurarAlinhamentoImagemV139, 300);
  setTimeout(configurarAlinhamentoImagemV139, 1000);
});


/* v140 - opções de tamanho para imagem inserida */
function imagemAtualSelecionadaV140() {
  try {
    if (imagemSelecionadaEditorV139 && document.body.contains(imagemSelecionadaEditorV139)) {
      return imagemSelecionadaEditorV139;
    }
  } catch {}

  return document.querySelector(".imagem-selecionada-v139");
}

function aplicarTamanhoImagemV140(tipo, largura = null) {
  const img = imagemAtualSelecionadaV140();

  if (!img) {
    alert("Clique primeiro na imagem que deseja ajustar.");
    return;
  }

  const container = img.closest(".paragrafo-imagem-nota-v138, p, div, figure") || img.parentElement;

  img.style.height = "auto";
  img.style.display = "block";

  if (tipo === "original") {
    img.style.width = "auto";
    img.style.maxWidth = "100%";
    img.style.removeProperty("min-width");
    img.classList.remove("imagem-tamanho-fixo-v140");
    img.classList.add("imagem-tamanho-original-v140");

    if (container) {
      container.style.textAlign = container.style.textAlign || "center";
    }

    return;
  }

  if (tipo === "fixo") {
    img.style.width = largura;
    img.style.maxWidth = "100%";
    img.classList.add("imagem-tamanho-fixo-v140");
    img.classList.remove("imagem-tamanho-original-v140");

    if (container) {
      container.style.textAlign = container.style.textAlign || "center";
    }
  }
}

function criarBotaoTamanhoOriginalImagemV140() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btnImagemTamanhoOriginalV140";
  btn.className = "btn-editor-formatacao btn-imagem-original-v140";
  btn.title = "Tamanho original da imagem";
  btn.textContent = "Original";

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    aplicarTamanhoImagemV140("original");
  });

  return btn;
}

function criarMenuTamanhoImagemV140() {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-tamanho-imagem-v140";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btnTamanhoImagemV140";
  btn.className = "btn-editor-formatacao btn-tamanho-imagem-v140";
  btn.title = "Tamanho da imagem";
  btn.innerHTML = `<span>Imagem</span><span class="seta-tamanho-imagem-v140">⌄</span>`;

  const menu = document.createElement("div");
  menu.className = "menu-tamanho-imagem-v140 escondido";

  const opcoes = [
    { rotulo: "Pequena", largura: "30%" },
    { rotulo: "Média", largura: "50%" },
    { rotulo: "Grande", largura: "75%" }
  ];

  opcoes.forEach(opcao => {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = opcao.rotulo;
    item.title = `Imagem ${opcao.rotulo.toLowerCase()} (${opcao.largura})`;

    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      aplicarTamanhoImagemV140("fixo", opcao.largura);
      menu.classList.add("escondido");
    });

    menu.appendChild(item);
  });

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    document.querySelectorAll(".menu-tamanho-imagem-v140").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });

    menu.classList.toggle("escondido");
  });

  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) {
      menu.classList.add("escondido");
    }
  });

  wrapper.appendChild(btn);
  wrapper.appendChild(menu);

  return wrapper;
}

function localizarToolbarTextoPrincipalParaImagemV140() {
  try {
    return localizarToolbarTextoPrincipalV138?.() || localizarToolbarTextoPrincipalV127?.() || encontrarToolbarNota?.();
  } catch {
    return null;
  }
}

function adicionarBotoesTamanhoImagemV140() {
  const toolbar = localizarToolbarTextoPrincipalParaImagemV140();
  if (!toolbar || toolbar.dataset.tamanhoImagemV140 === "1") return;

  toolbar.dataset.tamanhoImagemV140 = "1";

  const btnImagem = toolbar.querySelector("#btnInserirImagemTextoNotaV138, .btn-inserir-imagem-v138");

  const btnOriginal = criarBotaoTamanhoOriginalImagemV140();
  const menuTamanho = criarMenuTamanhoImagemV140();

  if (btnImagem && btnImagem.parentElement === toolbar) {
    toolbar.insertBefore(btnOriginal, btnImagem.nextSibling);
    toolbar.insertBefore(menuTamanho, btnOriginal.nextSibling);
    return;
  }

  const grupoTabela = toolbar.querySelector(".grupo-ferramentas-tabela");
  if (grupoTabela) {
    toolbar.insertBefore(btnOriginal, grupoTabela);
    toolbar.insertBefore(menuTamanho, grupoTabela);
    return;
  }

  toolbar.appendChild(btnOriginal);
  toolbar.appendChild(menuTamanho);
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(adicionarBotoesTamanhoImagemV140, 0);
  setTimeout(adicionarBotoesTamanhoImagemV140, 400);
  setTimeout(adicionarBotoesTamanhoImagemV140, 1000);
});


/* v141 - grupo Imagem com Posição e Tamanho */
function imagemAtualSelecionadaV141() {
  try {
    if (imagemSelecionadaEditorV139 && document.body.contains(imagemSelecionadaEditorV139)) {
      return imagemSelecionadaEditorV139;
    }
  } catch {}

  return document.querySelector(".imagem-selecionada-v139");
}

function aplicarPosicaoImagemV141(posicao) {
  const img = imagemAtualSelecionadaV141();

  if (!img) {
    alert("Clique primeiro na imagem que deseja ajustar.");
    return;
  }

  const container = img.closest(".paragrafo-imagem-nota-v138, p, div, figure") || img.parentElement;
  if (!container) return;

  container.classList.add("paragrafo-imagem-nota-v138");

  img.style.display = "block";
  img.style.maxWidth = "100%";
  img.style.height = "auto";

  if (posicao === "left") {
    container.style.textAlign = "left";
    img.style.marginLeft = "0";
    img.style.marginRight = "auto";
  }

  if (posicao === "center") {
    container.style.textAlign = "center";
    img.style.marginLeft = "auto";
    img.style.marginRight = "auto";
  }

  if (posicao === "right") {
    container.style.textAlign = "right";
    img.style.marginLeft = "auto";
    img.style.marginRight = "0";
  }

  try { salvarSelecaoEditorV121(); } catch {}
}

function aplicarTamanhoImagemV141(tipo, largura = null) {
  const img = imagemAtualSelecionadaV141();

  if (!img) {
    alert("Clique primeiro na imagem que deseja ajustar.");
    return;
  }

  const container = img.closest(".paragrafo-imagem-nota-v138, p, div, figure") || img.parentElement;
  if (container) container.classList.add("paragrafo-imagem-nota-v138");

  img.style.height = "auto";
  img.style.display = "block";

  if (tipo === "original") {
    img.style.width = "auto";
    img.style.maxWidth = "100%";
    img.style.removeProperty("min-width");
    img.classList.remove("imagem-tamanho-fixo-v140", "imagem-ajustada-bordas-v141");
    img.classList.add("imagem-tamanho-original-v140");
    if (container) container.style.textAlign = container.style.textAlign || "center";
    return;
  }

  if (tipo === "bordas") {
    img.style.width = "100%";
    img.style.maxWidth = "100%";
    img.style.marginLeft = "0";
    img.style.marginRight = "0";
    img.classList.add("imagem-tamanho-fixo-v140", "imagem-ajustada-bordas-v141");
    img.classList.remove("imagem-tamanho-original-v140");
    if (container) container.style.textAlign = "justify";
    return;
  }

  if (tipo === "fixo") {
    img.style.width = largura;
    img.style.maxWidth = "100%";
    img.classList.add("imagem-tamanho-fixo-v140");
    img.classList.remove("imagem-tamanho-original-v140", "imagem-ajustada-bordas-v141");
    if (container) container.style.textAlign = container.style.textAlign || "center";
  }
}

function criarMenuPosicaoImagemV141() {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-imagem-v141 dropdown-posicao-imagem-v141";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btnPosicaoImagemV141";
  btn.className = "btn-editor-formatacao btn-posicao-imagem-v141";
  btn.title = "Posição da imagem";
  btn.innerHTML = `<span>Posição</span><span class="seta-imagem-v141">⌄</span>`;

  const menu = document.createElement("div");
  menu.className = "menu-imagem-v141 menu-posicao-imagem-v141 escondido";

  const opcoes = [
    { rotulo: "Alinhar à esquerda", posicao: "left" },
    { rotulo: "Centralizar", posicao: "center" },
    { rotulo: "Alinhar à direita", posicao: "right" }
  ];

  opcoes.forEach(opcao => {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = opcao.rotulo;

    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      aplicarPosicaoImagemV141(opcao.posicao);
      menu.classList.add("escondido");
    });

    menu.appendChild(item);
  });

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    document.querySelectorAll(".menu-imagem-v141, .menu-tamanho-imagem-v140").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });

    menu.classList.toggle("escondido");
  });

  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) {
      menu.classList.add("escondido");
    }
  });

  wrapper.appendChild(btn);
  wrapper.appendChild(menu);
  return wrapper;
}

function criarMenuTamanhoImagemV141() {
  const wrapper = document.createElement("div");
  wrapper.className = "dropdown-imagem-v141 dropdown-tamanho-imagem-v141";

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btnTamanhoImagemV141";
  btn.className = "btn-editor-formatacao btn-tamanho-imagem-v141";
  btn.title = "Tamanho da imagem";
  btn.innerHTML = `<span>Tamanho</span><span class="seta-imagem-v141">⌄</span>`;

  const menu = document.createElement("div");
  menu.className = "menu-imagem-v141 menu-tamanho-imagem-v141 escondido";

  const opcoes = [
    { rotulo: "Pequena", tipo: "fixo", largura: "30%" },
    { rotulo: "Média", tipo: "fixo", largura: "50%" },
    { rotulo: "Grande", tipo: "fixo", largura: "75%" },
    { rotulo: "Ajustar às bordas", tipo: "bordas", largura: null },
    { rotulo: "Tamanho original", tipo: "original", largura: null }
  ];

  opcoes.forEach(opcao => {
    const item = document.createElement("button");
    item.type = "button";
    item.textContent = opcao.rotulo;

    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      aplicarTamanhoImagemV141(opcao.tipo, opcao.largura);
      menu.classList.add("escondido");
    });

    menu.appendChild(item);
  });

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    document.querySelectorAll(".menu-imagem-v141, .menu-tamanho-imagem-v140").forEach(m => {
      if (m !== menu) m.classList.add("escondido");
    });

    menu.classList.toggle("escondido");
  });

  document.addEventListener("click", (event) => {
    if (!wrapper.contains(event.target)) {
      menu.classList.add("escondido");
    }
  });

  wrapper.appendChild(btn);
  wrapper.appendChild(menu);
  return wrapper;
}

function localizarToolbarTextoPrincipalParaImagemV141() {
  try {
    return localizarToolbarTextoPrincipalV138?.() || localizarToolbarTextoPrincipalV127?.() || encontrarToolbarNota?.();
  } catch {
    return null;
  }
}

function criarGrupoImagemV141() {
  const grupo = document.createElement("div");
  grupo.id = "grupoImagemToolbarV141";
  grupo.className = "grupo-imagem-toolbar-v141";

  const rotulo = document.createElement("span");
  rotulo.className = "rotulo-grupo-imagem-v141";
  rotulo.textContent = "Imagem";

  grupo.appendChild(rotulo);

  // Reaproveita o botão existente de inserir imagem se possível.
  let btnInserir = document.getElementById("btnInserirImagemTextoNotaV138");
  if (!btnInserir) {
    try {
      btnInserir = criarBotaoInserirImagemV138();
    } catch {
      btnInserir = document.createElement("button");
      btnInserir.type = "button";
      btnInserir.textContent = "Imagem";
      btnInserir.className = "btn-editor-formatacao btn-inserir-imagem-v138";
      btnInserir.addEventListener("click", (event) => {
        event.preventDefault();
        try { abrirSeletorImagemNotaV138(); } catch {}
      });
    }
  }

  btnInserir.classList.add("btn-imagem-grupo-v141");

  grupo.appendChild(btnInserir);
  grupo.appendChild(criarMenuPosicaoImagemV141());
  grupo.appendChild(criarMenuTamanhoImagemV141());

  return grupo;
}

function reorganizarBotoesImagemV141() {
  const toolbar = localizarToolbarTextoPrincipalParaImagemV141();
  if (!toolbar) return;

  // Remove botões antigos/soltos de imagem/tamanho original/tamanho v140, para não duplicar.
  toolbar.querySelectorAll(
    "#grupoImagemToolbarV141, #btnImagemTamanhoOriginalV140, #btnTamanhoImagemV140, .dropdown-tamanho-imagem-v140, .btn-imagem-original-v140"
  ).forEach(el => el.remove());

  const grupo = criarGrupoImagemV141();

  const grupoTabela = toolbar.querySelector(".grupo-ferramentas-tabela");
  if (grupoTabela) {
    toolbar.insertBefore(grupo, grupoTabela);
  } else {
    toolbar.appendChild(grupo);
  }

  toolbar.dataset.imagemV141 = "1";
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(reorganizarBotoesImagemV141, 0);
  setTimeout(reorganizarBotoesImagemV141, 500);
  setTimeout(reorganizarBotoesImagemV141, 1200);
});


/* v142 - alinhar à direita e listas separadas */
function obterEditorAtivoToolbarV142(toolbar) {
  const editorTexto = document.getElementById("notaTextoEditor");
  const editorAnexo =
    document.querySelector("[data-editor-anexo-texto='1']") ||
    document.getElementById("notaAnexoEditor") ||
    document.getElementById("notaAnexoTextoEditor");

  if (toolbar?.classList?.contains("toolbar-editor-anexo") || toolbar?.id === "toolbarTextoAnexoIgualTexto") {
    return editorAnexo || editorTexto;
  }

  return editorTexto || editorAnexo;
}

function focarEditorParaToolbarV142(toolbar) {
  const editor = obterEditorAtivoToolbarV142(toolbar);
  if (editor) editor.focus();

  try { restaurarSelecaoEditorV121(); } catch {}

  return editor;
}

function executarComandoToolbarV142(toolbar, comando) {
  const editor = focarEditorParaToolbarV142(toolbar);
  if (!editor) return;

  document.execCommand(comando, false, null);

  try { salvarSelecaoEditorV121(); } catch {}
}

function criarBotaoListaMarcadoresV142(toolbar) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-editor-formatacao btn-lista-marcadores-v142";
  btn.title = "Lista com marcadores";
  btn.innerHTML = `
    <span class="icone-lista-marcadores-v142" aria-hidden="true">
      <i></i><i></i><i></i>
    </span>
  `;

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    executarComandoToolbarV142(toolbar, "insertUnorderedList");
  });

  return btn;
}

function criarBotaoListaNumeradaV142(toolbar) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-editor-formatacao btn-lista-numerada-v142";
  btn.title = "Lista numerada";
  btn.innerHTML = `
    <span class="icone-lista-numerada-v142" aria-hidden="true">
      <i>1</i><i>2</i><i>3</i>
    </span>
  `;

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    executarComandoToolbarV142(toolbar, "insertOrderedList");
  });

  return btn;
}

function criarBotaoAlinharDireitaV142(toolbar) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-editor-formatacao btn-alinhar-direita-v142";
  btn.title = "Alinhar à direita";
  btn.innerHTML = `
    <span class="icone-alinhar-direita-v142" aria-hidden="true">
      <i></i><i></i><i></i><i></i>
    </span>
  `;

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    // Se houver imagem selecionada, aplica na imagem também.
    try {
      if (typeof aplicarPosicaoImagemV141 === "function" && imagemSelecionadaEditorV139 && document.body.contains(imagemSelecionadaEditorV139)) {
        aplicarPosicaoImagemV141("right");
        return;
      }
    } catch {}

    executarComandoToolbarV142(toolbar, "justifyRight");
  });

  return btn;
}

function separarBotoesListaV142(toolbar) {
  if (!toolbar || toolbar.dataset.listasSeparadasV142 === "1") return;

  const dropdownLista =
    toolbar.querySelector(".dropdown-lista-editor") ||
    toolbar.querySelector(".btn-dropdown-lista-editor")?.closest("div");

  if (!dropdownLista) return;

  const btnMarcadores = criarBotaoListaMarcadoresV142(toolbar);
  const btnNumerada = criarBotaoListaNumeradaV142(toolbar);

  dropdownLista.insertAdjacentElement("beforebegin", btnMarcadores);
  btnMarcadores.insertAdjacentElement("afterend", btnNumerada);

  dropdownLista.remove();

  toolbar.dataset.listasSeparadasV142 = "1";
}

function adicionarBotaoAlinharDireitaV142(toolbar) {
  if (!toolbar || toolbar.querySelector(".btn-alinhar-direita-v142")) return;

  const btnDireita = criarBotaoAlinharDireitaV142(toolbar);

  const btnCentralizar = toolbar.querySelector(".btn-centralizar");
  const btnJustificar = toolbar.querySelector(".btn-justificar");
  const grupo = toolbar.querySelector(".grupo-listas-alinhamento");

  if (btnCentralizar) {
    btnCentralizar.insertAdjacentElement("afterend", btnDireita);
    return;
  }

  if (btnJustificar) {
    btnJustificar.insertAdjacentElement("beforebegin", btnDireita);
    return;
  }

  if (grupo) {
    grupo.appendChild(btnDireita);
    return;
  }

  toolbar.appendChild(btnDireita);
}

function ajustarToolbarsListasEAlinhamentoV142() {
  document.querySelectorAll(".toolbar-editor, .barra-editor, .editor-toolbar, .toolbar-editor-avancada").forEach(toolbar => {
    separarBotoesListaV142(toolbar);
    adicionarBotaoAlinharDireitaV142(toolbar);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(ajustarToolbarsListasEAlinhamentoV142, 0);
  setTimeout(ajustarToolbarsListasEAlinhamentoV142, 500);
  setTimeout(ajustarToolbarsListasEAlinhamentoV142, 1200);
});


/* v158 - botão inserir/editar link no campo Texto da nota */
function localizarEditorTextoPrincipalV158() {
  return document.getElementById("notaTextoEditor");
}

function localizarToolbarTextoPrincipalV158() {
  const editorTexto = localizarEditorTextoPrincipalV158();
  if (!editorTexto) return null;

  let el = editorTexto.previousElementSibling;
  for (let i = 0; el && i < 8; i++) {
    if (el.querySelector?.("button")) return el;
    el = el.previousElementSibling;
  }

  try {
    return localizarToolbarTextoPrincipalV138?.() ||
           localizarToolbarTextoPrincipalV127?.() ||
           encontrarToolbarNota?.() ||
           null;
  } catch {
    return null;
  }
}

function salvarSelecaoLinkV158() {
  try { salvarSelecaoEditorV121(); } catch {}
}

function normalizarUrlLinkV158(url) {
  let texto = String(url || "").trim();

  if (!texto) return "";

  if (
    texto.startsWith("#") ||
    texto.startsWith("/") ||
    texto.startsWith("mailto:") ||
    texto.startsWith("tel:") ||
    texto.startsWith("http://") ||
    texto.startsWith("https://")
  ) {
    return texto;
  }

  return "https://" + texto;
}

function obterLinkAtualV158() {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;

  let node = sel.anchorNode;
  if (node && node.nodeType === Node.TEXT_NODE) node = node.parentElement;

  return node?.closest?.("a") || null;
}

function inserirOuEditarLinkV158() {
  const editor = localizarEditorTextoPrincipalV158();
  if (!editor) return;

  editor.focus();

  try { restaurarSelecaoEditorV121(); } catch {}

  const linkAtual = obterLinkAtualV158();
  const urlAtual = linkAtual?.getAttribute("href") || "";

  const urlDigitada = prompt("Digite ou cole o link:", urlAtual);
  if (urlDigitada === null) return;

  const url = normalizarUrlLinkV158(urlDigitada);

  if (!url) {
    if (linkAtual) {
      const texto = document.createTextNode(linkAtual.textContent || "");
      linkAtual.replaceWith(texto);
    }
    return;
  }

  const sel = window.getSelection();

  if (linkAtual) {
    linkAtual.setAttribute("href", url);
    linkAtual.setAttribute("target", "_blank");
    linkAtual.setAttribute("rel", "noopener noreferrer");
    return;
  }

  if (!sel || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  const textoSelecionado = sel.toString();

  if (!textoSelecionado) {
    const textoLink = prompt("Texto que aparecerá no link:", urlDigitada.trim());
    if (textoLink === null || !textoLink.trim()) return;

    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = textoLink.trim();

    range.insertNode(a);

    const novoRange = document.createRange();
    novoRange.setStartAfter(a);
    novoRange.collapse(true);

    sel.removeAllRanges();
    sel.addRange(novoRange);

    try { salvarSelecaoEditorV121(); } catch {}
    return;
  }

  try {
    document.execCommand("createLink", false, url);

    const novoLink = obterLinkAtualV158();
    if (novoLink) {
      novoLink.setAttribute("target", "_blank");
      novoLink.setAttribute("rel", "noopener noreferrer");
    }
  } catch {
    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = textoSelecionado;

    range.deleteContents();
    range.insertNode(a);
  }

  try { salvarSelecaoEditorV121(); } catch {}
}

function criarBotaoLinkTextoV158() {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btnInserirLinkTextoNotaV158";
  btn.className = "btn-editor-formatacao btn-inserir-link-v158";
  btn.title = "Inserir ou editar link";
  btn.innerHTML = `
    <span class="icone-link-v158" aria-hidden="true">
      <span></span><span></span>
    </span>
    <span class="texto-botao-link-v158">Link</span>
  `;

  btn.addEventListener("mousedown", salvarSelecaoLinkV158);
  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    inserirOuEditarLinkV158();
  });

  return btn;
}

function adicionarBotaoLinkToolbarTextoV158() {
  const toolbar = localizarToolbarTextoPrincipalV158();
  if (!toolbar || toolbar.querySelector("#btnInserirLinkTextoNotaV158")) return;

  const btnLink = criarBotaoLinkTextoV158();

  const grupoImagem = toolbar.querySelector("#grupoImagemToolbarV141, .grupo-imagem-toolbar-v141");
  if (grupoImagem) {
    toolbar.insertBefore(btnLink, grupoImagem);
    return;
  }

  const grupoTabela = toolbar.querySelector(".grupo-ferramentas-tabela");
  if (grupoTabela) {
    toolbar.insertBefore(btnLink, grupoTabela);
    return;
  }

  const btnImagem = toolbar.querySelector("#btnInserirImagemTextoNotaV138, .btn-inserir-imagem-v138");
  if (btnImagem) {
    toolbar.insertBefore(btnLink, btnImagem);
    return;
  }

  toolbar.appendChild(btnLink);
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(adicionarBotaoLinkToolbarTextoV158, 0);
  setTimeout(adicionarBotaoLinkToolbarTextoV158, 500);
  setTimeout(adicionarBotaoLinkToolbarTextoV158, 1200);
});
