// 09-impressao.js
function abrirModalImpressao() {
  garantirModalImpressaoFuncionando();
  const modal = document.getElementById("modalImpressao");
  if (modal) modal.classList.remove("escondido");
  atualizarCamposImpressao();
}

function fecharModalImpressao() {
  const modal = document.getElementById("modalImpressao");
  if (modal) modal.classList.add("escondido");
}

function prepararModalImpressao() {
  garantirModalImpressaoFuncionando();
  prepararCalendarioImpressao();
  atualizarCamposImpressao();
}

function atualizarCamposImpressao() {
  const tipo = document.getElementById("tipoImpressao")?.value || "busca";
  const campoData = document.getElementById("campoDataImpressao");
  const campoQuantidade = document.getElementById("campoQuantidadeImpressao");

  if (campoData) campoData.classList.toggle("escondido", tipo !== "boletim");
  if (campoQuantidade) campoQuantidade.classList.toggle("escondido", tipo !== "quantidade");

  if (tipo === "boletim") {
    prepararCalendarioImpressao();
    renderizarCalendarioImpressao();
  }
}

function confirmarImpressao() {
  const tipo = document.getElementById("tipoImpressao").value;
  let notas = obterNotasBaseImpressao();

  if (tipo === "boletim") {
    const dataBR = document.getElementById("dataImpressao").value;
    if (!dataBR) {
      alert("Escolha a data do boletim.");
      return;
    }
    notas = notas.filter(n => n.data === dataBR);
  }

  if (tipo === "quantidade") {
    const qtd = Math.max(1, Number(document.getElementById("quantidadeImpressao").value || 20));
    notas = notas.slice(0, qtd);
  }

  if (!notas.length) {
    alert("Não há notas para imprimir com esses critérios.");
    return;
  }

  montarAreaImpressao(notas, criarTituloImpressao(tipo, notas));
  fecharModalImpressao();

  setTimeout(() => window.print(), 100);
}

function criarTituloImpressao(tipo, notas) {
  if (tipo === "boletim") {
    return `Boletim de ${notas[0]?.data || ""}`;
  }
  if (tipo === "quantidade") {
    return `${notas.length} nota(s) mais recentes`;
  }
  return filtroAtual.label || "Resultado atual";
}

function obterNotasBaseImpressao() {
  return dados.notas
    .filter(pertenceAoFiltro)
    .filter(passaNaBusca)
    .sort(ordenarNotas);
}

function imprimirNotaUnica(id) {
  const nota = dados.notas.find(n => n.id === id);
  if (!nota) return;

  montarAreaImpressao([nota], `Nota individual`);
  setTimeout(() => window.print(), 100);
}

function atualizarMarcaDaguaImpressao() {
  const rg = rgAtual() || "RG NÃO IDENTIFICADO";
  const texto = `RG ${rg}`;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="280" height="160" viewBox="0 0 280 160">
      <text x="20" y="95"
        font-family="Segoe UI, Arial, sans-serif"
        font-size="22"
        font-weight="700"
        fill="black"
        transform="rotate(-28 140 80)">
        ${escapeXml(texto)}
      </text>
    </svg>
  `;

  const url = `url("data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}")`;
  document.documentElement.style.setProperty("--marca-dagua-rg", url);
}

function montarAreaImpressao(notas, tituloImpressao = "Boletim Digital") {
  atualizarMarcaDaguaImpressao();
  const area = document.getElementById("areaImpressao");
  const dataExportacao = new Date().toLocaleString("pt-BR");
  const grupos = agruparNotasParaImpressao(notas);

  area.innerHTML = `
    <div class="print-cabecalho">
      <h1>Boletim Digital</h1>
      <p><strong>${escapeHtml(tituloImpressao)}</strong></p>
      <p><strong>Gerado em:</strong> ${escapeHtml(dataExportacao)}</p>
      <p><strong>Total de notas:</strong> ${notas.length}</p>
    </div>
    ${renderizarGruposImpressao(grupos)}
  `;
}

function agruparNotasParaImpressao(notas) {
  const grupos = [];

  notas.forEach(nota => {
    let grupoParte = grupos.find(g => g.parte === nota.parte);
    if (!grupoParte) {
      grupoParte = { parte: nota.parte || "Sem Parte", secoes: [] };
      grupos.push(grupoParte);
    }

    let grupoSecao = grupoParte.secoes.find(s => s.secao === (nota.secao || ""));
    if (!grupoSecao) {
      grupoSecao = { secao: nota.secao || "", subsecoes: [] };
      grupoParte.secoes.push(grupoSecao);
    }

    let grupoSubsecao = grupoSecao.subsecoes.find(s => s.subsecao === (nota.subsecao || ""));
    if (!grupoSubsecao) {
      grupoSubsecao = { subsecao: nota.subsecao || "", notas: [] };
      grupoSecao.subsecoes.push(grupoSubsecao);
    }

    grupoSubsecao.notas.push(nota);
  });

  return grupos;
}

function renderizarGruposImpressao(grupos) {
  return grupos.map(grupoParte => `
    <section>
      <h2 class="print-parte">${escapeHtml(grupoParte.parte)}</h2>
      ${grupoParte.secoes.map(grupoSecao => `
        ${grupoSecao.secao ? `<h3 class="print-secao">${escapeHtml(grupoSecao.secao)}</h3>` : ""}
        ${grupoSecao.subsecoes.map(grupoSubsecao => `
          ${grupoSubsecao.subsecao ? `<h4 class="print-subsecao">${escapeHtml(grupoSubsecao.subsecao)}</h4>` : ""}
          ${grupoSubsecao.notas.map((nota, index) => renderizarNotaImpressao(nota, index + 1)).join("")}
        `).join("")}
      `).join("")}
    </section>
  `).join("");
}

function renderizarNotaImpressao(nota, numeroImpresso = 1) {
  const tituloOriginal = String(nota.titulo || "").replace(/^\d+\.\s*/, "");

  return `
    <article class="print-nota">
      <h2 class="print-nota-titulo">
        <span class="print-numero-nota">${numeroImpresso}. </span><span class="print-texto-titulo-nota">${escapeHtml(tituloOriginal)}</span>
      </h2>
      <div class="print-meta">
        ${escapeHtml(nota.boletim)} • ${escapeHtml(nota.data)}
      </div>
      <div class="print-texto">${renderizarTextoParaImpressao(nota.texto || "")}</div>
      ${renderizarSubitensImpressao(nota)}
      ${renderizarAnexosImpressao(nota)}
    </article>
  `;
}

function renderizarSubitensImpressao(nota) {
  if (!nota.subitens || !nota.subitens.length) return "";

  return nota.subitens.map(sub => `
    <div class="print-subitem">
      <h3>${escapeHtml(sub.titulo || "Subitem")}</h3>
      <div class="print-texto">${renderizarTextoParaImpressao(sub.texto || "")}</div>
    </div>
  `).join("");
}

function renderizarAnexosImpressao(nota) {
  if (!nota.anexos || !nota.anexos.length) return "";

  return nota.anexos.map((anexo, index) => `
    <div class="print-anexo">
      <h3>${escapeHtml(anexo.titulo || `Anexo ${index + 1}`)}</h3>
      <div class="print-texto">${renderizarTextoParaImpressao(anexo.texto || "")}</div>
    </div>
  `).join("");
}

function garantirModalImpressaoFuncionando() {
  const btnFechar = document.getElementById("btnFecharImpressao");
  const btnCancelar = document.getElementById("btnCancelarImpressao");
  const btnConfirmar = document.getElementById("btnConfirmarImpressao");
  const tipo = document.getElementById("tipoImpressao");
  const modal = document.getElementById("modalImpressao");

  if (btnFechar && btnFechar.dataset.ok !== "1") {
    btnFechar.dataset.ok = "1";
    btnFechar.addEventListener("click", fecharModalImpressao);
  }

  if (btnCancelar && btnCancelar.dataset.ok !== "1") {
    btnCancelar.dataset.ok = "1";
    btnCancelar.addEventListener("click", fecharModalImpressao);
  }

  if (btnConfirmar && btnConfirmar.dataset.ok !== "1") {
    btnConfirmar.dataset.ok = "1";
    btnConfirmar.addEventListener("click", confirmarImpressao);
  }

  if (tipo && tipo.dataset.ok !== "1") {
    tipo.dataset.ok = "1";
    tipo.addEventListener("change", atualizarCamposImpressao);
    tipo.addEventListener("input", atualizarCamposImpressao);
  }

  if (modal && modal.dataset.ok !== "1") {
    modal.dataset.ok = "1";
    modal.addEventListener("click", (event) => {
      if (event.target === modal) fecharModalImpressao();
    });
  }
}


/* v116 - marca impressão de nota específica para esconder barra de Todas as Notas */
function marcarImpressaoNotaV116() {
  document.body.classList.add("imprimindo-nota");
}

function desmarcarImpressaoNotaV116() {
  document.body.classList.remove("imprimindo-nota");
}

window.addEventListener("afterprint", desmarcarImpressaoNotaV116);

// Wrapper para funções prováveis de impressão de nota.
["imprimirNota", "imprimirNotaIndividual", "imprimirNotaPorId"].forEach(nome => {
  try {
    const fn = window[nome];
    if (typeof fn === "function" && !fn.__v116) {
      const wrapper = function(...args) {
        marcarImpressaoNotaV116();
        const resultado = fn.apply(this, args);
        setTimeout(desmarcarImpressaoNotaV116, 1500);
        return resultado;
      };
      wrapper.__v116 = true;
      window[nome] = wrapper;
    }
  } catch {}
});


/* v117 - número do título sem sublinhado na impressão */
function ajustarTitulosImpressaoV117() {
  const seletores = [
    ".nota h1",
    ".nota h2",
    ".nota h3",
    ".nota .titulo-nota h1",
    ".nota .titulo-nota h2",
    ".nota .titulo-nota h3",
    ".impressao-nota h1",
    ".impressao-nota h2",
    ".impressao-nota h3",
    ".nota-impressao h1",
    ".nota-impressao h2",
    ".nota-impressao h3",
    ".print-nota h1",
    ".print-nota h2",
    ".print-nota h3"
  ];

  document.querySelectorAll(seletores.join(",")).forEach(el => {
    if (el.dataset.v117 === "1") return;

    const texto = (el.textContent || "").trim();

    // Ex.: "1. TÍTULO", "12 - TÍTULO", "03) TÍTULO"
    const match = texto.match(/^(\d+\s*(?:[.)-]|–|—)\s*)(.+)$/);
    if (!match) return;

    el.dataset.v117 = "1";
    el.innerHTML = `<span class="numero-contador-impressao-v117">${match[1]}</span><span class="titulo-texto-impressao-v117">${match[2]}</span>`;
  });
}

window.addEventListener("beforeprint", ajustarTitulosImpressaoV117);

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(ajustarTitulosImpressaoV117, 300);
});


/* v118 - correção real da impressão: linha removida e número sem sublinhado */
function removerLinhasEntreParteETituloV118(root = document) {
  // Remove elementos hr/divisores dentro de notas.
  root.querySelectorAll(`
    .nota hr,
    .nota .linha,
    .nota .divisor,
    .nota .separador,
    .nota .linha-divisoria,
    .nota .nota-divisor,
    .nota .divisor-nota,
    .nota .separador-nota,
    .nota [class*="divisor"],
    .nota [class*="separador"],
    .impressao-nota hr,
    .nota-impressao hr,
    .print-nota hr
  `).forEach(el => {
    el.style.display = "none";
    el.style.border = "0";
    el.style.height = "0";
    el.style.margin = "0";
    el.style.padding = "0";
  });

  // Remove borda inferior/superior em blocos de hierarquia/meta próximos do título.
  root.querySelectorAll(`
    .nota .meta,
    .nota .caminho,
    .nota .hierarquia,
    .nota .parte-nota,
    .nota .secao-nota,
    .nota .subsecao-nota,
    .nota [class*="hierarquia"],
    .nota [class*="caminho"],
    .nota [class*="parte"],
    .impressao-nota .meta,
    .nota-impressao .meta,
    .print-nota .meta
  `).forEach(el => {
    el.style.borderBottom = "0";
    el.style.borderTop = "0";
    el.style.boxShadow = "none";
  });

  // Caso a linha seja uma borda do próprio corpo ou cabeçalho da nota.
  root.querySelectorAll(`
    .nota,
    .nota > *,
    .impressao-nota,
    .impressao-nota > *,
    .nota-impressao,
    .nota-impressao > *,
    .print-nota,
    .print-nota > *
  `).forEach(el => {
    const texto = (el.textContent || "").trim().toLowerCase();
    const pareceBlocoHierarquia =
      texto.includes("parte") ||
      texto.includes("operações") ||
      texto.includes("operacoes") ||
      texto.includes("instrução") ||
      texto.includes("instrucao") ||
      texto.includes("alteração") ||
      texto.includes("alteracao");

    // Não remove bordas de tabelas.
    if (el.closest("table")) return;

    if (pareceBlocoHierarquia && el.offsetHeight < 80) {
      el.style.borderBottom = "0";
    }
  });
}

function separarNumeroDoTituloV118(root = document) {
  const seletores = [
    ".nota h1", ".nota h2", ".nota h3",
    ".nota .titulo-nota", ".nota .titulo-nota h1", ".nota .titulo-nota h2", ".nota .titulo-nota h3",
    ".impressao-nota h1", ".impressao-nota h2", ".impressao-nota h3",
    ".nota-impressao h1", ".nota-impressao h2", ".nota-impressao h3",
    ".print-nota h1", ".print-nota h2", ".print-nota h3",
    ".corpo h1", ".corpo h2", ".corpo h3"
  ];

  root.querySelectorAll(seletores.join(",")).forEach(el => {
    if (el.dataset.v118Titulo === "1") return;

    // Evita mexer em botões/listas que não sejam título impresso.
    const texto = (el.textContent || "").replace(/\s+/g, " ").trim();
    if (!texto) return;

    // Padrões: "1. Título", "1 - Título", "001/2026 - Título" não mexe no 001/2026.
    const match = texto.match(/^(\d{1,3}\s*(?:[.)-]|–|—)\s*)(.+)$/);
    if (!match) return;

    el.dataset.v118Titulo = "1";
    el.classList.add("titulo-ajustado-impressao-v118");

    // Preserva só texto, porque é título; número separado sem underline.
    el.innerHTML = `<span class="numero-contador-impressao-v118">${match[1]}</span><span class="texto-titulo-impressao-v118">${match[2]}</span>`;
  });

  // Se o título inteiro estiver sublinhado via text-decoration no elemento pai,
  // removemos do pai e aplicamos só ao texto do título.
  root.querySelectorAll(".titulo-ajustado-impressao-v118").forEach(el => {
    el.style.textDecoration = "none";
  });

  root.querySelectorAll(".numero-contador-impressao-v118").forEach(el => {
    el.style.textDecoration = "none";
  });

  root.querySelectorAll(".texto-titulo-impressao-v118").forEach(el => {
    el.style.textDecoration = "underline";
  });
}

function prepararImpressaoNotaV118() {
  removerLinhasEntreParteETituloV118(document);
  separarNumeroDoTituloV118(document);
}

window.addEventListener("beforeprint", prepararImpressaoNotaV118);
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(prepararImpressaoNotaV118, 300);
});

if (!window.printOriginalV118) {
  window.printOriginalV118 = window.print;
  window.print = function(...args) {
    prepararImpressaoNotaV118();
    return window.printOriginalV118.apply(window, args);
  };
}


/* v119 - número automático da nota sem sublinhado na impressão */
function ajustarNumeroTituloImpressaoV119() {
  document.querySelectorAll(".print-nota-titulo").forEach(el => {
    if (el.querySelector(".print-numero-nota")) return;

    const texto = (el.textContent || "").replace(/\s+/g, " ").trim();
    const match = texto.match(/^(\d+\.\s*)(.+)$/);
    if (!match) return;

    el.innerHTML = `<span class="print-numero-nota">${match[1]}</span><span class="print-texto-titulo-nota">${match[2]}</span>`;
  });
}

window.addEventListener("beforeprint", ajustarNumeroTituloImpressaoV119);
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(ajustarNumeroTituloImpressaoV119, 300);
});


/* v128 - calendário de impressão destaca dias com boletim/notas */
function obterDatasComNotasImpressaoV128() {
  const datas = new Set();

  try {
    (dados.notas || []).forEach(nota => {
      if (nota && nota.data) datas.add(String(nota.data));
      if (nota && nota.dataNota) datas.add(String(nota.dataNota));
      if (nota && nota.dataBoletim) datas.add(String(nota.dataBoletim));
    });
  } catch {}

  try {
    (dados.boletins || []).forEach(boletim => {
      if (boletim && boletim.data) datas.add(String(boletim.data));
      if (boletim && boletim.dataBoletim) datas.add(String(boletim.dataBoletim));
    });
  } catch {}

  return Array.from(datas).filter(Boolean);
}

function configurarMesCalendarioImpressaoV128() {
  try {
    const datas = obterDatasComNotasImpressaoV128()
      .map(dataBR => parseDataBR(dataBR))
      .filter(data => data instanceof Date && !Number.isNaN(data.getTime()))
      .sort((a, b) => b - a);

    if (!mesCalendarioImpressao && datas.length) {
      mesCalendarioImpressao = datas[0];
    }

    if (!mesCalendarioImpressao) {
      mesCalendarioImpressao = new Date();
    }
  } catch {
    if (!mesCalendarioImpressao) mesCalendarioImpressao = new Date();
  }
}

function destacarDiasCalendarioImpressaoV128() {
  const datas = new Set(obterDatasComNotasImpressaoV128().map(String));

  const painel = document.getElementById("painelCalendarioImpressao");
  if (!painel || !datas.size) return;

  painel.querySelectorAll("button, .dia, .calendario-dia, [data-data], [data-date]").forEach(el => {
    const dataAttr =
      el.dataset?.data ||
      el.dataset?.date ||
      el.getAttribute("data-data") ||
      el.getAttribute("data-date") ||
      "";

    let dataBR = String(dataAttr || "").trim();

    // Se o botão só tem o número do dia, monta dd/mm/aaaa pelo mês atual.
    if (!dataBR) {
      const texto = (el.textContent || "").trim();
      if (/^\d{1,2}$/.test(texto) && mesCalendarioImpressao) {
        const dia = texto.padStart(2, "0");
        const mes = String(mesCalendarioImpressao.getMonth() + 1).padStart(2, "0");
        const ano = String(mesCalendarioImpressao.getFullYear());
        dataBR = `${dia}/${mes}/${ano}`;
      }
    }

    if (datas.has(dataBR)) {
      el.classList.add("tem-nota", "tem-boletim", "dia-com-nota", "dia-com-boletim", "calendario-dia-com-nota-v128");
      el.title = "Há boletim/nota neste dia";
    }
  });
}

function renderizarCalendarioImpressaoComDestaqueV128() {
  configurarMesCalendarioImpressaoV128();

  try {
    if (typeof renderizarCalendarioImpressao === "function") {
      renderizarCalendarioImpressao();
    }
  } catch {}

  setTimeout(destacarDiasCalendarioImpressaoV128, 0);
  setTimeout(destacarDiasCalendarioImpressaoV128, 100);
}

if (typeof renderizarCalendarioImpressao === "function" && !window.renderizarCalendarioImpressaoOriginalV128) {
  window.renderizarCalendarioImpressaoOriginalV128 = renderizarCalendarioImpressao;

  renderizarCalendarioImpressao = function(...args) {
    configurarMesCalendarioImpressaoV128();

    const resultado = window.renderizarCalendarioImpressaoOriginalV128.apply(this, args);

    setTimeout(destacarDiasCalendarioImpressaoV128, 0);
    setTimeout(destacarDiasCalendarioImpressaoV128, 100);

    return resultado;
  };
}

function configurarBotaoCalendarioImpressaoV128() {
  const btn = document.getElementById("btnCalendarioImpressao");
  const painel = document.getElementById("painelCalendarioImpressao");

  if (!btn || !painel || btn.dataset.v128 === "1") return;
  btn.dataset.v128 = "1";

  btn.addEventListener("click", () => {
    setTimeout(() => {
      if (!painel.classList.contains("escondido")) {
        renderizarCalendarioImpressaoComDestaqueV128();
      }
    }, 0);

    setTimeout(() => {
      if (!painel.classList.contains("escondido")) {
        destacarDiasCalendarioImpressaoV128();
      }
    }, 150);
  });
}

function configurarNavegacaoCalendarioImpressaoV128() {
  ["mesAnteriorImpressao", "mesProximoImpressao"].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn || btn.dataset.v128 === "1") return;
    btn.dataset.v128 = "1";

    btn.addEventListener("click", () => {
      setTimeout(destacarDiasCalendarioImpressaoV128, 0);
      setTimeout(destacarDiasCalendarioImpressaoV128, 100);
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  configurarMesCalendarioImpressaoV128();
  configurarBotaoCalendarioImpressaoV128();
  configurarNavegacaoCalendarioImpressaoV128();

  setTimeout(() => {
    configurarMesCalendarioImpressaoV128();
    configurarBotaoCalendarioImpressaoV128();
    configurarNavegacaoCalendarioImpressaoV128();
    destacarDiasCalendarioImpressaoV128();
  }, 500);
});


/* v129 - permite selecionar dias com notas no calendário de impressão */
function obterDataBRDoDiaCalendarioImpressaoV129(el) {
  if (!el) return "";

  const dataAttr =
    el.dataset?.data ||
    el.dataset?.date ||
    el.getAttribute("data-data") ||
    el.getAttribute("data-date") ||
    "";

  if (dataAttr) return String(dataAttr).trim();

  const texto = (el.textContent || "").trim();

  if (/^\d{1,2}$/.test(texto) && typeof mesCalendarioImpressao !== "undefined" && mesCalendarioImpressao) {
    const dia = texto.padStart(2, "0");
    const mes = String(mesCalendarioImpressao.getMonth() + 1).padStart(2, "0");
    const ano = String(mesCalendarioImpressao.getFullYear());
    return `${dia}/${mes}/${ano}`;
  }

  const match = texto.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return match ? match[0] : "";
}

function existeNotaOuBoletimNaDataV129(dataBR) {
  if (!dataBR) return false;

  try {
    if ((dados.notas || []).some(nota =>
      String(nota.data || "") === dataBR ||
      String(nota.dataNota || "") === dataBR ||
      String(nota.dataBoletim || "") === dataBR
    )) return true;
  } catch {}

  try {
    if ((dados.boletins || []).some(boletim =>
      String(boletim.data || "") === dataBR ||
      String(boletim.dataBoletim || "") === dataBR
    )) return true;
  } catch {}

  return false;
}

function numeroBoletimDaDataV129(dataBR) {
  try {
    const boletim = (dados.boletins || []).find(b =>
      String(b.data || "") === dataBR ||
      String(b.dataBoletim || "") === dataBR
    );

    if (boletim?.numero) return boletim.numero;
  } catch {}

  try {
    const nota = (dados.notas || []).find(n =>
      String(n.data || "") === dataBR ||
      String(n.dataNota || "") === dataBR ||
      String(n.dataBoletim || "") === dataBR
    );

    const textoBoletim = String(nota?.boletim || "");
    const match = textoBoletim.match(/(?:n[º°.]?\s*)?(\d+)/i);
    if (match) return match[1];
  } catch {}

  return "";
}

function selecionarDataImpressaoV129(dataBR) {
  if (!dataBR) return;

  const campo = document.getElementById("dataImpressao");
  const btn = document.getElementById("btnCalendarioImpressao");
  const painel = document.getElementById("painelCalendarioImpressao");

  if (campo) {
    campo.value = dataBR;
    campo.dispatchEvent(new Event("input", { bubbles: true }));
    campo.dispatchEvent(new Event("change", { bubbles: true }));
  }

  if (btn) {
    const numero = numeroBoletimDaDataV129(dataBR);
    btn.textContent = numero ? `Boletim nº ${numero} - ${dataBR}` : `Boletim de ${dataBR}`;
  }

  if (painel) {
    painel.classList.add("escondido");
  }
}

function configurarSelecaoCalendarioImpressaoV129() {
  const painel = document.getElementById("painelCalendarioImpressao");
  if (!painel || painel.dataset.selecaoV129 === "1") return;

  painel.dataset.selecaoV129 = "1";

  painel.addEventListener("click", (event) => {
    const alvo = event.target.closest("button, .dia, .calendario-dia, [data-data], [data-date]");
    if (!alvo || !painel.contains(alvo)) return;

    const dataBR = obterDataBRDoDiaCalendarioImpressaoV129(alvo);
    if (!dataBR) return;

    if (!existeNotaOuBoletimNaDataV129(dataBR)) return;

    event.preventDefault();
    event.stopPropagation();

    selecionarDataImpressaoV129(dataBR);
  }, true);
}

function reforcarDiasSelecionaveisImpressaoV129() {
  const painel = document.getElementById("painelCalendarioImpressao");
  if (!painel) return;

  painel.querySelectorAll("button, .dia, .calendario-dia, [data-data], [data-date]").forEach(el => {
    const dataBR = obterDataBRDoDiaCalendarioImpressaoV129(el);
    if (!dataBR) return;

    if (existeNotaOuBoletimNaDataV129(dataBR)) {
      el.disabled = false;
      el.removeAttribute("disabled");
      el.classList.add("dia-selecionavel-impressao-v129");
      el.style.pointerEvents = "auto";
      el.title = "Clique para selecionar este boletim";
    }
  });
}

const destacarDiasCalendarioImpressaoOriginalV129 = typeof destacarDiasCalendarioImpressaoV128 === "function"
  ? destacarDiasCalendarioImpressaoV128
  : null;

if (destacarDiasCalendarioImpressaoOriginalV129 && !window.destacarDiasCalendarioImpressaoV129Aplicado) {
  window.destacarDiasCalendarioImpressaoV129Aplicado = true;

  destacarDiasCalendarioImpressaoV128 = function(...args) {
    const resultado = destacarDiasCalendarioImpressaoOriginalV129.apply(this, args);
    reforcarDiasSelecionaveisImpressaoV129();
    configurarSelecaoCalendarioImpressaoV129();
    return resultado;
  };
}

document.addEventListener("DOMContentLoaded", () => {
  configurarSelecaoCalendarioImpressaoV129();
  setTimeout(() => {
    configurarSelecaoCalendarioImpressaoV129();
    reforcarDiasSelecionaveisImpressaoV129();
  }, 400);
  setTimeout(() => {
    configurarSelecaoCalendarioImpressaoV129();
    reforcarDiasSelecionaveisImpressaoV129();
  }, 1000);
});


/* v130 - impressão do boletim segue a ordem do menu lateral */
function normalizarOrdemMenuLateralV130(valor) {
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

function extrairNumeroOrdemV130(valor) {
  const texto = normalizarOrdemMenuLateralV130(valor);

  // Ex.: "1a parte", "2 parte", "3 - ..."
  const match = texto.match(/^(\d+)/);
  if (match) return Number(match[1]);

  return 9999;
}

function indiceMenuLateralV130(campo, valor) {
  const normalizado = normalizarOrdemMenuLateralV130(valor);
  if (!normalizado) return 9999;

  try {
    if (Array.isArray(window.estruturaMenu)) {
      const idx = window.estruturaMenu.findIndex(item => {
        const alvo = normalizarOrdemMenuLateralV130(item?.[campo] || item?.label || item?.nome || item?.id);
        return alvo && (alvo === normalizado || alvo.includes(normalizado) || normalizado.includes(alvo));
      });
      if (idx >= 0) return idx;
    }
  } catch {}

  try {
    if (Array.isArray(window.menuItens)) {
      const idx = window.menuItens.findIndex(item => {
        const alvo = normalizarOrdemMenuLateralV130(item?.[campo] || item?.label || item?.nome || item?.id);
        return alvo && (alvo === normalizado || alvo.includes(normalizado) || normalizado.includes(alvo));
      });
      if (idx >= 0) return idx;
    }
  } catch {}

  const numero = extrairNumeroOrdemV130(valor);
  if (numero !== 9999) return numero;

  return 9999;
}

function ordemParteImpressaoV130(nota) {
  try {
    if (typeof ordemParte === "function") return ordemParte(nota);
  } catch {}

  const parte = nota?.parte || "";
  const mapa = {
    "1a parte - servicos diarios": 1,
    "1 parte - servicos diarios": 1,
    "servicos diarios": 1,

    "2a parte - operacoes e instrucao": 2,
    "2 parte - operacoes e instrucao": 2,
    "operacoes e instrucao": 2,

    "3a parte - assuntos gerais e administrativos": 3,
    "3 parte - assuntos gerais e administrativos": 3,
    "assuntos gerais e administrativos": 3,

    "4a parte - justica e disciplina": 4,
    "4 parte - justica e disciplina": 4,
    "justica e disciplina": 4
  };

  const n = normalizarOrdemMenuLateralV130(parte);
  return mapa[n] || extrairNumeroOrdemV130(parte) || 9999;
}

function ordemSecaoImpressaoV130(nota) {
  try {
    if (typeof ordemSecao === "function") return ordemSecao(nota);
  } catch {}

  return indiceMenuLateralV130("secao", nota?.secao);
}

function ordemSubsecaoImpressaoV130(nota) {
  try {
    if (typeof ordemSubsecao === "function") return ordemSubsecao(nota);
  } catch {}

  return indiceMenuLateralV130("subsecao", nota?.subsecao);
}

function ordemInternaNotaImpressaoV130(nota) {
  const candidatos = [
    nota?.ordemInclusao,
    nota?.ordem,
    nota?.numero,
    nota?.numeroNota,
    nota?.id
  ];

  for (const valor of candidatos) {
    const n = Number(String(valor ?? "").replace(/\D/g, ""));
    if (Number.isFinite(n) && n > 0) return n;
  }

  return 9999;
}

function compararNotasOrdemMenuLateralV130(a, b) {
  const parte = ordemParteImpressaoV130(a) - ordemParteImpressaoV130(b);
  if (parte !== 0) return parte;

  const secao = ordemSecaoImpressaoV130(a) - ordemSecaoImpressaoV130(b);
  if (secao !== 0) return secao;

  const subsecao = ordemSubsecaoImpressaoV130(a) - ordemSubsecaoImpressaoV130(b);
  if (subsecao !== 0) return subsecao;

  const parteTexto = normalizarOrdemMenuLateralV130(a?.parte).localeCompare(normalizarOrdemMenuLateralV130(b?.parte));
  if (parteTexto !== 0) return parteTexto;

  const secaoTexto = normalizarOrdemMenuLateralV130(a?.secao).localeCompare(normalizarOrdemMenuLateralV130(b?.secao));
  if (secaoTexto !== 0) return secaoTexto;

  const subsecaoTexto = normalizarOrdemMenuLateralV130(a?.subsecao).localeCompare(normalizarOrdemMenuLateralV130(b?.subsecao));
  if (subsecaoTexto !== 0) return subsecaoTexto;

  return ordemInternaNotaImpressaoV130(a) - ordemInternaNotaImpressaoV130(b);
}

function ordenarNotasParaImpressaoComoMenuLateralV130(notas) {
  if (!Array.isArray(notas)) return notas;
  return [...notas].sort(compararNotasOrdemMenuLateralV130);
}

if (typeof confirmarImpressao === "function" && !window.confirmarImpressaoOriginalV130) {
  window.confirmarImpressaoOriginalV130 = confirmarImpressao;

  confirmarImpressao = function(...args) {
    const tipo = document.getElementById("tipoImpressao")?.value;

    // Para impressão por boletim/data específica, intercepta o fluxo para ordenar antes de montar.
    if (tipo === "boletim") {
      let notas = obterNotasBaseImpressao();

      const dataBR = document.getElementById("dataImpressao")?.value;
      if (!dataBR) {
        alert("Escolha a data do boletim.");
        return;
      }

      notas = notas.filter(n => n.data === dataBR);
      notas = ordenarNotasParaImpressaoComoMenuLateralV130(notas);

      if (!notas.length) {
        alert("Não há notas para imprimir com esses critérios.");
        return;
      }

      montarAreaImpressao(notas, criarTituloImpressao(tipo, notas));
      fecharModalImpressao();

      setTimeout(() => window.print(), 100);
      return;
    }

    return window.confirmarImpressaoOriginalV130.apply(this, args);
  };
}

// Reforço: agruparNotasParaImpressao também recebe notas já ordenadas.
if (typeof agruparNotasParaImpressao === "function" && !window.agruparNotasParaImpressaoOriginalV130) {
  window.agruparNotasParaImpressaoOriginalV130 = agruparNotasParaImpressao;

  agruparNotasParaImpressao = function(notas) {
    return window.agruparNotasParaImpressaoOriginalV130(ordenarNotasParaImpressaoComoMenuLateralV130(notas));
  };
}
