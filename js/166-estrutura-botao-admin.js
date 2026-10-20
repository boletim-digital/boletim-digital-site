
// v166 - corrige botão Estrutura Organizacional e garante acesso pelo grupo Administração.
function mostrarEstruturaOrganizacionalV166() {
  const perfil = (() => {
    try { return typeof perfilAtual === "function" ? perfilAtual() : sessionStorage.getItem("boletimDigitalPerfil"); }
    catch { return ""; }
  })();

  if (!["desenvolvedor", "administrador"].includes(String(perfil || ""))) {
    alert("Apenas Administrador e Desenvolvedor podem acessar a Estrutura Organizacional.");
    return;
  }

  try { modoPagina = "estrutura"; } catch {}

  document.querySelectorAll(".menu button, .menu-rodape button, .btn-extra-admin").forEach(b => b.classList.remove("ativo"));
  document.getElementById("btnEstruturaOrganizacional")?.classList.add("ativo");

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

  try { renderizarEstruturaOrganizacionalV164(); } catch {}
}

function configurarBotaoEstruturaOrganizacionalV166() {
  const btn = document.getElementById("btnEstruturaOrganizacional");
  if (!btn) return;

  const perfil = (() => {
    try { return typeof perfilAtual === "function" ? perfilAtual() : sessionStorage.getItem("boletimDigitalPerfil"); }
    catch { return ""; }
  })();

  btn.classList.toggle("escondido", !["desenvolvedor", "administrador"].includes(String(perfil || "")));

  if (btn.dataset.v166 === "1") return;

  const clone = btn.cloneNode(true);
  clone.dataset.v166 = "1";
  clone.addEventListener("click", function (event) {
    event.preventDefault();
    event.stopPropagation();
    mostrarEstruturaOrganizacionalV166();
  });

  btn.replaceWith(clone);
}

(function corrigirMostrarBoletimV166() {
  try {
    if (typeof mostrarBoletim === "function" && !window.mostrarBoletimOriginalV166) {
      window.mostrarBoletimOriginalV166 = mostrarBoletim;
      mostrarBoletim = function(...args) {
        const r = window.mostrarBoletimOriginalV166.apply(this, args);
        document.getElementById("paginaEstruturaOrganizacional")?.classList.add("escondido");
        return r;
      };
    }
  } catch {}
})();

document.addEventListener("DOMContentLoaded", () => {
  configurarBotaoEstruturaOrganizacionalV166();
  setTimeout(configurarBotaoEstruturaOrganizacionalV166, 300);
  setTimeout(configurarBotaoEstruturaOrganizacionalV166, 1000);
});
