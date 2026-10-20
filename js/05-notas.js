// 05-notas.js
function prepararTopo() {
  const el = document.getElementById("ultimoBoletimIncluido");
  if (!el) return;

  const notasComBoletim = (dados.notas || [])
    .filter(nota => nota.data && nota.boletim)
    .sort((a, b) => {
      const dataDiff = parseDataBR(b.data) - parseDataBR(a.data);
      if (dataDiff !== 0) return dataDiff;
      return Number(b.ordemInclusao || 0) - Number(a.ordemInclusao || 0);
    });

  if (!notasComBoletim.length) {
    el.textContent = "Nenhum boletim incluído";
    return;
  }

  const ultimaNota = notasComBoletim[0];
  const numero = extrairNumeroBoletim(ultimaNota.boletim);

  if (numero) {
    el.textContent = `SEDEC/CBMERJ nº ${numero} - ${ultimaNota.data}`;
  } else {
    el.textContent = `${ultimaNota.boletim} - ${ultimaNota.data}`;
  }
}

function montarMenu() {
  const menu = document.getElementById("menuLateral");
  menu.innerHTML = "";

  dados.estrutura.forEach(item => {
    if (item.id === "anexos") return;

    const btn = document.createElement("button");
    btn.textContent = item.label;
    btn.className = `nivel-${nivelDoItem(item)}`;
    btn.dataset.id = item.id;

    btn.addEventListener("click", () => {
      filtroAtual = item;
      boletimSelecionado = "";
      dataNotaSelecionadaCalendario = "";
      paginaAtual = 1;
      modoPagina = "boletim";
      document.querySelectorAll(".menu button, .menu-rodape button").forEach(b => b.classList.remove("ativo"));
      btn.classList.add("ativo");
      document.getElementById("tituloPagina").textContent = item.id === "todas" ? "Boletim Digital" : item.label;
      mostrarBoletim();
      ordenarNotasPorDataEInsercaoV180();
  renderizarNotas();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    if (item.id === "todas") btn.classList.add("ativo");
    menu.appendChild(btn);
  });
}

function nivelDoItem(item) {
  if (!item.parte || item.id === "todas") return 1;
  if (item.subsecao) return 3;
  if (item.secao) return 2;
  return 1;
}

function mostrarBoletim() {
  modoPagina = "boletim";
  mostrarBotaoIncluirNotaTopo();
  document.getElementById("controlesNotas").classList.remove("escondido");
  document.getElementById("listaNotas").classList.remove("escondido");
  document.getElementById("paginacao").classList.remove("escondido");
  document.getElementById("paginaFatosHistoricos").classList.add("escondido");
  document.getElementById("paginaEstatistica").classList.add("escondido");
  document.getElementById("paginaAuditoria")?.classList.add("escondido");
  document.getElementById("paginaEstruturaOrganizacional")?.classList.add("escondido");
  setTimeout(aplicarOcultacaoContadorNotasNaEstatistica, 0);
}

function mostrarPaginaExtra(tipo) {
  modoPagina = tipo;
  ocultarBotaoIncluirNotaTopo();
  document.querySelectorAll(".menu button, .menu-rodape button").forEach(b => b.classList.remove("ativo"));
  document.getElementById(tipo === "fatos" ? "btnFatosHistoricos" : "btnEstatistica").classList.add("ativo");

  document.getElementById("controlesNotas").classList.add("escondido");
  document.getElementById("listaNotas").classList.add("escondido");
  document.getElementById("paginacao").classList.add("escondido");

  document.getElementById("paginaFatosHistoricos").classList.toggle("escondido", tipo !== "fatos");
  document.getElementById("paginaEstatistica").classList.toggle("escondido", tipo !== "estatistica");
  document.getElementById("paginaAuditoria")?.classList.add("escondido");
  document.getElementById("tituloPagina").textContent = tipo === "fatos" ? "Fatos Históricos" : "Estatística de Socorros Prestados";
  if (tipo === "estatistica") renderizarEstatistica();
}

function ocultarBotaoIncluirNotaTopo() {
  const btn = document.getElementById("btnNovaNota");
  if (btn) btn.classList.add("oculto-contextual");
}

function mostrarBotaoIncluirNotaTopo() {
  const btn = document.getElementById("btnNovaNota");
  if (btn) btn.classList.remove("oculto-contextual");
}

function pertenceAoFiltro(nota) {
  if (!filtroAtual.parte) return true;
  if (filtroAtual.parte && nota.parte !== filtroAtual.parte) return false;
  if (filtroAtual.secao && nota.secao !== filtroAtual.secao) return false;
  if (filtroAtual.subsecao && nota.subsecao !== filtroAtual.subsecao) return false;
  return true;
}

function pertenceADataSelecionadaCalendario(nota) {
  if (!dataNotaSelecionadaCalendario) return true;
  return nota.data === dataNotaSelecionadaCalendario;
}

function pertenceAoBoletim(nota) {
  if (!boletimSelecionado) return true;
  return String(nota.boletim || "").includes(`nº ${boletimSelecionado}`) || String(nota.boletim || "").includes(`n° ${boletimSelecionado}`);
}

function passaNaBusca(nota) {
  if (!termoBusca) return true;
  return normalizar(JSON.stringify(nota)).includes(normalizar(termoBusca));
}

function ordemParte(nota) {
  const partes = {
    "1ª Parte - Serviços Diários": 1,
    "2ª Parte - Operações e Instrução": 2,
    "3ª Parte - Assuntos Gerais e Administrativos": 3,
    "4ª Parte - Justiça e Disciplina": 4,
    "4ª Parte - Justiça E Disciplina": 4,
    "5ª Parte - Comunicação Social": 5
  };
  return partes[nota.parte] || 99;
}

function ordemSecao(nota) {
  const texto = `${nota.secao || ""} ${nota.subsecao || ""}`;
  if (texto.includes("I - Operações")) return 1;
  if (texto.includes("II - Instrução")) return 2;
  if (texto.includes("I - Assuntos Gerais")) return 1;
  if (texto.includes("A - Alterações")) return 11;
  if (texto.includes("A1 - Alterações")) return 12;
  if (texto.includes("B - Alterações")) return 13;
  if (texto.includes("C - Alterações")) return 14;
  if (texto.includes("II - Assuntos Administrativos")) return 2;
  return 99;
}

function ordenarNotas(a, b) {
  const dataDif = parseDataBR(b.data) - parseDataBR(a.data);
  if (dataDif !== 0) return dataDif;

  const parteDif = ordemParte(a) - ordemParte(b);
  if (parteDif !== 0) return parteDif;

  const secaoDif = ordemSecao(a) - ordemSecao(b);
  if (secaoDif !== 0) return secaoDif;

  return (a.ordemInclusao || 0) - (b.ordemInclusao || 0);
}

function renderizarNotas() {
  const lista = document.getElementById("listaNotas");
  const filtroTitulo = document.getElementById("filtroAtual");
  const contador = document.getElementById("contadorNotas");

  filtroTitulo.textContent = filtroAtual.label;

  const todasNotas = dados.notas
    .filter(pertenceADataSelecionadaCalendario)
    .filter(pertenceAoBoletim)
    .filter(pertenceAoFiltro)
    .filter(passaNaBusca)
    .sort(ordenarNotas);

  contador.textContent = `${todasNotas.length} nota(s) encontrada(s)`;

  const totalPaginas = Math.max(1, Math.ceil(todasNotas.length / itensPorPagina));
  if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

  const inicio = (paginaAtual - 1) * itensPorPagina;
  const notas = todasNotas.slice(inicio, inicio + itensPorPagina);

  lista.innerHTML = "";

  if (!notas.length) {
    lista.innerHTML = `<div class="vazio">Nenhuma nota encontrada neste tópico.</div>`;
    renderizarPaginacao(1);
    return;
  }

  notas.forEach(nota => {
    const article = document.createElement("article");
    article.className = "nota";
    article.id = nota.id;

    const caminho = [nota.parte, nota.secao, nota.subsecao].filter(Boolean).join(" • ");
    const tituloCompleto = `${nota.numero ? nota.numero + ". " : ""}${nota.titulo}`;

    article.innerHTML = `
      <button class="titulo-nota" type="button">
        <div>
          <h3>${destacar(tituloCompleto)}</h3>
          <div class="meta">${escapeHtml(nota.boletim)} • ${escapeHtml(nota.data)}<br>${escapeHtml(caminho)}</div>
        </div>
        <span class="icone">+</span>
      </button>

      <div class="corpo-nota">
        <div class="texto">${renderizarTextoNota(nota.texto || "")}</div>
        ${renderizarSubitens(nota)}
        ${renderizarAnexosDaNota(nota)}
        <a class="permalink" href="#${nota.id}">Link permanente desta nota</a>
        <div class="acoes-nota-rodape">
          <div class="acoes-nota-esquerda">
            <button class="btn-editar-nota" type="button" data-id="${nota.id}">Editar nota</button>
            <button class="btn-excluir-nota" type="button" data-id="${nota.id}">Excluir nota</button>
          </div>

          <div class="acoes-nota-direita">
            <button class="btn-imprimir-nota" type="button" data-id="${nota.id}">Imprimir nota</button>
          </div>
        </div>
      </div>
    `;

    const botao = article.querySelector(".titulo-nota");
    botao.addEventListener("click", () => {
      const aberta = article.classList.toggle("aberta");
      article.querySelector(".icone").textContent = aberta ? "−" : "+";

      if (!aberta) {
        article.querySelectorAll(".anexo.aberto, .subitem.aberto").forEach(bloco => bloco.classList.remove("aberto"));
        article.querySelectorAll(".icone-anexo, .icone-subitem").forEach(icone => icone.textContent = "+");
      }
    });

    article.querySelectorAll(".titulo-anexo, .titulo-subitem").forEach(btn => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        const bloco = btn.closest(".anexo, .subitem");
        const aberto = bloco.classList.toggle("aberto");
        const icone = bloco.querySelector(".icone-anexo, .icone-subitem");
        if (icone) icone.textContent = aberto ? "−" : "+";
      });
    });

    const btnImprimirNota = article.querySelector(".btn-imprimir-nota");
    const btnEditar = article.querySelector(".btn-editar-nota");
    const btnExcluir = article.querySelector(".btn-excluir-nota");
    if (btnImprimirNota) btnImprimirNota.addEventListener("click", () => imprimirNotaUnica(nota.id));
    if (btnEditar) btnEditar.addEventListener("click", () => editarNota(nota.id));
    if (btnExcluir) btnExcluir.addEventListener("click", () => excluirNota(nota.id));

    lista.appendChild(article);
  });

  renderizarPaginacao(totalPaginas);
}

function renderizarPaginacao(totalPaginas) {
  const pag = document.getElementById("paginacao");
  pag.innerHTML = "";
  if (totalPaginas <= 1) return;

  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    if (i === paginaAtual) btn.classList.add("ativo");
    btn.addEventListener("click", () => {
      paginaAtual = i;
      renderizarNotas();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    pag.appendChild(btn);
  }
}

function renderizarSubitens(nota) {
  if (!nota.subitens || !nota.subitens.length) return "";
  return `
    <div class="subitens-nota">
      ${nota.subitens.map(sub => `
        <div class="subitem">
          <button class="titulo-subitem" type="button">
            <span>${escapeHtml(sub.titulo)}</span>
            <span class="icone-subitem">+</span>
          </button>
          <div class="corpo-subitem">${renderizarTextoNota(sub.texto || "")}</div>
        </div>
      `).join("")}
    </div>`;
}

function renderizarAnexosDaNota(nota) {
  if (!nota.anexos || !nota.anexos.length) return "";
  return `
    <div class="anexos-da-nota">
      <h4>Anexos desta nota</h4>
      ${nota.anexos.map((anexo, index) => `
        <div class="anexo">
          <button class="titulo-anexo" type="button">
            <span>${escapeHtml(anexo.titulo || `Anexo ${index + 1}`)}</span>
            <span class="icone-anexo">+</span>
          </button>
          <div class="corpo-anexo">${renderizarTextoNota(anexo.texto || "")}</div>
        </div>
      `).join("")}
    </div>`;
}

function incluirNotaPeloFormulario() {
  if (!podeIncluirNota()) {
    negarAcesso("Você não tem permissão para incluir notas.");
    return;
  }

  prepararBoletimAntesDaInclusaoV180();
  const numero = document.getElementById("notaNumero").value.trim();
  const editandoId = document.getElementById("formNota").dataset.editandoId;

  if (numeroJaExiste(numero, editandoId)) {
    alert("Já existe uma nota com esse número neste boletim/parte/seção/subseção. Use outro número ou edite a nota existente.");
    document.getElementById("notaNumero").focus();
    return;
  }

  const titulo = document.getElementById("notaTitulo").value.trim();
  const parte = document.getElementById("notaParte").value.trim();
  const secao = document.getElementById("notaSecao").value.trim();
  const subsecao = document.getElementById("notaSubsecao").value.trim();
  prepararBoletimAntesDaInclusaoV180();
  const boletim = montarTextoBoletimV180();
  const dataNota = dataInputParaBR(document.getElementById("notaData").value);
  const texto = document.getElementById("notaTextoEditor").innerHTML.trim();

  const anexos = Array.from(document.querySelectorAll(".campo-anexo")).map((campo, index) => {
    const tituloAnexo = campo.querySelector(".anexo-titulo").value.trim();
    const textoAnexo = campo.querySelector(".anexo-editor").innerHTML.trim();
    if (!tituloAnexo && !textoAnexo) return null;
    return { titulo: tituloAnexo || `Anexo ${index + 1}`, texto: textoAnexo };
  }).filter(Boolean);

  let novaNota;

  if (editandoId) {
    novaNota = dados.notas.find(n => n.id === editandoId);
    const notaAntes = {...novaNota};
    Object.assign(novaNota, { numero, titulo, parte, secao, subsecao, boletim, data: dataNota, texto, anexos });
    aplicarBoletimEstruturadoNaNotaV180(novaNota);
    registrarAuditoria("EDITOU_NOTA", {antes: notaAntes, depois: {...novaNota}});
    delete document.getElementById("formNota").dataset.editandoId;
  } else {
    novaNota = {
      id: `nota-manual-${Date.now()}`,
      ordemInclusao: Date.now(),
      numero, titulo, parte, secao, subsecao, boletim, data: dataNota, texto, anexos
    };
    dados.notas.unshift(novaNota);
  registrarAuditoria("CRIOU_NOTA", novaNota);
  }

  const numeroBoletim = extrairNumeroBoletim(boletim);
  if (numeroBoletim && !(dados.boletins || []).some(b => b.numero === numeroBoletim)) {
    dados.boletins = dados.boletins || [];
    dados.boletins.push({ numero: numeroBoletim, data: dataNota, titulo: boletim });
    prepararTopo();
    prepararCalendario();
  }

  ordenarNotasPorDataEInsercaoV180();
  salvarNotasLocais();
  fecharModalNota();
  document.getElementById("formNota").reset();
  document.getElementById("notaTextoEditor").innerHTML = "";
  document.getElementById("listaCamposAnexos").innerHTML = "";
  atualizarCamposHierarquia();

  filtroAtual = { parte: "", secao: "", subsecao: "", label: "Todas as notas" };
  boletimSelecionado = "";
  paginaAtual = 1;
  document.querySelectorAll(".menu button, .menu-rodape button").forEach(b => b.classList.remove("ativo"));
  const btnTodas = document.querySelector('.menu button[data-id="todas"]');
  if (btnTodas) btnTodas.classList.add("ativo");
  document.getElementById("tituloPagina").textContent = "Boletim Digital";

  mostrarBoletim();
  renderizarNotas();

  setTimeout(() => {
    const criada = document.getElementById(novaNota.id);
    if (criada) {
      criada.classList.add("aberta");
      const icone = criada.querySelector(".icone");
      if (icone) icone.textContent = "−";
      criada.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, 100);
}

function extrairNumeroBoletim(textoBoletim) {
  const m = String(textoBoletim).match(/n[º°]?\s*(\d+)/i);
  return m ? m[1] : "";
}


/* v71 - oculta cabeçalho superior do boletim na página Estatística */
function aplicarClassePaginaAtual(tipo) {
  document.body.classList.remove("pagina-estatistica-ativa", "pagina-fatos-ativa", "pagina-auditoria-ativa");

  if (tipo === "estatistica") document.body.classList.add("pagina-estatistica-ativa");
  if (tipo === "fatos") document.body.classList.add("pagina-fatos-ativa");
  if (tipo === "auditoria") document.body.classList.add("pagina-auditoria-ativa");
}

function mostrarBoletim() {
  modoPagina = "boletim";
  aplicarClassePaginaAtual("boletim");
  mostrarBotaoIncluirNotaTopo();

  document.getElementById("paginaBoletim")?.classList.remove("escondido");
  document.getElementById("paginaFatos")?.classList.add("escondido");
  document.getElementById("paginaEstatistica")?.classList.add("escondido");
  document.getElementById("paginaAuditoria")?.classList.add("escondido");
}

function mostrarPaginaExtra(tipo) {
  modoPagina = tipo;
  aplicarClassePaginaAtual(tipo);
  ocultarBotaoIncluirNotaTopo();

  document.getElementById("paginaBoletim")?.classList.add("escondido");
  document.getElementById("paginaFatos")?.classList.toggle("escondido", tipo !== "fatos");
  document.getElementById("paginaEstatistica")?.classList.toggle("escondido", tipo !== "estatistica");
  document.getElementById("paginaAuditoria")?.classList.add("escondido");

  const titulo = document.getElementById("tituloPagina");
  if (titulo) {
    titulo.textContent = tipo === "fatos" ? "Fatos Históricos" : "Estatística de Socorros Prestados";
  }

  if (tipo === "estatistica") {
    marcarControlesNotasParaEstatistica();
    try { renderizarEstatistica(); } catch {}
  }
}



/* v74 - marcação segura dos controles de Notas para esconder só na Estatística */
function marcarControlesNotasParaEstatistica() {
  const seletorQuantidade = document.getElementById("itensPorPagina");
  if (seletorQuantidade) {
    const blocoPai = seletorQuantidade.closest("label, div");
    if (blocoPai) blocoPai.classList.add("bloco-quantidade-notas-estatistica");
  }
}

document.addEventListener("DOMContentLoaded", marcarControlesNotasParaEstatistica);



/* v75 - oculta com precisão o contador "Todas as notas / X notas encontradas" na Estatística */
function marcarBlocoContadorNotas() {
  const candidatos = [
    document.getElementById("contadorNotas"),
    document.getElementById("infoNotas"),
    document.getElementById("resumoNotas"),
    document.getElementById("resumoResultados"),
    document.getElementById("resultadoNotas"),
    document.getElementById("cabecalhoNotas"),
    document.getElementById("barraNotas"),
    document.getElementById("controleNotas"),
    document.getElementById("controlesNotas")
  ].filter(Boolean);

  candidatos.forEach(el => el.classList.add("ocultar-contador-notas-estatistica"));

  const seletorQuantidade = document.getElementById("itensPorPagina");
  if (seletorQuantidade) {
    seletorQuantidade.classList.add("input-itens-por-pagina");

    const bloco = seletorQuantidade.closest("label, .controle, .controles, .barra, .toolbar, div");
    if (bloco) bloco.classList.add("ocultar-contador-notas-estatistica");
  }

  // Busca controlada: só procura blocos pequenos com texto de contador de notas.
  const areaPrincipal = document.querySelector("main") || document.body;
  areaPrincipal.querySelectorAll("div, header, section").forEach(el => {
    const texto = (el.textContent || "").replace(/\s+/g, " ").trim();

    const pareceContador =
      texto.includes("Todas as notas") &&
      texto.includes("notas encontradas");

    if (pareceContador && el.children.length <= 8 && el.offsetHeight <= 180) {
      el.classList.add("ocultar-contador-notas-estatistica");
    }
  });
}

function aplicarOcultacaoContadorNotasNaEstatistica() {
  marcarBlocoContadorNotas();

  const deveOcultar = document.body.classList.contains("pagina-estatistica-ativa");

  document.querySelectorAll(".ocultar-contador-notas-estatistica").forEach(el => {
    el.style.display = deveOcultar ? "none" : "";
  });
}

// Reexecuta após renderizações da página, sem esconder outros conteúdos.
document.addEventListener("DOMContentLoaded", () => {
  marcarBlocoContadorNotas();
  aplicarOcultacaoContadorNotasNaEstatistica();
});


/* v104 - aplica ordenação antes de exibir notas */
function renderizarNotasOrdenadasV104() {
  try { ordenarDadosNotas(); } catch {}
}

// Wrapper seguro: se renderizarNotas já existir, preserva a original e ordena antes.
if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV104) {
  window.renderizarNotasOriginalV104 = renderizarNotas;
  renderizarNotas = function(...args) {
    try { ordenarDadosNotas(); } catch {}
    return window.renderizarNotasOriginalV104.apply(this, args);
  };
}

// Wrapper seguro para mostrarBoletim, se existir.
if (typeof mostrarBoletim === "function" && !window.mostrarBoletimOriginalV104) {
  window.mostrarBoletimOriginalV104 = mostrarBoletim;
  mostrarBoletim = function(...args) {
    try { ordenarDadosNotas(); } catch {}
    return window.mostrarBoletimOriginalV104.apply(this, args);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  try { ordenarDadosNotas(); } catch {}
});


/* v105 - força nota mais recente no topo */
function obterTimestampNotaV105(nota) {
  if (!nota) return 0;

  const campos = [
    nota.dataNota,
    nota.data,
    nota.dataBoletim,
    nota.boletimData,
    nota.criadoEm,
    nota.criadaEm,
    nota.atualizadoEm,
    nota.timestamp
  ];

  for (const valor of campos) {
    if (!valor) continue;

    const texto = String(valor).trim();

    const br = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (br) {
      return new Date(
        Number(br[3]),
        Number(br[2]) - 1,
        Number(br[1]),
        Number(br[4] || 23),
        Number(br[5] || 59),
        Number(br[6] || 59)
      ).getTime();
    }

    const iso = texto.match(/(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (iso) {
      return new Date(
        Number(iso[1]),
        Number(iso[2]) - 1,
        Number(iso[3]),
        Number(iso[4] || 23),
        Number(iso[5] || 59),
        Number(iso[6] || 59)
      ).getTime();
    }

    const parsed = Date.parse(texto);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
}

function obterNumeroNotaV105(nota) {
  if (!nota) return 0;

  const valores = [
    nota.numero,
    nota.numeroNota,
    nota.id,
    nota.codigo
  ];

  for (const valor of valores) {
    const n = Number(String(valor ?? "").replace(/\D/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }

  return 0;
}

function compararNotasV105(a, b) {
  const dataB = obterTimestampNotaV105(b);
  const dataA = obterTimestampNotaV105(a);

  if (dataB !== dataA) return dataB - dataA;

  return obterNumeroNotaV105(b) - obterNumeroNotaV105(a);
}

function ordenarNotasV105(lista) {
  if (Array.isArray(lista)) {
    lista.sort(compararNotasV105);
  }

  return lista;
}

function aplicarOrdenacaoNotasV105() {
  try {
    if (typeof dados !== "undefined" && Array.isArray(dados.notas)) {
      ordenarNotasV105(dados.notas);
    }
  } catch {}
}

/* Reordena também os cards já exibidos, caso a função original renderize em ordem antiga */
function extrairDataCardNotaV105(card) {
  const texto = card?.textContent || "";
  const br = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

  if (br) {
    return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]), 23, 59, 59).getTime();
  }

  return 0;
}

function extrairNumeroCardNotaV105(card) {
  const texto = card?.textContent || "";
  const m = texto.match(/(?:Nota|N[º°o.]*)\s*(\d+)/i);

  return m ? Number(m[1]) : 0;
}

function reordenarCardsNotasV105() {
  const containers = [
    document.getElementById("listaNotas"),
    document.getElementById("notasContainer"),
    document.querySelector(".lista-notas"),
    document.querySelector(".notas-container")
  ].filter(Boolean);

  containers.forEach(container => {
    const cards = Array.from(container.children).filter(el => {
      const txt = (el.textContent || "").trim();
      return txt && !el.classList.contains("vazio");
    });

    if (cards.length < 2) return;

    cards.sort((a, b) => {
      const dataB = extrairDataCardNotaV105(b);
      const dataA = extrairDataCardNotaV105(a);

      if (dataB !== dataA) return dataB - dataA;

      return extrairNumeroCardNotaV105(b) - extrairNumeroCardNotaV105(a);
    });

    cards.forEach(card => container.appendChild(card));
  });
}

if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV105) {
  window.renderizarNotasOriginalV105 = renderizarNotas;

  renderizarNotas = function(...args) {
    aplicarOrdenacaoNotasV105();

    const resultado = window.renderizarNotasOriginalV105.apply(this, args);

    setTimeout(() => {
      aplicarOrdenacaoNotasV105();
      reordenarCardsNotasV105();
    }, 0);

    return resultado;
  };
}

if (typeof mostrarBoletim === "function" && !window.mostrarBoletimOriginalV105) {
  window.mostrarBoletimOriginalV105 = mostrarBoletim;

  mostrarBoletim = function(...args) {
    aplicarOrdenacaoNotasV105();
    const resultado = window.mostrarBoletimOriginalV105.apply(this, args);
    setTimeout(reordenarCardsNotasV105, 0);
    return resultado;
  };
}

document.addEventListener("DOMContentLoaded", () => {
  aplicarOrdenacaoNotasV105();

  setTimeout(() => {
    aplicarOrdenacaoNotasV105();
    try { renderizarNotas(); } catch {}
    try { reordenarCardsNotasV105(); } catch {}
  }, 250);
});


/* v106 - nota recém-incluída sempre no topo */
function timestampNotaV106(nota) {
  if (!nota) return 0;

  const campos = [
    nota.dataNota,
    nota.data,
    nota.dataBoletim,
    nota.boletimData,
    nota.criadoEm,
    nota.criadaEm,
    nota.atualizadoEm,
    nota.timestamp
  ];

  for (const valor of campos) {
    if (!valor) continue;
    const texto = String(valor).trim();

    const br = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (br) {
      return new Date(
        Number(br[3]),
        Number(br[2]) - 1,
        Number(br[1]),
        Number(br[4] || 23),
        Number(br[5] || 59),
        Number(br[6] || 59)
      ).getTime();
    }

    const iso = texto.match(/(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
    if (iso) {
      return new Date(
        Number(iso[1]),
        Number(iso[2]) - 1,
        Number(iso[3]),
        Number(iso[4] || 23),
        Number(iso[5] || 59),
        Number(iso[6] || 59)
      ).getTime();
    }

    const parsed = Date.parse(texto);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return 0;
}

function ordemInsercaoNotaV106(nota) {
  if (!nota) return 0;

  const campos = [nota._ordemCriacao, nota.ordemCriacao, nota.id, nota.numero, nota.numeroNota];

  for (const valor of campos) {
    const n = Number(String(valor ?? "").replace(/\D/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }

  return 0;
}

function compararNotasTopoV106(a, b) {
  const tb = timestampNotaV106(b);
  const ta = timestampNotaV106(a);

  if (tb !== ta) return tb - ta;

  const ob = ordemInsercaoNotaV106(b);
  const oa = ordemInsercaoNotaV106(a);

  if (ob !== oa) return ob - oa;

  return 0;
}

function pareceNotaV106(obj) {
  if (!obj || typeof obj !== "object") return false;
  return (
    "texto" in obj ||
    "titulo" in obj ||
    "parte" in obj ||
    "secao" in obj ||
    "subsecao" in obj ||
    "dataNota" in obj ||
    "data" in obj
  );
}

function ordenarListaNotasTopoV106(lista) {
  if (!Array.isArray(lista)) return lista;
  if (!lista.length) return lista;
  if (!lista.some(pareceNotaV106)) return lista;

  lista.forEach((nota, index) => {
    if (nota && typeof nota === "object" && !nota._ordemCriacao) {
      const idNumerico = ordemInsercaoNotaV106(nota);
      nota._ordemCriacao = idNumerico || (Date.now() + index);
    }
  });

  return lista.sort(compararNotasTopoV106);
}

function ordenarDadosNotasTopoV106() {
  try {
    if (typeof dados !== "undefined" && Array.isArray(dados.notas)) {
      ordenarListaNotasTopoV106(dados.notas);
    }
  } catch {}
}

/*
  Intercepta dados.notas.push:
  se a inclusão usa push(), a nota nova é ordenada em seguida.
*/
function interceptarInclusaoNotasV106() {
  try {
    if (typeof dados === "undefined" || !Array.isArray(dados.notas) || dados.notas._pushV106) return;

    Object.defineProperty(dados.notas, "_pushV106", { value: true, enumerable: false });

    const pushOriginal = dados.notas.push;
    dados.notas.push = function(...items) {
      items.forEach(item => {
        if (item && typeof item === "object" && !item._ordemCriacao) {
          item._ordemCriacao = Date.now();
        }
      });

      const r = pushOriginal.apply(this, items);
      ordenarListaNotasTopoV106(this);
      return r;
    };
  } catch {}
}

/*
  Durante renderizarNotas, qualquer resultado de filter() que seja uma lista de notas
  sai ordenado. Isso pega o caso em que a tela usa uma lista filtrada interna.
*/
function executarRenderComFilterOrdenadoV106(fn, contexto, args) {
  const filterOriginal = Array.prototype.filter;

  Array.prototype.filter = function(...filterArgs) {
    const resultado = filterOriginal.apply(this, filterArgs);

    try {
      if (Array.isArray(resultado) && resultado.some(pareceNotaV106)) {
        ordenarListaNotasTopoV106(resultado);
      }
    } catch {}

    return resultado;
  };

  try {
    return fn.apply(contexto, args);
  } finally {
    Array.prototype.filter = filterOriginal;
  }
}

if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV106) {
  window.renderizarNotasOriginalV106 = renderizarNotas;

  renderizarNotas = function(...args) {
    ordenarDadosNotasTopoV106();
    interceptarInclusaoNotasV106();

    const resultado = executarRenderComFilterOrdenadoV106(
      window.renderizarNotasOriginalV106,
      this,
      args
    );

    setTimeout(() => {
      ordenarDadosNotasTopoV106();
      reordenarDOMNotasTopoV106();
    }, 0);

    return resultado;
  };
}

function timestampCardNotaV106(card) {
  const texto = card?.textContent || "";
  const br = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

  if (br) {
    return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]), 23, 59, 59).getTime();
  }

  return 0;
}

function numeroCardNotaV106(card) {
  const texto = card?.textContent || "";
  const match = texto.match(/(?:Nota|N[º°o.]*)\s*(\d+)/i);
  return match ? Number(match[1]) : 0;
}

function reordenarDOMNotasTopoV106() {
  const containers = [
    document.getElementById("listaNotas"),
    document.getElementById("notasContainer"),
    document.querySelector(".lista-notas"),
    document.querySelector(".notas-container"),
    document.querySelector("[data-lista-notas]")
  ].filter(Boolean);

  containers.forEach(container => {
    const cards = Array.from(container.children).filter(el => {
      const txt = (el.textContent || "").trim();
      return txt && !el.classList.contains("vazio") && !txt.includes("Nenhuma nota encontrada");
    });

    if (cards.length < 2) return;

    cards.sort((a, b) => {
      const tb = timestampCardNotaV106(b);
      const ta = timestampCardNotaV106(a);

      if (tb !== ta) return tb - ta;

      return numeroCardNotaV106(b) - numeroCardNotaV106(a);
    });

    cards.forEach(card => container.appendChild(card));
  });
}

/*
  Se existir função de salvar nota, força renderização após salvar.
*/
["salvarNota", "incluirNota", "salvarNovaNota"].forEach(nomeFuncao => {
  try {
    const fn = window[nomeFuncao];
    if (typeof fn === "function" && !window[`${nomeFuncao}OriginalV106`]) {
      window[`${nomeFuncao}OriginalV106`] = fn;
      window[nomeFuncao] = function(...args) {
        const r = window[`${nomeFuncao}OriginalV106`].apply(this, args);
        setTimeout(() => {
          ordenarDadosNotasTopoV106();
          interceptarInclusaoNotasV106();
          try { renderizarNotas(); } catch {}
          reordenarDOMNotasTopoV106();
        }, 0);
        return r;
      };
    }
  } catch {}
});

document.addEventListener("DOMContentLoaded", () => {
  ordenarDadosNotasTopoV106();
  interceptarInclusaoNotasV106();

  setTimeout(() => {
    ordenarDadosNotasTopoV106();
    interceptarInclusaoNotasV106();
    try { renderizarNotas(); } catch {}
    reordenarDOMNotasTopoV106();
  }, 250);
});


/* v108 - Todas as Notas: boletins/notas do mais atual para o mais antigo */
function parseDataBoletimV108(valor) {
  if (!valor) return 0;

  const texto = String(valor).trim();

  // dd/mm/aaaa ou dd/mm/aaaa hh:mm
  const br = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (br) {
    return new Date(
      Number(br[3]),
      Number(br[2]) - 1,
      Number(br[1]),
      Number(br[4] || 23),
      Number(br[5] || 59),
      Number(br[6] || 59)
    ).getTime();
  }

  // yyyy-mm-dd
  const iso = texto.match(/(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (iso) {
    return new Date(
      Number(iso[1]),
      Number(iso[2]) - 1,
      Number(iso[3]),
      Number(iso[4] || 23),
      Number(iso[5] || 59),
      Number(iso[6] || 59)
    ).getTime();
  }

  const parsed = Date.parse(texto);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function extrairNumeroV108(valor) {
  const n = Number(String(valor ?? "").replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function dataDaNotaOuBoletimV108(nota) {
  if (!nota) return 0;

  const campos = [
    nota.dataNota,
    nota.data,
    nota.dataBoletim,
    nota.boletimData,
    nota.data_boletim,
    nota.criadoEm,
    nota.criadaEm,
    nota.atualizadoEm
  ];

  for (const campo of campos) {
    const ts = parseDataBoletimV108(campo);
    if (ts) return ts;
  }

  // Tenta encontrar data no texto do boletim/título
  const textoBoletim = `${nota.boletim || ""} ${nota.tituloBoletim || ""} ${nota.titulo || ""}`;
  const matchData = textoBoletim.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (matchData) {
    return parseDataBoletimV108(matchData[0]);
  }

  return 0;
}

function numeroDaNotaOuBoletimV108(nota) {
  if (!nota) return 0;

  return Math.max(
    extrairNumeroV108(nota.numero),
    extrairNumeroV108(nota.numeroNota),
    extrairNumeroV108(nota.boletim),
    extrairNumeroV108(nota.numeroBoletim),
    extrairNumeroV108(nota.id)
  );
}

function ordenarNotasPorBoletimAtualV108(a, b) {
  const dataB = dataDaNotaOuBoletimV108(b);
  const dataA = dataDaNotaOuBoletimV108(a);

  if (dataB !== dataA) return dataB - dataA;

  // Se for o mesmo dia, usa número do boletim/nota maior primeiro.
  const numeroB = numeroDaNotaOuBoletimV108(b);
  const numeroA = numeroDaNotaOuBoletimV108(a);

  if (numeroB !== numeroA) return numeroB - numeroA;

  // Fallback por ordem de inserção, se houver.
  const ordemB = Number(b?.ordemInsercao || b?.criadoEmMs || b?._ordemCriacao || 0);
  const ordemA = Number(a?.ordemInsercao || a?.criadoEmMs || a?._ordemCriacao || 0);

  return ordemB - ordemA;
}

function ordenarNotas(lista) {
  // Sobrescreve a função antiga com a ordem correta para Todas as Notas.
  return ordenarNotasPorBoletimAtualV108(...arguments);
}

function ordenarListaBoletinsNotasV108(lista) {
  if (Array.isArray(lista)) {
    lista.sort(ordenarNotasPorBoletimAtualV108);
  }
  return lista;
}

function ordenarDadosNotasPorBoletimV108() {
  try {
    if (typeof dados !== "undefined" && Array.isArray(dados.notas)) {
      ordenarListaBoletinsNotasV108(dados.notas);
    }

    if (typeof dados !== "undefined" && Array.isArray(dados.boletins)) {
      dados.boletins.sort((a, b) => {
        const dataB = parseDataBoletimV108(b?.data || b?.dataBoletim || b?.titulo);
        const dataA = parseDataBoletimV108(a?.data || a?.dataBoletim || a?.titulo);

        if (dataB !== dataA) return dataB - dataA;

        return extrairNumeroV108(b?.numero || b?.titulo) - extrairNumeroV108(a?.numero || a?.titulo);
      });
    }
  } catch {}
}

/*
  Wrapper da renderização:
  1. ordena dados.notas antes da filtragem;
  2. deixa a renderização original rodar;
  3. reforça a ordem dos cards visíveis depois.
*/
if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV108) {
  window.renderizarNotasOriginalV108 = renderizarNotas;

  renderizarNotas = function(...args) {
    ordenarDadosNotasPorBoletimV108();

    const resultado = window.renderizarNotasOriginalV108.apply(this, args);

    setTimeout(() => {
      ordenarDadosNotasPorBoletimV108();
      reordenarCardsTodasNotasV108();
    }, 0);

    return resultado;
  };
}

function extrairDataCardV108(card) {
  const texto = card?.textContent || "";
  const match = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return match ? parseDataBoletimV108(match[0]) : 0;
}

function extrairNumeroCardV108(card) {
  const texto = card?.textContent || "";

  const mNota = texto.match(/(?:Nota|N[º°o.]*)\s*(\d+)/i);
  const mBol = texto.match(/(?:Boletim|Bol\.?|BG|BI)\s*(?:n[º°.]*)?\s*(\d+)/i);

  return Math.max(
    mNota ? Number(mNota[1]) : 0,
    mBol ? Number(mBol[1]) : 0
  );
}

function reordenarCardsTodasNotasV108() {
  const containers = [
    document.getElementById("listaNotas"),
    document.getElementById("notasContainer"),
    document.querySelector(".lista-notas"),
    document.querySelector(".notas-container"),
    document.querySelector("[data-lista-notas]")
  ].filter(Boolean);

  containers.forEach(container => {
    const cards = Array.from(container.children).filter(el => {
      const texto = (el.textContent || "").trim();
      return texto && !el.classList.contains("vazio") && !texto.includes("Nenhuma nota encontrada");
    });

    if (cards.length < 2) return;

    cards.sort((a, b) => {
      const dataB = extrairDataCardV108(b);
      const dataA = extrairDataCardV108(a);

      if (dataB !== dataA) return dataB - dataA;

      return extrairNumeroCardV108(b) - extrairNumeroCardV108(a);
    });

    cards.forEach(card => container.appendChild(card));
  });
}

/*
  Ao salvar uma nota nova, força reordenação e renderização.
*/
["salvarNota", "incluirNota", "salvarNovaNota"].forEach(nomeFuncao => {
  try {
    const fn = window[nomeFuncao];
    if (typeof fn === "function" && !fn.__v108) {
      const wrapper = function(...args) {
        const resultado = fn.apply(this, args);

        setTimeout(() => {
          ordenarDadosNotasPorBoletimV108();
          try { renderizarNotas(); } catch {}
          reordenarCardsTodasNotasV108();
        }, 0);

        return resultado;
      };

      wrapper.__v108 = true;
      window[nomeFuncao] = wrapper;
    }
  } catch {}
});

document.addEventListener("DOMContentLoaded", () => {
  ordenarDadosNotasPorBoletimV108();

  setTimeout(() => {
    ordenarDadosNotasPorBoletimV108();
    try { renderizarNotas(); } catch {}
    reordenarCardsTodasNotasV108();
  }, 300);
});


/* v109 - aparência da barra superior de Todas as Notas */
function prepararBarraResumoNotasV109() {
  const contador = document.getElementById("contadorNotas");
  const seletor = document.getElementById("itensPorPagina");
  const filtroAtualEl = document.getElementById("filtroAtual");

  if (!contador && !seletor) return;

  let barra =
    document.getElementById("barraResumoNotasV109") ||
    contador?.closest(".barra-resumo-notas-v109") ||
    seletor?.closest(".barra-resumo-notas-v109");

  if (!barra) {
    barra = document.createElement("div");
    barra.id = "barraResumoNotasV109";
    barra.className = "barra-resumo-notas-v109";

    const referencia = contador || seletor;
    const pai = referencia.parentElement;
    pai.insertBefore(barra, referencia);
  }

  let esquerda = barra.querySelector(".barra-resumo-notas-esquerda");
  let direita = barra.querySelector(".barra-resumo-notas-direita");

  if (!esquerda) {
    esquerda = document.createElement("div");
    esquerda.className = "barra-resumo-notas-esquerda";
    barra.appendChild(esquerda);
  }

  if (!direita) {
    direita = document.createElement("div");
    direita.className = "barra-resumo-notas-direita";
    barra.appendChild(direita);
  }

  if (filtroAtualEl && filtroAtualEl.parentElement !== esquerda) {
    filtroAtualEl.classList.add("titulo-filtro-resumo-v109");
    esquerda.appendChild(filtroAtualEl);
  }

  if (contador && contador.parentElement !== esquerda) {
    contador.classList.add("contador-notas-v109");
    esquerda.appendChild(contador);
  }

  if (seletor) {
    const labelExistente = seletor.closest("label");

    if (labelExistente && labelExistente.parentElement !== direita) {
      labelExistente.classList.add("seletor-itens-pagina-v109");
      direita.appendChild(labelExistente);
    } else if (!labelExistente && seletor.parentElement !== direita) {
      const label = document.createElement("label");
      label.className = "seletor-itens-pagina-v109";
      label.append("Mostrar ");
      label.appendChild(seletor);
      label.append(" notas");
      direita.appendChild(label);
    }
  }

  if (contador) {
    const texto = contador.textContent || "";
    contador.textContent = texto.replace(/^Todas as notas\s*/i, "").trim();
  }
}

if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV109) {
  window.renderizarNotasOriginalV109 = renderizarNotas;

  renderizarNotas = function(...args) {
    const resultado = window.renderizarNotasOriginalV109.apply(this, args);
    setTimeout(prepararBarraResumoNotasV109, 0);
    return resultado;
  };
}

document.addEventListener("DOMContentLoaded", () => {
  prepararBarraResumoNotasV109();
  setTimeout(prepararBarraResumoNotasV109, 250);
  setTimeout(prepararBarraResumoNotasV109, 800);
});


/* v111 - filtro do menu lateral tolerante para Alteração de Praças */
function normalizarTextoFiltroV111(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ªº°]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[^\w\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function valoresNotaParaFiltroV111(nota) {
  return [
    nota?.parte,
    nota?.secao,
    nota?.seção,
    nota?.subsecao,
    nota?.subseção,
    nota?.topico,
    nota?.tópico,
    nota?.categoria,
    nota?.caminho,
    nota?.label,
    nota?.titulo
  ].map(normalizarTextoFiltroV111).filter(Boolean);
}

function valoresFiltroAtualV111() {
  if (typeof filtroAtual === "undefined" || !filtroAtual) return [];

  return [
    filtroAtual.parte,
    filtroAtual.secao,
    filtroAtual.seção,
    filtroAtual.subsecao,
    filtroAtual.subseção,
    filtroAtual.id,
    filtroAtual.label,
    filtroAtual.nome,
    filtroAtual.titulo
  ].map(normalizarTextoFiltroV111).filter(Boolean);
}

function correspondeFiltroV111(nota) {
  const filtros = valoresFiltroAtualV111();

  if (!filtros.length) return true;

  // "todas" / vazio não filtra.
  if (filtros.some(f => f === "todas" || f === "todas as notas" || f === "todos")) {
    return true;
  }

  const valoresNota = valoresNotaParaFiltroV111(nota);

  // Caso específico: Alteração de Praças deve bater com variações.
  const filtroAlteracaoPracas = filtros.some(f =>
    f.includes("alteracao de pracas") ||
    f.includes("alteracoes de pracas") ||
    f.includes("alteracao pracas") ||
    f.includes("alteracoes pracas")
  );

  if (filtroAlteracaoPracas) {
    return valoresNota.some(v =>
      v.includes("alteracao de pracas") ||
      v.includes("alteracoes de pracas") ||
      v.includes("alteracao pracas") ||
      v.includes("alteracoes pracas")
    );
  }

  return filtros.some(filtro => {
    return valoresNota.some(valor => {
      return valor === filtro ||
             valor.includes(filtro) ||
             filtro.includes(valor);
    });
  });
}

if (typeof pertenceAoFiltro === "function" && !window.pertenceAoFiltroOriginalV111) {
  window.pertenceAoFiltroOriginalV111 = pertenceAoFiltro;

  pertenceAoFiltro = function(nota) {
    try {
      // Se o filtro novo bater, libera.
      if (correspondeFiltroV111(nota)) return true;

      // Se não bater, tenta a regra original para não quebrar outros tópicos.
      return window.pertenceAoFiltroOriginalV111(nota);
    } catch {
      return window.pertenceAoFiltroOriginalV111(nota);
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    try { renderizarNotas(); } catch {}
  }, 200);
});


/* v112 - filtros gerais do menu lateral para Partes, Seções e Subseções */
function normalizarFiltroLateralV112(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ªº°]/g, "")
    .replace(/[–—]/g, "-")
    .replace(/[^\w\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function limparPrefixosHierarquiaV112(valor) {
  let texto = normalizarFiltroLateralV112(valor);

  // Remove prefixos como "1a Parte -", "2ª Parte -", "I -", "II -", etc.
  texto = texto
    .replace(/^\d+\s*a?\s*parte\s*[-–—:]?\s*/i, "")
    .replace(/^\d+\s*parte\s*[-–—:]?\s*/i, "")
    .replace(/^[ivxlcdm]+\s*[-–—.:]\s*/i, "")
    .replace(/^\d+\s*[-–—.:]\s*/i, "")
    .replace(/\s+/g, " ")
    .trim();

  return texto;
}

function camposNotaHierarquiaV112(nota) {
  return {
    parte: normalizarFiltroLateralV112(nota?.parte),
    secao: normalizarFiltroLateralV112(nota?.secao || nota?.seção),
    subsecao: normalizarFiltroLateralV112(nota?.subsecao || nota?.subseção),
    parteLimpa: limparPrefixosHierarquiaV112(nota?.parte),
    secaoLimpa: limparPrefixosHierarquiaV112(nota?.secao || nota?.seção),
    subsecaoLimpa: limparPrefixosHierarquiaV112(nota?.subsecao || nota?.subseção)
  };
}

function camposFiltroHierarquiaV112() {
  if (typeof filtroAtual === "undefined" || !filtroAtual) {
    return { parte: "", secao: "", subsecao: "", parteLimpa: "", secaoLimpa: "", subsecaoLimpa: "" };
  }

  return {
    parte: normalizarFiltroLateralV112(filtroAtual.parte),
    secao: normalizarFiltroLateralV112(filtroAtual.secao || filtroAtual.seção),
    subsecao: normalizarFiltroLateralV112(filtroAtual.subsecao || filtroAtual.subseção),
    parteLimpa: limparPrefixosHierarquiaV112(filtroAtual.parte),
    secaoLimpa: limparPrefixosHierarquiaV112(filtroAtual.secao || filtroAtual.seção),
    subsecaoLimpa: limparPrefixosHierarquiaV112(filtroAtual.subsecao || filtroAtual.subseção),
    id: normalizarFiltroLateralV112(filtroAtual.id),
    label: normalizarFiltroLateralV112(filtroAtual.label)
  };
}

function textosEquivalentesV112(a, b) {
  const x = normalizarFiltroLateralV112(a);
  const y = normalizarFiltroLateralV112(b);

  if (!x || !y) return true;
  if (x === y) return true;

  const xl = limparPrefixosHierarquiaV112(x);
  const yl = limparPrefixosHierarquiaV112(y);

  if (xl && yl && xl === yl) return true;

  // Permite pequenas diferenças, desde que um lado contenha o outro.
  // Ex.: "alteracao de pracas" vs "3a parte alteracao de pracas"
  if (x.includes(y) || y.includes(x)) return true;
  if (xl && yl && (xl.includes(yl) || yl.includes(xl))) return true;

  return false;
}

function pertenceAoFiltroV112(nota) {
  if (typeof filtroAtual === "undefined" || !filtroAtual) return true;

  // Todas as notas não filtra.
  if (!filtroAtual.parte || filtroAtual.id === "todas") return true;

  const notaCampos = camposNotaHierarquiaV112(nota);
  const filtroCampos = camposFiltroHierarquiaV112();

  // Parte obrigatória quando o filtro possui parte.
  if (filtroAtual.parte && !textosEquivalentesV112(notaCampos.parte, filtroCampos.parte)) {
    return false;
  }

  // Seção obrigatória quando o filtro possui seção.
  if ((filtroAtual.secao || filtroAtual.seção) && !textosEquivalentesV112(notaCampos.secao, filtroCampos.secao)) {
    return false;
  }

  // Subseção obrigatória quando o filtro possui subseção.
  if ((filtroAtual.subsecao || filtroAtual.subseção) && !textosEquivalentesV112(notaCampos.subsecao, filtroCampos.subsecao)) {
    return false;
  }

  return true;
}

// Sobrescreve a função antiga de filtro, que comparava os textos exatamente.
if (typeof pertenceAoFiltro === "function" && !window.pertenceAoFiltroOriginalV112) {
  window.pertenceAoFiltroOriginalV112 = pertenceAoFiltro;

  pertenceAoFiltro = function(nota) {
    return pertenceAoFiltroV112(nota);
  };
}

/*
  Reforço: quando clicar em item do menu lateral, renderiza novamente
  usando a função nova de filtro.
*/
function reforcarCliquesMenuLateralV112() {
  document.querySelectorAll(".menu button, .menu-rodape button").forEach(btn => {
    if (btn.dataset.filtroV112 === "1") return;
    btn.dataset.filtroV112 = "1";

    btn.addEventListener("click", () => {
      setTimeout(() => {
        try { renderizarNotas(); } catch {}
      }, 0);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  reforcarCliquesMenuLateralV112();

  setTimeout(() => {
    reforcarCliquesMenuLateralV112();
    try { renderizarNotas(); } catch {}
  }, 300);
});


/* v131 - ordenação das notas: data desc; dentro da data, inclusão mais recente em cima */
function parseDataNotaV131(valor) {
  if (!valor) return 0;

  const texto = String(valor).trim();

  const br = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (br) {
    return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]), 23, 59, 59).getTime();
  }

  const iso = texto.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]), 23, 59, 59).getTime();
  }

  const parsed = Date.parse(texto);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function obterDataOrdenacaoNotaV131(nota) {
  return Math.max(
    parseDataNotaV131(nota?.data),
    parseDataNotaV131(nota?.dataNota),
    parseDataNotaV131(nota?.dataBoletim),
    parseDataNotaV131(nota?.boletimData)
  );
}

function obterOrdemInclusaoV131(nota, fallback = 0) {
  const candidatos = [
    nota?.ordemInclusao,
    nota?.ordemInsercao,
    nota?.criadoEmMs,
    nota?.dataInsercaoMs,
    nota?._criadoEmMs,
    nota?._ordemCriacao,
    nota?.timestampCriacao,
    nota?.id,
    nota?.numeroNota,
    nota?.numero
  ];

  for (const valor of candidatos) {
    const n = Number(String(valor ?? "").replace(/\D/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }

  return fallback;
}

function garantirOrdemInclusaoV131(lista) {
  if (!Array.isArray(lista)) return lista;

  const base = Date.now() - lista.length - 10;

  lista.forEach((nota, index) => {
    if (!nota || typeof nota !== "object") return;

    const temOrdem =
      Number(nota.ordemInclusao || nota.ordemInsercao || nota.criadoEmMs || nota._ordemCriacao || 0) > 0;

    if (!temOrdem) {
      nota.ordemInclusao = base + index;
    }
  });

  return lista;
}

function compararNotasDataDepoisInclusaoV131(a, b) {
  const dataB = obterDataOrdenacaoNotaV131(b);
  const dataA = obterDataOrdenacaoNotaV131(a);

  if (dataB !== dataA) return dataB - dataA;

  const ordemB = obterOrdemInclusaoV131(b);
  const ordemA = obterOrdemInclusaoV131(a);

  if (ordemB !== ordemA) return ordemB - ordemA;

  return 0;
}

function ordenarNotasDataDepoisInclusaoV131(lista) {
  if (!Array.isArray(lista)) return lista;

  garantirOrdemInclusaoV131(lista);
  lista.sort(compararNotasDataDepoisInclusaoV131);
  return lista;
}

function ordenarNotas(a, b) {
  return compararNotasDataDepoisInclusaoV131(a, b);
}

function ordenarDadosNotasV131() {
  try {
    if (typeof dados !== "undefined" && Array.isArray(dados.notas)) {
      ordenarNotasDataDepoisInclusaoV131(dados.notas);
    }
  } catch {}
}

function interceptarInclusaoNotasV131() {
  try {
    if (typeof dados === "undefined" || !Array.isArray(dados.notas) || dados.notas.__v131) return;

    Object.defineProperty(dados.notas, "__v131", {
      value: true,
      enumerable: false
    });

    const pushOriginal = dados.notas.push;
    dados.notas.push = function(...items) {
      items.forEach(item => {
        if (item && typeof item === "object") {
          item.ordemInclusao = Date.now();
        }
      });

      const resultado = pushOriginal.apply(this, items);
      ordenarNotasDataDepoisInclusaoV131(this);
      return resultado;
    };

    const unshiftOriginal = dados.notas.unshift;
    dados.notas.unshift = function(...items) {
      items.forEach(item => {
        if (item && typeof item === "object") {
          item.ordemInclusao = Date.now();
        }
      });

      const resultado = unshiftOriginal.apply(this, items);
      ordenarNotasDataDepoisInclusaoV131(this);
      return resultado;
    };
  } catch {}
}

if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV131) {
  window.renderizarNotasOriginalV131 = renderizarNotas;

  renderizarNotas = function(...args) {
    ordenarDadosNotasV131();
    interceptarInclusaoNotasV131();

    const resultado = window.renderizarNotasOriginalV131.apply(this, args);

    setTimeout(() => {
      ordenarDadosNotasV131();
    }, 0);

    return resultado;
  };
}

["salvarNota", "incluirNota", "salvarNovaNota"].forEach(nome => {
  try {
    const fn = window[nome];

    if (typeof fn === "function" && !fn.__v131) {
      const wrapper = function(...args) {
        const resultado = fn.apply(this, args);

        setTimeout(() => {
          ordenarDadosNotasV131();
          try { renderizarNotas(); } catch {}
        }, 0);

        return resultado;
      };

      wrapper.__v131 = true;
      window[nome] = wrapper;
    }
  } catch {}
});

document.addEventListener("DOMContentLoaded", () => {
  ordenarDadosNotasV131();
  interceptarInclusaoNotasV131();

  setTimeout(() => {
    ordenarDadosNotasV131();
    try { renderizarNotas(); } catch {}
  }, 300);
});


/* v137 - botão Todas as notas para limpar filtros e exibir tudo */
function voltarParaTodasAsNotasV137() {
  try {
    filtroAtual = { parte: "", secao: "", subsecao: "", label: "Todas as notas", id: "todas" };
  } catch {}

  try { boletimSelecionado = ""; } catch {}
  try { dataNotaSelecionadaCalendario = ""; } catch {}
  try { paginaAtual = 1; } catch {}
  try { modoPagina = "boletim"; } catch {}

  const busca = document.getElementById("buscaNotas");
  if (busca) {
    busca.value = "";
    try { termoBusca = ""; } catch {}
    busca.dispatchEvent(new Event("input", { bubbles: true }));
    busca.dispatchEvent(new Event("change", { bubbles: true }));
  }

  document.querySelectorAll(".menu button, .menu-rodape button").forEach(btn => {
    btn.classList.remove("ativo");
  });

  const btnTodasMenu = document.querySelector('.menu button[data-id="todas"], .menu-rodape button[data-id="todas"]');
  if (btnTodasMenu) btnTodasMenu.classList.add("ativo");

  const titulo = document.getElementById("tituloPagina");
  if (titulo) titulo.textContent = "Boletim Digital";

  try {
    const painelCalendario = document.getElementById("painelCalendario");
    if (painelCalendario) painelCalendario.classList.add("escondido");
  } catch {}

  try {
    mostrarBoletim();
  } catch {}

  try {
    renderizarNotas();
  } catch {}

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function criarBotaoTodasAsNotasV137() {
  if (document.getElementById("btnTodasNotasTopoV137")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btnTodasNotasTopoV137";
  btn.className = "btn-todas-notas-topo-v137";
  btn.textContent = "Todas as notas";
  btn.title = "Limpar filtros e exibir todas as notas";

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    voltarParaTodasAsNotasV137();
  });

  // Local mais intuitivo: junto dos botões superiores, perto de Imprimir/Incluir/Calendário.
  const btnImprimir = document.getElementById("btnImprimir");
  const btnIncluir = document.getElementById("btnNovaNota") || document.getElementById("btnIncluirNota");
  const btnCalendario = document.getElementById("btnCalendario");

  if (btnImprimir?.parentElement) {
    btnImprimir.parentElement.insertBefore(btn, btnImprimir);
    return;
  }

  if (btnIncluir?.parentElement) {
    btnIncluir.parentElement.insertBefore(btn, btnIncluir);
    return;
  }

  if (btnCalendario?.parentElement) {
    btnCalendario.parentElement.insertBefore(btn, btnCalendario);
    return;
  }

  const topo = document.querySelector(".topo-acoes, .acoes-topo, .header-actions, .cabecalho-acoes, header");
  if (topo) {
    topo.appendChild(btn);
    return;
  }

  const container = document.querySelector("main") || document.body;
  container.insertBefore(btn, container.firstChild);
}

document.addEventListener("DOMContentLoaded", () => {
  criarBotaoTodasAsNotasV137();
  setTimeout(criarBotaoTodasAsNotasV137, 300);
  setTimeout(criarBotaoTodasAsNotasV137, 900);
});


/* v159 - Sistema de favoritos de notas */
let filtroFavoritosAtivoV159 = false;

function obterNotaPorIdV159(id) {
  try {
    return (dados.notas || []).find(n => String(n.id) === String(id));
  } catch {
    return null;
  }
}

function salvarDadosFavoritosV159() {
  try {
    if (typeof salvarDados === "function") {
      salvarDados();
      return;
    }
  } catch {}

  try {
    if (typeof salvarNoLocalStorage === "function") {
      salvarNoLocalStorage();
      return;
    }
  } catch {}

  try {
    localStorage.setItem("boletimDigitalDados", JSON.stringify(dados));
  } catch {}
}

function alternarFavoritoNotaV159(id) {
  const nota = obterNotaPorIdV159(id);
  if (!nota) return;

  nota.favorita = !Boolean(nota.favorita);

  salvarDadosFavoritosV159();

  try { renderizarNotas(); } catch {}
  setTimeout(aplicarFavoritosNaListaV159, 0);
}

function notaEstaFavoritaV159(nota) {
  return Boolean(nota?.favorita || nota?.favorito || nota?.favoritada);
}

function aplicarFiltroFavoritosListaV159(lista) {
  if (!filtroFavoritosAtivoV159 || !Array.isArray(lista)) return lista;
  return lista.filter(notaEstaFavoritaV159);
}

function criarBotaoFavoritoCardV159(nota) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn-favorito-nota-v159";
  btn.dataset.idNota = String(nota.id);
  btn.title = notaEstaFavoritaV159(nota) ? "Remover dos favoritos" : "Adicionar aos favoritos";
  btn.setAttribute("aria-label", btn.title);
  btn.innerHTML = notaEstaFavoritaV159(nota) ? "★" : "☆";

  if (notaEstaFavoritaV159(nota)) {
    btn.classList.add("favorita");
  }

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    alternarFavoritoNotaV159(nota.id);
  });

  return btn;
}

function obterIdNotaDoCardV159(card) {
  if (!card) return "";

  const dataIds = [
    card.dataset?.id,
    card.dataset?.notaId,
    card.dataset?.idNota,
    card.getAttribute("data-id"),
    card.getAttribute("data-nota-id"),
    card.getAttribute("data-id-nota")
  ].filter(Boolean);

  if (dataIds.length) return dataIds[0];

  const btnEditar = card.querySelector("[onclick*='editarNota'], [onclick*='imprimirNotaUnica'], [onclick*='excluirNota']");
  const onclick = btnEditar?.getAttribute("onclick") || "";
  const match = onclick.match(/['"]?([a-zA-Z0-9_-]{6,})['"]?/);
  if (match) return match[1];

  return "";
}

function localizarNotaDoCardV159(card) {
  const id = obterIdNotaDoCardV159(card);
  if (id) {
    const nota = obterNotaPorIdV159(id);
    if (nota) return nota;
  }

  // fallback por título e data, se o card não possuir ID no HTML
  const texto = (card?.textContent || "").toLowerCase();
  try {
    return (dados.notas || []).find(nota => {
      const titulo = String(nota.titulo || "").toLowerCase();
      const data = String(nota.data || "").toLowerCase();
      return titulo && texto.includes(titulo) && (!data || texto.includes(data));
    }) || null;
  } catch {
    return null;
  }
}

function aplicarFavoritosNaListaV159() {
  const containers = [
    document.getElementById("listaNotas"),
    document.getElementById("notasContainer"),
    document.querySelector(".lista-notas"),
    document.querySelector(".notas-container"),
    document.querySelector("[data-lista-notas]")
  ].filter(Boolean);

  containers.forEach(container => {
    const cards = Array.from(container.children).filter(el => {
      const texto = (el.textContent || "").trim();
      return texto && !texto.includes("Nenhuma nota encontrada");
    });

    cards.forEach(card => {
      const nota = localizarNotaDoCardV159(card);
      if (!nota || !nota.id) return;

      card.classList.add("card-com-favorito-v159");
      card.dataset.idNota = String(nota.id);

      let btn = card.querySelector(".btn-favorito-nota-v159");
      if (!btn) {
        btn = criarBotaoFavoritoCardV159(nota);
        card.appendChild(btn);
      } else {
        btn.dataset.idNota = String(nota.id);
        btn.innerHTML = notaEstaFavoritaV159(nota) ? "★" : "☆";
        btn.classList.toggle("favorita", notaEstaFavoritaV159(nota));
        btn.title = notaEstaFavoritaV159(nota) ? "Remover dos favoritos" : "Adicionar aos favoritos";
      }

      if (filtroFavoritosAtivoV159 && !notaEstaFavoritaV159(nota)) {
        card.style.display = "none";
      } else {
        card.style.display = "";
      }
    });
  });

  atualizarBotaoFavoritosV159();
}

function ativarFiltroFavoritosV159() {
  filtroFavoritosAtivoV159 = true;

  try { paginaAtual = 1; } catch {}

  const busca = document.getElementById("buscaNotas");
  if (busca) {
    busca.value = "";
    try { termoBusca = ""; } catch {}
  }

  try { renderizarNotas(); } catch {}
  setTimeout(aplicarFavoritosNaListaV159, 0);
}

function desativarFiltroFavoritosV159() {
  filtroFavoritosAtivoV159 = false;
  try { paginaAtual = 1; } catch {}

  try { renderizarNotas(); } catch {}
  setTimeout(aplicarFavoritosNaListaV159, 0);
}

function atualizarBotaoFavoritosV159() {
  const btn = document.getElementById("btnFavoritosNotasV159");
  if (!btn) return;

  btn.classList.toggle("ativo", filtroFavoritosAtivoV159);

  const total = (() => {
    try {
      return (dados.notas || []).filter(notaEstaFavoritaV159).length;
    } catch {
      return 0;
    }
  })();

  btn.textContent = filtroFavoritosAtivoV159 ? `Favoritos (${total})` : `Favoritos`;
  btn.title = `Exibir notas favoritadas (${total})`;
}

function criarBotaoFavoritosV159() {
  if (document.getElementById("btnFavoritosNotasV159")) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "btnFavoritosNotasV159";
  btn.className = "btn-favoritos-notas-v159";
  btn.textContent = "Favoritos";
  btn.title = "Exibir notas favoritadas";

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    if (filtroFavoritosAtivoV159) {
      desativarFiltroFavoritosV159();
    } else {
      ativarFiltroFavoritosV159();
    }
  });

  const btnTodas = document.getElementById("btnTodasNotasTopoV137");
  if (btnTodas?.parentElement) {
    btnTodas.insertAdjacentElement("afterend", btn);
    return;
  }

  const btnImprimir = document.getElementById("btnImprimir");
  if (btnImprimir?.parentElement) {
    btnImprimir.parentElement.insertBefore(btn, btnImprimir);
    return;
  }

  const topo = document.querySelector(".topo-acoes, .acoes-topo, .header-actions, .cabecalho-acoes, header");
  if (topo) {
    topo.appendChild(btn);
    return;
  }

  document.body.insertBefore(btn, document.body.firstChild);
}

// Wrapper para aplicar filtro antes de renderizar, quando possível.
if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV159) {
  window.renderizarNotasOriginalV159 = renderizarNotas;

  renderizarNotas = function(...args) {
    const resultado = window.renderizarNotasOriginalV159.apply(this, args);
    setTimeout(aplicarFavoritosNaListaV159, 0);
    return resultado;
  };
}

// Intercepta função Todas as notas para limpar também Favoritos.
if (typeof voltarParaTodasAsNotasV137 === "function" && !window.voltarParaTodasAsNotasOriginalV159) {
  window.voltarParaTodasAsNotasOriginalV159 = voltarParaTodasAsNotasV137;

  voltarParaTodasAsNotasV137 = function(...args) {
    filtroFavoritosAtivoV159 = false;
    const resultado = window.voltarParaTodasAsNotasOriginalV159.apply(this, args);
    setTimeout(aplicarFavoritosNaListaV159, 0);
    return resultado;
  };
}

document.addEventListener("DOMContentLoaded", () => {
  criarBotaoFavoritosV159();
  setTimeout(() => {
    criarBotaoFavoritosV159();
    aplicarFavoritosNaListaV159();
  }, 300);
  setTimeout(() => {
    criarBotaoFavoritosV159();
    aplicarFavoritosNaListaV159();
  }, 1000);
});


/* v160 - Favoritos por militar/usuário, sem alterar a nota original */
function obterIdentificadorUsuarioFavoritosV160() {
  const candidatos = [];

  try { candidatos.push(usuarioAtual?.rg); } catch {}
  try { candidatos.push(usuarioAtual?.id); } catch {}
  try { candidatos.push(usuarioAtual?.email); } catch {}
  try { candidatos.push(usuarioLogado?.rg); } catch {}
  try { candidatos.push(usuarioLogado?.id); } catch {}
  try { candidatos.push(usuarioLogado?.email); } catch {}
  try { candidatos.push(dados?.usuarioAtual?.rg); } catch {}
  try { candidatos.push(dados?.usuarioAtual?.id); } catch {}
  try { candidatos.push(dados?.usuarioAtual?.email); } catch {}

  const encontrado = candidatos
    .map(v => String(v || "").trim())
    .find(Boolean);

  // Se o projeto ainda não tiver login/identificação de militar,
  // usa um perfil local do navegador. Assim já fica individual por computador/navegador.
  if (encontrado) return encontrado;

  let idLocal = localStorage.getItem("boletimDigitalUsuarioLocalFavoritos");
  if (!idLocal) {
    idLocal = "local-" + (crypto?.randomUUID?.() || String(Date.now()) + "-" + Math.random().toString(16).slice(2));
    localStorage.setItem("boletimDigitalUsuarioLocalFavoritos", idLocal);
  }

  return idLocal;
}

function garantirEstruturaFavoritosPorUsuarioV160() {
  if (!dados.favoritosPorUsuario || typeof dados.favoritosPorUsuario !== "object" || Array.isArray(dados.favoritosPorUsuario)) {
    dados.favoritosPorUsuario = {};
  }

  const usuario = obterIdentificadorUsuarioFavoritosV160();

  if (!Array.isArray(dados.favoritosPorUsuario[usuario])) {
    dados.favoritosPorUsuario[usuario] = [];
  }

  return dados.favoritosPorUsuario[usuario];
}

function obterListaFavoritosUsuarioV160() {
  return garantirEstruturaFavoritosPorUsuarioV160();
}

function notaEstaFavoritaUsuarioV160(nota) {
  if (!nota?.id) return false;

  const lista = obterListaFavoritosUsuarioV160();
  return lista.map(String).includes(String(nota.id));
}

function alternarFavoritoNotaUsuarioV160(id) {
  if (!id) return;

  const lista = obterListaFavoritosUsuarioV160();
  const idTexto = String(id);
  const idx = lista.map(String).indexOf(idTexto);

  if (idx >= 0) {
    lista.splice(idx, 1);
  } else {
    lista.push(idTexto);
  }

  // Remove o campo global antigo, se existir, para evitar favorito compartilhado.
  const nota = obterNotaPorIdV159?.(id) || (dados.notas || []).find(n => String(n.id) === idTexto);
  if (nota) {
    delete nota.favorita;
    delete nota.favorito;
    delete nota.favoritada;
  }

  salvarDadosFavoritosV159?.();

  try { renderizarNotas(); } catch {}
  setTimeout(aplicarFavoritosNaListaV159, 0);
}

function migrarFavoritosGlobaisParaUsuarioV160() {
  const lista = obterListaFavoritosUsuarioV160();
  const existentes = new Set(lista.map(String));

  try {
    (dados.notas || []).forEach(nota => {
      if (!nota?.id) return;

      if (nota.favorita || nota.favorito || nota.favoritada) {
        const id = String(nota.id);
        if (!existentes.has(id)) {
          lista.push(id);
          existentes.add(id);
        }

        // Remove favorito global da nota.
        delete nota.favorita;
        delete nota.favorito;
        delete nota.favoritada;
      }
    });
  } catch {}

  salvarDadosFavoritosV159?.();
}

// Sobrescreve as funções da v159 para deixarem de usar favorito global.
notaEstaFavoritaV159 = function(nota) {
  return notaEstaFavoritaUsuarioV160(nota);
};

alternarFavoritoNotaV159 = function(id) {
  alternarFavoritoNotaUsuarioV160(id);
};

aplicarFiltroFavoritosListaV159 = function(lista) {
  if (!filtroFavoritosAtivoV159 || !Array.isArray(lista)) return lista;
  return lista.filter(notaEstaFavoritaUsuarioV160);
};

function atualizarIndicacaoFavoritosUsuarioV160() {
  const btn = document.getElementById("btnFavoritosNotasV159");
  if (!btn) return;

  const total = obterListaFavoritosUsuarioV160().length;
  btn.classList.toggle("ativo", Boolean(filtroFavoritosAtivoV159));
  btn.textContent = filtroFavoritosAtivoV159 ? `Favoritos (${total})` : "Favoritos";
  btn.title = `Exibir minhas notas favoritadas (${total})`;
}

if (typeof atualizarBotaoFavoritosV159 === "function" && !window.atualizarBotaoFavoritosOriginalV160) {
  window.atualizarBotaoFavoritosOriginalV160 = atualizarBotaoFavoritosV159;

  atualizarBotaoFavoritosV159 = function(...args) {
    const resultado = window.atualizarBotaoFavoritosOriginalV160.apply(this, args);
    atualizarIndicacaoFavoritosUsuarioV160();
    return resultado;
  };
}

if (typeof aplicarFavoritosNaListaV159 === "function" && !window.aplicarFavoritosNaListaOriginalV160) {
  window.aplicarFavoritosNaListaOriginalV160 = aplicarFavoritosNaListaV159;

  aplicarFavoritosNaListaV159 = function(...args) {
    migrarFavoritosGlobaisParaUsuarioV160();

    const resultado = window.aplicarFavoritosNaListaOriginalV160.apply(this, args);

    // Garante que estrelas e filtro usem a lista do usuário atual.
    document.querySelectorAll(".btn-favorito-nota-v159").forEach(btn => {
      const id = btn.dataset.idNota;
      const nota = (dados.notas || []).find(n => String(n.id) === String(id));
      const fav = notaEstaFavoritaUsuarioV160(nota);

      btn.innerHTML = fav ? "★" : "☆";
      btn.classList.toggle("favorita", fav);
      btn.title = fav ? "Remover dos meus favoritos" : "Adicionar aos meus favoritos";
      btn.setAttribute("aria-label", btn.title);
    });

    if (filtroFavoritosAtivoV159) {
      document.querySelectorAll("#listaNotas > article, #listaNotas > .nota, #listaNotas > *").forEach(card => {
        if (card.classList.contains("vazio")) return;
        const id = card.dataset?.idNota || card.id;
        const nota = (dados.notas || []).find(n => String(n.id) === String(id));
        if (nota && !notaEstaFavoritaUsuarioV160(nota)) {
          card.style.display = "none";
        }
      });
    }

    atualizarIndicacaoFavoritosUsuarioV160();
    return resultado;
  };
}

document.addEventListener("DOMContentLoaded", () => {
  migrarFavoritosGlobaisParaUsuarioV160();

  setTimeout(() => {
    migrarFavoritosGlobaisParaUsuarioV160();
    try { aplicarFavoritosNaListaV159(); } catch {}
  }, 500);
});


/* v161 - Favoritos 100% individuais por usuário/localStorage + estrela sem sobrepor o + */

/*
  Correção:
  - Não salva favoritos dentro de dados compartilhados.
  - Não usa dados.favoritosPorUsuario, pois isso vai junto no export/import e vira compartilhado.
  - Usa localStorage separado por usuário/militar/navegador.
*/

function obterIdentificadorUsuarioFavoritosV161() {
  const candidatos = [];

  try { candidatos.push(window.usuarioAtual?.rg); } catch {}
  try { candidatos.push(window.usuarioAtual?.id); } catch {}
  try { candidatos.push(window.usuarioAtual?.email); } catch {}
  try { candidatos.push(window.usuarioAtual?.nome); } catch {}

  try { candidatos.push(window.usuarioLogado?.rg); } catch {}
  try { candidatos.push(window.usuarioLogado?.id); } catch {}
  try { candidatos.push(window.usuarioLogado?.email); } catch {}
  try { candidatos.push(window.usuarioLogado?.nome); } catch {}

  try { candidatos.push(window.usuario?.rg); } catch {}
  try { candidatos.push(window.usuario?.id); } catch {}
  try { candidatos.push(window.usuario?.email); } catch {}
  try { candidatos.push(window.usuario?.nome); } catch {}

  try { candidatos.push(window.militarAtual?.rg); } catch {}
  try { candidatos.push(window.militarAtual?.id); } catch {}
  try { candidatos.push(window.militarAtual?.email); } catch {}
  try { candidatos.push(window.militarAtual?.nome); } catch {}

  try { candidatos.push(localStorage.getItem("boletimDigitalUsuarioAtual")); } catch {}
  try { candidatos.push(localStorage.getItem("usuarioAtual")); } catch {}
  try { candidatos.push(localStorage.getItem("usuarioLogado")); } catch {}
  try { candidatos.push(sessionStorage.getItem("boletimDigitalUsuarioAtual")); } catch {}

  const bruto = candidatos
    .map(v => {
      if (!v) return "";
      if (typeof v === "object") {
        return v.rg || v.id || v.email || v.nome || JSON.stringify(v);
      }
      return String(v);
    })
    .map(v => v.trim())
    .find(Boolean);

  if (bruto) {
    return bruto
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w@.-]+/g, "_")
      .toLowerCase();
  }

  // Sem login: favoritos ficam próprios daquele navegador.
  let idLocal = localStorage.getItem("boletimDigitalFavoritosUsuarioLocalV161");
  if (!idLocal) {
    idLocal = "local-" + (crypto?.randomUUID?.() || (Date.now() + "-" + Math.random().toString(16).slice(2)));
    localStorage.setItem("boletimDigitalFavoritosUsuarioLocalV161", idLocal);
  }
  return idLocal;
}

function chaveFavoritosUsuarioV161() {
  return "boletimDigitalFavoritosNotas__" + obterIdentificadorUsuarioFavoritosV161();
}

function obterListaFavoritosUsuarioV161() {
  try {
    const raw = localStorage.getItem(chaveFavoritosUsuarioV161());
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista.map(String) : [];
  } catch {
    return [];
  }
}

function salvarListaFavoritosUsuarioV161(lista) {
  try {
    const unica = Array.from(new Set((lista || []).map(String).filter(Boolean)));
    localStorage.setItem(chaveFavoritosUsuarioV161(), JSON.stringify(unica));
  } catch {}
}

function removerFavoritosCompartilhadosV161() {
  // Remove campos globais que causavam favorito para todos.
  try {
    (dados.notas || []).forEach(nota => {
      if (!nota || typeof nota !== "object") return;
      delete nota.favorita;
      delete nota.favorito;
      delete nota.favoritada;
    });
  } catch {}

  // Remove estrutura compartilhada criada na v160, se existir.
  try {
    if (dados && dados.favoritosPorUsuario) {
      delete dados.favoritosPorUsuario;
    }
  } catch {}
}

function notaEstaFavoritaUsuarioV161(nota) {
  if (!nota?.id) return false;
  return obterListaFavoritosUsuarioV161().includes(String(nota.id));
}

function alternarFavoritoNotaUsuarioV161(id) {
  if (!id) return;

  removerFavoritosCompartilhadosV161();

  const idTexto = String(id);
  const lista = obterListaFavoritosUsuarioV161();
  const idx = lista.indexOf(idTexto);

  if (idx >= 0) {
    lista.splice(idx, 1);
  } else {
    lista.push(idTexto);
  }

  salvarListaFavoritosUsuarioV161(lista);

  try { renderizarNotas(); } catch {}
  setTimeout(aplicarFavoritosNaListaV159, 0);
}

function totalFavoritosUsuarioV161() {
  return obterListaFavoritosUsuarioV161().length;
}

/* Sobrescreve o comportamento das versões anteriores */
notaEstaFavoritaV159 = function(nota) {
  return notaEstaFavoritaUsuarioV161(nota);
};

alternarFavoritoNotaV159 = function(id) {
  alternarFavoritoNotaUsuarioV161(id);
};

if (typeof notaEstaFavoritaUsuarioV160 === "function") {
  notaEstaFavoritaUsuarioV160 = notaEstaFavoritaUsuarioV161;
}

if (typeof alternarFavoritoNotaUsuarioV160 === "function") {
  alternarFavoritoNotaUsuarioV160 = alternarFavoritoNotaUsuarioV161;
}

if (typeof obterListaFavoritosUsuarioV160 === "function") {
  obterListaFavoritosUsuarioV160 = obterListaFavoritosUsuarioV161;
}

function atualizarBotaoFavoritosV161() {
  const btn = document.getElementById("btnFavoritosNotasV159");
  if (!btn) return;

  const total = totalFavoritosUsuarioV161();
  btn.classList.toggle("ativo", Boolean(filtroFavoritosAtivoV159));
  btn.textContent = filtroFavoritosAtivoV159 ? `Favoritos (${total})` : "Favoritos";
  btn.title = `Exibir minhas notas favoritadas (${total})`;
}

if (typeof atualizarBotaoFavoritosV159 === "function" && !window.atualizarBotaoFavoritosOriginalV161) {
  window.atualizarBotaoFavoritosOriginalV161 = atualizarBotaoFavoritosV159;

  atualizarBotaoFavoritosV159 = function(...args) {
    const resultado = window.atualizarBotaoFavoritosOriginalV161.apply(this, args);
    atualizarBotaoFavoritosV161();
    return resultado;
  };
}

if (typeof aplicarFavoritosNaListaV159 === "function" && !window.aplicarFavoritosNaListaOriginalV161) {
  window.aplicarFavoritosNaListaOriginalV161 = aplicarFavoritosNaListaV159;

  aplicarFavoritosNaListaV159 = function(...args) {
    removerFavoritosCompartilhadosV161();

    const resultado = window.aplicarFavoritosNaListaOriginalV161.apply(this, args);

    const listaUsuario = obterListaFavoritosUsuarioV161();

    document.querySelectorAll(".btn-favorito-nota-v159").forEach(btn => {
      const id = btn.dataset.idNota;
      const fav = listaUsuario.includes(String(id));

      btn.innerHTML = fav ? "★" : "☆";
      btn.classList.toggle("favorita", fav);
      btn.title = fav ? "Remover dos meus favoritos" : "Adicionar aos meus favoritos";
      btn.setAttribute("aria-label", btn.title);
    });

    if (filtroFavoritosAtivoV159) {
      document.querySelectorAll("#listaNotas > article, #listaNotas > .nota, #listaNotas > *").forEach(card => {
        if (card.classList.contains("vazio")) return;

        const id = card.dataset?.idNota || card.id;
        if (!id) return;

        if (!listaUsuario.includes(String(id))) {
          card.style.display = "none";
        }
      });
    }

    atualizarBotaoFavoritosV161();
    return resultado;
  };
}

/* Evita que qualquer salvamento leve favoritos compartilhados para export/import */
if (typeof salvarDadosFavoritosV159 === "function") {
  salvarDadosFavoritosV159 = function() {
    removerFavoritosCompartilhadosV161();

    // Não salva favorito em dados compartilhados.
    try {
      if (typeof salvarDados === "function") {
        salvarDados();
      } else if (typeof salvarNoLocalStorage === "function") {
        salvarNoLocalStorage();
      }
    } catch {}
  };
}

/* Ajusta posição: estrela fica antes do +, sem sobrepor */
function reposicionarEstrelasFavoritosV161() {
  document.querySelectorAll("#listaNotas article.nota, #listaNotas .nota").forEach(article => {
    const tituloBtn = article.querySelector(".titulo-nota");
    const estrela = article.querySelector(".btn-favorito-nota-v159");
    const iconeMais = tituloBtn?.querySelector(".icone");

    if (!tituloBtn || !estrela) return;

    // Move a estrela para dentro do cabeçalho, antes do +.
    if (estrela.parentElement !== tituloBtn) {
      tituloBtn.insertBefore(estrela, iconeMais || null);
    } else if (iconeMais && estrela.nextElementSibling !== iconeMais) {
      tituloBtn.insertBefore(estrela, iconeMais);
    }

    estrela.classList.add("btn-favorito-no-cabecalho-v161");
  });
}

if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV161) {
  window.renderizarNotasOriginalV161 = renderizarNotas;

  renderizarNotas = function(...args) {
    removerFavoritosCompartilhadosV161();

    const resultado = window.renderizarNotasOriginalV161.apply(this, args);

    setTimeout(() => {
      try { aplicarFavoritosNaListaV159(); } catch {}
      reposicionarEstrelasFavoritosV161();
      atualizarBotaoFavoritosV161();
    }, 0);

    return resultado;
  };
}

document.addEventListener("DOMContentLoaded", () => {
  removerFavoritosCompartilhadosV161();

  setTimeout(() => {
    try { aplicarFavoritosNaListaV159(); } catch {}
    reposicionarEstrelasFavoritosV161();
    atualizarBotaoFavoritosV161();
  }, 300);

  setTimeout(() => {
    try { aplicarFavoritosNaListaV159(); } catch {}
    reposicionarEstrelasFavoritosV161();
    atualizarBotaoFavoritosV161();
  }, 1200);
});


/* v162 - Favoritos individuais por RG e chave única por nota */
/*
  Correção profunda:
  - Favoritos usam SEMPRE o RG do login atual quando existir.
  - Não usa dados.favoritosPorUsuario nem campos dentro da nota.
  - Evita duplicação/interligação quando notas têm id ausente/repetido.
  - Cada favorito usa uma chave única estável da nota.
*/

function obterRgUsuarioFavoritosV162() {
  const candidatos = [];

  try { candidatos.push(sessionStorage.getItem("boletimDigitalRg")); } catch {}
  try { candidatos.push(typeof rgAtual === "function" ? rgAtual() : ""); } catch {}
  try { candidatos.push(localStorage.getItem("boletimDigitalRg")); } catch {}
  try { candidatos.push(window.usuarioAtual?.rg); } catch {}
  try { candidatos.push(window.usuarioLogado?.rg); } catch {}
  try { candidatos.push(window.militarAtual?.rg); } catch {}

  const rg = candidatos
    .map(v => String(v || "").trim())
    .find(Boolean);

  if (rg) {
    return "rg_" + rg.replace(/[^\w-]/g, "_").toLowerCase();
  }

  // Fallback só para teste sem login: individual por navegador.
  let idLocal = localStorage.getItem("boletimDigitalFavoritosUsuarioLocalV162");
  if (!idLocal) {
    idLocal = "local_" + (crypto?.randomUUID?.() || (Date.now() + "_" + Math.random().toString(16).slice(2)));
    localStorage.setItem("boletimDigitalFavoritosUsuarioLocalV162", idLocal);
  }
  return idLocal;
}

function chaveStorageFavoritosV162() {
  return "boletimDigitalFavoritosNotasPorUsuario__" + obterRgUsuarioFavoritosV162();
}

function textoLimpoFavoritoV162(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function indiceRealNotaV162(nota) {
  try {
    return (dados.notas || []).indexOf(nota);
  } catch {
    return -1;
  }
}

function chaveUnicaNotaFavoritoV162(nota) {
  if (!nota) return "";

  // Detecta se o ID é realmente único. Se não for, não confia só nele.
  const id = String(nota.id || "").trim();

  if (id) {
    try {
      const iguais = (dados.notas || []).filter(n => String(n.id || "").trim() === id);
      if (iguais.length === 1) {
        return "id:" + id;
      }
    } catch {}
  }

  // Fallback estável por conteúdo essencial + índice real.
  // O índice evita duas notas iguais ficarem interligadas.
  const idx = indiceRealNotaV162(nota);

  const partes = [
    "idx:" + idx,
    "data:" + textoLimpoFavoritoV162(nota.data),
    "boletim:" + textoLimpoFavoritoV162(nota.boletim),
    "numero:" + textoLimpoFavoritoV162(nota.numero),
    "titulo:" + textoLimpoFavoritoV162(nota.titulo),
    "parte:" + textoLimpoFavoritoV162(nota.parte),
    "secao:" + textoLimpoFavoritoV162(nota.secao),
    "subsecao:" + textoLimpoFavoritoV162(nota.subsecao)
  ];

  return "nota:" + partes.join("|");
}

function garantirChavesUnicasNotasV162() {
  try {
    const vistos = new Map();

    (dados.notas || []).forEach((nota, index) => {
      if (!nota || typeof nota !== "object") return;

      // Remove favoritos globais antigos.
      delete nota.favorita;
      delete nota.favorito;
      delete nota.favoritada;

      // Se não há ID ou ID repetido, cria uma chave interna não compartilhada para DOM,
      // mas a lista de favoritos continua no localStorage do usuário.
      const id = String(nota.id || "").trim();

      if (!id) {
        nota.id = "nota_" + Date.now() + "_" + index + "_" + Math.random().toString(16).slice(2);
        return;
      }

      if (!vistos.has(id)) {
        vistos.set(id, [nota]);
      } else {
        vistos.get(id).push(nota);
      }
    });

    // Corrige IDs repetidos para impedir que uma estrela afete várias notas.
    vistos.forEach((lista, id) => {
      if (lista.length <= 1) return;

      lista.forEach((nota, idx) => {
        // Mantém o primeiro ID e ajusta os demais.
        if (idx === 0) return;
        nota.id = id + "_dup_" + idx + "_" + Date.now() + "_" + Math.random().toString(16).slice(2);
      });
    });

    if (dados && dados.favoritosPorUsuario) {
      delete dados.favoritosPorUsuario;
    }
  } catch {}
}

function obterFavoritosUsuarioV162() {
  try {
    const raw = localStorage.getItem(chaveStorageFavoritosV162());
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista.map(String) : [];
  } catch {
    return [];
  }
}

function salvarFavoritosUsuarioV162(lista) {
  try {
    const limpa = Array.from(new Set((lista || []).map(String).filter(Boolean)));
    localStorage.setItem(chaveStorageFavoritosV162(), JSON.stringify(limpa));
  } catch {}
}

function notaEstaFavoritaUsuarioV162(nota) {
  const chave = chaveUnicaNotaFavoritoV162(nota);
  if (!chave) return false;
  return obterFavoritosUsuarioV162().includes(chave);
}

function alternarFavoritoNotaUsuarioV162(notaOuId) {
  garantirChavesUnicasNotasV162();

  let nota = null;

  if (typeof notaOuId === "object" && notaOuId) {
    nota = notaOuId;
  } else {
    const id = String(notaOuId || "");
    nota = (dados.notas || []).find(n => String(n.id) === id) || null;
  }

  if (!nota) return;

  const chave = chaveUnicaNotaFavoritoV162(nota);
  if (!chave) return;

  const lista = obterFavoritosUsuarioV162();
  const idx = lista.indexOf(chave);

  if (idx >= 0) {
    lista.splice(idx, 1);
  } else {
    lista.push(chave);
  }

  salvarFavoritosUsuarioV162(lista);

  try { renderizarNotas(); } catch {}
  setTimeout(aplicarFavoritosNaListaV159, 0);
}

function localizarNotaPorChaveCardV162(card) {
  if (!card) return null;

  const id = card.dataset?.idNota || card.id || "";
  if (id) {
    const nota = (dados.notas || []).find(n => String(n.id) === String(id));
    if (nota) return nota;
  }

  const cards = Array.from(document.querySelectorAll("#listaNotas article.nota, #listaNotas .nota"));
  const idx = cards.indexOf(card);

  if (idx >= 0) {
    // Usa a nota visível correspondente se possível, mas com filtro isso nem sempre bate.
    const texto = textoLimpoFavoritoV162(card.textContent);
    return (dados.notas || []).find(n => {
      return texto.includes(textoLimpoFavoritoV162(n.titulo)) &&
             texto.includes(textoLimpoFavoritoV162(n.data || ""));
    }) || null;
  }

  return null;
}

/* Sobrescreve tudo das versões anteriores */
notaEstaFavoritaV159 = function(nota) {
  return notaEstaFavoritaUsuarioV162(nota);
};

alternarFavoritoNotaV159 = function(id) {
  const nota = (dados.notas || []).find(n => String(n.id) === String(id));
  alternarFavoritoNotaUsuarioV162(nota || id);
};

if (typeof notaEstaFavoritaUsuarioV160 === "function") notaEstaFavoritaUsuarioV160 = notaEstaFavoritaUsuarioV162;
if (typeof notaEstaFavoritaUsuarioV161 === "function") notaEstaFavoritaUsuarioV161 = notaEstaFavoritaUsuarioV162;

if (typeof alternarFavoritoNotaUsuarioV160 === "function") alternarFavoritoNotaUsuarioV160 = alternarFavoritoNotaUsuarioV162;
if (typeof alternarFavoritoNotaUsuarioV161 === "function") alternarFavoritoNotaUsuarioV161 = alternarFavoritoNotaUsuarioV162;

if (typeof obterListaFavoritosUsuarioV160 === "function") obterListaFavoritosUsuarioV160 = obterFavoritosUsuarioV162;
if (typeof obterListaFavoritosUsuarioV161 === "function") obterListaFavoritosUsuarioV161 = obterFavoritosUsuarioV162;

function atualizarBotaoFavoritosV162() {
  const btn = document.getElementById("btnFavoritosNotasV159");
  if (!btn) return;

  const total = obterFavoritosUsuarioV162().length;
  btn.classList.toggle("ativo", Boolean(filtroFavoritosAtivoV159));
  btn.textContent = filtroFavoritosAtivoV159 ? `Favoritos (${total})` : "Favoritos";
  btn.title = `Exibir meus favoritos (${total})`;
}

function aplicarFavoritosNaListaV162() {
  garantirChavesUnicasNotasV162();

  const favoritos = new Set(obterFavoritosUsuarioV162());

  document.querySelectorAll("#listaNotas article.nota, #listaNotas .nota").forEach(card => {
    const nota = localizarNotaPorChaveCardV162(card);
    if (!nota) return;

    const chave = chaveUnicaNotaFavoritoV162(nota);
    const fav = favoritos.has(chave);

    card.dataset.idNota = String(nota.id || "");

    let tituloBtn = card.querySelector(".titulo-nota");
    let estrela = card.querySelector(".btn-favorito-nota-v159");

    if (!estrela) {
      estrela = document.createElement("button");
      estrela.type = "button";
      estrela.className = "btn-favorito-nota-v159 btn-favorito-no-cabecalho-v161";
      estrela.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();

        const notaAtual = localizarNotaPorChaveCardV162(card);
        if (notaAtual) alternarFavoritoNotaUsuarioV162(notaAtual);
      });
    }

    estrela.dataset.idNota = String(nota.id || "");
    estrela.dataset.chaveFavorito = chave;
    estrela.innerHTML = fav ? "★" : "☆";
    estrela.classList.toggle("favorita", fav);
    estrela.title = fav ? "Remover dos meus favoritos" : "Adicionar aos meus favoritos";
    estrela.setAttribute("aria-label", estrela.title);

    if (tituloBtn) {
      const icone = tituloBtn.querySelector(".icone");
      if (estrela.parentElement !== tituloBtn) {
        tituloBtn.insertBefore(estrela, icone || null);
      } else if (icone && estrela.nextElementSibling !== icone) {
        tituloBtn.insertBefore(estrela, icone);
      }
    } else if (estrela.parentElement !== card) {
      card.appendChild(estrela);
    }

    if (filtroFavoritosAtivoV159 && !fav) {
      card.style.display = "none";
    } else {
      card.style.display = "";
    }
  });

  atualizarBotaoFavoritosV162();
}

if (typeof aplicarFavoritosNaListaV159 === "function" && !window.aplicarFavoritosNaListaOriginalV162) {
  window.aplicarFavoritosNaListaOriginalV162 = aplicarFavoritosNaListaV159;

  aplicarFavoritosNaListaV159 = function(...args) {
    const r = window.aplicarFavoritosNaListaOriginalV162.apply(this, args);
    aplicarFavoritosNaListaV162();
    return r;
  };
}

if (typeof atualizarBotaoFavoritosV159 === "function" && !window.atualizarBotaoFavoritosOriginalV162) {
  window.atualizarBotaoFavoritosOriginalV162 = atualizarBotaoFavoritosV159;

  atualizarBotaoFavoritosV159 = function(...args) {
    const r = window.atualizarBotaoFavoritosOriginalV162.apply(this, args);
    atualizarBotaoFavoritosV162();
    return r;
  };
}

if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV162) {
  window.renderizarNotasOriginalV162 = renderizarNotas;

  renderizarNotas = function(...args) {
    garantirChavesUnicasNotasV162();

    const r = window.renderizarNotasOriginalV162.apply(this, args);

    setTimeout(() => {
      aplicarFavoritosNaListaV162();
      try { reposicionarEstrelasFavoritosV161(); } catch {}
    }, 0);

    return r;
  };
}

if (typeof salvarDadosFavoritosV159 === "function") {
  salvarDadosFavoritosV159 = function() {
    garantirChavesUnicasNotasV162();

    // Não salva favoritos no banco compartilhado.
    try {
      if (typeof salvarDados === "function") salvarDados();
      else if (typeof salvarNoLocalStorage === "function") salvarNoLocalStorage();
    } catch {}
  };
}

document.addEventListener("DOMContentLoaded", () => {
  garantirChavesUnicasNotasV162();

  setTimeout(() => {
    aplicarFavoritosNaListaV162();
    atualizarBotaoFavoritosV162();
  }, 300);

  setTimeout(() => {
    aplicarFavoritosNaListaV162();
    atualizarBotaoFavoritosV162();
  }, 1200);
});


/* v163 - corrige favorito afetando nota errada */
/*
  Problema corrigido:
  - A estrela podia usar ID repetido ou busca por texto e acabar favoritando outra nota.
  - Agora a estrela é recriada com um listener limpo e vinculada diretamente à nota visível naquele card.
*/

function chaveUnicaNotaFavoritoV163(nota) {
  if (!nota) return "";

  const idx = (() => {
    try { return (dados.notas || []).indexOf(nota); } catch { return -1; }
  })();

  const id = String(nota.id || "").trim();

  // Mesmo com ID, inclui o índice real para impedir interligação quando houver duplicidade.
  return [
    "idx:" + idx,
    "id:" + id,
    "data:" + textoLimpoFavoritoV162(nota.data),
    "boletim:" + textoLimpoFavoritoV162(nota.boletim),
    "numero:" + textoLimpoFavoritoV162(nota.numero),
    "titulo:" + textoLimpoFavoritoV162(nota.titulo),
    "parte:" + textoLimpoFavoritoV162(nota.parte),
    "secao:" + textoLimpoFavoritoV162(nota.secao),
    "subsecao:" + textoLimpoFavoritoV162(nota.subsecao)
  ].join("|");
}

function obterNotasVisiveisDaPaginaAtualV163() {
  try {
    const todasNotas = dados.notas
      .filter(pertenceADataSelecionadaCalendario)
      .filter(pertenceAoBoletim)
      .filter(pertenceAoFiltro)
      .filter(passaNaBusca)
      .sort(ordenarNotas);

    if (typeof filtroFavoritosAtivoV159 !== "undefined" && filtroFavoritosAtivoV159) {
      const favoritos = new Set(obterFavoritosUsuarioV162());
      const filtradas = todasNotas.filter(nota => favoritos.has(chaveUnicaNotaFavoritoV163(nota)));
      const totalPaginas = Math.max(1, Math.ceil(filtradas.length / itensPorPagina));
      if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
      const inicioFav = (paginaAtual - 1) * itensPorPagina;
      return filtradas.slice(inicioFav, inicioFav + itensPorPagina);
    }

    const totalPaginas = Math.max(1, Math.ceil(todasNotas.length / itensPorPagina));
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;

    const inicio = (paginaAtual - 1) * itensPorPagina;
    return todasNotas.slice(inicio, inicio + itensPorPagina);
  } catch {
    return [];
  }
}

function notaEstaFavoritaUsuarioV163(nota) {
  const chave = chaveUnicaNotaFavoritoV163(nota);
  if (!chave) return false;
  return obterFavoritosUsuarioV162().includes(chave);
}

function alternarFavoritoNotaUsuarioV163(nota) {
  if (!nota) return;

  removerFavoritosCompartilhadosV161?.();

  const chave = chaveUnicaNotaFavoritoV163(nota);
  if (!chave) return;

  const lista = obterFavoritosUsuarioV162();
  const idx = lista.indexOf(chave);

  if (idx >= 0) {
    lista.splice(idx, 1);
  } else {
    lista.push(chave);
  }

  salvarFavoritosUsuarioV162(lista);

  try { renderizarNotas(); } catch {}
  setTimeout(aplicarFavoritosNaListaV163, 0);
}

function criarEstrelaFavoritoV163(nota) {
  const fav = notaEstaFavoritaUsuarioV163(nota);

  const estrela = document.createElement("button");
  estrela.type = "button";
  estrela.className = "btn-favorito-nota-v159 btn-favorito-no-cabecalho-v161 btn-favorito-v163";
  estrela.dataset.chaveFavorito = chaveUnicaNotaFavoritoV163(nota);
  estrela.dataset.idNota = String(nota.id || "");
  estrela.innerHTML = fav ? "★" : "☆";
  estrela.classList.toggle("favorita", fav);
  estrela.title = fav ? "Remover dos meus favoritos" : "Adicionar aos meus favoritos";
  estrela.setAttribute("aria-label", estrela.title);

  estrela.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    alternarFavoritoNotaUsuarioV163(nota);
  }, true);

  return estrela;
}

function aplicarFavoritosNaListaV163() {
  try { garantirChavesUnicasNotasV162(); } catch {}

  const cards = Array.from(document.querySelectorAll("#listaNotas article.nota, #listaNotas .nota"));
  const notasVisiveis = obterNotasVisiveisDaPaginaAtualV163();

  cards.forEach((card, index) => {
    const nota = notasVisiveis[index];

    if (!nota) return;

    card.dataset.idNota = String(nota.id || "");
    card.dataset.chaveFavorito = chaveUnicaNotaFavoritoV163(nota);
    card.classList.add("card-com-favorito-v159");

    // Remove qualquer estrela antiga com listener antigo para evitar ação na nota errada.
    card.querySelectorAll(".btn-favorito-nota-v159").forEach(btn => btn.remove());

    const estrela = criarEstrelaFavoritoV163(nota);
    const tituloBtn = card.querySelector(".titulo-nota");
    const icone = tituloBtn?.querySelector(".icone");

    if (tituloBtn) {
      tituloBtn.insertBefore(estrela, icone || null);
    } else {
      card.appendChild(estrela);
    }
  });

  atualizarBotaoFavoritosV162?.();
}

notaEstaFavoritaV159 = function(nota) {
  return notaEstaFavoritaUsuarioV163(nota);
};

alternarFavoritoNotaV159 = function(id) {
  const nota = (dados.notas || []).find(n => String(n.id) === String(id));
  if (nota) alternarFavoritoNotaUsuarioV163(nota);
};

if (typeof notaEstaFavoritaUsuarioV162 === "function") {
  notaEstaFavoritaUsuarioV162 = notaEstaFavoritaUsuarioV163;
}

if (typeof alternarFavoritoNotaUsuarioV162 === "function") {
  alternarFavoritoNotaUsuarioV162 = alternarFavoritoNotaUsuarioV163;
}

if (typeof aplicarFavoritosNaListaV159 === "function" && !window.aplicarFavoritosNaListaOriginalV163) {
  window.aplicarFavoritosNaListaOriginalV163 = aplicarFavoritosNaListaV159;

  aplicarFavoritosNaListaV159 = function(...args) {
    const r = window.aplicarFavoritosNaListaOriginalV163.apply(this, args);
    aplicarFavoritosNaListaV163();
    return r;
  };
}

if (typeof aplicarFavoritosNaListaV162 === "function") {
  aplicarFavoritosNaListaV162 = aplicarFavoritosNaListaV163;
}

if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV163) {
  window.renderizarNotasOriginalV163 = renderizarNotas;

  renderizarNotas = function(...args) {
    const r = window.renderizarNotasOriginalV163.apply(this, args);

    setTimeout(() => {
      aplicarFavoritosNaListaV163();
    }, 0);

    return r;
  };
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(aplicarFavoritosNaListaV163, 300);
  setTimeout(aplicarFavoritosNaListaV163, 1200);
});



/* v180 - helpers definitivos para boletim estruturado e ordem de inserção */
function obterNumeroBoletimV180() {
  const el = document.getElementById("notaBoletimNumero");
  return String(el?.value || "").trim();
}

function montarTextoBoletimV180() {
  const tipo = document.getElementById("notaBoletimTipo")?.value || "SEDEC";
  const numero = obterNumeroBoletimV180();
  const sufixo = numero ? ` nº ${numero}` : "";

  if (tipo === "SEDEC") {
    return `Boletim da SEDEC/CBMERJ${sufixo}`;
  }

  if (tipo === "CBA") {
    const sel = document.getElementById("notaBoletimCba");
    const orgao = sel?.selectedOptions?.[0]?.textContent?.trim() || "CBA";
    return `Boletim do ${orgao}${sufixo}`;
  }

  if (tipo === "OBM") {
    const input = document.getElementById("notaBoletimObmBusca");
    const orgao = String(input?.value || "").trim() || "OBM";
    return `Boletim do ${orgao}${sufixo}`;
  }

  return `Boletim${sufixo}`;
}

function aplicarBoletimEstruturadoNaNotaV180(nota) {
  if (!nota) return nota;

  const tipo = document.getElementById("notaBoletimTipo")?.value || "SEDEC";
  const numero = obterNumeroBoletimV180();
  const texto = montarTextoBoletimV180();

  nota.boletim = texto;
  nota.boletimTexto = texto;
  nota.boletimTipo = tipo;
  nota.boletimNumero = numero;

  if (tipo === "SEDEC") {
    nota.boletimOrgaoId = "sedec-cbmerj";
    nota.boletimOrgaoNome = "SEDEC/CBMERJ";
    nota.boletimCbaId = "";
    nota.boletimObmId = "";
  }

  if (tipo === "CBA") {
    const sel = document.getElementById("notaBoletimCba");
    nota.boletimOrgaoId = sel?.value || "";
    nota.boletimOrgaoNome = sel?.selectedOptions?.[0]?.textContent?.trim() || "";
    nota.boletimCbaId = sel?.value || "";
    nota.boletimObmId = "";
  }

  if (tipo === "OBM") {
    const input = document.getElementById("notaBoletimObmBusca");
    nota.boletimOrgaoId = input?.dataset.obmId || "";
    nota.boletimOrgaoNome = String(input?.value || "").trim();
    nota.boletimCbaId = "";
    nota.boletimObmId = input?.dataset.obmId || "";
  }

  return nota;
}

function prepararBoletimAntesDaInclusaoV180() {
  const legado = document.getElementById("notaBoletim");
  if (!legado) return;

  legado.required = false;
  legado.removeAttribute("required");
  legado.value = montarTextoBoletimV180();
}

function dataOrdenacaoNotaV180(dataBR) {
  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return 0;
  return Number(`${m[3]}${String(m[2]).padStart(2, "0")}${String(m[1]).padStart(2, "0")}`);
}

function compararNotasPorDataEInsercaoV180(a, b) {
  const da = dataOrdenacaoNotaV180(a?.data);
  const db = dataOrdenacaoNotaV180(b?.data);
  if (da !== db) return db - da;

  const ia = Number(a?.inseridoEm || a?.criadoEm || 0);
  const ib = Number(b?.inseridoEm || b?.criadoEm || 0);
  if (ia !== ib) return ib - ia;

  return 0;
}

function ordenarNotasPorDataEInsercaoV180() {
  if (Array.isArray(dados?.notas)) {
    dados.notas.sort(compararNotasPorDataEInsercaoV180);
  }
}
