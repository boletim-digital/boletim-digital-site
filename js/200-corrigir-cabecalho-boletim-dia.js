
// v200 - corrige cabeçalho do boletim de dia específico.
// O cabeçalho deve aparecer sempre que a impressão for "Boletim de dd/mm/aaaa",
// mesmo que exista somente uma nota naquele dia.

function ehTituloBoletimDeDiaV200(titulo) {
  return /^boletim de\s+\d{2}\/\d{2}\/\d{4}/i.test(String(titulo || "").trim());
}

function ativarCabecalhoBoletimDiaV200(titulo) {
  const tituloFinal = String(titulo || "Boletim Digital")
    .replace(/^boletim de/i, "BOLETIM")
    .toUpperCase();

  document.body.classList.add("impressao-boletim-completo-v199");
  document.body.classList.remove("impressao-nota-isolada-v199");

  const area = document.getElementById("areaImpressao");
  if (area) {
    area.classList.add("area-boletim-completo-v199");
    area.classList.remove("area-nota-isolada-v199");
    area.dataset.tituloBoletimV199 = tituloFinal;
  }

  try {
    if (typeof tituloBoletimCompletoV199 !== "undefined") {
      tituloBoletimCompletoV199 = tituloFinal;
    }
    if (typeof impressaoBoletimCompletoV199 !== "undefined") {
      impressaoBoletimCompletoV199 = true;
    }
  } catch {}

  try {
    if (typeof inserirCabecalhoModeloBoletimV199 === "function") {
      inserirCabecalhoModeloBoletimV199();
    }
  } catch {}

  try {
    if (typeof limparCabecalhoAntigoV198ParaBoletimV199 === "function") {
      limparCabecalhoAntigoV198ParaBoletimV199();
    }
  } catch {}
}

function desativarCabecalhoBoletimDiaV200() {
  document.body.classList.remove("impressao-boletim-completo-v199");
  document.body.classList.add("impressao-nota-isolada-v199");

  const area = document.getElementById("areaImpressao");
  if (area) {
    area.classList.remove("area-boletim-completo-v199");
    area.classList.add("area-nota-isolada-v199");
  }

  try {
    if (typeof impressaoBoletimCompletoV199 !== "undefined") {
      impressaoBoletimCompletoV199 = false;
    }
  } catch {}
}

(function corrigirMontagemImpressaoV200() {
  try {
    if (typeof montarAreaImpressao === "function" && !window.montarAreaImpressaoOriginalV200) {
      window.montarAreaImpressaoOriginalV200 = montarAreaImpressao;

      montarAreaImpressao = function(notas, tituloImpressao = "Boletim Digital") {
        const ehBoletimDia = ehTituloBoletimDeDiaV200(tituloImpressao);
        const ehNotaIndividual = /nota individual/i.test(String(tituloImpressao || ""));

        const r = window.montarAreaImpressaoOriginalV200.apply(this, arguments);

        if (ehBoletimDia && !ehNotaIndividual) {
          ativarCabecalhoBoletimDiaV200(tituloImpressao);
          setTimeout(() => ativarCabecalhoBoletimDiaV200(tituloImpressao), 0);
          setTimeout(() => ativarCabecalhoBoletimDiaV200(tituloImpressao), 80);
        } else {
          desativarCabecalhoBoletimDiaV200();
        }

        return r;
      };

      window.montarAreaImpressao = montarAreaImpressao;
    }
  } catch {}

  try {
    if (typeof imprimirNotaUnica === "function" && !window.imprimirNotaUnicaOriginalV200) {
      window.imprimirNotaUnicaOriginalV200 = imprimirNotaUnica;

      imprimirNotaUnica = function(...args) {
        desativarCabecalhoBoletimDiaV200();
        return window.imprimirNotaUnicaOriginalV200.apply(this, args);
      };

      window.imprimirNotaUnica = imprimirNotaUnica;
    }
  } catch {}

  try {
    if (typeof confirmarImpressao === "function" && !window.confirmarImpressaoOriginalV200) {
      window.confirmarImpressaoOriginalV200 = confirmarImpressao;

      confirmarImpressao = function(...args) {
        const tipo = document.getElementById("tipoImpressao")?.value || "";

        const r = window.confirmarImpressaoOriginalV200.apply(this, args);

        if (tipo === "boletim") {
          const dataBR = document.getElementById("dataImpressao")?.value || "";
          const titulo = dataBR ? `Boletim de ${dataBR}` : "";
          if (titulo) {
            ativarCabecalhoBoletimDiaV200(titulo);
            setTimeout(() => ativarCabecalhoBoletimDiaV200(titulo), 40);
          }
        }

        return r;
      };

      window.confirmarImpressao = confirmarImpressao;
    }
  } catch {}
})();

document.addEventListener("beforeprint", () => {
  const area = document.getElementById("areaImpressao");
  const titulo = area?.dataset.tituloBoletimV199 || "";
  const tipo = document.getElementById("tipoImpressao")?.value || "";

  if (tipo === "boletim" || document.body.classList.contains("impressao-boletim-completo-v199")) {
    ativarCabecalhoBoletimDiaV200(titulo || "Boletim Digital");
  }
});

document.addEventListener("DOMContentLoaded", () => {
  // Mantém nota isolada sem cabeçalho por padrão.
  desativarCabecalhoBoletimDiaV200();
});
