
// v173 - isola completamente a página Estrutura Organizacional.
function obterPaginaEstruturaUnicaV173() {
  const paginas = Array.from(document.querySelectorAll("#paginaEstruturaOrganizacional"));

  if (!paginas.length) return null;

  const principal = document.querySelector("main.principal") || document.querySelector("main") || document.querySelector("#app");
  const paginaPrincipal = paginas.find(p => principal?.contains(p)) || paginas[0];

  paginas.forEach(p => {
    if (p !== paginaPrincipal) p.remove();
  });

  if (principal && !principal.contains(paginaPrincipal)) {
    principal.appendChild(paginaPrincipal);
  }

  paginaPrincipal.classList.add("pagina-estrutura-organizacional-v173");
  return paginaPrincipal;
}

function removerEstruturaVazadaV173() {
  const pagina = obterPaginaEstruturaUnicaV173();

  [
    "novoCbaNome",
    "btnAdicionarCba",
    "novaObmNome",
    "novaObmCba",
    "novaObmAliases",
    "btnAdicionarObm",
    "listaCbasEstrutura",
    "listaObmsEstrutura"
  ].forEach(id => {
    document.querySelectorAll("#" + id).forEach(el => {
      if (!pagina || !pagina.contains(el)) {
        const bloco = el.closest(
          ".estrutura-card-v172, .estrutura-card, .estrutura-org-layout-v172, .estrutura-org-layout, .estrutura-form-obm-v172, .estrutura-form-cba-v172, label"
        );
        if (bloco && (!pagina || !pagina.contains(bloco))) bloco.remove();
        else el.remove();
      }
    });
  });
}

function montarHtmlEstruturaOrganizacionalV173() {
  return `
    <div class="pagina-extra-topo pagina-extra-topo-estrutura-v173">
      <h2>Estrutura Organizacional</h2>
      <p>Cadastre CBAs e OBMs para organizar a abrangência dos boletins.</p>
    </div>

    <div class="estrutura-org-layout-v172 estrutura-org-layout-v173">
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

function renderizarEstruturaOrganizacionalV173() {
  const pagina = obterPaginaEstruturaUnicaV173();
  if (!pagina) return;

  removerEstruturaVazadaV173();

  // Always rebuild from a clean template to prevent duplicated OBM blocks.
  pagina.innerHTML = montarHtmlEstruturaOrganizacionalV173();

  try {
    const estrutura = obterEstruturaOrganizacionalV172();

    const select = document.getElementById("novaObmCba");
    if (select) {
      const ativos = estrutura.cbas.filter(c => c.ativo !== false);
      select.innerHTML = ativos.length
        ? ativos.map(c => `<option value="${escEstruturaV172(c.id)}">${escEstruturaV172(c.nome)}</option>`).join("")
        : `<option value="">Cadastre um CBA primeiro</option>`;
    }

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

    configurarEventosEstruturaOrganizacionalV173();
  } catch {
    try { configurarEventosEstruturaOrganizacionalV173(); } catch {}
  }
}

function configurarEventosEstruturaOrganizacionalV173() {
  const pagina = obterPaginaEstruturaUnicaV173();
  if (!pagina || pagina.dataset.eventosV173 === "1") return;

  pagina.dataset.eventosV173 = "1";

  pagina.addEventListener("click", event => {
    const btn = event.target.closest("button");
    if (!btn || !pagina.contains(btn)) return;

    if (btn.id === "btnAdicionarCba") {
      event.preventDefault();
      event.stopPropagation();
      try { adicionarCbaEstruturaV172(); } catch {}
      setTimeout(renderizarEstruturaOrganizacionalV173, 0);
      return;
    }

    if (btn.id === "btnAdicionarObm") {
      event.preventDefault();
      event.stopPropagation();
      try { adicionarObmEstruturaV172(); } catch {}
      setTimeout(renderizarEstruturaOrganizacionalV173, 0);
      return;
    }

    if (btn.dataset.acao === "toggle-cba" || btn.dataset.acao === "toggle-obm") {
      setTimeout(renderizarEstruturaOrganizacionalV173, 0);
    }
  }, true);
}

function esconderElementosEstruturaForaDaPaginaV173() {
  const pagina = obterPaginaEstruturaUnicaV173();
  if (!pagina) return;

  document.querySelectorAll(".estrutura-org-layout-v172, .estrutura-card-v172, .estrutura-card, .estrutura-form-obm-v172, .estrutura-form-cba-v172").forEach(el => {
    if (!pagina.contains(el)) {
      el.style.display = "none";
    }
  });
}

function mostrarEstruturaOrganizacionalV173() {
  const pagina = obterPaginaEstruturaUnicaV173();
  if (!pagina) return;

  try { modoPagina = "estrutura"; } catch {}

  document.querySelectorAll(".menu button, .menu-rodape button").forEach(b => b.classList.remove("ativo"));
  document.getElementById("btnEstruturaOrganizacional")?.classList.add("ativo");

  [
    "controlesNotas",
    "listaNotas",
    "paginacao",
    "paginaFatosHistoricos",
    "paginaEstatistica",
    "paginaAuditoria"
  ].forEach(id => document.getElementById(id)?.classList.add("escondido"));

  pagina.classList.remove("escondido");
  document.body.classList.add("modo-estrutura-organizacional-v172");

  // Hide the top title/description so only the internal title remains.
  document.body.classList.add("modo-estrutura-sem-titulo-superior-v173");

  const titulo = document.getElementById("tituloPagina");
  if (titulo) titulo.textContent = "Estrutura Organizacional";

  renderizarEstruturaOrganizacionalV173();
  removerEstruturaVazadaV173();
}

window.renderizarEstruturaOrganizacionalV164 = renderizarEstruturaOrganizacionalV173;
window.renderizarEstruturaOrganizacionalV172 = renderizarEstruturaOrganizacionalV173;
window.mostrarEstruturaOrganizacionalV166 = mostrarEstruturaOrganizacionalV173;
window.mostrarEstruturaOrganizacionalV168 = mostrarEstruturaOrganizacionalV173;
window.mostrarEstruturaOrganizacionalV170 = mostrarEstruturaOrganizacionalV173;
window.mostrarEstruturaOrganizacionalV171 = mostrarEstruturaOrganizacionalV173;
window.mostrarEstruturaOrganizacionalV172 = mostrarEstruturaOrganizacionalV173;

(function corrigirSaidaEstruturaV173() {
  try {
    if (typeof mostrarBoletim === "function" && !window.mostrarBoletimOriginalV173) {
      window.mostrarBoletimOriginalV173 = mostrarBoletim;
      mostrarBoletim = function(...args) {
        document.body.classList.remove("modo-estrutura-organizacional-v172", "modo-estrutura-sem-titulo-superior-v173");
        document.getElementById("paginaEstruturaOrganizacional")?.classList.add("escondido");
        return window.mostrarBoletimOriginalV173.apply(this, args);
      };
    }
  } catch {}

  try {
    if (typeof mostrarPaginaExtra === "function" && !window.mostrarPaginaExtraOriginalV173) {
      window.mostrarPaginaExtraOriginalV173 = mostrarPaginaExtra;
      mostrarPaginaExtra = function(...args) {
        document.body.classList.remove("modo-estrutura-organizacional-v172", "modo-estrutura-sem-titulo-superior-v173");
        document.getElementById("paginaEstruturaOrganizacional")?.classList.add("escondido");
        return window.mostrarPaginaExtraOriginalV173.apply(this, args);
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  obterPaginaEstruturaUnicaV173();
  removerEstruturaVazadaV173();
  esconderElementosEstruturaForaDaPaginaV173();

  const btn = document.getElementById("btnEstruturaOrganizacional");
  if (btn && btn.dataset.v173 !== "1") {
    btn.dataset.v173 = "1";
    btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      mostrarEstruturaOrganizacionalV173();
    }, true);
  }

  setTimeout(() => {
    removerEstruturaVazadaV173();
    esconderElementosEstruturaForaDaPaginaV173();
  }, 700);
});
