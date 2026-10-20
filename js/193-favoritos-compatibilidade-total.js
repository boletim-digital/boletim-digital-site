
// v193 - Favoritos compatível com versões antigas e novas.
// Considera favorito por ID salvo e também propriedades antigas na nota: favorita/favorito/favoritada.

function usuarioFavoritosV193() {
  let rg = "";
  try { rg = sessionStorage.getItem("boletimDigitalRg") || ""; } catch {}
  if (!rg) {
    try { rg = localStorage.getItem("boletimDigitalRg") || ""; } catch {}
  }
  if (!rg) {
    try { rg = document.getElementById("loginRg")?.value || ""; } catch {}
  }
  return (rg || "local").replace(/[^\w-]/g, "_").toLowerCase();
}

function chaveFavoritosIdsV193() {
  return "boletimDigitalFavoritosIds__" + usuarioFavoritosV193();
}

function obterIdsFavoritosV193() {
  const ids = [];

  try {
    const raw = localStorage.getItem(chaveFavoritosIdsV193());
    const arr = raw ? JSON.parse(raw) : [];
    if (Array.isArray(arr)) ids.push(...arr.map(String));
  } catch {}

  // Recupera listas salvas por versões anteriores.
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;

      const kl = k.toLowerCase();
      if (!kl.includes("favorit")) continue;

      const raw = localStorage.getItem(k);
      const arr = raw ? JSON.parse(raw) : [];

      if (Array.isArray(arr)) {
        arr.forEach(item => {
          const s = String(item || "");
          if (!s) return;

          // Se a chave antiga tiver "id:xxx", extrai o id.
          const m = s.match(/(?:^|\|)id:([^|]+)/);
          if (m && m[1]) ids.push(String(m[1]));

          // Se já for o próprio ID, guarda também.
          ids.push(s);
        });
      }
    }
  } catch {}

  // Recupera favoritos marcados diretamente na própria nota por versões antigas.
  try {
    (dados.notas || []).forEach(nota => {
      if (nota && (nota.favorita || nota.favorito || nota.favoritada) && nota.id) {
        ids.push(String(nota.id));
      }
    });
  } catch {}

  return Array.from(new Set(ids.map(String).filter(Boolean)));
}

function salvarIdsFavoritosV193(ids) {
  const limpa = Array.from(new Set((ids || []).map(String).filter(Boolean)));
  try {
    localStorage.setItem(chaveFavoritosIdsV193(), JSON.stringify(limpa));
  } catch {}
}

function notaFavoritaV193(notaOuId) {
  const id = typeof notaOuId === "object" ? notaOuId?.id : notaOuId;
  if (!id) return false;

  const nota = typeof notaOuId === "object"
    ? notaOuId
    : (dados.notas || []).find(n => String(n.id) === String(id));

  if (nota && (nota.favorita || nota.favorito || nota.favoritada)) return true;

  return obterIdsFavoritosV193().includes(String(id));
}

function alternarFavoritoV193(notaOuId) {
  const id = typeof notaOuId === "object" ? notaOuId?.id : notaOuId;
  if (!id) return;

  const nota = (dados.notas || []).find(n => String(n.id) === String(id));
  const ids = obterIdsFavoritosV193();
  const ja = notaFavoritaV193(id);

  let novos;
  if (ja) {
    novos = ids.filter(x => String(x) !== String(id));
  } else {
    novos = ids.concat(String(id));
  }

  salvarIdsFavoritosV193(novos);

  if (nota) {
    nota.favorita = !ja;
    nota.favorito = !ja;
    nota.favoritada = !ja;
  }

  try {
    if (typeof salvarNotasLocais === "function") salvarNotasLocais();
    else if (typeof salvarDados === "function") salvarDados();
  } catch {}

  if (window.modoFavoritosV193) {
    renderizarFavoritosV193();
  } else {
    atualizarEstrelasV193();
  }
}

function dataOrdFavV193(dataBR) {
  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return 0;
  return Number(`${m[3]}${String(m[2]).padStart(2, "0")}${String(m[1]).padStart(2, "0")}`);
}

function ordenarNotasFavV193(notas) {
  return [...notas].sort((a, b) => {
    const da = dataOrdFavV193(a.data);
    const db = dataOrdFavV193(b.data);
    if (da !== db) return db - da;

    return Number(b.inseridoEm || b.ordemInclusao || b.criadoEm || 0) -
           Number(a.inseridoEm || a.ordemInclusao || a.criadoEm || 0);
  });
}

function notasFavoritasV193() {
  return ordenarNotasFavV193((dados.notas || []).filter(notaFavoritaV193));
}

function escFavV193(s) {
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function textoNotaFavV193(html) {
  try {
    if (typeof renderizarTextoNota === "function") return renderizarTextoNota(html || "");
  } catch {}
  return html || "";
}

function subitensFavV193(nota) {
  try {
    if (typeof renderizarSubitens === "function") return renderizarSubitens(nota);
  } catch {}
  return "";
}

function anexosFavV193(nota) {
  try {
    if (typeof renderizarAnexosDaNota === "function") return renderizarAnexosDaNota(nota);
  } catch {}
  return "";
}

function htmlNotaFavV193(nota) {
  const caminho = [nota.parte, nota.secao, nota.subsecao].filter(Boolean).join(" • ");
  const tituloCompleto = `${nota.numero || ""} - ${nota.titulo || ""}`;

  return `
    <article class="nota" id="${escFavV193(nota.id)}" data-id-nota="${escFavV193(nota.id)}">
      <button class="titulo-nota" type="button">
        <div>
          <h3>${escFavV193(tituloCompleto)}</h3>
          <div class="meta">${escFavV193(nota.boletim || nota.boletimTexto || "")} • ${escFavV193(nota.data || "")}<br>${escFavV193(caminho)}</div>
        </div>
        <button type="button" class="btn-favorito-nota-v159 btn-favorito-v193 favorita" data-fav-id="${escFavV193(nota.id)}">★</button>
        <span class="icone">+</span>
      </button>

      <div class="corpo-nota">
        <div class="texto">${textoNotaFavV193(nota.texto || "")}</div>
        ${subitensFavV193(nota)}
        ${anexosFavV193(nota)}
        <a class="permalink" href="#${escFavV193(nota.id)}">Link permanente desta nota</a>
        <div class="acoes-nota-rodape">
          <div class="acoes-nota-esquerda">
            <button class="btn-editar-nota" type="button" data-id="${escFavV193(nota.id)}">Editar nota</button>
            <button class="btn-excluir-nota" type="button" data-id="${escFavV193(nota.id)}">Excluir nota</button>
          </div>
          <div class="acoes-nota-direita">
            <button class="btn-imprimir-nota" type="button" data-id="${escFavV193(nota.id)}">Imprimir nota</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function atualizarBotaoFavoritosV193() {
  const btn = document.getElementById("btnFavoritosNotasV159");
  if (!btn) return;

  const total = notasFavoritasV193().length;
  btn.classList.toggle("ativo", Boolean(window.modoFavoritosV193));
  btn.textContent = window.modoFavoritosV193 ? `Favoritos (${total})` : "Favoritos";
  btn.title = `Exibir meus favoritos (${total})`;
}

function renderizarFavoritosV193() {
  window.modoFavoritosV193 = true;
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

  const favoritas = notasFavoritasV193();

  if (!favoritas.length) {
    lista.innerHTML = `<div class="vazio">Nenhuma nota favoritada por este usuário.</div>`;
  } else {
    lista.innerHTML = favoritas.map(htmlNotaFavV193).join("");
  }

  atualizarBotaoFavoritosV193();
}

function sairFavoritosV193() {
  window.modoFavoritosV193 = false;
  window.modoFavoritosV192 = false;
  window.modoFavoritosV191 = false;
  window.filtroFavoritosAtivoV159 = false;
  try { filtroFavoritosAtivoV159 = false; } catch {}

  try { mostrarBoletim(); } catch {}
  try { renderizarNotas(); } catch {}
  setTimeout(atualizarEstrelasV193, 0);
}

function atualizarEstrelasV193() {
  if (window.modoFavoritosV193) return;

  document.querySelectorAll("#listaNotas article.nota, #listaNotas .nota").forEach(card => {
    const id = card.dataset.idNota || card.id;
    if (!id) return;

    card.querySelectorAll(".btn-favorito-nota-v159, .btn-favorito-v190, .btn-favorito-v191, .btn-favorito-v192, .btn-favorito-v193").forEach(b => b.remove());

    const fav = notaFavoritaV193(id);

    const estrela = document.createElement("button");
    estrela.type = "button";
    estrela.className = "btn-favorito-nota-v159 btn-favorito-v193";
    estrela.dataset.favId = id;
    estrela.textContent = fav ? "★" : "☆";
    estrela.classList.toggle("favorita", fav);
    estrela.title = fav ? "Remover dos favoritos" : "Adicionar aos favoritos";

    estrela.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      alternarFavoritoV193(id);
      return false;
    }, true);

    const titulo = card.querySelector(".titulo-nota");
    const icone = titulo?.querySelector(".icone");

    if (titulo) titulo.insertBefore(estrela, icone || null);
    else card.appendChild(estrela);
  });

  atualizarBotaoFavoritosV193();
}

function configurarEventosFavoritosV193() {
  const lista = document.getElementById("listaNotas");
  if (lista && lista.dataset.v193 !== "1") {
    lista.dataset.v193 = "1";

    lista.addEventListener("click", event => {
      const fav = event.target.closest(".btn-favorito-v193, .btn-favorito-v192, .btn-favorito-v191, .btn-favorito-v190, .btn-favorito-nota-v159");
      if (fav) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        const id = fav.dataset.favId || fav.closest(".nota")?.dataset.idNota || fav.closest(".nota")?.id;
        alternarFavoritoV193(id);
        return false;
      }

      if (window.modoFavoritosV193) {
        const titulo = event.target.closest(".titulo-nota");
        if (titulo) {
          const card = titulo.closest(".nota");
          card?.classList.toggle("aberta");
          const icone = card?.querySelector(".icone");
          if (icone) icone.textContent = card.classList.contains("aberta") ? "−" : "+";
        }
      }
    }, true);
  }

  const btn = document.getElementById("btnFavoritosNotasV159");
  if (btn && btn.dataset.v193 !== "1") {
    btn.dataset.v193 = "1";
    btn.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      if (window.modoFavoritosV193) sairFavoritosV193();
      else renderizarFavoritosV193();

      return false;
    }, true);
  }
}

// Compatibilidade: força versões antigas a usarem esta lógica.
window.notaEstaFavoritaV159 = function(nota) { return notaFavoritaV193(nota); };
window.notaEstaFavoritaUsuarioV162 = window.notaEstaFavoritaV159;
window.notaEstaFavoritaUsuarioV163 = window.notaEstaFavoritaV159;
window.alternarFavoritoNotaV159 = function(id) { alternarFavoritoV193(id); };
window.alternarFavoritoNotaUsuarioV162 = function(notaOuId) { alternarFavoritoV193(notaOuId); };
window.alternarFavoritoNotaUsuarioV163 = window.alternarFavoritoNotaUsuarioV162;
window.obterFavoritosUsuarioV162 = function() { return obterIdsFavoritosV193(); };

(function reforcarRenderV193() {
  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV193) {
      window.renderizarNotasOriginalV193 = renderizarNotas;

      renderizarNotas = function(...args) {
        if (window.modoFavoritosV193) {
          renderizarFavoritosV193();
          return;
        }

        const r = window.renderizarNotasOriginalV193.apply(this, args);
        setTimeout(() => {
          configurarEventosFavoritosV193();
          atualizarEstrelasV193();
        }, 0);
        return r;
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarEventosFavoritosV193();
  setTimeout(() => {
    configurarEventosFavoritosV193();
    atualizarEstrelasV193();
  }, 300);
  setTimeout(() => {
    configurarEventosFavoritosV193();
    atualizarEstrelasV193();
  }, 1000);
});
