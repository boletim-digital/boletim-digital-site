
// v186 - última nota incluída no topo da data + popup para número duplicado.

function dataNotaOrdemV186(dataBR) {
  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return 0;

  const dia = String(m[1]).padStart(2, "0");
  const mes = String(m[2]).padStart(2, "0");
  const ano = String(m[3]);

  return Number(`${ano}${mes}${dia}`);
}

function timestampInclusaoNotaV186(nota, indiceFallback = 0) {
  if (!nota || typeof nota !== "object") return 0;

  const candidatos = [
    nota.inseridoEm,
    nota.ordemInclusao,
    nota.criadoEm,
    nota.timestamp,
    nota.createdAt
  ];

  for (const valor of candidatos) {
    const n = Number(valor);
    if (Number.isFinite(n) && n > 0) return n;
  }

  // Para notas antigas sem carimbo, preserva aproximadamente a ordem atual.
  return 1000000 - indiceFallback;
}

function ordenarNotasV186() {
  if (!window.dados || !Array.isArray(dados.notas)) return;

  dados.notas = dados.notas
    .map((nota, indiceOriginal) => ({ nota, indiceOriginal }))
    .sort((a, b) => {
      const dataA = dataNotaOrdemV186(a.nota.data);
      const dataB = dataNotaOrdemV186(b.nota.data);

      if (dataA !== dataB) return dataB - dataA;

      const incA = timestampInclusaoNotaV186(a.nota, a.indiceOriginal);
      const incB = timestampInclusaoNotaV186(b.nota, b.indiceOriginal);

      if (incA !== incB) return incB - incA;

      return a.indiceOriginal - b.indiceOriginal;
    })
    .map(item => item.nota);
}

function marcarNotaCriadaComoMaisRecenteV186(antesIds) {
  const agora = Date.now();

  const novas = (dados.notas || []).filter(nota => !antesIds.has(nota.id));

  novas.forEach(nota => {
    nota.criadoEm = nota.criadoEm || agora;
    nota.ordemInclusao = agora;
    nota.inseridoEm = agora;
  });

  ordenarNotasV186();

  try {
    if (typeof salvarNotasLocais === "function") salvarNotasLocais();
    else if (typeof salvarDados === "function") salvarDados();
  } catch {}

  try { renderizarNotas(); } catch {}
}

// Reforça a inclusão: depois que qualquer função antiga criar a nota,
// a nova nota recebe o maior carimbo e a lista é renderizada ordenada.
(function reforcarInclusaoTopoV186() {
  try {
    if (typeof incluirNotaPeloFormulario === "function" && !window.incluirNotaPeloFormularioOriginalV186) {
      window.incluirNotaPeloFormularioOriginalV186 = incluirNotaPeloFormulario;

      incluirNotaPeloFormulario = function(...args) {
        const antesIds = new Set((dados.notas || []).map(n => n.id));

        const resultado = window.incluirNotaPeloFormularioOriginalV186.apply(this, args);

        setTimeout(() => marcarNotaCriadaComoMaisRecenteV186(antesIds), 0);
        setTimeout(() => marcarNotaCriadaComoMaisRecenteV186(antesIds), 120);

        return resultado;
      };

      window.incluirNotaPeloFormulario = incluirNotaPeloFormulario;
    }
  } catch {}
})();

// Reforça qualquer renderização.
(function reforcarRenderOrdemV186() {
  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV186) {
      window.renderizarNotasOriginalV186 = renderizarNotas;

      renderizarNotas = function(...args) {
        ordenarNotasV186();
        return window.renderizarNotasOriginalV186.apply(this, args);
      };
    }
  } catch {}

  try {
    ordenarNotas = function(a, b) {
      const dataA = dataNotaOrdemV186(a?.data);
      const dataB = dataNotaOrdemV186(b?.data);

      if (dataA !== dataB) return dataB - dataA;

      const incA = timestampInclusaoNotaV186(a, 0);
      const incB = timestampInclusaoNotaV186(b, 0);

      return incB - incA;
    };
  } catch {}
})();

function numeroNotaDuplicadoV186(numero, ignorarId = "") {
  const valor = String(numero || "").trim();
  if (!valor) return false;

  return (dados.notas || []).some(nota => {
    if (ignorarId && String(nota.id) === String(ignorarId)) return false;
    return String(nota.numero || "").trim() === valor;
  });
}

function validarDuplicataNumeroNotaPopupV186() {
  const campo = document.getElementById("notaNumero");
  const form = document.getElementById("formNota");

  const numero = String(campo?.value || "").trim();
  const editandoId = form?.dataset.editandoId || "";

  if (!numero) return true;

  if (numeroNotaDuplicadoV186(numero, editandoId)) {
    alert("Já existe uma nota com esse Número da Nota. Use outro número ou edite a nota existente.");

    if (campo) {
      campo.classList.add("campo-obrigatorio-erro-v181");
      try {
        campo.focus();
        campo.select();
        campo.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {}

      setTimeout(() => {
        campo.classList.remove("campo-obrigatorio-erro-v181", "campo-duplicado-v183");
      }, 1800);
    }

    // Oculta eventual mensagem inline antiga.
    const inline = document.getElementById("erroNumeroNotaDuplicadoV183");
    if (inline) inline.classList.add("escondido");

    return false;
  }

  return true;
}

// Troca as validações antigas para popup.
window.validarDuplicataNumeroNotaV182 = validarDuplicataNumeroNotaPopupV186;
window.validarDuplicataNumeroNotaV183 = validarDuplicataNumeroNotaPopupV186;

function configurarDuplicataPopupV186() {
  const form = document.getElementById("formNota");
  const campo = document.getElementById("notaNumero");

  // Remove comportamento inline no uso normal.
  const inline = document.getElementById("erroNumeroNotaDuplicadoV183");
  if (inline) inline.classList.add("escondido");

  if (campo && campo.dataset.v186 !== "1") {
    campo.dataset.v186 = "1";

    campo.addEventListener("input", () => {
      campo.classList.remove("campo-duplicado-v183", "campo-obrigatorio-erro-v181");
      const inline = document.getElementById("erroNumeroNotaDuplicadoV183");
      if (inline) inline.classList.add("escondido");
    });
  }

  if (form && form.dataset.popupDuplicataV186 !== "1") {
    form.dataset.popupDuplicataV186 = "1";

    form.addEventListener("submit", event => {
      if (!validarDuplicataNumeroNotaPopupV186()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  ordenarNotasV186();
  configurarDuplicataPopupV186();

  setTimeout(() => {
    ordenarNotasV186();
    configurarDuplicataPopupV186();
    try { renderizarNotas(); } catch {}
  }, 300);

  setTimeout(configurarDuplicataPopupV186, 1000);
});
