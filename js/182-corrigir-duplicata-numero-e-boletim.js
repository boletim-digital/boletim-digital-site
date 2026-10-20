
// v182 - impede duplicata de Número da Nota e corrige boletim na criação.

function numeroNotaJaExisteV182(numero, ignorarId = "") {
  const n = String(numero || "").trim();
  if (!n) return false;

  try {
    return (dados.notas || []).some(nota => {
      if (ignorarId && String(nota.id) === String(ignorarId)) return false;
      return String(nota.numero || "").trim() === n;
    });
  } catch {
    return false;
  }
}

function montarTextoBoletimV182() {
  const tipo = document.getElementById("notaBoletimTipo")?.value || "SEDEC";
  const numeroBoletim = String(document.getElementById("notaBoletimNumero")?.value || "").trim();
  const sufixo = numeroBoletim ? ` nº ${numeroBoletim}` : "";

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

function aplicarBoletimNoCampoLegadoV182() {
  const legado = document.getElementById("notaBoletim");
  if (!legado) return montarTextoBoletimV182();

  legado.required = false;
  legado.removeAttribute("required");
  legado.value = montarTextoBoletimV182();

  return legado.value;
}

function aplicarDadosBoletimNaNotaV182(nota) {
  if (!nota) return nota;

  const tipo = document.getElementById("notaBoletimTipo")?.value || "SEDEC";
  const numeroBoletim = String(document.getElementById("notaBoletimNumero")?.value || "").trim();
  const texto = montarTextoBoletimV182();

  nota.boletim = texto;
  nota.boletimTexto = texto;
  nota.boletimTipo = tipo;
  nota.boletimNumero = numeroBoletim;

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

function validarDuplicataNumeroNotaV182() {
  const numero = String(document.getElementById("notaNumero")?.value || "").trim();
  const editandoId = document.getElementById("formNota")?.dataset.editandoId || "";

  if (!numero) return true;

  if (numeroNotaJaExisteV182(numero, editandoId)) {
    alert("Já existe uma nota com esse Número da Nota. Use outro número ou edite a nota existente.");
    const campo = document.getElementById("notaNumero");
    if (campo) {
      campo.classList.add("campo-obrigatorio-erro-v181");
      campo.focus();
      campo.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => campo.classList.remove("campo-obrigatorio-erro-v181"), 1800);
    }
    return false;
  }

  return true;
}

function dataInputParaBRV182(valor) {
  try {
    if (typeof dataInputParaBR === "function") return dataInputParaBR(valor);
  } catch {}

  const m = String(valor || "").match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : String(valor || "");
}

function coletarAnexosNotaV182() {
  return Array.from(document.querySelectorAll(".campo-anexo")).map((campo, index) => {
    const tituloAnexo = campo.querySelector(".anexo-titulo")?.value.trim() || "";
    const textoAnexo = campo.querySelector(".anexo-editor")?.innerHTML.trim() || "";
    if (!tituloAnexo && !textoAnexo) return null;
    return { titulo: tituloAnexo || `Anexo ${index + 1}`, texto: textoAnexo };
  }).filter(Boolean);
}

function extrairNumeroBoletimV182(boletim) {
  try {
    if (typeof extrairNumeroBoletim === "function") return extrairNumeroBoletim(boletim);
  } catch {}

  const m = String(boletim || "").match(/n[º°.]?\s*(\d+)/i);
  return m ? m[1] : "";
}

function ordenarNotasV182() {
  try {
    if (typeof ordenarNotasPorDataEInsercaoV180 === "function") {
      ordenarNotasPorDataEInsercaoV180();
      return;
    }
  } catch {}

  function dataOrd(dataBR) {
    const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (!m) return 0;
    return Number(`${m[3]}${String(m[2]).padStart(2, "0")}${String(m[1]).padStart(2, "0")}`);
  }

  (dados.notas || []).sort((a, b) => {
    const da = dataOrd(a.data);
    const db = dataOrd(b.data);
    if (da !== db) return db - da;

    return Number(b.inseridoEm || b.criadoEm || 0) - Number(a.inseridoEm || a.criadoEm || 0);
  });
}

function incluirNotaPeloFormularioV182() {
  if (!podeIncluirNota()) {
    negarAcesso("Você não tem permissão para incluir notas.");
    return false;
  }

  try {
    if (typeof validarCamposObrigatoriosNotaV181 === "function" && !validarCamposObrigatoriosNotaV181()) {
      return false;
    }
  } catch {}

  if (!validarDuplicataNumeroNotaV182()) return false;

  const numero = document.getElementById("notaNumero").value.trim();
  const editandoId = document.getElementById("formNota").dataset.editandoId;

  const titulo = document.getElementById("notaTitulo").value.trim();
  const parte = document.getElementById("notaParte").value.trim();
  const secao = document.getElementById("notaSecao").value.trim();
  const subsecao = document.getElementById("notaSubsecao").value.trim();

  // Ponto principal: monta o boletim ANTES de criar a nota.
  const boletim = aplicarBoletimNoCampoLegadoV182();

  const dataNota = dataInputParaBRV182(document.getElementById("notaData").value);
  const texto = document.getElementById("notaTextoEditor").innerHTML.trim();
  const anexos = coletarAnexosNotaV182();

  let novaNota;

  if (editandoId) {
    novaNota = dados.notas.find(n => n.id === editandoId);
    const notaAntes = { ...novaNota };

    Object.assign(novaNota, {
      numero,
      titulo,
      parte,
      secao,
      subsecao,
      boletim,
      data: dataNota,
      texto,
      anexos,
      editadoEm: Date.now()
    });

    aplicarDadosBoletimNaNotaV182(novaNota);

    registrarAuditoria("EDITOU_NOTA", { antes: notaAntes, depois: { ...novaNota } });
    delete document.getElementById("formNota").dataset.editandoId;
  } else {
    novaNota = {
      id: `nota-manual-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ordemInclusao: Date.now(),
      criadoEm: Date.now(),
      inseridoEm: Date.now(),
      numero,
      titulo,
      parte,
      secao,
      subsecao,
      boletim,
      data: dataNota,
      texto,
      anexos
    };

    aplicarDadosBoletimNaNotaV182(novaNota);

    dados.notas = dados.notas || [];
    dados.notas.unshift(novaNota);

    registrarAuditoria("CRIOU_NOTA", novaNota);
  }

  const numeroBoletim = extrairNumeroBoletimV182(novaNota.boletim);
  if (numeroBoletim && !(dados.boletins || []).some(b => b.numero === numeroBoletim)) {
    dados.boletins = dados.boletins || [];
    dados.boletins.push({ numero: numeroBoletim, data: dataNota, titulo: novaNota.boletim });
    try { prepararTopo(); } catch {}
    try { prepararCalendario(); } catch {}
  }

  ordenarNotasV182();

  try { salvarNotasLocais(); } catch {
    try { salvarDados(); } catch {}
  }

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
  ordenarNotasV182();
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

  return true;
}

function configurarInclusaoNotaV182() {
  // Substitui a função antiga por uma versão coerente com boletim estruturado.
  window.incluirNotaPeloFormulario = incluirNotaPeloFormularioV182;
  try { incluirNotaPeloFormulario = incluirNotaPeloFormularioV182; } catch {}

  const form = document.getElementById("formNota");
  if (form && form.dataset.v182 !== "1") {
    form.dataset.v182 = "1";
    form.addEventListener("submit", event => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      incluirNotaPeloFormularioV182();
      return false;
    }, true);
  }

  const campoNumero = document.getElementById("notaNumero");
  if (campoNumero && campoNumero.dataset.v182 !== "1") {
    campoNumero.dataset.v182 = "1";
    campoNumero.addEventListener("blur", validarDuplicataNumeroNotaV182);
  }

  ["notaBoletimTipo", "notaBoletimCba", "notaBoletimObmBusca", "notaBoletimNumero"].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.v182b === "1") return;
    el.dataset.v182b = "1";
    el.addEventListener("input", aplicarBoletimNoCampoLegadoV182);
    el.addEventListener("change", aplicarBoletimNoCampoLegadoV182);
  });

  aplicarBoletimNoCampoLegadoV182();
}

document.addEventListener("DOMContentLoaded", () => {
  configurarInclusaoNotaV182();
  setTimeout(configurarInclusaoNotaV182, 300);
  setTimeout(configurarInclusaoNotaV182, 1000);
});
