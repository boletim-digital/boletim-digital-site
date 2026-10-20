
// v199 - cabeçalho oficial somente na impressão do boletim completo.
// Usa o modelo enviado como base visual e não aplica em nota individual.

let impressaoBoletimCompletoV199 = false;
let tituloBoletimCompletoV199 = "";

function normalizarTituloBoletimV199(titulo) {
  const t = String(titulo || "").trim();

  if (/boletim de\s+\d{2}\/\d{2}\/\d{4}/i.test(t)) {
    return t.replace(/boletim de/i, "BOLETIM").toUpperCase();
  }

  if (/boletim/i.test(t)) {
    return t.toUpperCase();
  }

  return "BOLETIM DIGITAL";
}

function marcarImpressaoBoletimCompletoV199(titulo) {
  impressaoBoletimCompletoV199 = true;
  tituloBoletimCompletoV199 = normalizarTituloBoletimV199(titulo);
  document.body.classList.add("impressao-boletim-completo-v199");
  document.body.classList.remove("impressao-nota-isolada-v199");

  const area = document.getElementById("areaImpressao");
  if (area) {
    area.classList.add("area-boletim-completo-v199");
    area.classList.remove("area-nota-isolada-v199");
    area.dataset.tituloBoletimV199 = tituloBoletimCompletoV199;
  }
}

function marcarImpressaoNotaIsoladaV199() {
  impressaoBoletimCompletoV199 = false;
  tituloBoletimCompletoV199 = "";
  document.body.classList.remove("impressao-boletim-completo-v199");
  document.body.classList.add("impressao-nota-isolada-v199");

  const area = document.getElementById("areaImpressao");
  if (area) {
    area.classList.remove("area-boletim-completo-v199");
    area.classList.add("area-nota-isolada-v199");
    delete area.dataset.tituloBoletimV199;
  }
}

function obterTituloCabecalhoBoletimV199() {
  const area = document.getElementById("areaImpressao");
  return area?.dataset.tituloBoletimV199 || tituloBoletimCompletoV199 || "BOLETIM DIGITAL";
}

function inserirCabecalhoModeloBoletimV199() {
  const area = document.getElementById("areaImpressao");
  if (!area || !document.body.classList.contains("impressao-boletim-completo-v199")) return;

  area.querySelectorAll(".cabecalho-boletim-modelo-v199").forEach(el => el.remove());

  const header = document.createElement("div");
  header.className = "cabecalho-boletim-modelo-v199";
  header.innerHTML = `
    <div class="cabecalho-boletim-bg-v199"></div>
    <div class="cabecalho-boletim-titulo-v199">${obterTituloCabecalhoBoletimV199()}</div>
    <div class="cabecalho-boletim-folha-v199">FL. <span class="numero-folha-v199"></span></div>
  `;

  area.insertBefore(header, area.firstChild);
}

function limparCabecalhoAntigoV198ParaBoletimV199() {
  // Remove o cabeçalho experimental da v198 quando formos usar o modelo exato v199.
  if (document.body.classList.contains("impressao-boletim-completo-v199")) {
    document.querySelectorAll("#cabecalho-impressao-v198, .print-page-header-v198").forEach(el => {
      el.style.display = "none";
    });
  }
}

// Intercepta montagem da área de impressão para descobrir se é boletim completo ou nota isolada.
(function interceptarImpressaoV199() {
  try {
    if (typeof montarAreaImpressao === "function" && !window.montarAreaImpressaoOriginalV199) {
      window.montarAreaImpressaoOriginalV199 = montarAreaImpressao;

      montarAreaImpressao = function(notas, tituloImpressao = "Boletim Digital") {
        const lista = Array.isArray(notas) ? notas : [];
        const titulo = String(tituloImpressao || "");

        // No sistema atual, "Nota individual" é usado em imprimirNotaUnica.
        // O cabeçalho modelo só entra em "Boletim de dd/mm/aaaa", isto é, boletim completo de um dia.
        const ehNotaIndividual = /nota individual/i.test(titulo);
        const ehBoletimCompleto = /^boletim de\s+\d{2}\/\d{2}\/\d{4}/i.test(titulo) && lista.length > 1;

        if (ehBoletimCompleto && !ehNotaIndividual) {
          marcarImpressaoBoletimCompletoV199(titulo);
        } else {
          marcarImpressaoNotaIsoladaV199();
        }

        const r = window.montarAreaImpressaoOriginalV199.apply(this, arguments);

        if (ehBoletimCompleto && !ehNotaIndividual) {
          marcarImpressaoBoletimCompletoV199(titulo);
          inserirCabecalhoModeloBoletimV199();
          limparCabecalhoAntigoV198ParaBoletimV199();
        }

        return r;
      };

      window.montarAreaImpressao = montarAreaImpressao;
    }
  } catch {}

  try {
    if (typeof imprimirNotaUnica === "function" && !window.imprimirNotaUnicaOriginalV199) {
      window.imprimirNotaUnicaOriginalV199 = imprimirNotaUnica;

      imprimirNotaUnica = function(...args) {
        marcarImpressaoNotaIsoladaV199();
        return window.imprimirNotaUnicaOriginalV199.apply(this, args);
      };

      window.imprimirNotaUnica = imprimirNotaUnica;
    }
  } catch {}

  const printOriginal = window.print;
  if (!window.printOriginalV199) {
    window.printOriginalV199 = printOriginal;

    window.print = function(...args) {
      if (document.body.classList.contains("impressao-boletim-completo-v199")) {
        inserirCabecalhoModeloBoletimV199();
        limparCabecalhoAntigoV198ParaBoletimV199();
      }
      return window.printOriginalV199.apply(window, args);
    };
  }
})();

document.addEventListener("beforeprint", () => {
  if (document.body.classList.contains("impressao-boletim-completo-v199")) {
    inserirCabecalhoModeloBoletimV199();
    limparCabecalhoAntigoV198ParaBoletimV199();
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Garante que impressões normais não tragam cabeçalho completo por padrão.
  marcarImpressaoNotaIsoladaV199();
});
