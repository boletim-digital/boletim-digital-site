
// v189 - corrige edição de OBM para não criar duplicata.

function obterObmEditandoIdV189() {
  try {
    return String(window.obmEditandoIdV188 || obmEditandoIdV188 || "").trim();
  } catch {
    return "";
  }
}

function definirObmEditandoIdV189(id) {
  try { window.obmEditandoIdV188 = id || ""; } catch {}
  try { obmEditandoIdV188 = id || ""; } catch {}
}

function obterEstruturaV189() {
  try {
    if (typeof obterEstruturaV188 === "function") return obterEstruturaV188();
  } catch {}

  try {
    if (typeof obterEstruturaOrganizacionalV172 === "function") return obterEstruturaOrganizacionalV172();
  } catch {}

  if (!window.dados) window.dados = {};
  if (!dados.estruturaOrganizacional) dados.estruturaOrganizacional = {};
  if (!Array.isArray(dados.estruturaOrganizacional.cbas)) dados.estruturaOrganizacional.cbas = [];
  if (!Array.isArray(dados.estruturaOrganizacional.obms)) dados.estruturaOrganizacional.obms = [];

  return dados.estruturaOrganizacional;
}

function salvarEstruturaV189() {
  try {
    if (typeof salvarEstruturaV188 === "function") {
      salvarEstruturaV188();
      return;
    }
  } catch {}

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

function normalizarObmV189(texto) {
  try {
    if (typeof normObmV188 === "function") return normObmV188(texto);
  } catch {}

  return String(texto || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°ª]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function salvarEdicaoObmSemDuplicarV189() {
  const id = obterObmEditandoIdV189();

  if (!id) return false;

  const estrutura = obterEstruturaV189();
  const obm = estrutura.obms.find(o => String(o.id) === String(id));

  if (!obm) {
    definirObmEditandoIdV189("");
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
    return true;
  }

  if (!cbaId) {
    alert("Escolha o CBA vinculado à OBM.");
    cbaEl?.focus();
    return true;
  }

  const duplicada = estrutura.obms.some(o =>
    String(o.id) !== String(id) &&
    normalizarObmV189(o.nome) === normalizarObmV189(nome)
  );

  if (duplicada) {
    alert("Já existe outra OBM com esse nome.");
    nomeEl?.focus();
    return true;
  }

  // Atualiza a OBM existente, sem criar outra.
  obm.nome = nome;
  obm.cbaId = cbaId;
  obm.aliases = aliases;
  obm.ativo = obm.ativo !== false;

  salvarEstruturaV189();

  try {
    if (typeof cancelarEdicaoObmV188 === "function") cancelarEdicaoObmV188();
    else definirObmEditandoIdV189("");
  } catch {
    definirObmEditandoIdV189("");
  }

  try {
    if (typeof renderizarEstruturaOrganizacionalV173 === "function") renderizarEstruturaOrganizacionalV173();
    else if (typeof renderizarEstruturaOrganizacionalV172 === "function") renderizarEstruturaOrganizacionalV172();
    else if (typeof renderizarEstruturaOrganizacionalV164 === "function") renderizarEstruturaOrganizacionalV164();
  } catch {}

  setTimeout(() => {
    try { configurarEditarObmsV188(); } catch {}
    try { configurarEdicaoObmSemDuplicarV189(); } catch {}
  }, 120);

  return true;
}

// Sobrescreve a função antiga de adicionar OBM.
// Se houver uma OBM em edição, salva a edição e NÃO deixa adicionar duplicata.
(function interceptarAdicionarObmV189() {
  try {
    if (typeof adicionarObmEstruturaV172 === "function" && !window.adicionarObmEstruturaOriginalV189) {
      window.adicionarObmEstruturaOriginalV189 = adicionarObmEstruturaV172;

      adicionarObmEstruturaV172 = function(...args) {
        if (obterObmEditandoIdV189()) {
          salvarEdicaoObmSemDuplicarV189();
          return false;
        }

        return window.adicionarObmEstruturaOriginalV189.apply(this, args);
      };

      window.adicionarObmEstruturaV172 = adicionarObmEstruturaV172;
    }
  } catch {}

  try {
    if (typeof salvarEdicaoObmV188 === "function") {
      window.salvarEdicaoObmV188 = salvarEdicaoObmSemDuplicarV189;
      salvarEdicaoObmV188 = salvarEdicaoObmSemDuplicarV189;
    }
  } catch {}
})();

function configurarEdicaoObmSemDuplicarV189() {
  const pagina = document.getElementById("paginaEstruturaOrganizacional");
  const btn = document.getElementById("btnAdicionarObm");

  if (btn && btn.dataset.v189 !== "1") {
    btn.dataset.v189 = "1";

    // Captura antes dos listeners antigos e interrompe tudo quando estiver editando.
    btn.addEventListener("click", event => {
      if (!obterObmEditandoIdV189()) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      salvarEdicaoObmSemDuplicarV189();
      return false;
    }, true);
  }

  if (pagina && pagina.dataset.v189 !== "1") {
    pagina.dataset.v189 = "1";

    pagina.addEventListener("click", event => {
      const botao = event.target.closest("button");
      if (!botao || !pagina.contains(botao)) return;

      if (botao.id === "btnAdicionarObm" && obterObmEditandoIdV189()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        salvarEdicaoObmSemDuplicarV189();
        return false;
      }

      // Quando clicar em Editar, garante que o ID fique exposto também em window.
      if (botao.dataset.acao === "editar-obm-v188") {
        setTimeout(() => {
          try { window.obmEditandoIdV188 = obmEditandoIdV188; } catch {}
          configurarEdicaoObmSemDuplicarV189();
        }, 50);
      }
    }, true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  configurarEdicaoObmSemDuplicarV189();
  setTimeout(configurarEdicaoObmSemDuplicarV189, 300);
  setTimeout(configurarEdicaoObmSemDuplicarV189, 1000);
});

document.addEventListener("click", event => {
  if (event.target?.closest?.("#btnEstruturaOrganizacional")) {
    setTimeout(configurarEdicaoObmSemDuplicarV189, 400);
  }
}, true);
