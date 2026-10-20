
// v197 - permite incluir nota em "I - Assuntos Gerais" sem selecionar subseção.

function textoNormalizadoAssuntosGeraisV197(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function ehAssuntosGeraisV197(valor) {
  const t = textoNormalizadoAssuntosGeraisV197(valor);
  return (
    t === "i - assuntos gerais" ||
    t === "i – assuntos gerais" ||
    t === "i. assuntos gerais" ||
    t === "assuntos gerais" ||
    t.includes("assuntos gerais")
  );
}

function parteOuSecaoAssuntosGeraisV197() {
  const parte = document.getElementById("notaParte")?.value || "";
  const secao = document.getElementById("notaSecao")?.value || "";

  return ehAssuntosGeraisV197(parte) || ehAssuntosGeraisV197(secao);
}

function liberarSubsecaoAssuntosGeraisV197() {
  const subsecao = document.getElementById("notaSubsecao");
  if (!subsecao) return;

  if (parteOuSecaoAssuntosGeraisV197()) {
    subsecao.required = false;
    subsecao.removeAttribute("required");
    subsecao.dataset.subsecaoOpcionalAssuntosGeraisV197 = "1";

    const label = subsecao.closest("label");
    if (label) label.classList.add("subsecao-opcional-assuntos-gerais-v197");
  }
}

function validarCamposObrigatoriosNotaV197() {
  // Primeiro reaplica a regra visual/required.
  liberarSubsecaoAssuntosGeraisV197();

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

      try {
        if (typeof marcarErroCampoNotaV181 === "function") marcarErroCampoNotaV181(campo.id);
        else el?.classList.add("campo-obrigatorio-erro-v181");
      } catch {}

      try {
        if (typeof focarCampoNotaV181 === "function") focarCampoNotaV181(campo.id);
        else el?.focus();
      } catch {}

      return false;
    }
  }

  const secao = document.getElementById("notaSecao");
  if (secao && secao.required && !String(secao.value || "").trim()) {
    alert("Preencha o campo obrigatório: Seção.");
    try {
      if (typeof marcarErroCampoNotaV181 === "function") marcarErroCampoNotaV181("notaSecao");
      else secao.classList.add("campo-obrigatorio-erro-v181");
    } catch {}
    secao.focus();
    return false;
  }

  const subsecao = document.getElementById("notaSubsecao");

  // Ponto principal: se for Assuntos Gerais, não exige subseção.
  if (
    subsecao &&
    subsecao.required &&
    !String(subsecao.value || "").trim() &&
    !parteOuSecaoAssuntosGeraisV197()
  ) {
    alert("Preencha o campo obrigatório: Subseção.");
    try {
      if (typeof marcarErroCampoNotaV181 === "function") marcarErroCampoNotaV181("notaSubsecao");
      else subsecao.classList.add("campo-obrigatorio-erro-v181");
    } catch {}
    subsecao.focus();
    return false;
  }

  let texto = "";
  try {
    if (typeof textoEditorNotaV181 === "function") texto = textoEditorNotaV181();
  } catch {}

  if (!texto) {
    const editor = document.getElementById("notaTextoEditor");
    if (editor) {
      const clone = editor.cloneNode(true);
      clone.querySelectorAll("br").forEach(br => br.replaceWith("\n"));
      texto = String(clone.textContent || "")
        .replace(/\u00a0/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }
  }

  if (!texto) {
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

  try {
    if (typeof prepararBoletimAntesDaInclusaoV180 === "function") prepararBoletimAntesDaInclusaoV180();
    else if (typeof prepararBoletimAntesDeSalvarV178 === "function") prepararBoletimAntesDeSalvarV178();
  } catch {}

  try {
    if (typeof validarBoletimV179 === "function" && !validarBoletimV179()) return false;
  } catch {}

  try {
    if (typeof validarBoletimEstruturadoV178 === "function" && !validarBoletimEstruturadoV178()) return false;
  } catch {}

  return true;
}

// Substitui a validação antiga, mas mantendo a mesma assinatura.
window.validarCamposObrigatoriosNotaV181 = validarCamposObrigatoriosNotaV197;

try {
  validarCamposObrigatoriosNotaV181 = validarCamposObrigatoriosNotaV197;
} catch {}

function configurarAssuntosGeraisSemSubsecaoV197() {
  ["notaParte", "notaSecao", "notaSubsecao"].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.v197 === "1") return;

    el.dataset.v197 = "1";
    el.addEventListener("change", () => setTimeout(liberarSubsecaoAssuntosGeraisV197, 0), true);
    el.addEventListener("input", () => setTimeout(liberarSubsecaoAssuntosGeraisV197, 0), true);
  });

  const form = document.getElementById("formNota");
  if (form && form.dataset.v197 !== "1") {
    form.dataset.v197 = "1";

    form.addEventListener("submit", event => {
      liberarSubsecaoAssuntosGeraisV197();

      if (!validarCamposObrigatoriosNotaV197()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);
  }

  liberarSubsecaoAssuntosGeraisV197();
}

// Se a função antiga de hierarquia marcar a subseção como required,
// reaplica a exceção logo depois.
(function reforcarHierarquiaAssuntosGeraisV197() {
  try {
    if (typeof atualizarCamposHierarquia === "function" && !window.atualizarCamposHierarquiaOriginalV197) {
      window.atualizarCamposHierarquiaOriginalV197 = atualizarCamposHierarquia;

      atualizarCamposHierarquia = function(...args) {
        const r = window.atualizarCamposHierarquiaOriginalV197.apply(this, args);
        setTimeout(liberarSubsecaoAssuntosGeraisV197, 0);
        setTimeout(liberarSubsecaoAssuntosGeraisV197, 120);
        return r;
      };

      window.atualizarCamposHierarquia = atualizarCamposHierarquia;
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarAssuntosGeraisSemSubsecaoV197();
  setTimeout(configurarAssuntosGeraisSemSubsecaoV197, 300);
  setTimeout(configurarAssuntosGeraisSemSubsecaoV197, 1000);
});

document.addEventListener("change", event => {
  if (event.target && ["notaParte", "notaSecao", "notaSubsecao"].includes(event.target.id)) {
    setTimeout(liberarSubsecaoAssuntosGeraisV197, 0);
  }
}, true);
