
// v211 - ajustes no corpo da impressão do boletim completo.
// 1) Remove a linha de boletim abaixo do título de cada nota.
// 2) Reaplica após montagem das páginas do boletim.

function removerLinhaBoletimDasNotasV211() {
  if (!document.body.classList.contains("impressao-boletim-completo-v201")) return;

  const area = document.getElementById("areaImpressao");
  if (!area) return;

  // Remove elementos conhecidos de metadados/caminho usados na impressão.
  area.querySelectorAll(
    ".print-meta, .print-meta-nota, .print-caminho, .print-caminho-v201, .meta, .meta-nota"
  ).forEach(el => {
    const texto = String(el.textContent || "").trim();

    if (
      /boletim\s+da\s+sedec\/cbmerj/i.test(texto) ||
      /^boletim\s+/i.test(texto) ||
      /n[º°]\s*\d+/i.test(texto) && /\d{2}\/\d{2}\/\d{4}/.test(texto)
    ) {
      el.remove();
    }
  });

  // Caso a linha venha como div/span/p solto imediatamente após o título da nota.
  area.querySelectorAll(".print-nota, .print-nota-v201").forEach(notaEl => {
    const filhos = Array.from(notaEl.children);
    filhos.forEach(el => {
      const texto = String(el.textContent || "").trim();

      if (
        /boletim\s+da\s+sedec\/cbmerj/i.test(texto) ||
        /^boletim\s+da/i.test(texto) ||
        (/^boletim/i.test(texto) && /\d{2}\/\d{2}\/\d{4}/.test(texto))
      ) {
        el.remove();
      }
    });
  });

  // Remove texto puro em nós após o h5, se algum renderizador colocou como texto direto.
  area.querySelectorAll(".print-nota, .print-nota-v201").forEach(notaEl => {
    Array.from(notaEl.childNodes).forEach(node => {
      if (node.nodeType !== Node.TEXT_NODE) return;

      const texto = String(node.textContent || "").trim();
      if (/boletim\s+da\s+sedec\/cbmerj/i.test(texto)) {
        node.remove();
      }
    });
  });
}

(function reforcarAjusteImpressaoV211() {
  try {
    if (typeof montarPaginasBoletimV201 === "function" && !window.montarPaginasBoletimOriginalV211) {
      window.montarPaginasBoletimOriginalV211 = montarPaginasBoletimV201;

      montarPaginasBoletimV201 = function(...args) {
        const r = window.montarPaginasBoletimOriginalV211.apply(this, args);
        setTimeout(removerLinhaBoletimDasNotasV211, 0);
        setTimeout(removerLinhaBoletimDasNotasV211, 120);
        return r;
      };

      window.montarPaginasBoletimV201 = montarPaginasBoletimV201;
    }
  } catch {}

  try {
    if (typeof montarAreaImpressao === "function" && !window.montarAreaImpressaoOriginalV211) {
      window.montarAreaImpressaoOriginalV211 = montarAreaImpressao;

      montarAreaImpressao = function(...args) {
        const r = window.montarAreaImpressaoOriginalV211.apply(this, args);
        setTimeout(removerLinhaBoletimDasNotasV211, 0);
        setTimeout(removerLinhaBoletimDasNotasV211, 140);
        return r;
      };

      window.montarAreaImpressao = montarAreaImpressao;
    }
  } catch {}
})();

document.addEventListener("beforeprint", removerLinhaBoletimDasNotasV211);
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(removerLinhaBoletimDasNotasV211, 300);
});
