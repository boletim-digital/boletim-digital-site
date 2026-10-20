
// v183 - corrige erro de duplicidade de Número da Nota sem travar a janela.
function obterCaixaErroNumeroNotaV183() {
  const campo = document.getElementById("notaNumero");
  if (!campo) return null;

  let caixa = document.getElementById("erroNumeroNotaDuplicadoV183");

  if (!caixa) {
    caixa = document.createElement("div");
    caixa.id = "erroNumeroNotaDuplicadoV183";
    caixa.className = "erro-numero-nota-duplicado-v183 escondido";
    caixa.textContent = "Já existe uma nota com esse número. Use outro número ou edite a nota existente.";

    const label = campo.closest("label");
    if (label) {
      label.insertAdjacentElement("afterend", caixa);
    } else {
      campo.insertAdjacentElement("afterend", caixa);
    }
  }

  return caixa;
}

function esconderErroNumeroNotaV183() {
  const caixa = document.getElementById("erroNumeroNotaDuplicadoV183");
  const campo = document.getElementById("notaNumero");

  if (caixa) caixa.classList.add("escondido");
  if (campo) campo.classList.remove("campo-obrigatorio-erro-v181", "campo-duplicado-v183");
}

function mostrarErroNumeroNotaV183() {
  const caixa = obterCaixaErroNumeroNotaV183();
  const campo = document.getElementById("notaNumero");

  if (caixa) caixa.classList.remove("escondido");

  if (campo) {
    campo.classList.add("campo-duplicado-v183");
    try {
      campo.focus();
      campo.select();
    } catch {}
  }
}

function numeroNotaJaExisteSemTravarV183(numero, ignorarId = "") {
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

function validarDuplicataNumeroNotaV183(mostrarMensagem = true) {
  const campo = document.getElementById("notaNumero");
  const form = document.getElementById("formNota");
  const numero = String(campo?.value || "").trim();
  const editandoId = form?.dataset.editandoId || "";

  if (!numero) {
    esconderErroNumeroNotaV183();
    return true;
  }

  if (numeroNotaJaExisteSemTravarV183(numero, editandoId)) {
    if (mostrarMensagem) mostrarErroNumeroNotaV183();
    return false;
  }

  esconderErroNumeroNotaV183();
  return true;
}

// Substitui a função da v182 para não usar alert.
window.validarDuplicataNumeroNotaV182 = function() {
  return validarDuplicataNumeroNotaV183(true);
};

// Se a função de inclusão da v182 estiver ativa, substitui por uma versão que primeiro
// valida sem alert e só continua se estiver tudo certo.
(function corrigirInclusaoDuplicataV183() {
  try {
    if (typeof incluirNotaPeloFormularioV182 === "function" && !window.incluirNotaPeloFormularioV182OriginalV183) {
      window.incluirNotaPeloFormularioV182OriginalV183 = incluirNotaPeloFormularioV182;

      incluirNotaPeloFormularioV182 = function(...args) {
        if (!validarDuplicataNumeroNotaV183(true)) {
          return false;
        }

        return window.incluirNotaPeloFormularioV182OriginalV183.apply(this, args);
      };

      window.incluirNotaPeloFormulario = incluirNotaPeloFormularioV182;
      try { incluirNotaPeloFormulario = incluirNotaPeloFormularioV182; } catch {}
    }
  } catch {}

  try {
    if (typeof incluirNotaPeloFormulario === "function" && !window.incluirNotaPeloFormularioOriginalV183) {
      window.incluirNotaPeloFormularioOriginalV183 = incluirNotaPeloFormulario;

      incluirNotaPeloFormulario = function(...args) {
        if (!validarDuplicataNumeroNotaV183(true)) {
          return false;
        }

        return window.incluirNotaPeloFormularioOriginalV183.apply(this, args);
      };

      window.incluirNotaPeloFormulario = incluirNotaPeloFormulario;
    }
  } catch {}
})();

function configurarErroDuplicataNumeroNotaV183() {
  const campo = document.getElementById("notaNumero");
  const form = document.getElementById("formNota");

  obterCaixaErroNumeroNotaV183();

  if (campo && campo.dataset.v183 !== "1") {
    campo.dataset.v183 = "1";

    campo.addEventListener("input", () => {
      // Ao digitar, some a mensagem imediatamente para permitir correção.
      esconderErroNumeroNotaV183();
    });

    campo.addEventListener("blur", () => {
      // No blur, mostra apenas mensagem inline, sem alert.
      validarDuplicataNumeroNotaV183(true);
    });
  }

  if (form && form.dataset.dupV183 !== "1") {
    form.dataset.dupV183 = "1";

    form.addEventListener("submit", event => {
      if (!validarDuplicataNumeroNotaV183(true)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  configurarErroDuplicataNumeroNotaV183();
  setTimeout(configurarErroDuplicataNumeroNotaV183, 300);
  setTimeout(configurarErroDuplicataNumeroNotaV183, 1000);
});
