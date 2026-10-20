
// v213 - Boletim Reservado de Oficiais.
// Objetivo:
// - criar tipo de boletim reservado para oficiais;
// - permitir que oficial veja o boletim reservado independentemente do perfil do sistema;
// - impedir que usuário não oficial veja notas reservadas;
// - manter Desenvolvedor/Administrador com acesso para gestão;
// A condição de oficial vem exclusivamente do perfil autenticado no servidor.

function normV213(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function rgLimpoV213(valor) {
  return String(valor || "").replace(/\D+/g, "");
}

function usuarioAtualV213() {
  const rg = rgAtual?.() || sessionStorage.getItem("boletimDigitalRg") || "";
  const categoria = sessionStorage.getItem("boletimDigitalCategoriaMilitar") || "";
  const posto = sessionStorage.getItem("boletimDigitalPostoGraduacao") || "";
  const nome = sessionStorage.getItem("boletimDigitalNome") || "";
  const perfil = perfilAtual?.() || sessionStorage.getItem("boletimDigitalPerfil") || "";

  return { rg, categoriaMilitar: categoria, postoGraduacao: posto, nome, perfil };
}

function perfilPodeGerirReservadoOficiaisV213() {
  const perfil = normV213(perfilAtual?.() || sessionStorage.getItem("boletimDigitalPerfil") || "");
  return perfil === "desenvolvedor" || perfil === "administrador";
}

function usuarioEhOficialV213() {
  const u = usuarioAtualV213();
  const categoria = normV213(u.categoriaMilitar);
  const posto = normV213(u.postoGraduacao);
  if (categoria === "oficial") return true;

  // Fallback por posto/graduação, útil quando futuramente vier de cadastro/DGP.
  const postosOficiais = [
    "cadete", "asp", "aspirante", "aspirante a oficial",
    "2 ten", "2º ten", "2 tenente", "segundo tenente",
    "1 ten", "1º ten", "1 tenente", "primeiro tenente",
    "cap", "capitao", "capitão",
    "maj", "major",
    "ten cel", "tenente coronel", "tc",
    "cel", "coronel"
  ];

  return postosOficiais.some(p => posto === p || posto.includes(p));
}

function podeVerBoletimReservadoOficiaisV213() {
  return usuarioEhOficialV213() || perfilPodeGerirReservadoOficiaisV213();
}

function notaEhReservadaOficiaisV213(nota) {
  if (!nota) return false;

  const tipo = normV213(nota.boletimTipo || nota.tipoBoletim || nota.tipo);
  const visibilidade = normV213(nota.visibilidade || nota.classificacao || nota.acesso);
  const boletim = normV213(`${nota.boletim || ""} ${nota.boletimTexto || ""} ${nota.boletimOrgaoNome || ""}`);

  return (
    tipo === "oficiais" ||
    tipo === "reservado_oficiais" ||
    tipo === "reservado-oficiais" ||
    visibilidade === "oficiais" ||
    visibilidade === "reservado_oficiais" ||
    visibilidade === "reservado-oficiais" ||
    nota.reservadoOficiais === true ||
    nota.boletimReservadoOficiais === true ||
    /boletim\s+reservado\s+de\s+oficiais/i.test(String(nota.boletim || "")) ||
    boletim.includes("reservado de oficiais")
  );
}

function textoBoletimReservadoOficiaisV213() {
  const numero = String(document.getElementById("notaBoletimNumero")?.value || "").trim();
  return `Boletim Reservado de Oficiais${numero ? " nº " + numero : ""}`;
}

function aplicarDadosReservadoOficiaisNaNotaV213(nota) {
  if (!nota) return nota;

  const numero = String(document.getElementById("notaBoletimNumero")?.value || "").trim();
  const texto = textoBoletimReservadoOficiaisV213();

  nota.boletim = texto;
  nota.boletimTexto = texto;
  nota.boletimTipo = "OFICIAIS";
  nota.boletimNumero = numero;
  nota.boletimOrgaoId = "reservado-oficiais";
  nota.boletimOrgaoNome = "Reservado de Oficiais";
  nota.boletimCbaId = "";
  nota.boletimObmId = "";
  nota.visibilidade = "oficiais";
  nota.reservadoOficiais = true;
  nota.boletimReservadoOficiais = true;

  return nota;
}

function tipoBoletimAtualV213() {
  return String(document.getElementById("notaBoletimTipo")?.value || "").trim();
}

function adicionarOpcaoReservadoOficiaisV213() {
  const select = document.getElementById("notaBoletimTipo");
  if (!select) return;

  if (!Array.from(select.options).some(opt => opt.value === "OFICIAIS")) {
    const opt = document.createElement("option");
    opt.value = "OFICIAIS";
    opt.textContent = "Reservado de Oficiais";
    select.appendChild(opt);
  }
}

function atualizarCamposBoletimReservadoOficiaisV213() {
  adicionarOpcaoReservadoOficiaisV213();

  const tipo = document.getElementById("notaBoletimTipo");
  const grupoCba = document.getElementById("grupoNotaBoletimCba");
  const grupoObm = document.getElementById("grupoNotaBoletimObm");
  const legado = document.getElementById("notaBoletim");

  if (!tipo) return;

  if (tipo.value === "OFICIAIS") {
    if (grupoCba) {
      grupoCba.classList.add("escondido");
      grupoCba.style.display = "none";
      grupoCba.style.visibility = "hidden";
    }

    if (grupoObm) {
      grupoObm.classList.add("escondido");
      grupoObm.style.display = "none";
      grupoObm.style.visibility = "hidden";
    }

    if (legado) {
      legado.required = false;
      legado.removeAttribute("required");
      legado.value = textoBoletimReservadoOficiaisV213();
    }
  } else {
    if (legado) {
      legado.required = false;
      legado.removeAttribute("required");
    }
  }
}

function configurarTipoReservadoOficiaisV213() {
  adicionarOpcaoReservadoOficiaisV213();

  ["notaBoletimTipo", "notaBoletimNumero"].forEach(id => {
    const el = document.getElementById(id);
    if (!el || el.dataset.v213 === "1") return;

    el.dataset.v213 = "1";
    el.addEventListener("change", atualizarCamposBoletimReservadoOficiaisV213, true);
    el.addEventListener("input", atualizarCamposBoletimReservadoOficiaisV213, true);
  });

  atualizarCamposBoletimReservadoOficiaisV213();
}

function atualizarIndicacaoUsuarioOficialV213() {
  document.body.classList.toggle("usuario-oficial-v213", usuarioEhOficialV213());
  document.body.classList.toggle("pode-ver-reservado-oficiais-v213", podeVerBoletimReservadoOficiaisV213());

  const el = document.getElementById("perfilUsuario");
  if (el) {
    const perfil = nomePerfil?.(perfilAtual?.() || "") || perfilAtual?.() || "Usuário";
    const rg = rgAtual?.() || "";
    const sufixo = usuarioEhOficialV213() ? " • Oficial" : "";
    el.textContent = `${perfil}${sufixo} • RG ${rg}`;
  }
}

function incluirCredencialOficialNoLoginV213() {
  // Compatibilidade com chamadas antigas: credenciais de demonstração foram removidas.
}

function loginOficialDemoV213(event) {
  return false;
}

(function configurarLoginOficialV213() {
  // O login é configurado em 02-auth.js e validado pelo Supabase Auth.
})();

(function ajustarPermissoesV213() {
  try {
    if (typeof aplicarPermissoes === "function" && !window.aplicarPermissoesOriginalV213) {
      window.aplicarPermissoesOriginalV213 = aplicarPermissoes;

      aplicarPermissoes = function(...args) {
        const r = window.aplicarPermissoesOriginalV213.apply(this, args);
        atualizarIndicacaoUsuarioOficialV213();
        adicionarBotaoBoletimReservadoOficiaisV213();
        return r;
      };

      window.aplicarPermissoes = aplicarPermissoes;
    }
  } catch {}

  try {
    if (typeof sair === "function" && !window.sairOriginalV213) {
      window.sairOriginalV213 = sair;

      sair = function(...args) {
        sessionStorage.removeItem("boletimDigitalCategoriaMilitar");
        sessionStorage.removeItem("boletimDigitalPostoGraduacao");
        sessionStorage.removeItem("boletimDigitalNome");
        document.body.classList.remove("usuario-oficial-v213", "pode-ver-reservado-oficiais-v213");
        return window.sairOriginalV213.apply(this, args);
      };

      window.sair = sair;
    }
  } catch {}
})();

function adicionarBotaoBoletimReservadoOficiaisV213() {
  const menu = document.getElementById("menuLateral");
  if (!menu) return;

  menu.querySelectorAll("#btnBoletimReservadoOficiaisV213").forEach(el => el.remove());

  if (!podeVerBoletimReservadoOficiaisV213()) return;

  const btn = document.createElement("button");
  btn.id = "btnBoletimReservadoOficiaisV213";
  btn.type = "button";
  btn.textContent = "Boletim Reservado de Oficiais";
  btn.className = "nivel-1 btn-reservado-oficiais-v213";
  btn.dataset.id = "boletim-reservado-oficiais";

  btn.addEventListener("click", () => {
    filtroAtual = {
      id: "boletim-reservado-oficiais",
      label: "Boletim Reservado de Oficiais",
      parte: "",
      secao: "",
      subsecao: "",
      reservadoOficiais: true
    };

    boletimSelecionado = "";
    dataNotaSelecionadaCalendario = "";
    paginaAtual = 1;
    modoPagina = "boletim";

    document.querySelectorAll(".menu button, .menu-rodape button").forEach(b => b.classList.remove("ativo"));
    btn.classList.add("ativo");

    document.getElementById("tituloPagina").textContent = "Boletim Reservado de Oficiais";
    mostrarBoletim?.();
    renderizarNotas?.();
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const todas = menu.querySelector('[data-id="todas"]');
  if (todas?.nextSibling) menu.insertBefore(btn, todas.nextSibling);
  else menu.appendChild(btn);
}

(function ajustarMenuReservadoV213() {
  try {
    if (typeof montarMenu === "function" && !window.montarMenuOriginalV213) {
      window.montarMenuOriginalV213 = montarMenu;

      montarMenu = function(...args) {
        const r = window.montarMenuOriginalV213.apply(this, args);
        adicionarBotaoBoletimReservadoOficiaisV213();
        return r;
      };

      window.montarMenu = montarMenu;
    }
  } catch {}
})();

(function ajustarFiltroNotasReservadasV213() {
  try {
    if (typeof pertenceAoFiltro === "function" && !window.pertenceAoFiltroOriginalV213) {
      window.pertenceAoFiltroOriginalV213 = pertenceAoFiltro;

      pertenceAoFiltro = function(nota) {
        const filtroReservado = filtroAtual?.id === "boletim-reservado-oficiais" || filtroAtual?.reservadoOficiais === true;
        const reservada = notaEhReservadaOficiaisV213(nota);

        if (filtroReservado) {
          return reservada && podeVerBoletimReservadoOficiaisV213();
        }

        if (reservada && !podeVerBoletimReservadoOficiaisV213()) {
          return false;
        }

        return window.pertenceAoFiltroOriginalV213.apply(this, arguments);
      };

      window.pertenceAoFiltro = pertenceAoFiltro;
    }
  } catch {}
})();

(function ajustarTextosBoletimReservadoV213() {
  const nomesTexto = [
    "montarTextoBoletimSubmitV178",
    "montarTextoBoletimV179",
    "montarTextoBoletimV180",
    "montarTextoBoletimV182",
    "montarTextoBoletimAtualV185"
  ];

  nomesTexto.forEach(nome => {
    try {
      const fn = window[nome] || eval(nome);
      if (typeof fn === "function" && !fn.__v213) {
        const original = fn;
        const wrapper = function(...args) {
          if (tipoBoletimAtualV213() === "OFICIAIS") {
            return textoBoletimReservadoOficiaisV213();
          }
          return original.apply(this, args);
        };
        wrapper.__v213 = true;

        window[nome] = wrapper;
        try { eval(`${nome} = window["${nome}"];`); } catch {}
      }
    } catch {}
  });

  const nomesAplicar = [
    "aplicarDadosBoletimNaNotaV182",
    "aplicarCamposBoletimNaNotaV185",
    "aplicarBoletimEstruturadoNaNotaV180"
  ];

  nomesAplicar.forEach(nome => {
    try {
      const fn = window[nome] || eval(nome);
      if (typeof fn === "function" && !fn.__v213) {
        const original = fn;
        const wrapper = function(nota, ...resto) {
          const r = original.apply(this, [nota, ...resto]);
          if (tipoBoletimAtualV213() === "OFICIAIS") {
            return aplicarDadosReservadoOficiaisNaNotaV213(r || nota);
          }
          return r;
        };
        wrapper.__v213 = true;

        window[nome] = wrapper;
        try { eval(`${nome} = window["${nome}"];`); } catch {}
      }
    } catch {}
  });
})();

(function ajustarImpressaoReservadoV213() {
  try {
    if (typeof tituloCabecalhoBoletimV201 === "function" && !window.tituloCabecalhoBoletimOriginalV213) {
      window.tituloCabecalhoBoletimOriginalV213 = tituloCabecalhoBoletimV201;

      tituloCabecalhoBoletimV201 = function(notas, tituloImpressao) {
        const lista = Array.isArray(notas) ? notas : [];
        const algumaReservada = lista.some(notaEhReservadaOficiaisV213);

        if (algumaReservada) {
          const numero = (() => {
            for (const n of lista) {
              const direto = String(n?.boletimNumero || "").trim();
              if (direto) return direto.padStart(3, "0");
              const m = String(n?.boletim || n?.boletimTexto || "").match(/n[º°.]?\s*(\d+)/i);
              if (m) return m[1].padStart(3, "0");
            }
            return "";
          })();

          const data = (() => {
            const m = String(tituloImpressao || "").match(/(\d{2}\/\d{2}\/\d{4})/);
            if (m) return m[1];
            return lista[0]?.data || "";
          })();

          if (numero && data) return `BOLETIM RESERVADO DE OFICIAIS Nº ${numero}, DE ${data}`;
          if (data) return `BOLETIM RESERVADO DE OFICIAIS, DE ${data}`;
          return "BOLETIM RESERVADO DE OFICIAIS";
        }

        return window.tituloCabecalhoBoletimOriginalV213.apply(this, arguments);
      };

      window.tituloCabecalhoBoletimV201 = tituloCabecalhoBoletimV201;
    }
  } catch {}
})();

function inicializarBoletimReservadoOficiaisV213() {
  incluirCredencialOficialNoLoginV213();
  configurarTipoReservadoOficiaisV213();
  atualizarIndicacaoUsuarioOficialV213();
  adicionarBotaoBoletimReservadoOficiaisV213();
}

document.addEventListener("DOMContentLoaded", () => {
  inicializarBoletimReservadoOficiaisV213();
  setTimeout(inicializarBoletimReservadoOficiaisV213, 300);
  setTimeout(inicializarBoletimReservadoOficiaisV213, 1000);
});

document.addEventListener("click", event => {
  if (event.target?.id === "btnNovaNota" || event.target?.closest?.("#btnNovaNota")) {
    setTimeout(configurarTipoReservadoOficiaisV213, 120);
  }
}, true);

document.addEventListener("change", event => {
  if (event.target?.id === "notaBoletimTipo" || event.target?.id === "notaBoletimNumero") {
    atualizarCamposBoletimReservadoOficiaisV213();
  }
}, true);
