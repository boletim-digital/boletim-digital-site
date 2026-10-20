
// v184 - ordenação definitiva das notas:
// 1) data mais recente primeiro;
// 2) dentro da mesma data, última inclusão primeiro.

function dataNotaParaOrdenacaoV184(dataBR) {
  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return 0;

  const dia = String(m[1]).padStart(2, "0");
  const mes = String(m[2]).padStart(2, "0");
  const ano = String(m[3]);

  return Number(`${ano}${mes}${dia}`);
}

function carimboInclusaoNotaV184(nota, indiceFallback = 0) {
  if (!nota || typeof nota !== "object") return 0;

  const candidatos = [
    nota.inseridoEm,
    nota.ordemInclusao,
    nota.criadoEm,
    nota.timestamp,
    nota.createdAt
  ];

  for (const valor of candidatos) {
    const numero = Number(valor);
    if (Number.isFinite(numero) && numero > 0) return numero;
  }

  // Fallback para notas antigas sem carimbo:
  // quanto mais acima no array original, mais recente ela tende a ser.
  return 1_000_000 - indiceFallback;
}

function compararNotasDataInclusaoV184(a, b, indiceA = 0, indiceB = 0) {
  const dataA = dataNotaParaOrdenacaoV184(a?.data);
  const dataB = dataNotaParaOrdenacaoV184(b?.data);

  if (dataA !== dataB) {
    return dataB - dataA;
  }

  const incA = carimboInclusaoNotaV184(a, indiceA);
  const incB = carimboInclusaoNotaV184(b, indiceB);

  if (incA !== incB) {
    return incB - incA;
  }

  return 0;
}

function ordenarNotasPorDataInclusaoV184() {
  if (!window.dados || !Array.isArray(dados.notas)) return;

  dados.notas = dados.notas
    .map((nota, indiceOriginal) => ({ nota, indiceOriginal }))
    .sort((a, b) => compararNotasDataInclusaoV184(a.nota, b.nota, a.indiceOriginal, b.indiceOriginal))
    .map(item => item.nota);
}

// Garante que novas notas recebam carimbo de inclusão.
(function reforcarCarimboNovaNotaV184() {
  try {
    if (typeof incluirNotaPeloFormulario === "function" && !window.incluirNotaPeloFormularioOriginalV184) {
      window.incluirNotaPeloFormularioOriginalV184 = incluirNotaPeloFormulario;

      incluirNotaPeloFormulario = function(...args) {
        const antes = new Set((dados.notas || []).map(n => n.id));

        const resultado = window.incluirNotaPeloFormularioOriginalV184.apply(this, args);

        try {
          (dados.notas || []).forEach(nota => {
            if (!antes.has(nota.id)) {
              const agora = Date.now();
              nota.inseridoEm = agora;
              nota.ordemInclusao = agora;
              nota.criadoEm = nota.criadoEm || agora;
            }
          });

          ordenarNotasPorDataInclusaoV184();

          if (typeof salvarNotasLocais === "function") {
            salvarNotasLocais();
          } else if (typeof salvarDados === "function") {
            salvarDados();
          }

          if (typeof renderizarNotas === "function") {
            renderizarNotas();
          }
        } catch {}

        return resultado;
      };
    }
  } catch {}
})();

// Garante a ordenação em toda renderização.
(function reforcarRenderizacaoOrdenadaV184() {
  try {
    if (typeof renderizarNotas === "function" && !window.renderizarNotasOriginalV184) {
      window.renderizarNotasOriginalV184 = renderizarNotas;

      renderizarNotas = function(...args) {
        ordenarNotasPorDataInclusaoV184();
        return window.renderizarNotasOriginalV184.apply(this, args);
      };
    }
  } catch {}
})();

// Compatibilidade: sobrescreve ordenadores de versões anteriores.
window.compararNotasDataInclusaoV184 = compararNotasDataInclusaoV184;
window.ordenarNotasPorDataInclusaoV184 = ordenarNotasPorDataInclusaoV184;

try {
  ordenarNotas = function(a, b) {
    return compararNotasDataInclusaoV184(a, b);
  };
} catch {}

document.addEventListener("DOMContentLoaded", () => {
  ordenarNotasPorDataInclusaoV184();

  try {
    if (typeof renderizarNotas === "function") renderizarNotas();
  } catch {}
});
