
// v168 - ajusta botão e exibição correta da página Estrutura Organizacional.
function moverPaginaEstruturaParaConteudoV168() {
  const pagina = document.getElementById("paginaEstruturaOrganizacional");
  if (!pagina) return;

  const paginaEstatistica = document.getElementById("paginaEstatistica");
  if (paginaEstatistica && pagina.parentElement !== paginaEstatistica.parentElement) {
    paginaEstatistica.insertAdjacentElement("afterend", pagina);
    return;
  }

  const main = document.querySelector("main, .conteudo, .content, #conteudoPrincipal");
  if (main && !main.contains(pagina)) {
    main.appendChild(pagina);
  }
}

function mostrarEstruturaOrganizacionalV168() {
  const perfil = (() => {
    try { return typeof perfilAtual === "function" ? perfilAtual() : sessionStorage.getItem("boletimDigitalPerfil"); }
    catch { return ""; }
  })();

  if (!["desenvolvedor", "administrador"].includes(String(perfil || ""))) {
    alert("Apenas Administrador e Desenvolvedor podem acessar a Estrutura Organizacional.");
    return;
  }

  moverPaginaEstruturaParaConteudoV168();

  try { modoPagina = "estrutura"; } catch {}

  document.querySelectorAll(".menu button, .menu-rodape button").forEach(b => b.classList.remove("ativo"));
  const btn = document.getElementById("btnEstruturaOrganizacional");
  btn?.classList.add("ativo");

  [
    "controlesNotas",
    "listaNotas",
    "paginacao",
    "paginaFatosHistoricos",
    "paginaEstatistica",
    "paginaAuditoria"
  ].forEach(id => document.getElementById(id)?.classList.add("escondido"));

  const pagina = document.getElementById("paginaEstruturaOrganizacional");
  if (pagina) {
    pagina.classList.remove("escondido");
    pagina.style.display = "";
    pagina.style.visibility = "";
    pagina.style.opacity = "";
  }

  const titulo = document.getElementById("tituloPagina");
  if (titulo) titulo.textContent = "Estrutura Organizacional";

  try { renderizarEstruturaOrganizacionalV164(); } catch {}
}

function configurarEstruturaOrganizacionalV168() {
  moverPaginaEstruturaParaConteudoV168();

  const btn = document.getElementById("btnEstruturaOrganizacional");
  if (!btn) return;

  const perfil = (() => {
    try { return typeof perfilAtual === "function" ? perfilAtual() : sessionStorage.getItem("boletimDigitalPerfil"); }
    catch { return ""; }
  })();

  const pode = ["desenvolvedor", "administrador"].includes(String(perfil || ""));
  btn.classList.toggle("escondido", !pode);

  // Remove classes visuais criadas antes que destoavam dos botões de Administração.
  btn.classList.remove("btn-extra-admin", "btn-menu-admin");
  btn.classList.add("requer-administracao", "estrutura-organizacional-menu-v168");

  if (btn.dataset.v168 === "1") return;
  btn.dataset.v168 = "1";

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    mostrarEstruturaOrganizacionalV168();
  }, true);
}

// Corrige funções antigas para chamar a versão ajustada.
window.mostrarEstruturaOrganizacionalV166 = mostrarEstruturaOrganizacionalV168;

document.addEventListener("DOMContentLoaded", () => {
  configurarEstruturaOrganizacionalV168();
  setTimeout(configurarEstruturaOrganizacionalV168, 300);
  setTimeout(configurarEstruturaOrganizacionalV168, 1000);
});
