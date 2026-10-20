
// v181 - valida campos obrigatórios de Incluir Nova Nota.
function textoEditorNotaV181() {
  const editor = document.getElementById("notaTextoEditor");
  if (!editor) return "";

  const clone = editor.cloneNode(true);

  // Remove elementos que não representam texto útil.
  clone.querySelectorAll("br").forEach(br => br.replaceWith("\n"));

  return String(clone.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function focarCampoNotaV181(id) {
  const el = document.getElementById(id);
  if (!el) return;

  try {
    el.focus();
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  } catch {}
}

function marcarErroCampoNotaV181(id) {
  const el = document.getElementById(id);
  if (!el) return;

  el.classList.add("campo-obrigatorio-erro-v181");

  setTimeout(() => {
    el.classList.remove("campo-obrigatorio-erro-v181");
  }, 1800);
}

function validarCamposObrigatoriosNotaV181() {
  const obrigatorios = [
    { id: "notaNumero", nome: "Número da nota" },
    { id: "notaData", nome: "Data" },
    { id: "notaTitulo", nome: "Título" },
    { id: "notaParte", nome: "Parte" },
    { id: "notaBoletimNumero", nome: "Número do boletim" }
  ];

  for (const campo of obrigatorios) {
    const el = document.getElementById(campo.id);
    const valor = String(el?.value || "").trim();

    if (!valor) {
      alert(`Preencha o campo obrigatório: ${campo.nome}.`);
      marcarErroCampoNotaV181(campo.id);
      focarCampoNotaV181(campo.id);
      return false;
    }
  }

  // Se a parte/seleção exigir seção/subseção, mantém a lógica existente de required.
  const secao = document.getElementById("notaSecao");
  if (secao && secao.required && !String(secao.value || "").trim()) {
    alert("Preencha o campo obrigatório: Seção.");
    marcarErroCampoNotaV181("notaSecao");
    focarCampoNotaV181("notaSecao");
    return false;
  }

  const subsecao = document.getElementById("notaSubsecao");
  if (subsecao && subsecao.required && !String(subsecao.value || "").trim()) {
    alert("Preencha o campo obrigatório: Subseção.");
    marcarErroCampoNotaV181("notaSubsecao");
    focarCampoNotaV181("notaSubsecao");
    return false;
  }

  if (!textoEditorNotaV181()) {
    alert("Preencha o campo obrigatório: Texto.");
    const editor = document.getElementById("notaTextoEditor");
    if (editor) {
      editor.classList.add("campo-obrigatorio-erro-v181");
      try {
        editor.focus();
        editor.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {}
      setTimeout(() => editor.classList.remove("campo-obrigatorio-erro-v181"), 1800);
    }
    return false;
  }

  // Reaproveita validações específicas de boletim estruturado.
  try {
    if (typeof prepararBoletimAntesDaInclusaoV180 === "function") {
      prepararBoletimAntesDaInclusaoV180();
    } else if (typeof prepararBoletimAntesDeSalvarV178 === "function") {
      prepararBoletimAntesDeSalvarV178();
    }
  } catch {}

  try {
    if (typeof validarBoletimV179 === "function" && !validarBoletimV179()) return false;
  } catch {}

  try {
    if (typeof validarBoletimEstruturadoV178 === "function" && !validarBoletimEstruturadoV178()) return false;
  } catch {}

  return true;
}

function configurarValidacaoObrigatoriaNotaV181() {
  // Marca atributos required nos campos nativos.
  ["notaNumero", "notaData", "notaTitulo", "notaParte", "notaBoletimNumero"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.required = true;
  });

  const form = document.getElementById("formNota");
  if (form && form.dataset.v181 !== "1") {
    form.dataset.v181 = "1";

    form.addEventListener("submit", event => {
      if (!validarCamposObrigatoriosNotaV181()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);
  }
}

// Intercepta a função principal de inclusão para impedir criação por qualquer caminho.
(function interceptarInclusaoNotaV181() {
  try {
    if (typeof incluirNotaPeloFormulario === "function" && !window.incluirNotaPeloFormularioOriginalV181) {
      window.incluirNotaPeloFormularioOriginalV181 = incluirNotaPeloFormulario;

      incluirNotaPeloFormulario = function(...args) {
        if (!validarCamposObrigatoriosNotaV181()) {
          return false;
        }

        return window.incluirNotaPeloFormularioOriginalV181.apply(this, args);
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarValidacaoObrigatoriaNotaV181();
  setTimeout(configurarValidacaoObrigatoriaNotaV181, 300);
  setTimeout(configurarValidacaoObrigatoriaNotaV181, 1000);
});

// Garante validação mesmo se algum script disparar clique direto no botão.
document.addEventListener("click", event => {
  const btn = event.target?.closest?.("button[type='submit'], #btnSalvarNota, .btn-principal");
  const form = document.getElementById("formNota");

  if (!btn || !form || !form.contains(btn)) return;

  if (!validarCamposObrigatoriosNotaV181()) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    return false;
  }
}, true);
