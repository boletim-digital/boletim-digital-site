
// v177 - corrige autocomplete de OBM em Incluir Nova Nota.
function normalizarObmBuscaV177(texto) {
  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°ª]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function escaparObmV177(texto) {
  try { return escapeHtml(texto); } catch {}
  return String(texto || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function obterEstruturaObmNotaV177() {
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
  if (!Array.isArray(dados.estruturaOrganizacional.cbas)) dados.estruturaOrganizacional.cbas = [];
  if (!Array.isArray(dados.estruturaOrganizacional.obms)) dados.estruturaOrganizacional.obms = [];

  return dados.estruturaOrganizacional;
}

function cbaDaObmV177(cbaId) {
  const estrutura = obterEstruturaObmNotaV177();
  return (estrutura.cbas || []).find(c => c.id === cbaId) || null;
}

function filtrarObmsNotaV177(termo) {
  const q = normalizarObmBuscaV177(termo);
  if (!q) return [];

  const estrutura = obterEstruturaObmNotaV177();

  return (estrutura.obms || [])
    .filter(obm => obm.ativo !== false)
    .filter(obm => {
      const campos = [
        obm.nome,
        obm.id,
        ...(obm.aliases || [])
      ].map(normalizarObmBuscaV177).join(" ");

      return campos.includes(q);
    })
    .slice(0, 10);
}

function posicionarSugestoesObmV177() {
  const input = document.getElementById("notaBoletimObmBusca");
  const box = document.getElementById("sugestoesNotaBoletimObm");
  if (!input || !box) return;

  const grupo = document.getElementById("grupoNotaBoletimObm");
  if (grupo && box.parentElement !== grupo) {
    grupo.appendChild(box);
  }
}

function mostrarSugestoesObmNotaV177() {
  const input = document.getElementById("notaBoletimObmBusca");
  const box = document.getElementById("sugestoesNotaBoletimObm");
  if (!input || !box) return;

  posicionarSugestoesObmV177();

  const termo = input.value;
  const resultados = filtrarObmsNotaV177(termo);

  box.innerHTML = "";

  if (!termo.trim()) {
    box.classList.add("escondido");
    input.dataset.obmId = "";
    return;
  }

  if (!resultados.length) {
    const vazio = document.createElement("div");
    vazio.className = "sugestao-obm-vazia-v177";
    vazio.textContent = "Nenhuma OBM encontrada.";
    box.appendChild(vazio);
    box.classList.remove("escondido");
    return;
  }

  resultados.forEach(obm => {
    const cba = cbaDaObmV177(obm.cbaId);

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sugestao-obm-nota-v177";
    btn.innerHTML = `
      <strong>${escaparObmV177(obm.nome)}</strong>
      <small>${escaparObmV177(cba?.nome || "Sem CBA vinculado")}</small>
    `;

    btn.addEventListener("mousedown", event => {
      // mousedown evita o blur do input esconder a lista antes da seleção.
      event.preventDefault();
    });

    btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();

      input.value = obm.nome;
      input.dataset.obmId = obm.id;

      box.classList.add("escondido");
      box.innerHTML = "";

      try {
        if (typeof aplicarBoletimEstruturadoAoFormularioV164 === "function") {
          aplicarBoletimEstruturadoAoFormularioV164();
        }
      } catch {}
    });

    box.appendChild(btn);
  });

  box.classList.remove("escondido");
}

function configurarAutocompleteObmNotaV177() {
  const tipo = document.getElementById("notaBoletimTipo");
  const input = document.getElementById("notaBoletimObmBusca");
  const box = document.getElementById("sugestoesNotaBoletimObm");
  const grupo = document.getElementById("grupoNotaBoletimObm");

  if (!tipo || !input || !box || !grupo) return;

  posicionarSugestoesObmV177();

  if (input.dataset.v177 !== "1") {
    input.dataset.v177 = "1";

    input.addEventListener("input", () => {
      input.dataset.obmId = "";
      mostrarSugestoesObmNotaV177();
      try {
        if (typeof aplicarBoletimEstruturadoAoFormularioV164 === "function") {
          aplicarBoletimEstruturadoAoFormularioV164();
        }
      } catch {}
    });

    input.addEventListener("focus", () => {
      if ((tipo.value || "") === "OBM") {
        mostrarSugestoesObmNotaV177();
      }
    });

    input.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        box.classList.add("escondido");
      }
    });

    input.addEventListener("blur", () => {
      setTimeout(() => {
        box.classList.add("escondido");
      }, 180);
    });
  }

  if (tipo.dataset.obmV177 !== "1") {
    tipo.dataset.obmV177 = "1";

    tipo.addEventListener("change", () => {
      if (tipo.value === "OBM") {
        grupo.classList.remove("escondido");
        grupo.style.display = "";
        grupo.style.visibility = "";
        setTimeout(mostrarSugestoesObmNotaV177, 80);
      } else {
        box.classList.add("escondido");
      }
    });
  }

  if (tipo.value === "OBM") {
    grupo.classList.remove("escondido");
    grupo.style.display = "";
    grupo.style.visibility = "";
  }
}

// Reaplica sempre que abrir a janela de nova nota/edição.
(function interceptarAberturaNotaV177() {
  try {
    if (typeof abrirModalNota === "function" && !window.abrirModalNotaOriginalV177) {
      window.abrirModalNotaOriginalV177 = abrirModalNota;
      abrirModalNota = function(...args) {
        const r = window.abrirModalNotaOriginalV177.apply(this, args);
        setTimeout(configurarAutocompleteObmNotaV177, 0);
        setTimeout(configurarAutocompleteObmNotaV177, 250);
        return r;
      };
    }
  } catch {}

  try {
    if (typeof editarNota === "function" && !window.editarNotaOriginalObmV177) {
      window.editarNotaOriginalObmV177 = editarNota;
      editarNota = function(...args) {
        const r = window.editarNotaOriginalObmV177.apply(this, args);
        setTimeout(configurarAutocompleteObmNotaV177, 0);
        setTimeout(configurarAutocompleteObmNotaV177, 250);
        return r;
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarAutocompleteObmNotaV177();
  setTimeout(configurarAutocompleteObmNotaV177, 300);
  setTimeout(configurarAutocompleteObmNotaV177, 1000);
});

document.addEventListener("input", event => {
  if (event.target && event.target.id === "notaBoletimObmBusca") {
    mostrarSugestoesObmNotaV177();
  }
}, true);

document.addEventListener("click", event => {
  const box = document.getElementById("sugestoesNotaBoletimObm");
  const input = document.getElementById("notaBoletimObmBusca");
  if (!box || !input) return;

  if (box.contains(event.target) || input.contains(event.target)) return;
  box.classList.add("escondido");
}, true);
