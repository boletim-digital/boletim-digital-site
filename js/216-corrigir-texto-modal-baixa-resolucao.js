
// v216 - corrige sumiço/colapso do campo Texto no modal Incluir Nova Nota.

function encontrarBlocoTextoPrincipalV216() {
  const editor = document.getElementById("notaTextoEditor");
  if (!editor) return null;

  let atual = editor.parentElement;
  while (atual && atual.id !== "modalNota") {
    const texto = String(atual.textContent || "").toLowerCase();
    const temAnexo = /anexo\s*1|texto do anexo|título do anexo/i.test(texto);
    const temEditorPrincipal = atual.querySelector("#notaTextoEditor");

    if (temEditorPrincipal && !temAnexo) return atual;

    // Se contém editor principal mas também anexo, tenta devolver o pai imediato
    // que ainda é anterior ao bloco de anexos.
    if (temEditorPrincipal && atual.parentElement?.id !== "modalNota") {
      const anterior = editor.closest("label, .campo, .grupo-form, .campo-form, .form-grupo, .editor-container, .bloco-editor");
      if (anterior) return anterior;
    }

    atual = atual.parentElement;
  }

  return editor.parentElement;
}

function encontrarToolbarTextoPrincipalV216() {
  const editor = document.getElementById("notaTextoEditor");
  if (!editor) return null;

  const bloco = encontrarBlocoTextoPrincipalV216() || editor.parentElement;
  if (!bloco) return null;

  const toolbars = Array.from(bloco.querySelectorAll(".barra-editor, .toolbar-editor, .toolbar-editor-avancada"));
  if (toolbars.length) return toolbars[toolbars.length - 1];

  // Fallback: toolbar imediatamente antes do editor.
  let el = editor.previousElementSibling;
  while (el) {
    if (el.matches?.(".barra-editor, .toolbar-editor, .toolbar-editor-avancada")) return el;
    el = el.previousElementSibling;
  }

  return null;
}

function marcarBlocosModalNotaV216() {
  const modal = document.getElementById("modalNota");
  const editor = document.getElementById("notaTextoEditor");
  if (!modal || !editor) return;

  editor.classList.add("editor-texto-principal-v216");
  editor.dataset.placeholder = editor.dataset.placeholder || "Digite o texto da nota...";

  const blocoTexto = encontrarBlocoTextoPrincipalV216();
  if (blocoTexto) {
    blocoTexto.classList.add("campo-texto-nota-v216");
    blocoTexto.style.display = "block";
    blocoTexto.style.visibility = "visible";
    blocoTexto.style.opacity = "1";
    blocoTexto.style.minHeight = "190px";
    blocoTexto.style.clear = "both";
  }

  const toolbar = encontrarToolbarTextoPrincipalV216();
  if (toolbar) {
    toolbar.classList.add("toolbar-texto-principal-v216");
    toolbar.style.display = "flex";
    toolbar.style.visibility = "visible";
    toolbar.style.opacity = "1";
    toolbar.style.flexWrap = "wrap";
  }

  const listaAnexos = document.getElementById("listaCamposAnexos");
  if (listaAnexos) {
    listaAnexos.classList.add("anexos-nota-v216");

    // Garante que anexos venham depois do bloco texto, quando o DOM permitir.
    if (blocoTexto && blocoTexto.parentElement && listaAnexos.parentElement === blocoTexto.parentElement) {
      if (blocoTexto.compareDocumentPosition(listaAnexos) & Node.DOCUMENT_POSITION_PRECEDING) {
        blocoTexto.parentElement.insertBefore(blocoTexto, listaAnexos);
      }
    }
  }

  ajustarAlturaEditorPrincipalV216();
}

function ajustarAlturaEditorPrincipalV216() {
  const editor = document.getElementById("notaTextoEditor");
  if (!editor) return;

  const altura = window.innerHeight || document.documentElement.clientHeight || 800;

  editor.style.display = "block";
  editor.style.visibility = "visible";
  editor.style.opacity = "1";
  editor.style.width = "100%";
  editor.style.overflowY = "auto";
  editor.style.overflowX = "hidden";
  editor.style.boxSizing = "border-box";
  editor.style.flex = "0 0 auto";

  if (altura <= 640) {
    editor.style.minHeight = "120px";
    editor.style.maxHeight = "28vh";
  } else if (altura <= 760) {
    editor.style.minHeight = "145px";
    editor.style.maxHeight = "32vh";
  } else {
    editor.style.minHeight = "170px";
    editor.style.maxHeight = "42vh";
  }
}

(function interceptarModalTextoV216() {
  const nomes = ["abrirModalNota", "preencherPadroesNovaNota", "prepararFormularioNovaNota", "adicionarCampoAnexo"];

  nomes.forEach(nome => {
    try {
      const fn = window[nome] || eval(nome);

      if (typeof fn === "function" && !fn.__v216) {
        const original = fn;

        const wrapper = function(...args) {
          const r = original.apply(this, args);
          setTimeout(marcarBlocosModalNotaV216, 0);
          setTimeout(marcarBlocosModalNotaV216, 120);
          setTimeout(marcarBlocosModalNotaV216, 300);
          return r;
        };

        wrapper.__v216 = true;
        window[nome] = wrapper;
        try { eval(`${nome} = window["${nome}"];`); } catch {}
      }
    } catch {}
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  marcarBlocosModalNotaV216();
  setTimeout(marcarBlocosModalNotaV216, 400);
});

document.addEventListener("click", event => {
  if (
    event.target?.id === "btnNovaNota" ||
    event.target?.closest?.("#btnNovaNota") ||
    event.target?.id === "btnAdicionarAnexo" ||
    event.target?.closest?.("#btnAdicionarAnexo")
  ) {
    setTimeout(marcarBlocosModalNotaV216, 80);
    setTimeout(marcarBlocosModalNotaV216, 250);
  }
}, true);

window.addEventListener("resize", () => {
  setTimeout(marcarBlocosModalNotaV216, 80);
});
