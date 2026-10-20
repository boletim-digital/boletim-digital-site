
// v195 - indicadores no cabeçalho da nota:
// bonequinho quando o RG logado é mencionado;
// clipes quando a nota possui anexos.

function obterRgUsuarioLogadoV195() {
  const candidatos = [];

  try { candidatos.push(sessionStorage.getItem("boletimDigitalRg")); } catch {}
  try { candidatos.push(localStorage.getItem("boletimDigitalRg")); } catch {}
  try { candidatos.push(sessionStorage.getItem("rgUsuarioLogado")); } catch {}
  try { candidatos.push(localStorage.getItem("rgUsuarioLogado")); } catch {}
  try { candidatos.push(sessionStorage.getItem("rgLogado")); } catch {}
  try { candidatos.push(localStorage.getItem("rgLogado")); } catch {}

  try { candidatos.push(window.usuarioAtual?.rg); } catch {}
  try { candidatos.push(window.usuarioLogado?.rg); } catch {}
  try { candidatos.push(window.usuario?.rg); } catch {}

  try {
    const raw = sessionStorage.getItem("boletimDigitalUsuario");
    if (raw) {
      const obj = JSON.parse(raw);
      candidatos.push(obj?.rg, obj?.RG, obj?.matricula);
    }
  } catch {}

  try {
    const raw = localStorage.getItem("boletimDigitalUsuario");
    if (raw) {
      const obj = JSON.parse(raw);
      candidatos.push(obj?.rg, obj?.RG, obj?.matricula);
    }
  } catch {}

  return candidatos
    .map(v => String(v || "").replace(/\D+/g, ""))
    .find(v => v.length >= 3) || "";
}

function limparHtmlTextoV195(valor) {
  const html = String(valor || "");
  const div = document.createElement("div");
  div.innerHTML = html;
  return String(div.textContent || div.innerText || html)
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function textoCompletoNotaV195(nota) {
  if (!nota) return "";

  const partes = [
    nota.numero,
    nota.titulo,
    nota.boletim,
    nota.boletimTexto,
    nota.data,
    nota.parte,
    nota.secao,
    nota.subsecao,
    nota.texto
  ];

  if (Array.isArray(nota.anexos)) {
    nota.anexos.forEach(anexo => {
      partes.push(anexo?.titulo, anexo?.texto, anexo?.nome, anexo?.descricao);
    });
  }

  if (Array.isArray(nota.subitens)) {
    nota.subitens.forEach(item => {
      partes.push(item?.titulo, item?.texto);
    });
  }

  return limparHtmlTextoV195(partes.filter(Boolean).join(" "));
}

function rgFoiMencionadoNaNotaV195(nota) {
  const rg = obterRgUsuarioLogadoV195();
  if (!rg) return false;

  const texto = textoCompletoNotaV195(nota);
  if (!texto) return false;

  const re = new RegExp(`(^|\\D)${rg}(?=\\D|$)`);
  return re.test(texto.replace(/\D+/g, " "));
}

function notaPossuiAnexoV195(nota) {
  if (!nota) return false;

  if (Array.isArray(nota.anexos) && nota.anexos.some(a => {
    if (!a) return false;
    return Boolean(
      String(a.titulo || "").trim() ||
      String(a.texto || "").trim() ||
      String(a.nome || "").trim() ||
      String(a.url || "").trim() ||
      String(a.arquivo || "").trim() ||
      String(a.base64 || "").trim()
    );
  })) return true;

  if (Array.isArray(nota.arquivos) && nota.arquivos.length) return true;
  if (Array.isArray(nota.attachments) && nota.attachments.length) return true;
  if (nota.temAnexo || nota.possuiAnexo || nota.anexo) return true;

  return false;
}

function encontrarNotaDoCardV195(card) {
  if (!card) return null;

  const id = card.dataset.idNota || card.dataset.id || card.id;

  if (id) {
    const nota = (dados.notas || []).find(n => String(n.id) === String(id));
    if (nota) return nota;
  }

  const titulo = card.querySelector("h3")?.textContent || "";
  const m = titulo.match(/^\s*([^\s-]+)\s*-\s*(.+)$/);
  if (m) {
    const numero = m[1].trim();
    const tituloNota = m[2].trim();
    return (dados.notas || []).find(n =>
      String(n.numero || "").trim() === numero &&
      String(n.titulo || "").trim() === tituloNota
    ) || null;
  }

  return null;
}

function criarIndicadorNotaV195(tipo, titulo) {
  const span = document.createElement("span");
  span.className = `indicador-nota-v195 indicador-${tipo}-v195`;
  span.title = titulo;
  span.setAttribute("aria-label", titulo);

  if (tipo === "mencao-rg") {
    span.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4Zm0 2c-2.67 0-8 1.34-8 4v1.25C4 19.66 4.34 20 4.75 20h14.5c.41 0 .75-.34.75-.75V18c0-2.66-5.33-4-8-4Z"></path>
      </svg>
    `;
  }

  if (tipo === "anexo") {
    span.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M16.5 6.5 8.1 14.9a2.2 2.2 0 0 0 3.1 3.1l8.1-8.1a4 4 0 0 0-5.66-5.66L5.5 12.38a5.8 5.8 0 0 0 8.2 8.2l7.46-7.46a1 1 0 0 0-1.42-1.42l-7.46 7.46a3.8 3.8 0 1 1-5.37-5.37l8.13-8.13a2 2 0 0 1 2.83 2.83L9.78 16.58a.2.2 0 0 1-.28-.28l8.4-8.4a1 1 0 0 0-1.4-1.4Z"></path>
      </svg>
    `;
  }

  return span;
}

function aplicarIndicadoresNotasV195() {
  const cards = Array.from(document.querySelectorAll("#listaNotas article.nota, #listaNotas .nota"));

  cards.forEach(card => {
    const nota = encontrarNotaDoCardV195(card);
    if (!nota) return;

    card.querySelectorAll(".grupo-indicadores-nota-v195, .indicador-nota-v195").forEach(el => el.remove());

    const titulo = card.querySelector(".titulo-nota");
    if (!titulo) return;

    const iconeExpandir = titulo.querySelector(".icone");
    const grupo = document.createElement("span");
    grupo.className = "grupo-indicadores-nota-v195";

    if (rgFoiMencionadoNaNotaV195(nota)) {
      grupo.appendChild(criarIndicadorNotaV195("mencao-rg", "Seu RG foi mencionado nesta nota"));
    }

    if (notaPossuiAnexoV195(nota)) {
      grupo.appendChild(criarIndicadorNotaV195("anexo", "Esta nota possui anexo"));
    }

    if (!grupo.children.length) return;

    // Coloca os indicadores imediatamente antes do +/−.
    if (iconeExpandir) titulo.insertBefore(grupo, iconeExpandir);
    else titulo.appendChild(grupo);
  });
}

(function reforcarRenderIndicadoresV195() {
  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV195) {
      window.renderizarNotasOriginalV195 = renderizarNotas;

      renderizarNotas = function(...args) {
        const r = window.renderizarNotasOriginalV195.apply(this, args);
        setTimeout(aplicarIndicadoresNotasV195, 0);
        setTimeout(aplicarIndicadoresNotasV195, 160);
        return r;
      };
    }
  } catch {}

  try {
    if (typeof renderizarFavoritosV194 === "function" && !window.renderizarFavoritosOriginalV195) {
      window.renderizarFavoritosOriginalV195 = renderizarFavoritosV194;

      renderizarFavoritosV194 = function(...args) {
        const r = window.renderizarFavoritosOriginalV195.apply(this, args);
        setTimeout(aplicarIndicadoresNotasV195, 0);
        setTimeout(aplicarIndicadoresNotasV195, 160);
        return r;
      };

      window.renderizarFavoritosV194 = renderizarFavoritosV194;
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(aplicarIndicadoresNotasV195, 300);
  setTimeout(aplicarIndicadoresNotasV195, 1000);
});

document.addEventListener("click", event => {
  if (
    event.target?.closest?.("#btnFavoritosNotasV159") ||
    event.target?.closest?.(".menu button") ||
    event.target?.closest?.(".titulo-nota")
  ) {
    setTimeout(aplicarIndicadoresNotasV195, 80);
    setTimeout(aplicarIndicadoresNotasV195, 220);
  }
}, true);
