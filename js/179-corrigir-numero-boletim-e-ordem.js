
// v179 - corrige número do boletim no texto final e ordem da nota recém-incluída.

function obterNumeroBoletimV179() {
  const candidatos = [
    document.getElementById("notaBoletimNumero"),
    document.querySelector("#blocoBoletimEstruturadoV164 input[id='notaBoletimNumero']"),
    document.querySelector("input[name='notaBoletimNumero']"),
    document.querySelector("input[data-campo='numero-boletim']")
  ].filter(Boolean);

  for (const el of candidatos) {
    const valor = String(el.value || "").trim();
    if (valor) return valor;
  }

  return "";
}

function montarTextoBoletimV179() {
  const tipo = document.getElementById("notaBoletimTipo")?.value || "SEDEC";
  const numero = obterNumeroBoletimV179();

  let orgao = "SEDEC/CBMERJ";

  if (tipo === "CBA") {
    const sel = document.getElementById("notaBoletimCba");
    orgao = sel?.selectedOptions?.[0]?.textContent?.trim() || "CBA";
  }

  if (tipo === "OBM") {
    const input = document.getElementById("notaBoletimObmBusca");
    orgao = String(input?.value || "").trim() || "OBM";
  }

  const sufixo = numero ? ` nº ${numero}` : "";

  if (tipo === "SEDEC") return `Boletim da SEDEC/CBMERJ${sufixo}`;
  if (tipo === "CBA") return `Boletim do ${orgao}${sufixo}`;
  if (tipo === "OBM") return `Boletim do ${orgao}${sufixo}`;

  return `Boletim${sufixo}`;
}

function aplicarBoletimCompletoV179() {
  const legado = document.getElementById("notaBoletim");
  if (!legado) return;

  const texto = montarTextoBoletimV179();
  legado.required = false;
  legado.removeAttribute("required");
  legado.value = texto;

  const tipo = document.getElementById("notaBoletimTipo")?.value || "SEDEC";
  const numero = obterNumeroBoletimV179();

  legado.dataset.tipoBoletim = tipo;
  legado.dataset.numeroBoletim = numero;

  if (tipo === "SEDEC") {
    legado.dataset.orgaoBoletimId = "sedec-cbmerj";
    legado.dataset.orgaoBoletimNome = "SEDEC/CBMERJ";
    legado.dataset.cbaBoletimId = "";
    legado.dataset.obmBoletimId = "";
  }

  if (tipo === "CBA") {
    const sel = document.getElementById("notaBoletimCba");
    legado.dataset.orgaoBoletimId = sel?.value || "";
    legado.dataset.orgaoBoletimNome = sel?.selectedOptions?.[0]?.textContent?.trim() || "";
    legado.dataset.cbaBoletimId = sel?.value || "";
    legado.dataset.obmBoletimId = "";
  }

  if (tipo === "OBM") {
    const input = document.getElementById("notaBoletimObmBusca");
    legado.dataset.orgaoBoletimId = input?.dataset.obmId || "";
    legado.dataset.orgaoBoletimNome = String(input?.value || "").trim();
    legado.dataset.obmBoletimId = input?.dataset.obmId || "";
  }
}

function validarBoletimV179() {
  const tipo = document.getElementById("notaBoletimTipo")?.value || "SEDEC";
  const numero = obterNumeroBoletimV179();

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

// Sobrescreve funções da v178 para usar a leitura correta do número.
window.montarTextoBoletimSubmitV178 = montarTextoBoletimV179;
window.prepararBoletimAntesDeSalvarV178 = function() {
  aplicarBoletimCompletoV179();
  return true;
};
window.validarBoletimEstruturadoV178 = validarBoletimV179;

function carimboInsercaoNotaV179(nota) {
  if (!nota || typeof nota !== "object") return;

  if (!nota.criadoEm) {
    nota.criadoEm = Date.now();
  }

  // Atualiza um campo próprio para ordenar pelo último salvamento/inclusão.
  // Para nota nova, isso garante que ela vá para o topo dentro da mesma data.
  nota.inseridoEm = Date.now();
}

function dataParaOrdenacaoV179(dataBR) {
  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return 0;
  return Number(`${m[3]}${String(m[2]).padStart(2, "0")}${String(m[1]).padStart(2, "0")}`);
}

function compararNotasV179(a, b) {
  const dataA = dataParaOrdenacaoV179(a?.data);
  const dataB = dataParaOrdenacaoV179(b?.data);

  if (dataA !== dataB) return dataB - dataA;

  const insA = Number(a?.inseridoEm || a?.criadoEm || 0);
  const insB = Number(b?.inseridoEm || b?.criadoEm || 0);

  if (insA !== insB) return insB - insA;

  const numA = Number(String(a?.numero || "").replace(/\D+/g, "")) || 0;
  const numB = Number(String(b?.numero || "").replace(/\D+/g, "")) || 0;

  return numB - numA;
}

function ordenarNotasBancoV179() {
  try {
    if (Array.isArray(dados.notas)) {
      dados.notas.sort(compararNotasV179);
    }
  } catch {}
}

// Intercepta inclusão: antes salva boletim; depois carimba a nota criada/editada e ordena.
(function corrigirInclusaoNotaV179() {
  try {
    if (typeof incluirNotaPeloFormulario === "function" && !window.incluirNotaPeloFormularioOriginalV179) {
      window.incluirNotaPeloFormularioOriginalV179 = incluirNotaPeloFormulario;

      incluirNotaPeloFormulario = function(...args) {
        aplicarBoletimCompletoV179();

        if (!validarBoletimV179()) return false;

        const antesIds = new Set((dados.notas || []).map(n => n.id));
        const r = window.incluirNotaPeloFormularioOriginalV179.apply(this, args);

        setTimeout(() => {
          try {
            const novas = (dados.notas || []).filter(n => !antesIds.has(n.id));
            const alvo = novas[0] || (dados.notas || [])[dados.notas.length - 1];

            if (alvo) {
              carimboInsercaoNotaV179(alvo);

              // Reaplica os dados estruturados do boletim na nota recém-criada.
              const legado = document.getElementById("notaBoletim");
              if (legado) {
                alvo.boletim = legado.value || montarTextoBoletimV179();
                alvo.boletimTexto = alvo.boletim;
                alvo.boletimTipo = legado.dataset.tipoBoletim || document.getElementById("notaBoletimTipo")?.value || "SEDEC";
                alvo.boletimNumero = obterNumeroBoletimV179();
                alvo.boletimOrgaoId = legado.dataset.orgaoBoletimId || "";
                alvo.boletimOrgaoNome = legado.dataset.orgaoBoletimNome || "";
                alvo.boletimCbaId = legado.dataset.cbaBoletimId || "";
                alvo.boletimObmId = legado.dataset.obmBoletimId || "";
              }
            }

            ordenarNotasBancoV179();

            try {
              if (typeof salvarNotasLocais === "function") salvarNotasLocais();
              else if (typeof salvarDados === "function") salvarDados();
            } catch {}

            try { renderizarNotas(); } catch {}
          } catch {}
        }, 0);

        return r;
      };
    }
  } catch {}
})();

// Garante que a renderização também ordene, mesmo após importação/edição.
(function corrigirRenderizacaoOrdemV179() {
  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV179) {
      window.renderizarNotasOriginalV179 = renderizarNotas;

      renderizarNotas = function(...args) {
        ordenarNotasBancoV179();
        return window.renderizarNotasOriginalV179.apply(this, args);
      };
    }
  } catch {}

  try {
    if (typeof ordenarNotas === "function" && !window.ordenarNotasOriginalV179) {
      window.ordenarNotasOriginalV179 = ordenarNotas;
      ordenarNotas = function(a, b) {
        return compararNotasV179(a, b);
      };
    }
  } catch {}
})();

function configurarBoletimNumeroV179() {
  const ids = ["notaBoletimTipo", "notaBoletimCba", "notaBoletimObmBusca", "notaBoletimNumero"];

  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.v179 === "1") return;
    el.dataset.v179 = "1";
    el.addEventListener("input", aplicarBoletimCompletoV179, true);
    el.addEventListener("change", aplicarBoletimCompletoV179, true);
  });

  const form = document.getElementById("formNota");
  if (form && form.dataset.v179 !== "1") {
    form.dataset.v179 = "1";
    form.addEventListener("submit", event => {
      aplicarBoletimCompletoV179();

      if (!validarBoletimV179()) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    }, true);
  }

  aplicarBoletimCompletoV179();
  ordenarNotasBancoV179();
}

document.addEventListener("DOMContentLoaded", () => {
  configurarBoletimNumeroV179();
  setTimeout(configurarBoletimNumeroV179, 300);
  setTimeout(configurarBoletimNumeroV179, 1000);
});

document.addEventListener("input", event => {
  if (event.target && ["notaBoletimTipo", "notaBoletimCba", "notaBoletimObmBusca", "notaBoletimNumero"].includes(event.target.id)) {
    aplicarBoletimCompletoV179();
  }
}, true);

document.addEventListener("change", event => {
  if (event.target && ["notaBoletimTipo", "notaBoletimCba", "notaBoletimObmBusca", "notaBoletimNumero"].includes(event.target.id)) {
    aplicarBoletimCompletoV179();
  }
}, true);
