
// v176 - corrige exibição da lista CBA em Incluir Nova Nota.
function obterEstruturaBoletimV176() {
  try {
    if (typeof obterEstruturaOrganizacionalV172 === "function") {
      return obterEstruturaOrganizacionalV172();
    }
  } catch {}

  try {
    if (typeof garantirEstruturaOrganizacionalV164 === "function") {
      return garantirEstruturaOrganizacionalV164();
    }
  } catch {}

  if (!window.dados) window.dados = {};
  if (!dados.estruturaOrganizacional) dados.estruturaOrganizacional = {};
  if (!Array.isArray(dados.estruturaOrganizacional.cbas)) {
    dados.estruturaOrganizacional.cbas = [
      { id: "cba-i", nome: "CBA I", ativo: true },
      { id: "cba-ii", nome: "CBA II", ativo: true },
      { id: "cba-iii", nome: "CBA III", ativo: true }
    ];
  }
  if (!Array.isArray(dados.estruturaOrganizacional.obms)) {
    dados.estruturaOrganizacional.obms = [];
  }
  return dados.estruturaOrganizacional;
}

function escBoletimV176(texto) {
  try { return escapeHtml(texto); } catch {}
  return String(texto || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function preencherSelectCbaNotaV176(valorAnterior) {
  const select = document.getElementById("notaBoletimCba");
  if (!select) return;

  const estrutura = obterEstruturaBoletimV176();
  const cbas = (estrutura.cbas || []).filter(c => c.ativo !== false);

  select.innerHTML = cbas.length
    ? cbas.map(c => `<option value="${escBoletimV176(c.id)}">${escBoletimV176(c.nome)}</option>`).join("")
    : `<option value="">Cadastre um CBA em Estrutura Organizacional</option>`;

  if (valorAnterior && Array.from(select.options).some(o => o.value === valorAnterior)) {
    select.value = valorAnterior;
  }
}

function atualizarCamposTipoBoletimV176() {
  const tipo = document.getElementById("notaBoletimTipo")?.value || "SEDEC";
  const grupoCba = document.getElementById("grupoNotaBoletimCba");
  const grupoObm = document.getElementById("grupoNotaBoletimObm");
  const selectCba = document.getElementById("notaBoletimCba");

  const valorCba = selectCba?.value || "";

  if (grupoCba) {
    grupoCba.classList.toggle("escondido", tipo !== "CBA");
    grupoCba.style.display = tipo === "CBA" ? "" : "none";
    grupoCba.style.visibility = tipo === "CBA" ? "" : "hidden";
  }

  if (grupoObm) {
    grupoObm.classList.toggle("escondido", tipo !== "OBM");
    grupoObm.style.display = tipo === "OBM" ? "" : "none";
    grupoObm.style.visibility = tipo === "OBM" ? "" : "hidden";
  }

  if (tipo === "CBA") {
    preencherSelectCbaNotaV176(valorCba);
  }

  try {
    if (typeof aplicarBoletimEstruturadoAoFormularioV164 === "function") {
      aplicarBoletimEstruturadoAoFormularioV164();
    }
  } catch {}
}

function configurarTipoBoletimCbaV176() {
  const tipo = document.getElementById("notaBoletimTipo");
  const selectCba = document.getElementById("notaBoletimCba");

  if (!tipo) return;

  if (tipo.dataset.v176 !== "1") {
    tipo.dataset.v176 = "1";
    tipo.addEventListener("change", atualizarCamposTipoBoletimV176);
    tipo.addEventListener("input", atualizarCamposTipoBoletimV176);
  }

  if (selectCba && selectCba.dataset.v176 !== "1") {
    selectCba.dataset.v176 = "1";
    selectCba.addEventListener("change", () => {
      try {
        if (typeof aplicarBoletimEstruturadoAoFormularioV164 === "function") {
          aplicarBoletimEstruturadoAoFormularioV164();
        }
      } catch {}
    });
  }

  atualizarCamposTipoBoletimV176();
}

// Sempre que abrir a janela de nota, reaplica o comportamento.
(function interceptarAbrirModalNotaV176() {
  try {
    if (typeof abrirModalNota === "function" && !window.abrirModalNotaOriginalV176) {
      window.abrirModalNotaOriginalV176 = abrirModalNota;
      abrirModalNota = function(...args) {
        const r = window.abrirModalNotaOriginalV176.apply(this, args);
        setTimeout(configurarTipoBoletimCbaV176, 0);
        setTimeout(configurarTipoBoletimCbaV176, 200);
        return r;
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarTipoBoletimCbaV176();
  setTimeout(configurarTipoBoletimCbaV176, 300);
  setTimeout(configurarTipoBoletimCbaV176, 1000);
});

document.addEventListener("change", (event) => {
  if (event.target && event.target.id === "notaBoletimTipo") {
    atualizarCamposTipoBoletimV176();
  }
}, true);
