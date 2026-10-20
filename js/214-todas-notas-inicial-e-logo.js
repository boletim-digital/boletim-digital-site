
// v214 - entrada padrão em Todas as notas + ajuste do ícone CB para BD.

function abrirTodasAsNotasV214() {
  try {
    filtroAtual = {
      parte: "",
      secao: "",
      subsecao: "",
      label: "Todas as notas"
    };
  } catch {}

  try { boletimSelecionado = ""; } catch {}
  try { dataNotaSelecionadaCalendario = ""; } catch {}
  try { paginaAtual = 1; } catch {}
  try { modoPagina = "boletim"; } catch {}

  document.querySelectorAll(".menu button, .menu-rodape button").forEach(btn => {
    btn.classList.remove("ativo");
  });

  const btnTodas =
    document.querySelector('.menu button[data-id="todas"]') ||
    document.querySelector('[data-id="todas"]');

  if (btnTodas) btnTodas.classList.add("ativo");

  const titulo = document.getElementById("tituloPagina");
  if (titulo) titulo.textContent = "Boletim Digital";

  try {
    document.getElementById("paginaFatosHistoricos")?.classList.add("escondido");
    document.getElementById("paginaEstatistica")?.classList.add("escondido");
    document.getElementById("paginaAuditoria")?.classList.add("escondido");
    document.getElementById("paginaEstruturaOrganizacional")?.classList.add("escondido");
    document.getElementById("controlesNotas")?.classList.remove("escondido");
    document.getElementById("listaNotas")?.classList.remove("escondido");
    document.getElementById("paginacao")?.classList.remove("escondido");
  } catch {}

  try { mostrarBoletim(); } catch {}
  try { renderizarNotas(); } catch {}
}

function ajustarLogoCbParaBdV214() {
  const candidatos = Array.from(document.querySelectorAll(
    ".logo, .marca-logo, .brand-logo, .app-logo, .sidebar-logo, .logo-app, .identidade-logo, .avatar-logo, .marca .icone, .brand .icone"
  ));

  const sidebar = document.querySelector(".sidebar, aside, .menu-lateral");
  if (sidebar) {
    Array.from(sidebar.querySelectorAll("div, span, strong")).forEach(el => {
      const texto = String(el.textContent || "").trim();
      if (texto === "CB") candidatos.push(el);
    });
  }

  candidatos.forEach(el => {
    const texto = String(el.textContent || "").trim();
    if (texto === "CB") {
      el.textContent = "BD";
      el.title = "Boletim Digital";
      el.classList.add("logo-boletim-digital-v214");
    }
  });
}

function configurarEntradaTodasNotasV214() {
  ajustarLogoCbParaBdV214();

  const logado = (() => {
    try {
      return sessionStorage.getItem("boletimDigitalLogado") === "true" ||
             localStorage.getItem("boletimDigitalLogado") === "true" ||
             document.body.classList.contains("logado");
    } catch {
      return false;
    }
  })();

  if (logado) {
    setTimeout(abrirTodasAsNotasV214, 80);
    setTimeout(abrirTodasAsNotasV214, 300);
  }
}

(function interceptarLoginV214() {
  try {
    if (typeof fazerLogin === "function" && !window.fazerLoginOriginalV214) {
      window.fazerLoginOriginalV214 = fazerLogin;

      fazerLogin = function(...args) {
        const r = window.fazerLoginOriginalV214.apply(this, args);
        setTimeout(() => {
          ajustarLogoCbParaBdV214();
          abrirTodasAsNotasV214();
        }, 80);
        setTimeout(abrirTodasAsNotasV214, 300);
        return r;
      };

      window.fazerLogin = fazerLogin;
    }
  } catch {}

  try {
    if (typeof mostrarApp === "function" && !window.mostrarAppOriginalV214) {
      window.mostrarAppOriginalV214 = mostrarApp;

      mostrarApp = function(...args) {
        const r = window.mostrarAppOriginalV214.apply(this, args);
        setTimeout(() => {
          ajustarLogoCbParaBdV214();
          abrirTodasAsNotasV214();
        }, 80);
        return r;
      };

      window.mostrarApp = mostrarApp;
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarEntradaTodasNotasV214();
  setTimeout(configurarEntradaTodasNotasV214, 300);
  setTimeout(ajustarLogoCbParaBdV214, 1000);
});

document.addEventListener("submit", event => {
  if (event.target?.id === "formLogin") {
    setTimeout(() => {
      ajustarLogoCbParaBdV214();
      abrirTodasAsNotasV214();
    }, 150);
  }
}, true);
