// 01-util.js
function parseDataBR(dataBR) {
  const [dia, mes, ano] = String(dataBR).split("/").map(Number);
  return new Date(ano, mes - 1, dia);
}

function chaveData(dataBR) {
  const [dia, mes, ano] = String(dataBR).split("/");
  return `${ano}-${mes}-${dia}`;
}

function dataBRParaInput(dataBR) {
  const [dia, mes, ano] = String(dataBR).split("/");
  return `${ano}-${mes}-${dia}`;
}

function dataInputParaBR(dataInput) {
  const [ano, mes, dia] = String(dataInput).split("-");
  return `${dia}/${mes}/${ano}`;
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeXml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function destacar(texto) {
  const seguro = escapeHtml(texto);
  if (!termoBusca) return seguro;
  const termo = termoBusca.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try { return seguro.replace(new RegExp(`(${termo})`, "gi"), "<mark>$1</mark>"); }
  catch { return seguro; }
}

function renderizarTextoNota(texto) {
  if (String(texto).includes("<")) return texto;
  return destacar(texto).replaceAll("\n", "<br>");
}

function renderizarTextoParaImpressao(texto) {
  if (String(texto).includes("<")) return texto;
  return escapeHtml(texto).replaceAll("\n", "<br>");
}

function formatarNumeroEstatistica(valor) {
  if (!Number.isFinite(valor)) return "0";
  if (Math.abs(valor % 1) > 0) return valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return Number(valor).toLocaleString("pt-BR");
}

function calcularDiasDoAnoAteData(dataBR) {
  const data = parseDataBR(dataBR);
  const inicio = new Date(data.getFullYear(), 0, 1);
  const diff = data - inicio;
  return Math.floor(diff / (1000 * 60 * 60 * 24)) + 1;
}

function chaveMesEstatistica(dataBR) {
  const [dia, mes, ano] = String(dataBR).split("/");
  return `${ano}-${mes}`;
}

function labelMesEstatistica(chave) {
  const [ano, mes] = chave.split("-");
  const nomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${nomes[Number(mes) - 1]} de ${ano}`;
}

function anoEstatistica(dataBR) {
  return String(dataBR).split("/")[2];
}
