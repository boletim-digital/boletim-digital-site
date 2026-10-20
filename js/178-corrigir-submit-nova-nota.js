
// v178 - corrige o botão Incluir nota após boletim estruturado.
function montarTextoBoletimSubmitV178() {
  const tipo = document.getElementById("notaBoletimTipo")?.value || "SEDEC";
  const numero = String(document.getElementById("notaBoletimNumero")?.value || "").trim();

  let orgao = "SEDEC/CBMERJ";

  if (tipo === "CBA") {
    const sel = document.getElementById("notaBoletimCba");
    orgao = sel?.selectedOptions?.[0]?.textContent?.trim() || "CBA";
  }

  if (tipo === "OBM") {
    const input = document.getElementById("notaBoletimObmBusca");
    orgao = String(input?.value || "").trim() || "OBM";
  }

  if (tipo === "SEDEC") return `Boletim da SEDEC/CBMERJ${numero ? " nº " + numero : ""}`;
  if (tipo === "CBA") return `Boletim do ${orgao}${numero ? " nº " + numero : ""}`;
  if (tipo === "OBM") return `Boletim do ${orgao}${numero ? " nº " + numero : ""}`;
  return numero ? `Boletim nº ${numero}` : "Boletim";
}

function prepararBoletimAntesDeSalvarV178() {
  const legado = document.getElementById("notaBoletim");
  if (!legado) return true;

  // Campo legado fica oculto, então não pode bloquear a validação nativa.
  legado.required = false;
  legado.removeAttribute("required");

  try {
    if (typeof aplicarBoletimEstruturadoAoFormularioV164 === "function") {
      aplicarBoletimEstruturadoAoFormularioV164();
    }
  } catch {}

  if (!String(legado.value || "").trim()) {
    legado.value = montarTextoBoletimSubmitV178();
  }

  return true;
}

function validarBoletimEstruturadoV178() {
  const tipo = document.getElementById("notaBoletimTipo")?.value || "SEDEC";
  const numero = String(document.getElementById("notaBoletimNumero")?.value || "").trim();

  if (!numero) {
    alert("Informe o número do boletim.");
    document.getElementById("notaBoletimNumero")?.focus();
    return false;
  }

  if (tipo === "CBA") {
    const cba = document.getElementById("notaBoletimCba")?.value || "";
    if (!cba) {
      alert("Selecione o CBA do boletim.");
      document.getElementById("notaBoletimCba")?.focus();
      return false;
    }
  }

  if (tipo === "OBM") {
    const obm = String(document.getElementById("notaBoletimObmBusca")?.value || "").trim();
    if (!obm) {
      alert("Selecione ou informe a OBM do boletim.");
      document.getElementById("notaBoletimObmBusca")?.focus();
      return false;
    }
  }

  return true;
}

function configurarSubmitNovaNotaV178() {
  const form = document.getElementById("formNota");
  const botao = form?.querySelector("button[type='submit'], .btn-principal");
  const legado = document.getElementById("notaBoletim");

  if (legado) {
    legado.required = false;
    legado.removeAttribute("required");
  }

  if (!form || form.dataset.v178 === "1") return;
  form.dataset.v178 = "1";

  // Captura antes dos listeners antigos para preencher o boletim legado antes de salvar.
  form.addEventListener("submit", (event) => {
    prepararBoletimAntesDeSalvarV178();

    if (!validarBoletimEstruturadoV178()) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return false;
    }
  }, true);

  if (botao && botao.dataset.v178 !== "1") {
    botao.dataset.v178 = "1";
    botao.addEventListener("click", () => {
      prepararBoletimAntesDeSalvarV178();
    }, true);
  }
}

// Corrige salvarNota diretamente também, caso seja chamada sem submit.
(function corrigirSalvarNotaV178() {
  try {
    if (typeof salvarNota === "function" && !window.salvarNotaOriginalV178) {
      window.salvarNotaOriginalV178 = salvarNota;
      salvarNota = function(...args) {
        prepararBoletimAntesDeSalvarV178();

        if (!validarBoletimEstruturadoV178()) {
          return false;
        }

        return window.salvarNotaOriginalV178.apply(this, args);
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarSubmitNovaNotaV178();
  prepararBoletimAntesDeSalvarV178();

  setTimeout(configurarSubmitNovaNotaV178, 300);
  setTimeout(configurarSubmitNovaNotaV178, 1000);
});

document.addEventListener("input", (event) => {
  if (
    event.target &&
    ["notaBoletimTipo", "notaBoletimCba", "notaBoletimObmBusca", "notaBoletimNumero"].includes(event.target.id)
  ) {
    prepararBoletimAntesDeSalvarV178();
  }
}, true);

document.addEventListener("change", (event) => {
  if (
    event.target &&
    ["notaBoletimTipo", "notaBoletimCba", "notaBoletimObmBusca", "notaBoletimNumero"].includes(event.target.id)
  ) {
    prepararBoletimAntesDeSalvarV178();
  }
}, true);
