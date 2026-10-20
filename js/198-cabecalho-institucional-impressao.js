
// v198 - cabeçalho institucional na impressão.
// Adiciona faixa cinza, brasões e bloco vermelho FL. X em páginas de impressão.

function obterTituloBoletimImpressaoV198() {
  const candidatos = [
    document.getElementById("tituloPagina")?.textContent,
    document.querySelector("#modalImpressao h2")?.textContent,
    document.querySelector(".titulo-impressao")?.textContent,
    document.title
  ].map(v => String(v || "").trim()).filter(Boolean);

  let titulo = candidatos[0] || "BOLETIM DIGITAL";

  // Quando a impressão for de boletim/data, preferimos algo institucional.
  if (/boletim digital/i.test(titulo) || !titulo) {
    titulo = "BOLETIM DIGITAL";
  }

  return titulo.toUpperCase();
}

function obterDataCabecalhoImpressaoV198() {
  const datas = [];

  try {
    const dataSelecionada = document.querySelector("[data-data-impressao]")?.dataset.dataImpressao;
    if (dataSelecionada) datas.push(dataSelecionada);
  } catch {}

  try {
    const texto = document.body.innerText || "";
    const m = texto.match(/\b\d{2}\/\d{2}\/\d{4}\b/);
    if (m) datas.push(m[0]);
  } catch {}

  return datas[0] || "";
}

function svgDefesaCivilV198() {
  return `
    <div class="print-logo-box print-logo-defesa-v198">
      <div class="print-logo-linha1">DEFESA CIVIL</div>
      <div class="print-logo-simbolo-v198">◈</div>
      <div class="print-logo-linha2">GOVERNO DO ESTADO<br>RIO DE JANEIRO</div>
    </div>
  `;
}

function svgBombeirosV198() {
  return `
    <div class="print-logo-bombeiros-v198" aria-label="CBMERJ">
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <path d="M60 7c6 13 16 21 27 28 10 6 19 16 19 32 0 26-21 46-46 46S14 93 14 67c0-18 12-31 25-39 8-5 15-11 21-21Z" fill="none" stroke="currentColor" stroke-width="6"/>
        <path d="M60 28 70 50l24 3-18 16 5 24-21-13-21 13 5-24-18-16 24-3 10-22Z" fill="none" stroke="currentColor" stroke-width="5"/>
        <path d="M35 18 18 35m67-17 17 17M31 102 18 87m71 15 13-15" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
      </svg>
    </div>
  `;
}

function cabecalhoImpressaoHtmlV198(titulo = "", folha = "1") {
  const tituloFinal = String(titulo || obterTituloBoletimImpressaoV198() || "BOLETIM DIGITAL").toUpperCase();
  const data = obterDataCabecalhoImpressaoV198();
  const textoTitulo = data && !tituloFinal.includes(data)
    ? `${tituloFinal} - ${data}`
    : tituloFinal;

  return `
    <div class="print-page-header-v198">
      <div class="print-header-main-v198">
        ${svgDefesaCivilV198()}
        <div class="print-header-title-v198">${textoTitulo}</div>
        ${svgBombeirosV198()}
      </div>
      <div class="print-header-page-v198">FL. <span class="print-page-number-v198">${folha}</span></div>
    </div>
  `;
}

function estilosCabecalhoImpressaoV198() {
  return `
    <style id="estilos-cabecalho-impressao-v198">
      @page {
        margin: 12mm 12mm 14mm 12mm;
      }

      body {
        counter-reset: page;
      }

      .print-page-header-v198 {
        display: flex;
        align-items: stretch;
        width: 100%;
        height: 34mm;
        margin: 0 0 8mm 0;
        break-inside: avoid;
        page-break-inside: avoid;
        font-family: Arial, Helvetica, sans-serif;
      }

      .print-header-main-v198 {
        flex: 1;
        display: grid;
        grid-template-columns: 31mm 1fr 31mm;
        align-items: center;
        background: #303030;
        color: #ffffff;
        min-width: 0;
      }

      .print-header-title-v198 {
        text-align: center;
        font-size: 15pt;
        line-height: 1.18;
        font-weight: 900;
        letter-spacing: .2px;
        padding: 0 8mm;
        text-transform: uppercase;
        color: #ffffff;
      }

      .print-logo-box {
        width: 27mm;
        height: 27mm;
        margin-left: 5mm;
        background: #f7f7f7;
        color: #222;
        border: 1px solid #d7d7d7;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }

      .print-logo-linha1 {
        font-size: 7pt;
        line-height: 1;
        font-weight: 900;
        margin-bottom: 1mm;
      }

      .print-logo-simbolo-v198 {
        width: 15mm;
        height: 12mm;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20pt;
        line-height: 1;
        border-top: 6mm solid #222;
        color: #fff;
        background: #222;
        transform: skew(-8deg);
        margin-bottom: 1mm;
      }

      .print-logo-linha2 {
        font-size: 5.2pt;
        line-height: 1.05;
        font-weight: 900;
        text-align: center;
      }

      .print-logo-bombeiros-v198 {
        width: 24mm;
        height: 24mm;
        margin-right: 5mm;
        justify-self: end;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .print-logo-bombeiros-v198 svg {
        width: 24mm;
        height: 24mm;
        display: block;
      }

      .print-header-page-v198 {
        width: 25mm;
        margin-left: 3mm;
        background: #a9302b;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16pt;
        font-weight: 900;
        white-space: nowrap;
      }

      .print-page-number-v198::after {
        counter-increment: page;
        content: counter(page);
      }

      .print-page-number-v198 {
        font: inherit;
      }

      /* Quando usado em janela montada manualmente, evita duplicar o 1 fixo */
      .print-page-number-v198:not(:empty)::after {
        content: "";
        counter-increment: none;
      }

      @media screen {
        .print-page-header-v198 {
          max-width: 980px;
        }
      }

      @media print {
        .print-page-header-v198 {
          display: flex !important;
        }

        .print-header-main-v198 {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }

        .print-header-page-v198 {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    </style>
  `;
}

function inserirCabecalhoNaJanelaImpressaoV198(doc, titulo = "") {
  if (!doc || doc.getElementById("cabecalho-impressao-v198")) return;

  const styleWrap = doc.createElement("div");
  styleWrap.innerHTML = estilosCabecalhoImpressaoV198();
  Array.from(styleWrap.children).forEach(el => doc.head.appendChild(el));

  const wrapper = doc.createElement("div");
  wrapper.id = "cabecalho-impressao-v198";
  wrapper.innerHTML = cabecalhoImpressaoHtmlV198(titulo, "");

  doc.body.insertBefore(wrapper, doc.body.firstChild);
}

function prepararCabecalhoImpressaoDocumentoAtualV198() {
  if (document.getElementById("estilos-cabecalho-impressao-v198")) return;

  const styleWrap = document.createElement("div");
  styleWrap.innerHTML = estilosCabecalhoImpressaoV198();
  document.head.appendChild(styleWrap.firstElementChild);

  // Header fixo no documento atual só aparece em impressão, para não alterar a tela.
  if (!document.getElementById("cabecalho-impressao-v198")) {
    const header = document.createElement("div");
    header.id = "cabecalho-impressao-v198";
    header.className = "cabecalho-impressao-documento-atual-v198";
    header.innerHTML = cabecalhoImpressaoHtmlV198("", "");
    document.body.insertBefore(header, document.body.firstChild);
  }
}

function patchWindowOpenImpressaoV198() {
  if (window.__windowOpenPatchPrintV198) return;
  window.__windowOpenPatchPrintV198 = true;

  const originalOpen = window.open;
  window.open = function(...args) {
    const w = originalOpen.apply(window, args);

    try {
      if (w && w.document) {
        const originalPrint = w.print;
        let preparado = false;

        w.print = function(...printArgs) {
          if (!preparado) {
            preparado = true;
            try {
              inserirCabecalhoNaJanelaImpressaoV198(w.document, obterTituloBoletimImpressaoV198());
            } catch {}
          }
          return originalPrint.apply(w, printArgs);
        };

        setTimeout(() => {
          try {
            inserirCabecalhoNaJanelaImpressaoV198(w.document, obterTituloBoletimImpressaoV198());
          } catch {}
        }, 200);
      }
    } catch {}

    return w;
  };
}

(function interceptarFuncoesImpressaoV198() {
  patchWindowOpenImpressaoV198();

  const nomes = [
    "imprimirBoletim",
    "imprimirNota",
    "imprimirNotas",
    "imprimirBoletimDia",
    "imprimirBoletimPeriodo",
    "confirmarImpressao",
    "executarImpressao"
  ];

  nomes.forEach(nome => {
    try {
      const fn = window[nome];
      if (typeof fn === "function" && !fn.__cabecalhoV198) {
        const original = fn;
        const wrapper = function(...args) {
          prepararCabecalhoImpressaoDocumentoAtualV198();
          patchWindowOpenImpressaoV198();
          return original.apply(this, args);
        };
        wrapper.__cabecalhoV198 = true;
        window[nome] = wrapper;
        try { eval(`${nome} = window["${nome}"];`); } catch {}
      }
    } catch {}
  });

  const originalPrint = window.print;
  if (!window.__printPatchV198) {
    window.__printPatchV198 = true;
    window.print = function(...args) {
      prepararCabecalhoImpressaoDocumentoAtualV198();
      return originalPrint.apply(window, args);
    };
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  prepararCabecalhoImpressaoDocumentoAtualV198();
  patchWindowOpenImpressaoV198();
  setTimeout(patchWindowOpenImpressaoV198, 500);
});
