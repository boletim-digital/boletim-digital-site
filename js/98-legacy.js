// 98-legacy.js
const normalizar = (txt) => String(txt || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");







































































































document.getElementById("btnAuditoria")?.addEventListener("click", () => {
  if (!podeVerAuditoria()) {
    negarAcesso("Você não tem permissão para acessar a auditoria.");
    return;
  }
  modoPagina = "auditoria";
  ocultarBotaoIncluirNotaTopo();

  document.querySelectorAll(".menu button, .menu-rodape button").forEach(b => b.classList.remove("ativo"));
  document.getElementById("btnAuditoria").classList.add("ativo");

  document.getElementById("controlesNotas").classList.add("escondido");
  document.getElementById("listaNotas").classList.add("escondido");
  document.getElementById("paginacao").classList.add("escondido");

  document.getElementById("paginaFatosHistoricos").classList.add("escondido");
  document.getElementById("paginaEstatistica").classList.add("escondido");
  document.getElementById("paginaAuditoria")?.classList.add("escondido");
  document.getElementById("paginaAuditoria").classList.remove("escondido");

  document.getElementById("tituloPagina").textContent = "Auditoria";

  renderizarAuditoria();
});
































/* v41 - Estatística: 3 botões principais e médias como informações */



function chaveMesEstatistica(dataBR) {
  const [dia, mes, ano] = String(dataBR).split("/");
  return `${ano}-${mes}`;
}

function labelMesEstatistica(chave) {
  const [ano, mes] = String(chave).split("-");
  const nomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${nomes[Number(mes) - 1] || mes} de ${ano}`;
}

function anoEstatistica(dataBR) {
  return String(dataBR).split("/")[2];
}

function calcularDiasDoAnoAteData(dataBR) {
  const data = parseDataBR(dataBR);
  const inicio = new Date(data.getFullYear(), 0, 1);
  const diff = data - inicio;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}
