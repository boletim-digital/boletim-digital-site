
// v185 - persiste o Número do Boletim na inclusão e mantém a nota no topo.

function extrairNumeroBoletimTextoV185(texto) {
  const m = String(texto || "").match(/n[º°.]?\s*(\d+)/i);
  return m ? m[1] : "";
}

function obterNumeroBoletimAtualV185() {
  const direto = String(document.getElementById("notaBoletimNumero")?.value || "").trim();
  if (direto) return direto;

  const legado = String(document.getElementById("notaBoletim")?.value || "").trim();
  return extrairNumeroBoletimTextoV185(legado);
}

function montarTextoBoletimAtualV185() {
  const tipo = document.getElementById("notaBoletimTipo")?.value || "SEDEC";
  const numero = obterNumeroBoletimAtualV185();
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

function aplicarCamposBoletimNaNotaV185(nota) {
  if (!nota) return nota;

  const tipo = document.getElementById("notaBoletimTipo")?.value || nota.boletimTipo || "SEDEC";
  const numero = obterNumeroBoletimAtualV185() || nota.boletimNumero || extrairNumeroBoletimTextoV185(nota.boletim);
  const texto = montarTextoBoletimAtualV185();

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
    nota.boletimOrgaoId = sel?.value || nota.boletimOrgaoId || "";
    nota.boletimOrgaoNome = sel?.selectedOptions?.[0]?.textContent?.trim() || nota.boletimOrgaoNome || "";
    nota.boletimCbaId = sel?.value || nota.boletimCbaId || "";
    nota.boletimObmId = "";
  }

  if (tipo === "OBM") {
    const input = document.getElementById("notaBoletimObmBusca");
    nota.boletimOrgaoId = input?.dataset.obmId || nota.boletimOrgaoId || "";
    nota.boletimOrgaoNome = String(input?.value || "").trim() || nota.boletimOrgaoNome || "";
    nota.boletimCbaId = "";
    nota.boletimObmId = input?.dataset.obmId || nota.boletimObmId || "";
  }

  return nota;
}

function prepararCampoBoletimLegadoV185() {
  const legado = document.getElementById("notaBoletim");
  if (!legado) return;

  legado.required = false;
  legado.removeAttribute("required");
  legado.value = montarTextoBoletimAtualV185();
}

function preencherNumeroBoletimAoEditarV185(nota) {
  if (!nota) return;

  const campoNumero = document.getElementById("notaBoletimNumero");
  if (!campoNumero) return;

  const numero =
    String(nota.boletimNumero || "").trim() ||
    extrairNumeroBoletimTextoV185(nota.boletimTexto) ||
    extrairNumeroBoletimTextoV185(nota.boletim);

  campoNumero.value = numero;

  const tipo = document.getElementById("notaBoletimTipo");
  if (tipo && nota.boletimTipo) {
    tipo.value = nota.boletimTipo;
  }

  const legado = document.getElementById("notaBoletim");
  if (legado) {
    legado.required = false;
    legado.removeAttribute("required");
    legado.value = nota.boletim || nota.boletimTexto || montarTextoBoletimAtualV185();
  }
}

function dataNotaOrdenacaoV185(dataBR) {
  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return 0;
  return Number(`${m[3]}${String(m[2]).padStart(2, "0")}${String(m[1]).padStart(2, "0")}`);
}

function ordenarNotasDataInsercaoV185() {
  if (!window.dados || !Array.isArray(dados.notas)) return;

  dados.notas = dados.notas
    .map((nota, idx) => ({ nota, idx }))
    .sort((a, b) => {
      const da = dataNotaOrdenacaoV185(a.nota.data);
      const db = dataNotaOrdenacaoV185(b.nota.data);
      if (da !== db) return db - da;

      const ia = Number(a.nota.inseridoEm || a.nota.ordemInclusao || a.nota.criadoEm || 0);
      const ib = Number(b.nota.inseridoEm || b.nota.ordemInclusao || b.nota.criadoEm || 0);
      if (ia !== ib) return ib - ia;

      // Fallback: nota que estava mais acima no array permanece mais acima.
      return a.idx - b.idx;
    })
    .map(x => x.nota);
}

function corrigirUltimaNotaCriadaV185(antesIds) {
  const agora = Date.now();

  const criadas = (dados.notas || []).filter(n => !antesIds.has(n.id));
  const alvo = criadas[0];

  if (!alvo) return;

  alvo.criadoEm = alvo.criadoEm || agora;
  alvo.ordemInclusao = agora;
  alvo.inseridoEm = agora;

  aplicarCamposBoletimNaNotaV185(alvo);

  ordenarNotasDataInsercaoV185();

  try {
    if (typeof salvarNotasLocais === "function") salvarNotasLocais();
    else if (typeof salvarDados === "function") salvarDados();
  } catch {}

  try { renderizarNotas(); } catch {}
}

(function interceptarInclusaoV185() {
  try {
    if (typeof incluirNotaPeloFormulario === "function" && !window.incluirNotaPeloFormularioOriginalV185) {
      window.incluirNotaPeloFormularioOriginalV185 = incluirNotaPeloFormulario;

      incluirNotaPeloFormulario = function(...args) {
        prepararCampoBoletimLegadoV185();

        const antesIds = new Set((dados.notas || []).map(n => n.id));
        const r = window.incluirNotaPeloFormularioOriginalV185.apply(this, args);

        setTimeout(() => corrigirUltimaNotaCriadaV185(antesIds), 0);
        setTimeout(() => corrigirUltimaNotaCriadaV185(antesIds), 80);

        return r;
      };

      window.incluirNotaPeloFormulario = incluirNotaPeloFormulario;
    }
  } catch {}
})();

(function interceptarEdicaoV185() {
  try {
    if (typeof editarNota === "function" && !window.editarNotaOriginalV185) {
      window.editarNotaOriginalV185 = editarNota;

      editarNota = function(id) {
        const r = window.editarNotaOriginalV185.apply(this, arguments);
        setTimeout(() => {
          const nota = (dados.notas || []).find(n => String(n.id) === String(id));
          preencherNumeroBoletimAoEditarV185(nota);
        }, 60);
        setTimeout(() => {
          const nota = (dados.notas || []).find(n => String(n.id) === String(id));
          preencherNumeroBoletimAoEditarV185(nota);
        }, 180);
        return r;
      };

      window.editarNota = editarNota;
    }
  } catch {}
})();

(function reforcarRenderV185() {
  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV185) {
      window.renderizarNotasOriginalV185 = renderizarNotas;

      renderizarNotas = function(...args) {
        ordenarNotasDataInsercaoV185();
        return window.renderizarNotasOriginalV185.apply(this, args);
      };
    }
  } catch {}
})();

function configurarBoletimPersistenteV185() {
  const legado = document.getElementById("notaBoletim");
  if (legado) {
    legado.required = false;
    legado.removeAttribute("required");
  }

  ["notaBoletimTipo", "notaBoletimCba", "notaBoletimObmBusca", "notaBoletimNumero"].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.v185 === "1") return;
    el.dataset.v185 = "1";
    el.addEventListener("input", prepararCampoBoletimLegadoV185, true);
    el.addEventListener("change", prepararCampoBoletimLegadoV185, true);
  });

  prepararCampoBoletimLegadoV185();
}

document.addEventListener("DOMContentLoaded", () => {
  configurarBoletimPersistenteV185();
  ordenarNotasDataInsercaoV185();

  setTimeout(configurarBoletimPersistenteV185, 300);
  setTimeout(configurarBoletimPersistenteV185, 1000);
});

document.addEventListener("submit", event => {
  if (event.target && event.target.id === "formNota") {
    prepararCampoBoletimLegadoV185();
  }
}, true);
