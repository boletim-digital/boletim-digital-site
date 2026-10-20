
// v167 - garante botão Estrutura Organizacional no menu lateral.
function perfilPodeVerEstruturaV167() {
  try {
    const perfil = typeof perfilAtual === "function"
      ? perfilAtual()
      : sessionStorage.getItem("boletimDigitalPerfil");
    return ["desenvolvedor", "administrador"].includes(String(perfil || ""));
  } catch {
    return false;
  }
}

function garantirBotaoEstruturaNoMenuV167() {
  let btn = document.getElementById("btnEstruturaOrganizacional");

  if (!btn) {
    btn = document.createElement("button");
    btn.id = "btnEstruturaOrganizacional";
    btn.type = "button";
    btn.className = "btn-menu-admin estrutura-organizacional-menu-v167";
    btn.textContent = "Estrutura Organizacional";

    const btnAuditoria = document.getElementById("btnAuditoria");
    if (btnAuditoria?.parentElement) {
      btnAuditoria.insertAdjacentElement("afterend", btn);
    } else {
      const menu = document.querySelector(".menu, nav, aside");
      const tituloAdmin = Array.from(document.querySelectorAll(".menu-grupo-titulo"))
        .find(el => /administra/i.test(el.textContent || ""));

      if (tituloAdmin) {
        tituloAdmin.insertAdjacentElement("afterend", btn);
      } else if (menu) {
        const titulo = document.createElement("div");
        titulo.className = "menu-grupo-titulo";
        titulo.textContent = "Administração";
        menu.appendChild(titulo);
        menu.appendChild(btn);
      }
    }
  }

  if (!btn) return;

  // Não usar a classe "escondido" aqui, porque versões anteriores podem ter escondido o botão.
  if (perfilPodeVerEstruturaV167()) {
    btn.classList.remove("escondido", "oculto-contextual");
    btn.style.display = "";
    btn.style.visibility = "";
    btn.style.opacity = "";
  } else {
    btn.classList.add("escondido");
  }

  if (btn.dataset.v167 !== "1") {
    btn.dataset.v167 = "1";

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (typeof mostrarEstruturaOrganizacionalV166 === "function") {
        mostrarEstruturaOrganizacionalV166();
        return;
      }

      if (typeof renderizarEstruturaOrganizacionalV164 === "function") {
        try { modoPagina = "estrutura"; } catch {}

        document.querySelectorAll(".menu button, .menu-rodape button, .btn-extra-admin, .btn-menu-admin")
          .forEach(b => b.classList.remove("ativo"));

        btn.classList.add("ativo");

        [
          "controlesNotas",
          "listaNotas",
          "paginacao",
          "paginaFatosHistoricos",
          "paginaEstatistica",
          "paginaAuditoria"
        ].forEach(id => document.getElementById(id)?.classList.add("escondido"));

        document.getElementById("paginaEstruturaOrganizacional")?.classList.remove("escondido");

        const titulo = document.getElementById("tituloPagina");
        if (titulo) titulo.textContent = "Estrutura Organizacional";

        renderizarEstruturaOrganizacionalV164();
        return;
      }

      alert("A página Estrutura Organizacional não foi carregada.");
    });
  }
}

// Reaplica depois do login, pois a tela/menus mudam de estado.
document.addEventListener("DOMContentLoaded", () => {
  garantirBotaoEstruturaNoMenuV167();
  setTimeout(garantirBotaoEstruturaNoMenuV167, 300);
  setTimeout(garantirBotaoEstruturaNoMenuV167, 1000);
  setTimeout(garantirBotaoEstruturaNoMenuV167, 2000);
});

document.addEventListener("click", () => {
  setTimeout(garantirBotaoEstruturaNoMenuV167, 50);
}, true);
