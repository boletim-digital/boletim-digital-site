
// v215 - reforço de responsividade da janela Incluir Nova Nota.

function ajustarModalNotaResponsivoV215() {
  const modal = document.getElementById("modalNota");
  if (!modal) return;

  modal.classList.add("modal-nota-responsivo-v215");

  const editor = document.getElementById("notaTextoEditor");
  if (editor) {
    editor.classList.add("editor-nota-responsivo-v215");

    const altura = window.innerHeight || document.documentElement.clientHeight || 800;

    if (altura <= 640) {
      editor.style.minHeight = "105px";
      editor.style.maxHeight = "24vh";
      editor.style.overflowY = "auto";
    } else if (altura <= 760) {
      editor.style.minHeight = "135px";
      editor.style.maxHeight = "30vh";
      editor.style.overflowY = "auto";
    } else {
      editor.style.maxHeight = "42vh";
      editor.style.overflowY = "auto";
    }
  }

  const caixas = Array.from(modal.querySelectorAll(".modal-conteudo, .modal-card, .modal-box, .janela-modal"));
  if (!caixas.length && modal.firstElementChild) caixas.push(modal.firstElementChild);

  caixas.forEach(caixa => {
    caixa.classList.add("modal-nota-caixa-responsiva-v215");
    caixa.style.maxHeight = "calc(100vh - 24px)";
    caixa.style.overflowY = "auto";
    caixa.style.overflowX = "hidden";
    caixa.style.boxSizing = "border-box";
  });
}

(function interceptarAberturaModalNotaV215() {
  const nomes = ["abrirModalNota", "preencherPadroesNovaNota", "prepararFormularioNovaNota"];

  nomes.forEach(nome => {
    try {
      const fn = window[nome] || eval(nome);

      if (typeof fn === "function" && !fn.__v215) {
        const original = fn;
        const wrapper = function(...args) {
          const r = original.apply(this, args);
          setTimeout(ajustarModalNotaResponsivoV215, 0);
          setTimeout(ajustarModalNotaResponsivoV215, 150);
          return r;
        };

        wrapper.__v215 = true;
        window[nome] = wrapper;
        try { eval(`${nome} = window["${nome}"];`); } catch {}
      }
    } catch {}
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  ajustarModalNotaResponsivoV215();
  setTimeout(ajustarModalNotaResponsivoV215, 400);
});

document.addEventListener("click", event => {
  if (
    event.target?.id === "btnNovaNota" ||
    event.target?.closest?.("#btnNovaNota") ||
    event.target?.closest?.("[data-abrir-modal-nota]")
  ) {
    setTimeout(ajustarModalNotaResponsivoV215, 80);
    setTimeout(ajustarModalNotaResponsivoV215, 250);
  }
}, true);

window.addEventListener("resize", () => {
  setTimeout(ajustarModalNotaResponsivoV215, 80);
});
