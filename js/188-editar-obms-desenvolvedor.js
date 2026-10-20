
// v188 - Desenvolvedor pode editar OBMs na Estrutura Organizacional.
let obmEditandoIdV188 = "";

function perfilEhDesenvolvedorV188() {
  try {
    const perfil = typeof perfilAtual === "function"
      ? perfilAtual()
      : sessionStorage.getItem("boletimDigitalPerfil");

    return String(perfil || "").toLowerCase() === "desenvolvedor";
  } catch {
    return false;
  }
}

function obterEstruturaV188() {
  try {
    if (typeof obterEstruturaOrganizacionalV172 === "function") {
      return obterEstruturaOrganizacionalV172();
    }
  } catch {}

  if (!window.dados) window.dados = {};
  if (!dados.estruturaOrganizacional) dados.estruturaOrganizacional = {};
  if (!Array.isArray(dados.estruturaOrganizacional.cbas)) dados.estruturaOrganizacional.cbas = [];
  if (!Array.isArray(dados.estruturaOrganizacional.obms)) dados.estruturaOrganizacional.obms = [];

  return dados.estruturaOrganizacional;
}

function salvarEstruturaV188() {
  try {
    if (typeof salvarEstruturaOrganizacionalV172 === "function") {
      salvarEstruturaOrganizacionalV172();
      return;
    }
  } catch {}

  try {
    if (typeof salvarDados === "function") salvarDados();
    else if (typeof salvarNotasLocais === "function") salvarNotasLocais();
    else localStorage.setItem("boletimDigitalDados", JSON.stringify(dados));
  } catch {}
}

function slugObmV188(texto) {
  try {
    if (typeof slugEstruturaV172 === "function") return slugEstruturaV172(texto);
  } catch {}

  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°ª]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function normObmV188(texto) {
  try {
    if (typeof normEstruturaV172 === "function") return normEstruturaV172(texto);
  } catch {}

  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°ª]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function escObmV188(texto) {
  try {
    if (typeof escEstruturaV172 === "function") return escEstruturaV172(texto);
  } catch {}

  return String(texto || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function preencherFormularioEdicaoObmV188(obm) {
  if (!obm) return;

  obmEditandoIdV188 = obm.id;

  const nome = document.getElementById("novaObmNome");
  const cba = document.getElementById("novaObmCba");
  const aliases = document.getElementById("novaObmAliases");
  const btn = document.getElementById("btnAdicionarObm");

  if (nome) nome.value = obm.nome || "";
  if (cba) cba.value = obm.cbaId || "";
  if (aliases) aliases.value = (obm.aliases || []).join(", ");

  if (btn) {
    btn.textContent = "Salvar alterações da OBM";
    btn.classList.add("editando-obm-v188");
  }

  let aviso = document.getElementById("avisoEdicaoObmV188");
  if (!aviso) {
    aviso = document.createElement("div");
    aviso.id = "avisoEdicaoObmV188";
    aviso.className = "aviso-edicao-obm-v188";

    const form = document.querySelector("#paginaEstruturaOrganizacional .estrutura-form-obm-v172");
    if (form) form.insertAdjacentElement("beforebegin", aviso);
  }

  if (aviso) {
    aviso.innerHTML = `
      <span>Editando OBM: <strong>${escObmV188(obm.nome || "")}</strong></span>
      <button type="button" id="btnCancelarEdicaoObmV188">Cancelar edição</button>
    `;
    aviso.classList.remove("escondido");
  }

  setTimeout(() => {
    try {
      nome?.focus();
      nome?.scrollIntoView({ behavior: "smooth", block: "center" });
    } catch {}
  }, 0);
}

function cancelarEdicaoObmV188() {
  obmEditandoIdV188 = "";

  const nome = document.getElementById("novaObmNome");
  const aliases = document.getElementById("novaObmAliases");
  const btn = document.getElementById("btnAdicionarObm");
  const aviso = document.getElementById("avisoEdicaoObmV188");

  if (nome) nome.value = "";
  if (aliases) aliases.value = "";
  if (btn) {
    btn.textContent = "Adicionar OBM";
    btn.classList.remove("editando-obm-v188");
  }
  if (aviso) aviso.classList.add("escondido");
}

function salvarEdicaoObmV188() {
  const estrutura = obterEstruturaV188();
  const obm = estrutura.obms.find(o => o.id === obmEditandoIdV188);

  if (!obm) {
    cancelarEdicaoObmV188();
    return false;
  }

  const nomeEl = document.getElementById("novaObmNome");
  const cbaEl = document.getElementById("novaObmCba");
  const aliasesEl = document.getElementById("novaObmAliases");

  const nome = String(nomeEl?.value || "").trim();
  const cbaId = String(cbaEl?.value || "").trim();
  const aliases = String(aliasesEl?.value || "")
    .split(",")
    .map(a => a.trim())
    .filter(Boolean);

  if (!nome) {
    alert("Informe o nome da OBM.");
    nomeEl?.focus();
    return false;
  }

  if (!cbaId) {
    alert("Escolha o CBA vinculado à OBM.");
    cbaEl?.focus();
    return false;
  }

  const duplicada = estrutura.obms.some(o =>
    o.id !== obm.id &&
    normObmV188(o.nome) === normObmV188(nome)
  );

  if (duplicada) {
    alert("Já existe outra OBM com esse nome.");
    nomeEl?.focus();
    return false;
  }

  // Mantém o ID original para não quebrar notas antigas/filtros.
  obm.nome = nome;
  obm.cbaId = cbaId;
  obm.aliases = aliases;
  obm.ativo = obm.ativo !== false;

  salvarEstruturaV188();
  cancelarEdicaoObmV188();

  try {
    if (typeof renderizarEstruturaOrganizacionalV173 === "function") renderizarEstruturaOrganizacionalV173();
    else if (typeof renderizarEstruturaOrganizacionalV172 === "function") renderizarEstruturaOrganizacionalV172();
    else if (typeof renderizarEstruturaOrganizacionalV164 === "function") renderizarEstruturaOrganizacionalV164();
  } catch {}

  setTimeout(configurarEditarObmsV188, 80);
  return true;
}

function adicionarBotoesEditarObmV188() {
  if (!perfilEhDesenvolvedorV188()) return;

  const estrutura = obterEstruturaV188();

  document.querySelectorAll("#listaObmsEstrutura .estrutura-item-v172[data-obm-id]").forEach(item => {
    if (item.querySelector("[data-acao='editar-obm-v188']")) return;

    const id = item.dataset.obmId;
    const obm = estrutura.obms.find(o => o.id === id);
    if (!obm) return;

    const acoes = item.querySelector(".estrutura-acoes-v172") || item;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.acao = "editar-obm-v188";
    btn.dataset.obmId = id;
    btn.textContent = "Editar";
    btn.className = "btn-editar-obm-v188";

    acoes.insertBefore(btn, acoes.firstChild);
  });
}

function configurarEditarObmsV188() {
  if (!perfilEhDesenvolvedorV188()) {
    const aviso = document.getElementById("avisoEdicaoObmV188");
    if (aviso) aviso.classList.add("escondido");
    return;
  }

  adicionarBotoesEditarObmV188();

  const pagina = document.getElementById("paginaEstruturaOrganizacional");
  if (pagina && pagina.dataset.editarObmV188 !== "1") {
    pagina.dataset.editarObmV188 = "1";

    pagina.addEventListener("click", event => {
      const btn = event.target.closest("button");
      if (!btn || !pagina.contains(btn)) return;

      if (btn.dataset.acao === "editar-obm-v188") {
        event.preventDefault();
        event.stopPropagation();

        const estrutura = obterEstruturaV188();
        const obm = estrutura.obms.find(o => o.id === btn.dataset.obmId);

        if (obm) preencherFormularioEdicaoObmV188(obm);
        return;
      }

      if (btn.id === "btnCancelarEdicaoObmV188") {
        event.preventDefault();
        event.stopPropagation();
        cancelarEdicaoObmV188();
        return;
      }

      if (btn.id === "btnAdicionarObm" && obmEditandoIdV188) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        salvarEdicaoObmV188();
        return false;
      }
    }, true);
  }

  const btnAdicionar = document.getElementById("btnAdicionarObm");
  if (btnAdicionar && btnAdicionar.dataset.v188 !== "1") {
    btnAdicionar.dataset.v188 = "1";

    btnAdicionar.addEventListener("click", event => {
      if (!obmEditandoIdV188) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      salvarEdicaoObmV188();
      return false;
    }, true);
  }
}

// Reaplica após renderizações da estrutura.
(function reforcarRenderEstruturaV188() {
  ["renderizarEstruturaOrganizacionalV164", "renderizarEstruturaOrganizacionalV172", "renderizarEstruturaOrganizacionalV173"].forEach(nome => {
    try {
      const fn = window[nome] || (typeof globalThis !== "undefined" ? globalThis[nome] : null);
      if (typeof fn === "function" && !fn.__v188) {
        const original = fn;
        const wrapper = function(...args) {
          const r = original.apply(this, args);
          setTimeout(configurarEditarObmsV188, 0);
          setTimeout(configurarEditarObmsV188, 120);
          return r;
        };
        wrapper.__v188 = true;
        window[nome] = wrapper;
        try { eval(`${nome} = window["${nome}"];`); } catch {}
      }
    } catch {}
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarEditarObmsV188();
  setTimeout(configurarEditarObmsV188, 300);
  setTimeout(configurarEditarObmsV188, 1000);
});

// Quando entrar na página de estrutura, reaplica os botões.
document.addEventListener("click", event => {
  if (event.target?.closest?.("#btnEstruturaOrganizacional")) {
    setTimeout(configurarEditarObmsV188, 200);
    setTimeout(configurarEditarObmsV188, 600);
  }
}, true);
