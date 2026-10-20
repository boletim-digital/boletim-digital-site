
// v187 - popup de duplicidade não trava o campo Número da Nota.

function numeroNotaDuplicadoV187(numero, ignorarId = "") {
  const valor = String(numero || "").trim();
  if (!valor) return false;

  try {
    return (dados.notas || []).some(nota => {
      if (ignorarId && String(nota.id) === String(ignorarId)) return false;
      return String(nota.numero || "").trim() === valor;
    });
  } catch {
    return false;
  }
}

function campoNumeroNotaDuplicadoV187() {
  const campo = document.getElementById("notaNumero");
  const form = document.getElementById("formNota");

  const numero = String(campo?.value || "").trim();
  const editandoId = form?.dataset.editandoId || "";

  return numeroNotaDuplicadoV187(numero, editandoId);
}

let popupDuplicataAbertoV187 = false;

function mostrarPopupDuplicataNumeroNotaV187() {
  if (popupDuplicataAbertoV187) return false;

  popupDuplicataAbertoV187 = true;

  setTimeout(() => {
    alert("Já existe uma nota com esse Número da Nota. Use outro número ou edite a nota existente.");

    popupDuplicataAbertoV187 = false;

    const campo = document.getElementById("notaNumero");
    if (campo) {
      campo.classList.add("campo-obrigatorio-erro-v181");

      // Depois do OK, volta o foco para o campo e deixa editar normalmente.
      setTimeout(() => {
        try {
          campo.focus();
          campo.select();
        } catch {}
      }, 0);

      setTimeout(() => {
        campo.classList.remove("campo-obrigatorio-erro-v181", "campo-duplicado-v183");
      }, 1600);
    }

    const inline = document.getElementById("erroNumeroNotaDuplicadoV183");
    if (inline) inline.classList.add("escondido");
  }, 0);

  return false;
}

function validarDuplicataNumeroNotaPopupV187() {
  if (!campoNumeroNotaDuplicadoV187()) return true;
  return mostrarPopupDuplicataNumeroNotaV187();
}

// Importante:
// A validação antiga da v183 estava presa ao blur do campo e chamava popup.
// Agora ela fica silenciosa para não reabrir o alerta quando o usuário clica OK.
window.validarDuplicataNumeroNotaV183 = function() {
  const inline = document.getElementById("erroNumeroNotaDuplicadoV183");
  if (inline) inline.classList.add("escondido");

  const campo = document.getElementById("notaNumero");
  if (campo) campo.classList.remove("campo-duplicado-v183");

  // Retorna true no blur para permitir edição livre.
  return true;
};

// Esta é a validação usada ao tentar salvar.
window.validarDuplicataNumeroNotaV182 = validarDuplicataNumeroNotaPopupV187;
window.validarDuplicataNumeroNotaPopupV186 = validarDuplicataNumeroNotaPopupV187;

function configurarPopupDuplicataEditavelV187() {
  const campo = document.getElementById("notaNumero");
  const form = document.getElementById("formNota");

  const inline = document.getElementById("erroNumeroNotaDuplicadoV183");
  if (inline) inline.classList.add("escondido");

  if (campo && campo.dataset.v187 !== "1") {
    campo.dataset.v187 = "1";

    campo.addEventListener("input", () => {
      campo.classList.remove("campo-obrigatorio-erro-v181", "campo-duplicado-v183");

      const inline = document.getElementById("erroNumeroNotaDuplicadoV183");
      if (inline) inline.classList.add("escondido");
    }, true);

    // Bloqueia validações antigas no blur que faziam o popup reaparecer.
    campo.addEventListener("blur", event => {
      const inline = document.getElementById("erroNumeroNotaDuplicadoV183");
      if (inline) inline.classList.add("escondido");

      campo.classList.remove("campo-duplicado-v183");
      event.stopImmediatePropagation();
    }, true);
  }

  if (form && form.dataset.v187 !== "1") {
    form.dataset.v187 = "1";

    form.addEventListener("submit", event => {
      if (campoNumeroNotaDuplicadoV187()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        mostrarPopupDuplicataNumeroNotaV187();
        return false;
      }
    }, true);
  }

  // Reembrulha a inclusão para garantir popup só no salvamento.
  try {
    if (typeof incluirNotaPeloFormulario === "function" && !window.incluirNotaPeloFormularioOriginalV187) {
      window.incluirNotaPeloFormularioOriginalV187 = incluirNotaPeloFormulario;

      incluirNotaPeloFormulario = function(...args) {
        if (campoNumeroNotaDuplicadoV187()) {
          mostrarPopupDuplicataNumeroNotaV187();
          return false;
        }

        return window.incluirNotaPeloFormularioOriginalV187.apply(this, args);
      };

      window.incluirNotaPeloFormulario = incluirNotaPeloFormulario;
    }
  } catch {}
}

document.addEventListener("DOMContentLoaded", () => {
  configurarPopupDuplicataEditavelV187();
  setTimeout(configurarPopupDuplicataEditavelV187, 300);
  setTimeout(configurarPopupDuplicataEditavelV187, 1000);
});
