
// v212 - correção do texto das notas na impressão do boletim completo.
// Algumas notas estavam imprimindo somente o título. Esta versão força um
// renderizador mais simples e robusto para o boletim completo.

function obterTextoNotaParaImpressaoV212(nota) {
  if (!nota) return "";

  const candidatos = [
    nota.texto,
    nota.conteudo,
    nota.corpo,
    nota.descricao,
    nota.textoNota,
    nota.html,
    nota.observacao,
    nota.observações
  ];

  const texto = candidatos
    .map(v => String(v || "").trim())
    .find(Boolean);

  return texto || "";
}

function limparTextoHtmlV212(html) {
  const valor = String(html || "").trim();
  if (!valor) return "";

  // Se já tem HTML, mantém HTML. Se for texto puro, transforma em parágrafos.
  if (/<[a-z][\s\S]*>/i.test(valor)) return valor;

  return valor
    .split(/\n{1,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => `<p>${escaparHtmlImpressaoV212(p)}</p>`)
    .join("");
}

function escaparHtmlImpressaoV212(s) {
  try {
    if (typeof escapeHtml === "function") return escapeHtml(s);
  } catch {}

  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function renderizarTextoSeguroImpressaoV212(nota) {
  const bruto = obterTextoNotaParaImpressaoV212(nota);

  try {
    if (typeof renderizarTextoParaImpressao === "function") {
      const renderizado = String(renderizarTextoParaImpressao(bruto) || "").trim();
      if (renderizado) return renderizado;
    }
  } catch {}

  return limparTextoHtmlV212(bruto);
}

function renderizarAnexosSeguroImpressaoV212(nota) {
  try {
    if (typeof renderizarAnexosImpressao === "function") {
      return renderizarAnexosImpressao(nota) || "";
    }
  } catch {}
  return "";
}

function renderizarSubitensSeguroImpressaoV212(nota) {
  try {
    if (typeof renderizarSubitensImpressao === "function") {
      return renderizarSubitensImpressao(nota) || "";
    }
  } catch {}
  return "";
}

function renderizarNotaImpressaoCompletaV212(nota, numeroImpresso = "") {
  const tituloOriginal = String(nota?.titulo || "").replace(/^\d+\.\s*/, "").trim();
  const numeroNota = String(nota?.numero || numeroImpresso || "").trim();
  const prefixo = numeroNota ? `${escaparHtmlImpressaoV212(numeroNota)}. ` : "";

  const texto = renderizarTextoSeguroImpressaoV212(nota);
  const textoHtml = texto
    ? `<div class="print-texto print-texto-v212">${texto}</div>`
    : `<div class="print-texto print-texto-v212 print-texto-vazio-v212"></div>`;

  return `
    <article class="print-nota print-nota-v201 print-nota-v212">
      <h5 class="print-nota-titulo print-nota-titulo-v212">${prefixo}${escaparHtmlImpressaoV212(tituloOriginal)}</h5>
      ${textoHtml}
      ${renderizarSubitensSeguroImpressaoV212(nota)}
      ${renderizarAnexosSeguroImpressaoV212(nota)}
    </article>
  `;
}

// Substitui o renderizador usado pela paginação da v201.
window.renderizarNotaImpressaoV201 = renderizarNotaImpressaoCompletaV212;
try { renderizarNotaImpressaoV201 = renderizarNotaImpressaoCompletaV212; } catch {}

// Também substitui o renderizador original quando usado em outros caminhos.
window.renderizarNotaImpressaoV212 = renderizarNotaImpressaoCompletaV212;

// Se as páginas já estiverem montadas, refaz ao imprimir boletim completo.
function refazerPaginasBoletimComRendererV212() {
  if (!document.body.classList.contains("impressao-boletim-completo-v201")) return;

  const area = document.getElementById("areaImpressao");
  if (!area) return;

  // Se já existir boletim paginado, não temos a lista original aqui.
  // Então só removemos linhas/garantimos visibilidade do texto já existente.
  area.querySelectorAll(".print-texto").forEach(el => {
    el.style.display = "";
    el.style.visibility = "visible";
    el.style.opacity = "1";
  });

  area.querySelectorAll(".print-nota, .print-nota-v201").forEach(el => {
    el.classList.add("print-nota-v212");
  });
}

(function reforcarRenderizadorV212() {
  try {
    if (typeof montarPaginasBoletimV201 === "function" && !window.montarPaginasBoletimOriginalV212) {
      window.montarPaginasBoletimOriginalV212 = montarPaginasBoletimV201;

      montarPaginasBoletimV201 = function(...args) {
        const r = window.montarPaginasBoletimOriginalV212.apply(this, args);
        setTimeout(refazerPaginasBoletimComRendererV212, 0);
        setTimeout(refazerPaginasBoletimComRendererV212, 120);
        return r;
      };

      window.montarPaginasBoletimV201 = montarPaginasBoletimV201;
    }
  } catch {}

  try {
    if (typeof montarAreaImpressao === "function" && !window.montarAreaImpressaoOriginalV212) {
      window.montarAreaImpressaoOriginalV212 = montarAreaImpressao;

      montarAreaImpressao = function(...args) {
        const r = window.montarAreaImpressaoOriginalV212.apply(this, args);
        setTimeout(refazerPaginasBoletimComRendererV212, 0);
        setTimeout(refazerPaginasBoletimComRendererV212, 120);
        return r;
      };

      window.montarAreaImpressao = montarAreaImpressao;
    }
  } catch {}
})();

document.addEventListener("beforeprint", refazerPaginasBoletimComRendererV212);
