
// v190 - corrige filtro Favoritos para mostrar as notas favoritadas do usuário atual.

function obterUsuarioFavoritosV190() {
  try {
    if (typeof obterRgUsuarioFavoritosV162 === "function") return obterRgUsuarioFavoritosV162();
  } catch {}

  let rg = "";
  try { rg = sessionStorage.getItem("boletimDigitalRg") || ""; } catch {}
  if (!rg) {
    try { rg = localStorage.getItem("boletimDigitalRg") || ""; } catch {}
  }

  if (rg) return "rg_" + String(rg).replace(/[^\w-]/g, "_").toLowerCase();

  let local = localStorage.getItem("boletimDigitalFavoritosUsuarioLocalV190");
  if (!local) {
    local = "local_" + Date.now() + "_" + Math.random().toString(16).slice(2);
    localStorage.setItem("boletimDigitalFavoritosUsuarioLocalV190", local);
  }
  return local;
}

function chaveStorageFavoritosV190() {
  try {
    if (typeof chaveStorageFavoritosV162 === "function") return chaveStorageFavoritosV162();
  } catch {}
  return "boletimDigitalFavoritosNotasPorUsuario__" + obterUsuarioFavoritosV190();
}

function limparTextoFavoritoV190(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function chaveFavoritoNotaV190(nota) {
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
    "data:" + limparTextoFavoritoV190(nota.data),
    "boletim:" + limparTextoFavoritoV190(nota.boletim),
    "numero:" + limparTextoFavoritoV190(nota.numero),
    "titulo:" + limparTextoFavoritoV190(nota.titulo),
    "parte:" + limparTextoFavoritoV190(nota.parte),
    "secao:" + limparTextoFavoritoV190(nota.secao),
    "subsecao:" + limparTextoFavoritoV190(nota.subsecao)
  ].join("|");
}

function obterFavoritosUsuarioV190() {
  try {
    const raw = localStorage.getItem(chaveStorageFavoritosV190());
    const lista = raw ? JSON.parse(raw) : [];
    return Array.isArray(lista) ? lista.map(String) : [];
  } catch {
    return [];
  }
}

function salvarFavoritosUsuarioV190(lista) {
  try {
    const limpa = Array.from(new Set((lista || []).map(String).filter(Boolean)));
    localStorage.setItem(chaveStorageFavoritosV190(), JSON.stringify(limpa));
  } catch {}
}

function notaFavoritaV190(nota) {
  return obterFavoritosUsuarioV190().includes(chaveFavoritoNotaV190(nota));
}

function alternarFavoritoNotaV190(nota) {
  if (!nota) return;

  const chave = chaveFavoritoNotaV190(nota);
  if (!chave) return;

  const lista = obterFavoritosUsuarioV190();
  const i = lista.indexOf(chave);

  if (i >= 0) lista.splice(i, 1);
  else lista.push(chave);

  salvarFavoritosUsuarioV190(lista);

  try { renderizarNotas(); } catch {}
  setTimeout(aplicarFavoritosV190, 0);
}

function notasBaseFavoritosV190() {
  let notas = Array.isArray(dados?.notas) ? [...dados.notas] : [];

  try {
    if (typeof pertenceADataSelecionadaCalendario === "function") notas = notas.filter(pertenceADataSelecionadaCalendario);
  } catch {}

  try {
    if (typeof pertenceAoBoletim === "function") notas = notas.filter(pertenceAoBoletim);
  } catch {}

  try {
    if (typeof pertenceAoFiltro === "function") notas = notas.filter(pertenceAoFiltro);
  } catch {}

  try {
    if (typeof passaNaBusca === "function") notas = notas.filter(passaNaBusca);
  } catch {}

  try {
    if (typeof compararNotasDataInclusaoV184 === "function") notas.sort((a, b) => compararNotasDataInclusaoV184(a, b));
    else if (typeof ordenarNotas === "function") notas.sort(ordenarNotas);
  } catch {}

  return notas;
}

function notasDaPaginaAtualV190() {
  const notas = window.filtroFavoritosAtivoV159
    ? notasBaseFavoritosV190().filter(notaFavoritaV190)
    : notasBaseFavoritosV190();

  try {
    const totalPaginas = Math.max(1, Math.ceil(notas.length / itensPorPagina));
    if (paginaAtual > totalPaginas) paginaAtual = totalPaginas;
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return notas.slice(inicio, inicio + itensPorPagina);
  } catch {
    return notas;
  }
}

function atualizarBotaoFavoritosV190() {
  const btn = document.getElementById("btnFavoritosNotasV159");
  if (!btn) return;

  const total = (dados.notas || []).filter(notaFavoritaV190).length;
  btn.classList.toggle("ativo", Boolean(window.filtroFavoritosAtivoV159));
  btn.textContent = window.filtroFavoritosAtivoV159 ? `Favoritos (${total})` : "Favoritos";
  btn.title = `Exibir meus favoritos (${total})`;
}

function aplicarFavoritosV190() {
  const cards = Array.from(document.querySelectorAll("#listaNotas article.nota, #listaNotas .nota"));
  const notasPagina = notasDaPaginaAtualV190();

  cards.forEach((card, index) => {
    const nota = notasPagina[index] || (dados.notas || []).find(n => String(n.id) === String(card.dataset.idNota || card.id));
    if (!nota) return;

    card.dataset.idNota = nota.id || "";

    card.querySelectorAll(".btn-favorito-nota-v159").forEach(btn => btn.remove());

    const estrela = document.createElement("button");
    estrela.type = "button";
    estrela.className = "btn-favorito-nota-v159 btn-favorito-no-cabecalho-v161 btn-favorito-v190";
    estrela.innerHTML = notaFavoritaV190(nota) ? "★" : "☆";
    estrela.classList.toggle("favorita", notaFavoritaV190(nota));
    estrela.title = notaFavoritaV190(nota) ? "Remover dos meus favoritos" : "Adicionar aos meus favoritos";

    estrela.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      alternarFavoritoNotaV190(nota);
    }, true);

    const tituloBtn = card.querySelector(".titulo-nota");
    const icone = tituloBtn?.querySelector(".icone");

    if (tituloBtn) tituloBtn.insertBefore(estrela, icone || null);
    else card.appendChild(estrela);
  });

  atualizarBotaoFavoritosV190();
}

function configurarBotaoFavoritosV190() {
  const btn = document.getElementById("btnFavoritosNotasV159");
  if (!btn || btn.dataset.v190 === "1") return;

  btn.dataset.v190 = "1";

  btn.addEventListener("click", event => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    window.filtroFavoritosAtivoV159 = !window.filtroFavoritosAtivoV159;
    try { filtroFavoritosAtivoV159 = window.filtroFavoritosAtivoV159; } catch {}

    try { paginaAtual = 1; } catch {}

    try { renderizarNotas(); } catch {}

    setTimeout(aplicarFavoritosV190, 0);
    return false;
  }, true);
}

// Compatibilidade com versões anteriores.
window.notaEstaFavoritaV159 = notaFavoritaV190;
window.notaEstaFavoritaUsuarioV162 = notaFavoritaV190;
window.notaEstaFavoritaUsuarioV163 = notaFavoritaV190;
window.obterFavoritosUsuarioV162 = obterFavoritosUsuarioV190;

window.alternarFavoritoNotaUsuarioV162 = function(notaOuId) {
  const nota = typeof notaOuId === "object"
    ? notaOuId
    : (dados.notas || []).find(n => String(n.id) === String(notaOuId));
  alternarFavoritoNotaV190(nota);
};
window.alternarFavoritoNotaUsuarioV163 = window.alternarFavoritoNotaUsuarioV162;

(function reforcarRenderFavoritosV190() {
  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV190) {
      window.renderizarNotasOriginalV190 = renderizarNotas;
      renderizarNotas = function(...args) {
        const r = window.renderizarNotasOriginalV190.apply(this, args);
        setTimeout(() => {
          configurarBotaoFavoritosV190();
          aplicarFavoritosV190();
        }, 0);
        return r;
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarBotaoFavoritosV190();
  setTimeout(() => {
    configurarBotaoFavoritosV190();
    aplicarFavoritosV190();
  }, 300);
  setTimeout(() => {
    configurarBotaoFavoritosV190();
    aplicarFavoritosV190();
  }, 1000);
});
