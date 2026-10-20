
// v192 - Favoritos definitivo por ID da nota.
// A estrela grava o ID da nota e o botão Favoritos consulta essa mesma lista.

function usuarioFavoritosV192() {
  let rg = "";
  try { rg = sessionStorage.getItem("boletimDigitalRg") || ""; } catch {}
  if (!rg) {
    try { rg = localStorage.getItem("boletimDigitalRg") || ""; } catch {}
  }
  if (!rg) {
    try { rg = document.getElementById("loginRg")?.value || ""; } catch {}
  }
  if (!rg) rg = "local";
  return String(rg).replace(/[^\w-]/g, "_").toLowerCase();
}

function chaveFavoritosIdsV192() {
  return "boletimDigitalFavoritosIds__" + usuarioFavoritosV192();
}

function obterFavoritosIdsV192() {
  try {
    const raw = localStorage.getItem(chaveFavoritosIdsV192());
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista.map(String) : [];
  } catch {
    return [];
  }
}

function salvarFavoritosIdsV192(ids) {
  const limpa = Array.from(new Set((ids || []).map(String).filter(Boolean)));
  try {
    localStorage.setItem(chaveFavoritosIdsV192(), JSON.stringify(limpa));
  } catch {}
}

function notaPorIdV192(id) {
  return (dados.notas || []).find(n => String(n.id) === String(id));
}

function notaFavoritaV192(notaOuId) {
  const id = typeof notaOuId === "object" ? notaOuId?.id : notaOuId;
  if (!id) return false;
  return obterFavoritosIdsV192().includes(String(id));
}

function alternarFavoritoPorIdV192(notaOuId) {
  const id = typeof notaOuId === "object" ? notaOuId?.id : notaOuId;
  if (!id) return;

  const ids = obterFavoritosIdsV192();
  const sId = String(id);
  const idx = ids.indexOf(sId);

  if (idx >= 0) ids.splice(idx, 1);
  else ids.push(sId);

  salvarFavoritosIdsV192(ids);

  // Também mantém uma marca visual/local na própria nota para compatibilidade antiga.
  const nota = notaPorIdV192(sId);
  if (nota) {
    nota.favorita = ids.includes(sId);
    nota.favorito = ids.includes(sId);
    nota.favoritada = ids.includes(sId);
    try {
      if (typeof salvarNotasLocais === "function") salvarNotasLocais();
      else if (typeof salvarDados === "function") salvarDados();
    } catch {}
  }

  if (window.modoFavoritosV192 || window.modoFavoritosV191) {
    renderizarFavoritosV192();
  } else {
    atualizarEstrelasFavoritosV192();
  }
}

function dataOrdemFavV192(dataBR) {
  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return 0;
  return Number(`${m[3]}${String(m[2]).padStart(2, "0")}${String(m[1]).padStart(2, "0")}`);
}

function ordenarNotasFavoritosV192(notas) {
  return [...notas].sort((a, b) => {
    const da = dataOrdemFavV192(a.data);
    const db = dataOrdemFavV192(b.data);
    if (da !== db) return db - da;
    return Number(b.inseridoEm || b.ordemInclusao || b.criadoEm || 0) -
           Number(a.inseridoEm || a.ordemInclusao || a.criadoEm || 0);
  });
}

function notasFavoritasV192() {
  const ids = new Set(obterFavoritosIdsV192());
  return ordenarNotasFavoritosV192((dados.notas || []).filter(n => ids.has(String(n.id))));
}

function escFavV192(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function renderizarTextoFavV192(html) {
  try {
    if (typeof renderizarTextoNota === "function") return renderizarTextoNota(html || "");
  } catch {}
  return html || "";
}

function renderizarSubitensFavV192(nota) {
  try {
    if (typeof renderizarSubitens === "function") return renderizarSubitens(nota);
  } catch {}
  return "";
}

function renderizarAnexosFavV192(nota) {
  try {
    if (typeof renderizarAnexosDaNota === "function") return renderizarAnexosDaNota(nota);
  } catch {}
  return "";
}

function htmlNotaFavoritaV192(nota) {
  const caminho = [nota.parte, nota.secao, nota.subsecao].filter(Boolean).join(" • ");
  const tituloCompleto = `${nota.numero || ""} - ${nota.titulo || ""}`;

  return `
    <article class="nota" id="${escFavV192(nota.id)}" data-id-nota="${escFavV192(nota.id)}">
      <button class="titulo-nota" type="button">
        <div>
          <h3>${escFavV192(tituloCompleto)}</h3>
          <div class="meta">${escFavV192(nota.boletim || nota.boletimTexto || "")} • ${escFavV192(nota.data || "")}<br>${escFavV192(caminho)}</div>
        </div>
        <button type="button" class="btn-favorito-nota-v159 btn-favorito-v192 favorita" data-fav-id="${escFavV192(nota.id)}">★</button>
        <span class="icone">+</span>
      </button>

      <div class="corpo-nota">
        <div class="texto">${renderizarTextoFavV192(nota.texto || "")}</div>
        ${renderizarSubitensFavV192(nota)}
        ${renderizarAnexosFavV192(nota)}
        <a class="permalink" href="#${escFavV192(nota.id)}">Link permanente desta nota</a>
        <div class="acoes-nota-rodape">
          <div class="acoes-nota-esquerda">
            <button class="btn-editar-nota" type="button" data-id="${escFavV192(nota.id)}">Editar nota</button>
            <button class="btn-excluir-nota" type="button" data-id="${escFavV192(nota.id)}">Excluir nota</button>
          </div>
          <div class="acoes-nota-direita">
            <button class="btn-imprimir-nota" type="button" data-id="${escFavV192(nota.id)}">Imprimir nota</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function atualizarBotaoFavoritosV192() {
  const btn = document.getElementById("btnFavoritosNotasV159");
  if (!btn) return;

  const total = notasFavoritasV192().length;
  const ativo = Boolean(window.modoFavoritosV192);

  btn.classList.toggle("ativo", ativo);
  btn.textContent = ativo ? `Favoritos (${total})` : "Favoritos";
  btn.title = `Exibir meus favoritos (${total})`;
}

function atualizarEstrelasFavoritosV192() {
  const cards = Array.from(document.querySelectorAll("#listaNotas article.nota, #listaNotas .nota"));

  cards.forEach(card => {
    const id = card.dataset.idNota || card.id;
    if (!id) return;

    card.querySelectorAll(".btn-favorito-nota-v159, .btn-favorito-v190, .btn-favorito-v191, .btn-favorito-v192").forEach(b => b.remove());

    const estrela = document.createElement("button");
    estrela.type = "button";
    estrela.className = "btn-favorito-nota-v159 btn-favorito-v192";
    estrela.dataset.favId = id;
    estrela.textContent = notaFavoritaV192(id) ? "★" : "☆";
    estrela.classList.toggle("favorita", notaFavoritaV192(id));
    estrela.title = notaFavoritaV192(id) ? "Remover dos favoritos" : "Adicionar aos favoritos";

    estrela.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      alternarFavoritoPorIdV192(id);
    }, true);

    const titulo = card.querySelector(".titulo-nota");
    const icone = titulo?.querySelector(".icone");

    if (titulo) titulo.insertBefore(estrela, icone || null);
    else card.appendChild(estrela);
  });

  atualizarBotaoFavoritosV192();
}

function configurarEventosFavoritosV192() {
  const lista = document.getElementById("listaNotas");
  if (lista && lista.dataset.v192 !== "1") {
    lista.dataset.v192 = "1";

    lista.addEventListener("click", event => {
      const fav = event.target.closest(".btn-favorito-v192, .btn-favorito-nota-v159");
      if (fav) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const id = fav.dataset.favId || fav.closest(".nota")?.dataset.idNota || fav.closest(".nota")?.id;
        alternarFavoritoPorIdV192(id);
        return false;
      }

      if (window.modoFavoritosV192) {
        const titulo = event.target.closest(".titulo-nota");
        if (titulo) {
          const card = titulo.closest(".nota");
          if (card) {
            card.classList.toggle("aberta");
            const icone = card.querySelector(".icone");
            if (icone) icone.textContent = card.classList.contains("aberta") ? "−" : "+";
          }
        }
      }
    }, true);
  }
}

function renderizarFavoritosV192() {
  window.modoFavoritosV192 = true;
  window.modoFavoritosV191 = false;
  window.filtroFavoritosAtivoV159 = false;
  try { filtroFavoritosAtivoV159 = false; } catch {}

  const lista = document.getElementById("listaNotas");
  if (!lista) return;

  document.getElementById("controlesNotas")?.classList.remove("escondido");
  lista.classList.remove("escondido");
  document.getElementById("paginacao")?.classList.add("escondido");

  document.getElementById("paginaFatosHistoricos")?.classList.add("escondido");
  document.getElementById("paginaEstatistica")?.classList.add("escondido");
  document.getElementById("paginaAuditoria")?.classList.add("escondido");
  document.getElementById("paginaEstruturaOrganizacional")?.classList.add("escondido");

  const titulo = document.getElementById("tituloPagina");
  if (titulo) titulo.textContent = "Favoritos";

  const notas = notasFavoritasV192();

  if (!notas.length) {
    lista.innerHTML = `<div class="vazio">Nenhuma nota favoritada por este usuário.</div>`;
  } else {
    lista.innerHTML = notas.map(htmlNotaFavoritaV192).join("");
  }

  atualizarBotaoFavoritosV192();
  configurarEventosFavoritosV192();
}

function sairFavoritosV192() {
  window.modoFavoritosV192 = false;
  window.modoFavoritosV191 = false;
  window.filtroFavoritosAtivoV159 = false;
  try { filtroFavoritosAtivoV159 = false; } catch {}

  try { mostrarBoletim(); } catch {}
  try { renderizarNotas(); } catch {}
  setTimeout(atualizarEstrelasFavoritosV192, 0);
}

function configurarBotaoFavoritosV192() {
  const btn = document.getElementById("btnFavoritosNotasV159");
  if (!btn || btn.dataset.v192 === "1") return;

  btn.dataset.v192 = "1";

  // Captura antes dos listeners antigos.
  btn.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (window.modoFavoritosV192) sairFavoritosV192();
    else renderizarFavoritosV192();

    return false;
  }, true);
}

// Compatibilidade com versões antigas.
window.notaEstaFavoritaV159 = function(nota) { return notaFavoritaV192(nota); };
window.notaEstaFavoritaUsuarioV162 = window.notaEstaFavoritaV159;
window.notaEstaFavoritaUsuarioV163 = window.notaEstaFavoritaV159;

window.alternarFavoritoNotaV159 = function(id) { alternarFavoritoPorIdV192(id); };
window.alternarFavoritoNotaUsuarioV162 = function(notaOuId) { alternarFavoritoPorIdV192(notaOuId); };
window.alternarFavoritoNotaUsuarioV163 = window.alternarFavoritoNotaUsuarioV162;

window.obterFavoritosUsuarioV162 = function() { return obterFavoritosIdsV192(); };

(function reforcarRenderFavoritosV192() {
  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV192) {
      window.renderizarNotasOriginalV192 = renderizarNotas;

      renderizarNotas = function(...args) {
        if (window.modoFavoritosV192) {
          renderizarFavoritosV192();
          return;
        }

        const r = window.renderizarNotasOriginalV192.apply(this, args);

        setTimeout(() => {
          configurarBotaoFavoritosV192();
          configurarEventosFavoritosV192();
          atualizarEstrelasFavoritosV192();
        }, 0);

        return r;
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarBotaoFavoritosV192();
  configurarEventosFavoritosV192();

  setTimeout(() => {
    configurarBotaoFavoritosV192();
    configurarEventosFavoritosV192();
    atualizarEstrelasFavoritosV192();
  }, 300);

  setTimeout(() => {
    configurarBotaoFavoritosV192();
    configurarEventosFavoritosV192();
    atualizarEstrelasFavoritosV192();
  }, 1000);
});
