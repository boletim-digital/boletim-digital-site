
// 107-ordem-insercao-notas.js
// Notas mais novas no topo por ordem/data de inserção.

(function() {
  const STORAGE_KEYS_NOTAS = [
    "boletimDigitalNotasManuaisV30",
    "boletimDigitalNotasManuais",
    "notas",
    "boletimDigitalNotas"
  ];

  function agoraOrdem() {
    return Date.now();
  }

  function getNotas() {
    try {
      if (window.dados && Array.isArray(window.dados.notas)) {
        return window.dados.notas;
      }
    } catch {}

    return null;
  }

  function notaId(nota) {
    if (!nota) return "";
    return String(nota.id ?? nota.codigo ?? nota.numeroNota ?? nota.numero ?? "");
  }

  function notaOrdem(nota, indexFallback = 0) {
    if (!nota || typeof nota !== "object") return 0;

    const candidatos = [
      nota.ordemInsercao,
      nota.criadoEmMs,
      nota.dataInsercaoMs,
      nota._criadoEmMs,
      nota._ordemCriacao,
      nota.timestampCriacao
    ];

    for (const valor of candidatos) {
      const n = Number(valor);
      if (Number.isFinite(n) && n > 0) return n;
    }

    // Fallback para notas antigas: mantém ordem de importação, mas invertida.
    // Quanto mais abaixo no array antigo, mais nova ela tende a ser.
    return indexFallback + 1;
  }

  function garantirOrdemInsercao(notas) {
    if (!Array.isArray(notas)) return notas;

    const base = Date.now() - notas.length - 10;

    notas.forEach((nota, index) => {
      if (!nota || typeof nota !== "object") return;

      const temOrdem = Number(nota.ordemInsercao || nota.criadoEmMs || nota.dataInsercaoMs || nota._criadoEmMs || nota._ordemCriacao || 0) > 0;

      if (!temOrdem) {
        // Para notas antigas, considera a ordem atual como ordem de inclusão:
        // primeira antiga mais velha, última antiga mais nova.
        nota.ordemInsercao = base + index;
      }
    });

    return notas;
  }

  function ordenarPorInsercaoDesc(notas) {
    if (!Array.isArray(notas)) return notas;

    garantirOrdemInsercao(notas);

    notas.sort((a, b) => {
      const ia = notas.indexOf(a);
      const ib = notas.indexOf(b);
      const ob = notaOrdem(b, ib);
      const oa = notaOrdem(a, ia);

      if (ob !== oa) return ob - oa;

      const idb = Number(String(notaId(b)).replace(/\D/g, ""));
      const ida = Number(String(notaId(a)).replace(/\D/g, ""));

      if (Number.isFinite(idb) && Number.isFinite(ida) && idb !== ida) {
        return idb - ida;
      }

      return 0;
    });

    return notas;
  }

  function salvarNotasOrdenadas() {
    const notas = getNotas();
    if (!Array.isArray(notas)) return;

    ordenarPorInsercaoDesc(notas);

    for (const key of STORAGE_KEYS_NOTAS) {
      try {
        const valor = localStorage.getItem(key);
        if (valor !== null) {
          localStorage.setItem(key, JSON.stringify(notas));
        }
      } catch {}
    }
  }

  function prepararNotaNova(nota) {
    if (!nota || typeof nota !== "object") return nota;

    if (!nota.ordemInsercao) {
      nota.ordemInsercao = agoraOrdem();
    }

    if (!nota.criadoEmMs) {
      nota.criadoEmMs = nota.ordemInsercao;
    }

    return nota;
  }

  function interceptarArrayNotas() {
    const notas = getNotas();
    if (!Array.isArray(notas) || notas.__ordemInsercaoV107) return;

    Object.defineProperty(notas, "__ordemInsercaoV107", {
      value: true,
      enumerable: false
    });

    const pushOriginal = notas.push;
    notas.push = function(...items) {
      items.forEach(prepararNotaNova);
      const r = pushOriginal.apply(this, items);
      ordenarPorInsercaoDesc(this);
      salvarNotasOrdenadas();
      setTimeout(renderizarDepoisDaOrdenacao, 0);
      return r;
    };

    const unshiftOriginal = notas.unshift;
    notas.unshift = function(...items) {
      items.forEach(prepararNotaNova);
      const r = unshiftOriginal.apply(this, items);
      ordenarPorInsercaoDesc(this);
      salvarNotasOrdenadas();
      setTimeout(renderizarDepoisDaOrdenacao, 0);
      return r;
    };

    const spliceOriginal = notas.splice;
    notas.splice = function(...args) {
      // Se estiver adicionando item via splice, marca como novo.
      if (args.length > 2) {
        args.slice(2).forEach(prepararNotaNova);
      }
      const r = spliceOriginal.apply(this, args);
      ordenarPorInsercaoDesc(this);
      salvarNotasOrdenadas();
      setTimeout(renderizarDepoisDaOrdenacao, 0);
      return r;
    };
  }

  function renderizarDepoisDaOrdenacao() {
    try {
      ordenarPorInsercaoDesc(getNotas());
    } catch {}

    try {
      if (typeof window.renderizarNotas === "function" && !window.__renderizandoOrdemV107) {
        window.__renderizandoOrdemV107 = true;
        window.renderizarNotas();
        window.__renderizandoOrdemV107 = false;
      }
    } catch {
      window.__renderizandoOrdemV107 = false;
    }

    setTimeout(reordenarDOMPorInsercao, 0);
  }

  function extrairIdCard(card) {
    if (!card) return "";

    const attrs = [
      card.dataset?.id,
      card.dataset?.notaId,
      card.getAttribute("data-id"),
      card.getAttribute("data-nota-id")
    ].filter(Boolean);

    if (attrs.length) return String(attrs[0]);

    const texto = card.textContent || "";
    const m = texto.match(/(?:Nota|N[º°o.]*)\s*(\d+)/i);
    return m ? m[1] : "";
  }

  function mapaOrdemPorNota() {
    const notas = getNotas() || [];
    const mapa = new Map();

    notas.forEach((nota, index) => {
      const id = notaId(nota);
      const ordem = notaOrdem(nota, index);
      if (id) mapa.set(String(id), ordem);

      // Fallback por número da nota.
      const num = String(nota.numero ?? nota.numeroNota ?? "").replace(/\D/g, "");
      if (num) mapa.set(num, ordem);
    });

    return mapa;
  }

  function reordenarDOMPorInsercao() {
    const containers = [
      document.getElementById("listaNotas"),
      document.getElementById("notasContainer"),
      document.querySelector(".lista-notas"),
      document.querySelector(".notas-container"),
      document.querySelector("[data-lista-notas]")
    ].filter(Boolean);

    const mapa = mapaOrdemPorNota();

    containers.forEach(container => {
      const cards = Array.from(container.children).filter(el => {
        const txt = (el.textContent || "").trim();
        return txt && !el.classList.contains("vazio") && !txt.includes("Nenhuma nota encontrada");
      });

      if (cards.length < 2) return;

      cards.sort((a, b) => {
        const ida = extrairIdCard(a);
        const idb = extrairIdCard(b);

        const oa = mapa.get(String(ida)) || 0;
        const ob = mapa.get(String(idb)) || 0;

        return ob - oa;
      });

      cards.forEach(card => container.appendChild(card));
    });
  }

  function interceptarRenderizarNotas() {
    if (typeof window.renderizarNotas !== "function" || window.renderizarNotas.__ordemInsercaoV107) return;

    const original = window.renderizarNotas;

    function renderizarNotasV107(...args) {
      ordenarPorInsercaoDesc(getNotas());
      interceptarArrayNotas();

      const r = original.apply(this, args);

      setTimeout(() => {
        ordenarPorInsercaoDesc(getNotas());
        reordenarDOMPorInsercao();
      }, 0);

      return r;
    }

    renderizarNotasV107.__ordemInsercaoV107 = true;
    window.renderizarNotas = renderizarNotasV107;
  }

  function interceptarSalvarNota() {
    const nomes = ["salvarNota", "incluirNota", "salvarNovaNota"];

    nomes.forEach(nome => {
      const fn = window[nome];
      if (typeof fn !== "function" || fn.__ordemInsercaoV107) return;

      function wrapper(...args) {
        const antes = (getNotas() || []).length;
        const r = fn.apply(this, args);

        setTimeout(() => {
          const notas = getNotas();
          if (Array.isArray(notas)) {
            // Se apareceu uma nota nova sem ordem, a última inserida normalmente será a última do array.
            notas.forEach((nota, index) => {
              if (!nota.ordemInsercao && index >= antes - 1) {
                prepararNotaNova(nota);
              }
            });
            ordenarPorInsercaoDesc(notas);
            salvarNotasOrdenadas();
          }

          renderizarDepoisDaOrdenacao();
        }, 0);

        return r;
      }

      wrapper.__ordemInsercaoV107 = true;
      window[nome] = wrapper;
    });
  }

  function inicializar() {
    const notas = getNotas();
    if (Array.isArray(notas)) {
      garantirOrdemInsercao(notas);
      ordenarPorInsercaoDesc(notas);
      salvarNotasOrdenadas();
    }

    interceptarArrayNotas();
    interceptarRenderizarNotas();
    interceptarSalvarNota();

    setTimeout(renderizarDepoisDaOrdenacao, 100);
  }

  document.addEventListener("DOMContentLoaded", () => {
    inicializar();
    setTimeout(inicializar, 300);
    setTimeout(inicializar, 900);
  });

  window.ordenarNotasPorInsercaoDescV107 = function() {
    inicializar();
    renderizarDepoisDaOrdenacao();
  };
})();
