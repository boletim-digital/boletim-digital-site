
// v191 - Favoritos renderiza diretamente as notas favoritedas.

function usuarioFavoritosV191() {
  let rg = "";
  try { rg = sessionStorage.getItem("boletimDigitalRg") || ""; } catch {}
  if (!rg) {
    try { rg = localStorage.getItem("boletimDigitalRg") || ""; } catch {}
  }
  if (!rg) {
    try { rg = document.getElementById("loginRg")?.value || ""; } catch {}
  }
  return rg ? "rg_" + String(rg).replace(/[^\w-]/g, "_").toLowerCase() : "local";
}

function chavesPossiveisStorageFavoritosV191() {
  const u = usuarioFavoritosV191();
  return [
    "boletimDigitalFavoritosNotasPorUsuario__" + u,
    "boletimDigitalFavoritosNotas_" + u,
    "boletimDigitalFavoritos_" + u,
    "favoritosNotas_" + u
  ];
}

function lerArrayStorageV191(chave) {
  try {
    const raw = localStorage.getItem(chave);
    if (!raw) return [];
    const v = JSON.parse(raw);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function obterFavoritosV191() {
  // Primeiro tenta as funções antigas, mas não depende só delas.
  try {
    if (typeof obterFavoritosUsuarioV162 === "function") {
      const lista = obterFavoritosUsuarioV162();
      if (Array.isArray(lista) && lista.length) return lista.map(String);
    }
  } catch {}

  const juntas = [];
  chavesPossiveisStorageFavoritosV191().forEach(k => juntas.push(...lerArrayStorageV191(k)));

  // Também procura chaves de localStorage que pareçam ser do sistema de favoritos do usuário.
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      const kl = k.toLowerCase();
      if (kl.includes("favorit") && kl.includes("boletim")) {
        juntas.push(...lerArrayStorageV191(k));
      }
    }
  } catch {}

  return Array.from(new Set(juntas));
}

function salvarFavoritosV191(lista) {
  const limpa = Array.from(new Set((lista || []).map(String).filter(Boolean)));
  const chave = chavesPossiveisStorageFavoritosV191()[0];
  try { localStorage.setItem(chave, JSON.stringify(limpa)); } catch {}

  try {
    if (typeof salvarFavoritosUsuarioV162 === "function") salvarFavoritosUsuarioV162(limpa);
  } catch {}
}

function txtFavV191(v) {
  return String(v || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function chaveNotaFavoritoV191(nota) {
  if (!nota) return "";

  try {
    if (typeof chaveUnicaNotaFavoritoV163 === "function") return chaveUnicaNotaFavoritoV163(nota);
  } catch {}

  try {
    if (typeof chaveUnicaNotaFavoritoV162 === "function") return chaveUnicaNotaFavoritoV162(nota);
  } catch {}

  const idx = (dados.notas || []).indexOf(nota);

  return [
    "idx:" + idx,
    "id:" + String(nota.id || ""),
    "data:" + txtFavV191(nota.data),
    "boletim:" + txtFavV191(nota.boletim),
    "numero:" + txtFavV191(nota.numero),
    "titulo:" + txtFavV191(nota.titulo),
    "parte:" + txtFavV191(nota.parte),
    "secao:" + txtFavV191(nota.secao),
    "subsecao:" + txtFavV191(nota.subsecao)
  ].join("|");
}

// Chaves alternativas para recuperar favoritos gravados por versões antigas.
function chavesAlternativasNotaV191(nota) {
  const idx = (dados.notas || []).indexOf(nota);
  const base = [
    chaveNotaFavoritoV191(nota),
    String(nota.id || ""),
    "id:" + String(nota.id || ""),
    "nota:" + String(nota.id || ""),
    [
      "idx:" + idx,
      "id:" + String(nota.id || ""),
      "data:" + txtFavV191(nota.data),
      "boletim:" + txtFavV191(nota.boletim),
      "numero:" + txtFavV191(nota.numero),
      "titulo:" + txtFavV191(nota.titulo),
      "parte:" + txtFavV191(nota.parte),
      "secao:" + txtFavV191(nota.secao),
      "subsecao:" + txtFavV191(nota.subsecao)
    ].join("|")
  ];

  return Array.from(new Set(base.filter(Boolean)));
}

function notaEhFavoritaV191(nota) {
  const favoritos = new Set(obterFavoritosV191());
  return chavesAlternativasNotaV191(nota).some(k => favoritos.has(k));
}

function alternarFavoritoV191(nota) {
  if (!nota) return;

  const favoritos = obterFavoritosV191();
  const keys = chavesAlternativasNotaV191(nota);
  const existe = keys.some(k => favoritos.includes(k));

  let nova;
  if (existe) {
    nova = favoritos.filter(k => !keys.includes(k));
  } else {
    nova = favoritos.concat(chaveNotaFavoritoV191(nota));
  }

  salvarFavoritosV191(nova);

  if (window.modoFavoritosV191) {
    renderizarFavoritosDiretoV191();
  } else {
    try { renderizarNotas(); } catch {}
    setTimeout(aplicarEstrelasFavoritosV191, 0);
  }
}

function dataOrdemFavoritosV191(dataBR) {
  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return 0;
  return Number(`${m[3]}${String(m[2]).padStart(2, "0")}${String(m[1]).padStart(2, "0")}`);
}

function ordenarFavoritosV191(notas) {
  return [...notas].sort((a, b) => {
    const da = dataOrdemFavoritosV191(a.data);
    const db = dataOrdemFavoritosV191(b.data);
    if (da !== db) return db - da;

    return Number(b.inseridoEm || b.ordemInclusao || b.criadoEm || 0) -
           Number(a.inseridoEm || a.ordemInclusao || a.criadoEm || 0);
  });
}

function notasFavoritasV191() {
  return ordenarFavoritosV191((dados.notas || []).filter(notaEhFavoritaV191));
}

function escapeFavoritoV191(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[m]));
}

function htmlNotaFavoritaV191(nota) {
  const fav = notaEhFavoritaV191(nota) ? "★" : "☆";
  const anexos = Array.isArray(nota.anexos) && nota.anexos.length
    ? `<div class="nota-anexos-indicador">Anexos: ${nota.anexos.length}</div>`
    : "";

  return `
    <article class="nota card-com-favorito-v159" id="${escapeFavoritoV191(nota.id)}" data-id-nota="${escapeFavoritoV191(nota.id)}">
      <button class="titulo-nota" type="button">
        <span class="texto-titulo-nota">
          <strong>${escapeFavoritoV191(nota.numero)} - ${escapeFavoritoV191(nota.titulo)}</strong>
          <small>${escapeFavoritoV191(nota.data)} • ${escapeFavoritoV191(nota.boletim || nota.boletimTexto || "")}</small>
        </span>
        <button type="button" class="btn-favorito-nota-v159 btn-favorito-no-cabecalho-v161 btn-favorito-v191 favorita" data-fav-id="${escapeFavoritoV191(nota.id)}">${fav}</button>
        <span class="icone">+</span>
      </button>
      <div class="conteudo-nota">
        <div class="meta-nota">
          <span>${escapeFavoritoV191(nota.parte || "")}</span>
          ${nota.secao ? `<span>${escapeFavoritoV191(nota.secao)}</span>` : ""}
          ${nota.subsecao ? `<span>${escapeFavoritoV191(nota.subsecao)}</span>` : ""}
        </div>
        <div class="texto-nota">${nota.texto || ""}</div>
        ${anexos}
      </div>
    </article>
  `;
}

function configurarEventosListaFavoritosV191() {
  const lista = document.getElementById("listaNotas");
  if (!lista || lista.dataset.v191 === "1") return;
  lista.dataset.v191 = "1";

  lista.addEventListener("click", event => {
    const fav = event.target.closest(".btn-favorito-v191, .btn-favorito-nota-v159");
    if (fav && window.modoFavoritosV191) {
      event.preventDefault();
      event.stopPropagation();
      const id = fav.dataset.favId || fav.closest(".nota")?.dataset.idNota || fav.closest(".nota")?.id;
      const nota = (dados.notas || []).find(n => String(n.id) === String(id));
      alternarFavoritoV191(nota);
      return;
    }

    const titulo = event.target.closest(".titulo-nota");
    if (titulo && window.modoFavoritosV191) {
      const card = titulo.closest(".nota");
      if (!card) return;
      card.classList.toggle("aberta");
      const icone = card.querySelector(".icone");
      if (icone) icone.textContent = card.classList.contains("aberta") ? "−" : "+";
    }
  }, true);
}

function renderizarFavoritosDiretoV191() {
  window.modoFavoritosV191 = true;
  window.filtroFavoritosAtivoV159 = true;
  try { filtroFavoritosAtivoV159 = true; } catch {}

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

  const notas = notasFavoritasV191();

  if (!notas.length) {
    lista.innerHTML = `<div class="sem-notas">Nenhuma nota favoritada por este usuário.</div>`;
  } else {
    lista.innerHTML = notas.map(htmlNotaFavoritaV191).join("");
  }

  const btn = document.getElementById("btnFavoritosNotasV159");
  if (btn) {
    btn.classList.add("ativo");
    btn.textContent = `Favoritos (${notas.length})`;
  }

  configurarEventosListaFavoritosV191();
}

function sairModoFavoritosV191() {
  window.modoFavoritosV191 = false;
  window.filtroFavoritosAtivoV159 = false;
  try { filtroFavoritosAtivoV159 = false; } catch {}
}

function aplicarEstrelasFavoritosV191() {
  if (window.modoFavoritosV191) return;

  const cards = Array.from(document.querySelectorAll("#listaNotas article.nota, #listaNotas .nota"));
  cards.forEach(card => {
    const id = card.dataset.idNota || card.id;
    const nota = (dados.notas || []).find(n => String(n.id) === String(id));
    if (!nota) return;

    card.querySelectorAll(".btn-favorito-nota-v159").forEach(b => b.remove());

    const estrela = document.createElement("button");
    estrela.type = "button";
    estrela.className = "btn-favorito-nota-v159 btn-favorito-no-cabecalho-v161 btn-favorito-v191";
    estrela.innerHTML = notaEhFavoritaV191(nota) ? "★" : "☆";
    estrela.classList.toggle("favorita", notaEhFavoritaV191(nota));
    estrela.dataset.favId = nota.id;

    estrela.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      alternarFavoritoV191(nota);
    }, true);

    const titulo = card.querySelector(".titulo-nota");
    const icone = titulo?.querySelector(".icone");
    if (titulo) titulo.insertBefore(estrela, icone || null);
  });

  const btn = document.getElementById("btnFavoritosNotasV159");
  if (btn) {
    const total = notasFavoritasV191().length;
    btn.classList.toggle("ativo", false);
    btn.textContent = "Favoritos";
    btn.title = `Exibir meus favoritos (${total})`;
  }
}

function configurarFavoritosV191() {
  const btn = document.getElementById("btnFavoritosNotasV159");
  if (btn && btn.dataset.v191 !== "1") {
    btn.dataset.v191 = "1";
    btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (window.modoFavoritosV191) {
        sairModoFavoritosV191();
        try { mostrarBoletim(); } catch {}
        try { renderizarNotas(); } catch {}
        setTimeout(aplicarEstrelasFavoritosV191, 0);
      } else {
        renderizarFavoritosDiretoV191();
      }

      return false;
    }, true);
  }

  configurarEventosListaFavoritosV191();
}

// Compatibilidade com funções antigas.
window.notaEstaFavoritaV159 = notaEhFavoritaV191;
window.notaEstaFavoritaUsuarioV162 = notaEhFavoritaV191;
window.notaEstaFavoritaUsuarioV163 = notaEhFavoritaV191;
window.obterFavoritosUsuarioV162 = obterFavoritosV191;
window.alternarFavoritoNotaUsuarioV162 = function(notaOuId) {
  const nota = typeof notaOuId === "object" ? notaOuId : (dados.notas || []).find(n => String(n.id) === String(notaOuId));
  alternarFavoritoV191(nota);
};
window.alternarFavoritoNotaUsuarioV163 = window.alternarFavoritoNotaUsuarioV162;

(function reforcarRenderV191() {
  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV191) {
      window.renderizarNotasOriginalV191 = renderizarNotas;
      renderizarNotas = function(...args) {
        if (window.modoFavoritosV191) {
          renderizarFavoritosDiretoV191();
          return;
        }
        const r = window.renderizarNotasOriginalV191.apply(this, args);
        setTimeout(() => {
          configurarFavoritosV191();
          aplicarEstrelasFavoritosV191();
        }, 0);
        return r;
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarFavoritosV191();
  setTimeout(() => {
    configurarFavoritosV191();
    aplicarEstrelasFavoritosV191();
  }, 300);
  setTimeout(() => {
    configurarFavoritosV191();
    aplicarEstrelasFavoritosV191();
  }, 1000);
});
