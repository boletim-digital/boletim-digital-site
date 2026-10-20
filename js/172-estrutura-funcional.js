
// v172 - Estrutura Organizacional funcional e sem barra superior.
function normEstruturaV172(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[º°ª]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function slugEstruturaV172(texto) {
  return String(texto || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[º°ª]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "").toLowerCase();
}

function escEstruturaV172(texto) {
  try { return escapeHtml(texto); } catch {}
  return String(texto || "").replace(/[&<>"']/g, m => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
}

function obterEstruturaOrganizacionalV172() {
  if (!window.dados) window.dados = {};
  if (!dados.estruturaOrganizacional || typeof dados.estruturaOrganizacional !== "object") dados.estruturaOrganizacional = {};
  if (!Array.isArray(dados.estruturaOrganizacional.cbas)) {
    dados.estruturaOrganizacional.cbas = [
      { id: "cba-i", nome: "CBA I", ativo: true },
      { id: "cba-ii", nome: "CBA II", ativo: true },
      { id: "cba-iii", nome: "CBA III", ativo: true }
    ];
  }
  if (!Array.isArray(dados.estruturaOrganizacional.obms)) dados.estruturaOrganizacional.obms = [];
  return dados.estruturaOrganizacional;
}

function salvarEstruturaOrganizacionalV172() {
  try {
    if (typeof salvarDados === "function") salvarDados();
    else if (typeof salvarNoLocalStorage === "function") salvarNoLocalStorage();
    else localStorage.setItem("boletimDigitalDados", JSON.stringify(dados));
  } catch {}
}

function perfilPodeEditarEstruturaV172() {
  try {
    const perfil = typeof perfilAtual === "function" ? perfilAtual() : sessionStorage.getItem("boletimDigitalPerfil");
    return ["desenvolvedor", "administrador"].includes(String(perfil || ""));
  } catch { return false; }
}

function cbaPorIdEstruturaV172(id) {
  return obterEstruturaOrganizacionalV172().cbas.find(c => c.id === id) || null;
}

function montarHtmlEstruturaOrganizacionalV172() {
  return `
    <div class="pagina-extra-topo">
      <h2>Estrutura Organizacional</h2>
      <p>Cadastre CBAs e OBMs para organizar a abrangência dos boletins.</p>
    </div>

    <div class="estrutura-org-layout-v172">
      <div class="estrutura-card-v172">
        <h3>CBAs</h3>
        <div class="estrutura-form-cba-v172">
          <label>Nome do CBA<input id="novoCbaNome" type="text" placeholder="Ex.: CBA I"></label>
          <button id="btnAdicionarCba" type="button">Adicionar CBA</button>
        </div>
        <div id="listaCbasEstrutura" class="estrutura-lista-v172"></div>
      </div>

      <div class="estrutura-card-v172">
        <h3>OBMs</h3>
        <div class="estrutura-form-obm-v172">
          <label>Nome da OBM<input id="novaObmNome" type="text" placeholder="Ex.: 28º GBM"></label>
          <label>CBA vinculado<select id="novaObmCba"></select></label>
          <label class="estrutura-campo-cheio-v172">Apelidos/termos de busca<input id="novaObmAliases" type="text" placeholder="Ex.: 28 GBM, Penha, 28º Grupamento"></label>
          <button id="btnAdicionarObm" type="button" class="estrutura-campo-cheio-v172">Adicionar OBM</button>
        </div>
        <div id="listaObmsEstrutura" class="estrutura-lista-v172"></div>
      </div>
    </div>
  `;
}

function preencherSelectCbasEstruturaV172() {
  const select = document.getElementById("novaObmCba");
  if (!select) return;
  const ativos = obterEstruturaOrganizacionalV172().cbas.filter(c => c.ativo !== false);
  select.innerHTML = ativos.length
    ? ativos.map(c => `<option value="${escEstruturaV172(c.id)}">${escEstruturaV172(c.nome)}</option>`).join("")
    : `<option value="">Cadastre um CBA primeiro</option>`;
}

function renderizarEstruturaOrganizacionalV172() {
  const pagina = document.getElementById("paginaEstruturaOrganizacional");
  if (!pagina) return;

  if (!pagina.dataset.montadaV172) {
    pagina.innerHTML = montarHtmlEstruturaOrganizacionalV172();
    pagina.dataset.montadaV172 = "1";
  }

  const estrutura = obterEstruturaOrganizacionalV172();
  preencherSelectCbasEstruturaV172();

  const listaCbas = document.getElementById("listaCbasEstrutura");
  if (listaCbas) {
    listaCbas.innerHTML = estrutura.cbas.map(cba => `
      <div class="estrutura-item-v172" data-cba-id="${escEstruturaV172(cba.id)}">
        <div><strong>${escEstruturaV172(cba.nome)}</strong><small>${cba.ativo === false ? "Inativo" : "Ativo"}</small></div>
        <div class="estrutura-acoes-v172"><button type="button" data-acao="toggle-cba">${cba.ativo === false ? "Ativar" : "Inativar"}</button></div>
      </div>
    `).join("");
  }

  const listaObms = document.getElementById("listaObmsEstrutura");
  if (listaObms) {
    listaObms.innerHTML = estrutura.obms.map(obm => {
      const cba = cbaPorIdEstruturaV172(obm.cbaId);
      return `
        <div class="estrutura-item-v172" data-obm-id="${escEstruturaV172(obm.id)}">
          <div>
            <strong>${escEstruturaV172(obm.nome)}</strong>
            <small>${escEstruturaV172(cba?.nome || "Sem CBA")} • ${obm.ativo === false ? "Inativa" : "Ativa"}</small>
            ${(obm.aliases || []).length ? `<small>Busca: ${escEstruturaV172((obm.aliases || []).join(", "))}</small>` : ""}
          </div>
          <div class="estrutura-acoes-v172"><button type="button" data-acao="toggle-obm">${obm.ativo === false ? "Ativar" : "Inativar"}</button></div>
        </div>
      `;
    }).join("");
  }
}

function adicionarCbaEstruturaV172() {
  const input = document.getElementById("novoCbaNome");
  const nome = input?.value.trim();

  if (!nome) {
    alert("Informe o nome do CBA.");
    input?.focus();
    return;
  }

  const estrutura = obterEstruturaOrganizacionalV172();
  const id = slugEstruturaV172(nome);

  if (estrutura.cbas.some(c => c.id === id || normEstruturaV172(c.nome) === normEstruturaV172(nome))) {
    alert("Esse CBA já está cadastrado.");
    return;
  }

  estrutura.cbas.push({ id, nome, ativo: true });
  input.value = "";
  salvarEstruturaOrganizacionalV172();
  renderizarEstruturaOrganizacionalV172();
}

function adicionarObmEstruturaV172() {
  const nomeEl = document.getElementById("novaObmNome");
  const cbaEl = document.getElementById("novaObmCba");
  const aliasesEl = document.getElementById("novaObmAliases");

  const nome = nomeEl?.value.trim();
  const cbaId = cbaEl?.value;
  const aliases = String(aliasesEl?.value || "").split(",").map(a => a.trim()).filter(Boolean);

  if (!nome) {
    alert("Informe o nome da OBM.");
    nomeEl?.focus();
    return;
  }

  if (!cbaId) {
    alert("Escolha o CBA vinculado à OBM.");
    cbaEl?.focus();
    return;
  }

  const estrutura = obterEstruturaOrganizacionalV172();
  let idBase = slugEstruturaV172(nome);
  let id = idBase;
  let contador = 2;
  while (estrutura.obms.some(o => o.id === id)) id = `${idBase}-${contador++}`;

  estrutura.obms.push({ id, nome, cbaId, aliases, ativo: true });
  nomeEl.value = "";
  aliasesEl.value = "";
  salvarEstruturaOrganizacionalV172();
  renderizarEstruturaOrganizacionalV172();
}

function configurarEventosEstruturaOrganizacionalV172() {
  const pagina = document.getElementById("paginaEstruturaOrganizacional");
  if (!pagina || pagina.dataset.eventosV172 === "1") return;
  pagina.dataset.eventosV172 = "1";

  pagina.addEventListener("click", (event) => {
    const btn = event.target.closest("button");
    if (!btn || !pagina.contains(btn)) return;

    if (btn.id === "btnAdicionarCba") {
      event.preventDefault();
      adicionarCbaEstruturaV172();
      return;
    }

    if (btn.id === "btnAdicionarObm") {
      event.preventDefault();
      adicionarObmEstruturaV172();
      return;
    }

    const acao = btn.dataset.acao;

    if (acao === "toggle-cba") {
      const id = btn.closest("[data-cba-id]")?.dataset.cbaId;
      const cba = obterEstruturaOrganizacionalV172().cbas.find(c => c.id === id);
      if (cba) {
        cba.ativo = cba.ativo === false ? true : false;
        salvarEstruturaOrganizacionalV172();
        renderizarEstruturaOrganizacionalV172();
      }
      return;
    }

    if (acao === "toggle-obm") {
      const id = btn.closest("[data-obm-id]")?.dataset.obmId;
      const obm = obterEstruturaOrganizacionalV172().obms.find(o => o.id === id);
      if (obm) {
        obm.ativo = obm.ativo === false ? true : false;
        salvarEstruturaOrganizacionalV172();
        renderizarEstruturaOrganizacionalV172();
      }
    }
  });
}

function ocultarTopoNotasEmEstruturaV172(ocultar) {
  document.body.classList.toggle("modo-estrutura-organizacional-v172", Boolean(ocultar));
}

function mostrarEstruturaOrganizacionalV172() {
  const pagina = document.getElementById("paginaEstruturaOrganizacional");
  if (!pagina) return;

  if (!perfilPodeEditarEstruturaV172()) {
    alert("Apenas Administrador e Desenvolvedor podem acessar a Estrutura Organizacional.");
    return;
  }

  try { modoPagina = "estrutura"; } catch {}

  document.querySelectorAll(".menu button, .menu-rodape button").forEach(b => b.classList.remove("ativo"));
  document.getElementById("btnEstruturaOrganizacional")?.classList.add("ativo");

  ["controlesNotas", "listaNotas", "paginacao", "paginaFatosHistoricos", "paginaEstatistica", "paginaAuditoria"].forEach(id => {
    document.getElementById(id)?.classList.add("escondido");
  });

  pagina.classList.remove("escondido");

  const titulo = document.getElementById("tituloPagina");
  if (titulo) titulo.textContent = "Estrutura Organizacional";

  ocultarTopoNotasEmEstruturaV172(true);
  renderizarEstruturaOrganizacionalV172();
  configurarEventosEstruturaOrganizacionalV172();
}

function configurarBotaoEstruturaOrganizacionalV172() {
  const btn = document.getElementById("btnEstruturaOrganizacional");
  if (!btn) return;

  btn.classList.toggle("escondido", !perfilPodeEditarEstruturaV172());

  if (btn.dataset.v172 === "1") return;
  btn.dataset.v172 = "1";

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    mostrarEstruturaOrganizacionalV172();
  }, true);
}

window.renderizarEstruturaOrganizacionalV164 = renderizarEstruturaOrganizacionalV172;
window.mostrarEstruturaOrganizacionalV166 = mostrarEstruturaOrganizacionalV172;
window.mostrarEstruturaOrganizacionalV168 = mostrarEstruturaOrganizacionalV172;
window.mostrarEstruturaOrganizacionalV170 = mostrarEstruturaOrganizacionalV172;
window.mostrarEstruturaOrganizacionalV171 = mostrarEstruturaOrganizacionalV172;

(function corrigirSaidaEstruturaV172() {
  try {
    if (typeof mostrarBoletim === "function" && !window.mostrarBoletimOriginalV172) {
      window.mostrarBoletimOriginalV172 = mostrarBoletim;
      mostrarBoletim = function(...args) {
        ocultarTopoNotasEmEstruturaV172(false);
        document.getElementById("paginaEstruturaOrganizacional")?.classList.add("escondido");
        return window.mostrarBoletimOriginalV172.apply(this, args);
      };
    }
  } catch {}

  try {
    if (typeof mostrarPaginaExtra === "function" && !window.mostrarPaginaExtraOriginalV172) {
      window.mostrarPaginaExtraOriginalV172 = mostrarPaginaExtra;
      mostrarPaginaExtra = function(...args) {
        ocultarTopoNotasEmEstruturaV172(false);
        document.getElementById("paginaEstruturaOrganizacional")?.classList.add("escondido");
        return window.mostrarPaginaExtraOriginalV172.apply(this, args);
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  renderizarEstruturaOrganizacionalV172();
  configurarEventosEstruturaOrganizacionalV172();
  configurarBotaoEstruturaOrganizacionalV172();

  setTimeout(() => {
    configurarBotaoEstruturaOrganizacionalV172();
    renderizarEstruturaOrganizacionalV172();
    configurarEventosEstruturaOrganizacionalV172();
  }, 500);
});
