
// v194 - Favoritos com controles limpos, sem conflito com scripts antigos.
// Estratégia:
// 1. Remove/recria o botão Favoritos para apagar listeners antigos.
// 2. Remove/recria as estrelas para salvar diretamente em nota.favorita e localStorage por ID.
// 3. O botão Favoritos renderiza diretamente as notas favoritas.

function favUsuarioV194() {
  let rg = "";
  try { rg = sessionStorage.getItem("boletimDigitalRg") || ""; } catch {}
  if (!rg) {
    try { rg = localStorage.getItem("boletimDigitalRg") || ""; } catch {}
  }
  if (!rg) {
    try { rg = document.getElementById("loginRg")?.value || ""; } catch {}
  }
  return String(rg || "local").replace(/[^\w-]/g, "_").toLowerCase();
}

function favKeyV194() {
  return "boletimDigitalFavoritosIdsV194__" + favUsuarioV194();
}

function favIdsV194() {
  const ids = [];

  try {
    const raw = localStorage.getItem(favKeyV194());
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) ids.push(...arr.map(String));
  } catch {}

  // Migra também dos favoritos por ID v192.
  try {
    const raw = localStorage.getItem("boletimDigitalFavoritosIds__" + favUsuarioV194());
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) ids.push(...arr.map(String));
  } catch {}

  // Migra de notas que ficaram marcadas visualmente em versões antigas.
  try {
    (dados.notas || []).forEach(n => {
      if (n && n.id && (n.favorita || n.favorito || n.favoritada)) {
        ids.push(String(n.id));
      }
    });
  } catch {}

  return Array.from(new Set(ids.filter(Boolean)));
}

function salvarFavIdsV194(ids) {
  const lista = Array.from(new Set((ids || []).map(String).filter(Boolean)));
  try { localStorage.setItem(favKeyV194(), JSON.stringify(lista)); } catch {}
  try { localStorage.setItem("boletimDigitalFavoritosIds__" + favUsuarioV194(), JSON.stringify(lista)); } catch {}
}

function notaPorIdV194(id) {
  return (dados.notas || []).find(n => String(n.id) === String(id));
}

function notaEhFavoritaV194(notaOuId) {
  const id = typeof notaOuId === "object" ? notaOuId?.id : notaOuId;
  if (!id) return false;

  const nota = typeof notaOuId === "object" ? notaOuId : notaPorIdV194(id);
  if (nota && (nota.favorita || nota.favorito || nota.favoritada)) return true;

  return favIdsV194().includes(String(id));
}

function definirFavoritaV194(id, valor) {
  const sId = String(id || "");
  if (!sId) return;

  let ids = favIdsV194();
  const existe = ids.includes(sId);

  if (valor && !existe) ids.push(sId);
  if (!valor && existe) ids = ids.filter(x => x !== sId);

  salvarFavIdsV194(ids);

  const nota = notaPorIdV194(sId);
  if (nota) {
    nota.favorita = Boolean(valor);
    nota.favorito = Boolean(valor);
    nota.favoritada = Boolean(valor);
  }

  try {
    if (typeof salvarNotasLocais === "function") salvarNotasLocais();
    else if (typeof salvarDados === "function") salvarDados();
  } catch {}
}

function alternarFavoritaV194(id) {
  definirFavoritaV194(id, !notaEhFavoritaV194(id));

  if (window.modoFavoritosV194) {
    renderizarFavoritosV194();
  } else {
    recriarEstrelasV194();
    atualizarBotaoFavV194();
  }
}

function dataOrdV194(dataBR) {
  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return 0;
  return Number(`${m[3]}${String(m[2]).padStart(2, "0")}${String(m[1]).padStart(2, "0")}`);
}

function ordenarNotasFavV194(notas) {
  return [...notas].sort((a, b) => {
    const da = dataOrdV194(a.data);
    const db = dataOrdV194(b.data);
    if (da !== db) return db - da;
    return Number(b.inseridoEm || b.ordemInclusao || b.criadoEm || 0) -
           Number(a.inseridoEm || a.ordemInclusao || a.criadoEm || 0);
  });
}

function notasFavV194() {
  return ordenarNotasFavV194((dados.notas || []).filter(notaEhFavoritaV194));
}

function escV194(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function renderTextoV194(html) {
  try {
    if (typeof renderizarTextoNota === "function") return renderizarTextoNota(html || "");
  } catch {}
  return html || "";
}

function renderSubitensV194(nota) {
  try {
    if (typeof renderizarSubitens === "function") return renderizarSubitens(nota);
  } catch {}
  return "";
}

function renderAnexosV194(nota) {
  try {
    if (typeof renderizarAnexosDaNota === "function") return renderizarAnexosDaNota(nota);
  } catch {}
  return "";
}

function htmlNotaV194(nota) {
  const caminho = [nota.parte, nota.secao, nota.subsecao].filter(Boolean).join(" • ");
  const tituloCompleto = `${nota.numero || ""} - ${nota.titulo || ""}`;

  return `
    <article class="nota" id="${escV194(nota.id)}" data-id-nota="${escV194(nota.id)}">
      <button class="titulo-nota" type="button">
        <div>
          <h3>${escV194(tituloCompleto)}</h3>
          <div class="meta">${escV194(nota.boletim || nota.boletimTexto || "")} • ${escV194(nota.data || "")}<br>${escV194(caminho)}</div>
        </div>
        <button type="button" class="btn-favorito-v194 favorita" data-fav-id="${escV194(nota.id)}">★</button>
        <span class="icone">+</span>
      </button>
      <div class="corpo-nota">
        <div class="texto">${renderTextoV194(nota.texto || "")}</div>
        ${renderSubitensV194(nota)}
        ${renderAnexosV194(nota)}
        <a class="permalink" href="#${escV194(nota.id)}">Link permanente desta nota</a>
        <div class="acoes-nota-rodape">
          <div class="acoes-nota-esquerda">
            <button class="btn-editar-nota" type="button" data-id="${escV194(nota.id)}">Editar nota</button>
            <button class="btn-excluir-nota" type="button" data-id="${escV194(nota.id)}">Excluir nota</button>
          </div>
          <div class="acoes-nota-direita">
            <button class="btn-imprimir-nota" type="button" data-id="${escV194(nota.id)}">Imprimir nota</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function atualizarBotaoFavV194() {
  const btn = document.getElementById("btnFavoritosNotasV159");
  if (!btn) return;
  const total = notasFavV194().length;
  btn.classList.toggle("ativo", Boolean(window.modoFavoritosV194));
  btn.textContent = window.modoFavoritosV194 ? `Favoritos (${total})` : "Favoritos";
  btn.title = `Exibir meus favoritos (${total})`;
}

function renderizarFavoritosV194() {
  window.modoFavoritosV194 = true;
  window.modoFavoritosV193 = false;
  window.modoFavoritosV192 = false;
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

  const favoritas = notasFavV194();
  lista.innerHTML = favoritas.length
    ? favoritas.map(htmlNotaV194).join("")
    : `<div class="vazio">Nenhuma nota favoritada por este usuário.</div>`;

  atualizarBotaoFavV194();
}

function sairFavoritosV194() {
  window.modoFavoritosV194 = false;
  window.modoFavoritosV193 = false;
  window.modoFavoritosV192 = false;
  window.modoFavoritosV191 = false;
  window.filtroFavoritosAtivoV159 = false;
  try { filtroFavoritosAtivoV159 = false; } catch {}

  try { mostrarBoletim(); } catch {}
  try { renderizarNotas(); } catch {}
  setTimeout(() => {
    recriarBotaoFavoritosV194();
    recriarEstrelasV194();
    atualizarBotaoFavV194();
  }, 0);
}

function recriarBotaoFavoritosV194() {
  const antigo = document.getElementById("btnFavoritosNotasV159");
  if (!antigo) return;

  if (antigo.dataset.v194 === "1") {
    atualizarBotaoFavV194();
    return;
  }

  const novo = antigo.cloneNode(false);
  novo.id = "btnFavoritosNotasV159";
  novo.className = antigo.className;
  novo.type = "button";
  novo.dataset.v194 = "1";
  novo.textContent = "Favoritos";
  novo.title = antigo.title || "Exibir favoritos";

  antigo.replaceWith(novo);

  novo.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    if (window.modoFavoritosV194) sairFavoritosV194();
    else renderizarFavoritosV194();

    return false;
  }, true);

  atualizarBotaoFavV194();
}

function recriarEstrelasV194() {
  if (window.modoFavoritosV194) return;

  const cards = Array.from(document.querySelectorAll("#listaNotas article.nota, #listaNotas .nota"));

  cards.forEach(card => {
    const id = card.dataset.idNota || card.id;
    if (!id) return;

    card.querySelectorAll(".btn-favorito-nota-v159, .btn-favorito-v190, .btn-favorito-v191, .btn-favorito-v192, .btn-favorito-v193, .btn-favorito-v194").forEach(el => el.remove());

    const fav = notaEhFavoritaV194(id);

    const estrela = document.createElement("button");
    estrela.type = "button";
    estrela.className = "btn-favorito-v194";
    estrela.dataset.favId = id;
    estrela.textContent = fav ? "★" : "☆";
    estrela.classList.toggle("favorita", fav);
    estrela.title = fav ? "Remover dos favoritos" : "Adicionar aos favoritos";

    estrela.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      alternarFavoritaV194(id);
      return false;
    }, true);

    const titulo = card.querySelector(".titulo-nota");
    const icone = titulo?.querySelector(".icone");
    if (titulo) titulo.insertBefore(estrela, icone || null);
    else card.appendChild(estrela);
  });

  atualizarBotaoFavV194();
}

function configurarEventosListaV194() {
  const lista = document.getElementById("listaNotas");
  if (!lista || lista.dataset.v194 === "1") return;
  lista.dataset.v194 = "1";

  lista.addEventListener("click", event => {
    const fav = event.target.closest(".btn-favorito-v194");
    if (fav) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      alternarFavoritaV194(fav.dataset.favId || fav.closest(".nota")?.dataset.idNota || fav.closest(".nota")?.id);
      return false;
    }

    if (window.modoFavoritosV194) {
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

// Sobrescreve funções antigas.
window.notaEstaFavoritaV159 = function(nota) { return notaEhFavoritaV194(nota); };
window.notaEstaFavoritaUsuarioV162 = window.notaEstaFavoritaV159;
window.notaEstaFavoritaUsuarioV163 = window.notaEstaFavoritaV159;
window.alternarFavoritoNotaV159 = function(id) { alternarFavoritaV194(id); };
window.alternarFavoritoNotaUsuarioV162 = function(notaOuId) { alternarFavoritaV194(typeof notaOuId === "object" ? notaOuId?.id : notaOuId); };
window.alternarFavoritoNotaUsuarioV163 = window.alternarFavoritoNotaUsuarioV162;
window.obterFavoritosUsuarioV162 = function() { return favIdsV194(); };

(function reforcarRenderV194() {
  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV194) {
      window.renderizarNotasOriginalV194 = renderizarNotas;
      renderizarNotas = function(...args) {
        if (window.modoFavoritosV194) {
          renderizarFavoritosV194();
          return;
        }

        const r = window.renderizarNotasOriginalV194.apply(this, args);
        setTimeout(() => {
          recriarBotaoFavoritosV194();
          recriarEstrelasV194();
          configurarEventosListaV194();
        }, 0);
        setTimeout(() => {
          recriarBotaoFavoritosV194();
          recriarEstrelasV194();
        }, 120);
        return r;
      };
    }
  } catch {}
})();

function iniciarFavoritosV194() {
  recriarBotaoFavoritosV194();
  configurarEventosListaV194();
  recriarEstrelasV194();

  // Reaplica após scripts antigos terminarem seus setTimeouts.
  setTimeout(() => {
    recriarBotaoFavoritosV194();
    configurarEventosListaV194();
    recriarEstrelasV194();
  }, 400);

  setTimeout(() => {
    recriarBotaoFavoritosV194();
    configurarEventosListaV194();
    recriarEstrelasV194();
  }, 1200);
}

document.addEventListener("DOMContentLoaded", iniciarFavoritosV194);
