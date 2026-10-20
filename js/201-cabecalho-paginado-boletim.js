
// v201 - impressão do boletim completo com cabeçalho 19,4 x 2,3 cm
// e numeração contínua FL. 1, FL. 2, ...
//
// Observação técnica:
// Navegadores comuns não numeram automaticamente um elemento fixo repetido em cada página.
// Para garantir FL. 1, FL. 2, etc., esta versão monta páginas manuais
// quando a impressão for "Boletim de um dia específico".

function dataPorExtensoCabecalhoV201(dataBR) {
  const m = String(dataBR || "").match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!m) return dataBR || "";
  return `${m[1]}/${m[2]}/${m[3]}`;
}

function numeroBoletimCabecalhoV201(notas) {
  const lista = Array.isArray(notas) ? notas : [];

  for (const nota of lista) {
    const candidatos = [
      nota?.boletimNumero,
      nota?.numeroBoletim,
      nota?.boletim,
      nota?.boletimTexto
    ];

    for (const c of candidatos) {
      const texto = String(c || "").trim();
      if (!texto) continue;

      if (/^\d+$/.test(texto)) return texto.padStart(3, "0");

      const m = texto.match(/(?:n[º°.]?|nº|n°)\s*([0-9]+)/i);
      if (m && m[1]) return m[1].padStart(3, "0");
    }
  }

  return "";
}

function tituloCabecalhoBoletimV201(notas, tituloImpressao) {
  const data = (() => {
    const m = String(tituloImpressao || "").match(/(\d{2}\/\d{2}\/\d{4})/);
    if (m) return m[1];
    return Array.isArray(notas) && notas[0]?.data ? notas[0].data : "";
  })();

  const numero = numeroBoletimCabecalhoV201(notas);
  const dataTexto = dataPorExtensoCabecalhoV201(data);

  if (numero && dataTexto) {
    return `BOLETIM DA SEDEC/CBMERJ Nº ${numero}, DE ${dataTexto}`;
  }

  if (dataTexto) {
    return `BOLETIM DA SEDEC/CBMERJ, DE ${dataTexto}`;
  }

  return "BOLETIM DA SEDEC/CBMERJ";
}

function ehImpressaoBoletimDiaV201(tituloImpressao) {
  return /^boletim de\s+\d{2}\/\d{2}\/\d{4}/i.test(String(tituloImpressao || "").trim());
}

function escaparHtmlV201(s) {
  try {
    if (typeof escapeHtml === "function") return escapeHtml(s);
  } catch {}
  return String(s || "").replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[m]));
}

function renderizarNotaImpressaoV201(nota) {
  // Reaproveita a renderização original quando existir.
  try {
    if (typeof renderizarNotaImpressao === "function") {
      return renderizarNotaImpressao(nota);
    }
  } catch {}

  const caminho = [nota.parte, nota.secao, nota.subsecao].filter(Boolean).join(" • ");

  let anexosHtml = "";
  try {
    if (typeof renderizarAnexosDaNota === "function") {
      anexosHtml = renderizarAnexosDaNota(nota);
    }
  } catch {}

  return `
    <article class="print-nota print-nota-v201">
      <h5>${escaparHtmlV201(nota.numero || "")}. ${escaparHtmlV201(nota.titulo || "")}</h5>
      ${caminho ? `<div class="print-caminho-v201">${escaparHtmlV201(caminho)}</div>` : ""}
      <div class="print-texto">${nota.texto || ""}</div>
      ${anexosHtml || ""}
    </article>
  `;
}

function achatarGruposImpressaoV201(grupos) {
  const itens = [];

  (grupos || []).forEach(grupoParte => {
    itens.push({ tipo: "parte", texto: grupoParte.parte || "Sem Parte" });

    (grupoParte.secoes || []).forEach(grupoSecao => {
      if (grupoSecao.secao) itens.push({ tipo: "secao", texto: grupoSecao.secao });

      (grupoSecao.subsecoes || []).forEach(grupoSubsecao => {
        if (grupoSubsecao.subsecao) itens.push({ tipo: "subsecao", texto: grupoSubsecao.subsecao });

        (grupoSubsecao.notas || []).forEach(nota => {
          itens.push({ tipo: "nota", nota });
        });
      });
    });
  });

  return itens;
}

function htmlCabecalhoPaginaV201(titulo, folha) {
  return `
    <div class="cabecalho-pagina-boletim-v201">
      <div class="cabecalho-modelo-v201">
        <div class="logo-defesa-civil-v201">
          <div class="defesa-civil-topo-v201">DEFESA CIVIL</div>
          <div class="defesa-civil-miolo-v201">
            <div class="defesa-civil-emblema-v201">◈</div>
          </div>
          <div class="defesa-civil-base-v201">GOVERNO DO ESTADO<br>RIO DE JANEIRO</div>
        </div>

        <div class="titulo-boletim-v201">${escaparHtmlV201(titulo)}</div>

        <div class="brasao-bombeiros-v201">
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <path d="M60 7c6 13 16 21 27 28 10 6 19 16 19 32 0 26-21 46-46 46S14 93 14 67c0-18 12-31 25-39 8-5 15-11 21-21Z" fill="none" stroke="currentColor" stroke-width="6"/>
            <path d="M60 28 70 50l24 3-18 16 5 24-21-13-21 13 5-24-18-16 24-3 10-22Z" fill="none" stroke="currentColor" stroke-width="5"/>
            <path d="M35 18 18 35m67-17 17 17M31 102 18 87m71 15 13-15" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>
          </svg>
        </div>

        <div class="folha-v201">FL. ${folha}</div>
      </div>
    </div>
  `;
}

function montarPaginasBoletimV201(notas, tituloImpressao) {
  const area = document.getElementById("areaImpressao");
  if (!area) return false;

  const grupos = (() => {
    try {
      if (typeof agruparNotasParaImpressao === "function") return agruparNotasParaImpressao(notas);
    } catch {}
    return [];
  })();

  const tituloCabecalho = tituloCabecalhoBoletimV201(notas, tituloImpressao);
  const itens = achatarGruposImpressaoV201(grupos);

  // Paginação conservadora por "peso", para evitar cortes ruins.
  // Cabeçalho já ocupa 2,3 cm, e a página útil fica controlada no CSS.
  const paginas = [];
  let paginaAtual = [];
  let pesoAtual = 0;
  const LIMITE = 100;

  function pesoItem(item) {
    if (item.tipo === "parte") return 10;
    if (item.tipo === "secao") return 8;
    if (item.tipo === "subsecao") return 6;

    const texto = String(item.nota?.texto || "").replace(/<[^>]+>/g, " ");
    const anexos = Array.isArray(item.nota?.anexos) ? item.nota.anexos.length : 0;
    return Math.max(18, Math.ceil(texto.length / 260) * 9 + anexos * 10);
  }

  itens.forEach(item => {
    const p = pesoItem(item);

    if (paginaAtual.length && pesoAtual + p > LIMITE && item.tipo !== "parte") {
      paginas.push(paginaAtual);
      paginaAtual = [];
      pesoAtual = 0;
    }

    paginaAtual.push(item);
    pesoAtual += p;
  });

  if (paginaAtual.length) paginas.push(paginaAtual);

  function renderItem(item) {
    if (item.tipo === "parte") return `<h2 class="print-parte">${escaparHtmlV201(item.texto)}</h2>`;
    if (item.tipo === "secao") return `<h3 class="print-secao">${escaparHtmlV201(item.texto)}</h3>`;
    if (item.tipo === "subsecao") return `<h4 class="print-subsecao">${escaparHtmlV201(item.texto)}</h4>`;
    if (item.tipo === "nota") return renderizarNotaImpressaoV201(item.nota);
    return "";
  }

  area.innerHTML = `
    <div class="boletim-paginado-v201">
      ${paginas.map((itensPagina, idx) => `
        <section class="pagina-boletim-v201">
          ${htmlCabecalhoPaginaV201(tituloCabecalho, idx + 1)}
          <main class="conteudo-pagina-boletim-v201">
            ${itensPagina.map(renderItem).join("")}
          </main>
        </section>
      `).join("")}
    </div>
  `;

  document.body.classList.add("impressao-boletim-completo-v201");
  document.body.classList.remove("impressao-boletim-completo-v199", "impressao-nota-isolada-v199");

  return true;
}

(function interceptarMontagemBoletimV201() {
  try {
    if (typeof montarAreaImpressao === "function" && !window.montarAreaImpressaoOriginalV201) {
      window.montarAreaImpressaoOriginalV201 = montarAreaImpressao;

      montarAreaImpressao = function(notas, tituloImpressao = "Boletim Digital") {
        if (ehImpressaoBoletimDiaV201(tituloImpressao)) {
          const ok = montarPaginasBoletimV201(notas, tituloImpressao);
          if (ok) return;
        }

        document.body.classList.remove("impressao-boletim-completo-v201");
        return window.montarAreaImpressaoOriginalV201.apply(this, arguments);
      };

      window.montarAreaImpressao = montarAreaImpressao;
    }
  } catch {}

  try {
    if (typeof imprimirNotaUnica === "function" && !window.imprimirNotaUnicaOriginalV201) {
      window.imprimirNotaUnicaOriginalV201 = imprimirNotaUnica;

      imprimirNotaUnica = function(...args) {
        document.body.classList.remove("impressao-boletim-completo-v201");
        return window.imprimirNotaUnicaOriginalV201.apply(this, args);
      };

      window.imprimirNotaUnica = imprimirNotaUnica;
    }
  } catch {}
})();

document.addEventListener("beforeprint", () => {
  // Garante que os cabeçalhos antigos não apareçam junto.
  if (document.body.classList.contains("impressao-boletim-completo-v201")) {
    document.querySelectorAll("#cabecalho-impressao-v198, .cabecalho-boletim-modelo-v199, .print-page-header-v198").forEach(el => {
      el.style.display = "none";
    });
  }
});
