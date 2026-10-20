// 08-estatisticas.js
// Módulo da página Estatística de Socorros Prestados - v50

const CATEGORIAS_ESTATISTICA = [
  { id: "aph", nome: "Atendimento pré-hospitalar", iconeImg: "assets/icons/aph.png" },
  { id: "transito", nome: "Socorros e eventos de trânsito", iconeImg: "assets/icons/transito.png" },
  { id: "terrestres", nome: "Operações terrestres", iconeImg: "assets/icons/terrestres.png" },
  { id: "maritimas", nome: "Operações marítimas", iconeImg: "assets/icons/maritimas.png" },
  { id: "aereas", nome: "Operações aéreas", iconeImg: "assets/icons/aereas.png" },
  { id: "incendios", nome: "Combate a incêndios", iconeImg: "assets/icons/incendios.png" },
  { id: "gases", nome: "Escapamento de gases e explosão", iconeImg: "assets/icons/gases.png" },
  { id: "transtorno", nome: "Atendimento a portadores de transtorno comportamental", iconeImg: "assets/icons/transtorno.png" },
  { id: "interhospitalar", nome: "Transporte inter-hospitalar", iconeImg: "assets/icons/interhospitalar.png" },
  { id: "cadaver", nome: "Recolhimento de cadáver", iconeImg: "assets/icons/cadaver.png" },
  { id: "apoio", nome: "Apoio operacional eventos diversos", iconeImg: "assets/icons/apoio.png" },
  { id: "chuva", nome: "Eventos com chuva", iconeImg: "assets/icons/chuva.png" },
  { id: "trotes", nome: "Trotes", iconeImg: "assets/icons/trotes.png" }
];

const ESTATISTICAS_INICIAIS = [
  {
    id: "estatistica-2026-04-27",
    data: "27/04/2026",
    categorias: {
      aph: { dia: 189 },
      transito: { dia: 230 },
      terrestres: { dia: 182 },
      maritimas: { dia: 9 },
      aereas: { dia: 1 },
      incendios: { dia: 177 },
      gases: { dia: 11 },
      transtorno: { dia: 25 },
      interhospitalar: { dia: 4 },
      cadaver: { dia: 46 },
      apoio: { dia: 69 },
      chuva: { dia: 17 },
      trotes: { dia: 12 }
    }
  }
];

let estatisticas = [];
let visaoEstatistica = "diario";
let mesCalendarioEstatistica = null;
let mesCalendarioReferenciaEstatistica = null;

function carregarEstatisticas() {
  try {
    const salvas = JSON.parse(localStorage.getItem("boletimDigitalEstatisticasV50") || "[]");
    estatisticas = Array.isArray(salvas) && salvas.length ? salvas : ESTATISTICAS_INICIAIS;
  } catch {
    estatisticas = ESTATISTICAS_INICIAIS;
  }
}

function salvarEstatisticas() {
  localStorage.setItem("boletimDigitalEstatisticasV50", JSON.stringify(estatisticas));
  try {
    if (typeof salvarEstadoCompartilhadoSupabase === "function") {
      void salvarEstadoCompartilhadoSupabase("estatisticas", estatisticas);
    }
  } catch {}
}

function estatisticasOrdenadasDesc() {
  return [...estatisticas].sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));
}

function ultimaEstatistica() {
  return estatisticasOrdenadasDesc()[0] || null;
}

function chaveMesEstatistica(dataBR) {
  const [dia, mes, ano] = String(dataBR).split("/");
  return `${ano}-${mes}`;
}

function labelMesEstatistica(chave) {
  const [ano, mes] = String(chave).split("-");
  const nomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return `${nomes[Number(mes) - 1] || mes} de ${ano}`;
}

function nomeMesEstatistica(numeroMes) {
  const nomes = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return nomes[Number(numeroMes) - 1] || numeroMes;
}

function anoEstatistica(dataBR) {
  return String(dataBR).split("/")[2];
}

function mesEstatistica(dataBR) {
  return String(dataBR).split("/")[1];
}

function prepararPaginaEstatistica() {
  carregarEstatisticas();
  montarCamposEstatistica();
  configurarBotoesVisaoEstatistica();
  configurarFiltroPeriodoEstatistica();
  garantirModalEstatisticaFuncionando();

  const ultima = ultimaEstatistica();
  if (ultima) selecionarDataReferenciaEstatistica(ultima.data, false);

  ativarVisaoEstatistica(visaoEstatistica || "diario");
}

function configurarBotoesVisaoEstatistica() {
  const controles = document.getElementById("estatisticaControles") || document.querySelector(".estatistica-controles");
  if (!controles || controles.dataset.v50 === "1") return;

  controles.dataset.v50 = "1";

  controles.addEventListener("click", (event) => {
    const btn = event.target.closest(".btn-estatistica");
    if (!btn || !controles.contains(btn)) return;

    event.preventDefault();
    event.stopPropagation();

    ativarVisaoEstatistica(btn.dataset.visao);
  });
}

function ativarVisaoEstatistica(visao) {
  if (!["diario", "mes", "ano"].includes(visao)) visao = "diario";

  visaoEstatistica = visao;

  document.querySelectorAll(".btn-estatistica").forEach(btn => {
    btn.classList.toggle("ativo", btn.dataset.visao === visao);
  });

  if (visao === "diario") {
    const dataAtual = document.getElementById("estatisticaDataReferencia")?.value;
    const ultima = ultimaEstatistica();
    if (!dataAtual && ultima) selecionarDataReferenciaEstatistica(ultima.data, false);
  }

  if (visao === "mes") {
    atualizarSelectAnoMesReferenciaEstatistica();
    atualizarSelectMesMensalEstatistica();
  }

  if (visao === "ano") {
    atualizarSelectAnoReferenciaEstatistica();
  }

  atualizarFiltroPeriodoEstatistica();
  renderizarEstatistica();
}

function atualizarFiltroPeriodoEstatistica() {
  const filtroData = document.getElementById("filtroEstatisticaData");
  const filtroMes = document.getElementById("filtroEstatisticaMes");
  const filtroAno = document.getElementById("filtroEstatisticaAno");

  filtroData?.classList.add("escondido");
  filtroMes?.classList.add("escondido");
  filtroAno?.classList.add("escondido");

  if (visaoEstatistica === "diario") {
    filtroData?.classList.remove("escondido");
    configurarCalendarioReferenciaDiario();
    atualizarCalendarioReferenciaEstatistica();
  } else if (visaoEstatistica === "mes") {
    filtroMes?.classList.remove("escondido");
    atualizarSelectAnoMesReferenciaEstatistica();
    atualizarSelectMesMensalEstatistica();
  } else if (visaoEstatistica === "ano") {
    filtroAno?.classList.remove("escondido");
    atualizarSelectAnoReferenciaEstatistica();
  }
}

function configurarFiltroPeriodoEstatistica() {
  configurarCalendarioReferenciaDiario();

  const selAnoMensal = document.getElementById("estatisticaMesAnoReferencia");
  const selMesMensal = document.getElementById("estatisticaMesMesReferencia");
  const selAno = document.getElementById("estatisticaAnoReferencia");

  if (selAnoMensal && selAnoMensal.dataset.v50 !== "1") {
    selAnoMensal.dataset.v50 = "1";
    selAnoMensal.addEventListener("change", () => {
      atualizarSelectMesMensalEstatistica(true);
      renderizarEstatistica();
    });
  }

  if (selMesMensal && selMesMensal.dataset.v50 !== "1") {
    selMesMensal.dataset.v50 = "1";
    selMesMensal.addEventListener("change", renderizarEstatistica);
  }

  if (selAno && selAno.dataset.v50 !== "1") {
    selAno.dataset.v50 = "1";
    selAno.addEventListener("change", renderizarEstatistica);
  }
}

function configurarCalendarioReferenciaDiario() {
  const btnCal = document.getElementById("btnCalendarioReferenciaEstatistica");
  const painel = document.getElementById("painelCalendarioReferenciaEstatistica");
  const anterior = document.getElementById("mesAnteriorReferenciaEstatistica");
  const proximo = document.getElementById("mesProximoReferenciaEstatistica");

  if (btnCal && btnCal.dataset.v50 !== "1") {
    btnCal.dataset.v50 = "1";
    btnCal.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!painel) return;

      painel.classList.toggle("escondido");

      const dataAtual = document.getElementById("estatisticaDataReferencia")?.value;
      if (dataAtual) mesCalendarioReferenciaEstatistica = parseDataBR(dataAtual);
      else if (ultimaEstatistica()) mesCalendarioReferenciaEstatistica = parseDataBR(ultimaEstatistica().data);
      else mesCalendarioReferenciaEstatistica = new Date();

      atualizarCalendarioReferenciaEstatistica();
    });
  }

  if (anterior && anterior.dataset.v50 !== "1") {
    anterior.dataset.v50 = "1";
    anterior.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!mesCalendarioReferenciaEstatistica) mesCalendarioReferenciaEstatistica = new Date();
      mesCalendarioReferenciaEstatistica.setMonth(mesCalendarioReferenciaEstatistica.getMonth() - 1);
      atualizarCalendarioReferenciaEstatistica();
    });
  }

  if (proximo && proximo.dataset.v50 !== "1") {
    proximo.dataset.v50 = "1";
    proximo.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!mesCalendarioReferenciaEstatistica) mesCalendarioReferenciaEstatistica = new Date();
      mesCalendarioReferenciaEstatistica.setMonth(mesCalendarioReferenciaEstatistica.getMonth() + 1);
      atualizarCalendarioReferenciaEstatistica();
    });
  }
}

function atualizarCalendarioReferenciaEstatistica() {
  const grade = document.getElementById("gradeCalendarioReferenciaEstatistica");
  const titulo = document.getElementById("mesAnoCalendarioReferenciaEstatistica");
  if (!grade || !titulo) return;

  if (!mesCalendarioReferenciaEstatistica) {
    const dataAtual = document.getElementById("estatisticaDataReferencia")?.value;
    mesCalendarioReferenciaEstatistica = dataAtual
      ? parseDataBR(dataAtual)
      : (ultimaEstatistica() ? parseDataBR(ultimaEstatistica().data) : new Date());
  }

  const datasComDados = new Map(estatisticas.map(item => [chaveData(item.data), item]));
  const dataSelecionada = document.getElementById("estatisticaDataReferencia")?.value || "";

  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const ano = mesCalendarioReferenciaEstatistica.getFullYear();
  const mes = mesCalendarioReferenciaEstatistica.getMonth();

  titulo.textContent = `${nomesMeses[mes]} de ${ano}`;
  grade.innerHTML = "";

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  for (let i = 0; i < primeiroDia.getDay(); i++) {
    const vazio = document.createElement("button");
    vazio.className = "dia-calendario vazio";
    vazio.type = "button";
    vazio.tabIndex = -1;
    grade.appendChild(vazio);
  }

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const dataBR = `${String(dia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`;
    const item = datasComDados.get(chaveData(dataBR));

    const btn = document.createElement("button");
    btn.className = "dia-calendario";
    btn.type = "button";
    btn.textContent = dia;

    if (item) {
      btn.classList.add("com-estatistica");
      btn.title = `Dados inseridos em ${item.data}`;
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        selecionarDataReferenciaEstatistica(item.data, true);
      });
    } else {
      btn.disabled = true;
      btn.title = "Sem dados nesta data";
    }

    if (dataSelecionada === dataBR) btn.classList.add("selecionado-estatistica");

    grade.appendChild(btn);
  }
}

function selecionarDataReferenciaEstatistica(dataBR, deveRenderizar = true) {
  const input = document.getElementById("estatisticaDataReferencia");
  const botao = document.getElementById("btnCalendarioReferenciaEstatistica");
  const painel = document.getElementById("painelCalendarioReferenciaEstatistica");

  if (input) input.value = dataBR;
  if (botao) botao.textContent = dataBR;
  if (painel) painel.classList.add("escondido");

  mesCalendarioReferenciaEstatistica = parseDataBR(dataBR);

  atualizarSelectAnoMesReferenciaEstatistica();
  atualizarSelectMesMensalEstatistica();
  atualizarSelectAnoReferenciaEstatistica();
  atualizarCalendarioReferenciaEstatistica();

  if (deveRenderizar) renderizarEstatistica();
}

function anosComDadosEstatistica() {
  return [...new Set(estatisticas.map(e => anoEstatistica(e.data)))]
    .sort((a, b) => Number(b) - Number(a));
}

function mesesComDadosNoAno(ano) {
  return new Set(estatisticas.filter(e => anoEstatistica(e.data) === String(ano)).map(e => mesEstatistica(e.data)));
}

function atualizarSelectAnoMesReferenciaEstatistica() {
  const select = document.getElementById("estatisticaMesAnoReferencia");
  if (!select) return;

  const anos = anosComDadosEstatistica();
  const atualPorData = document.getElementById("estatisticaDataReferencia")?.value
    ? anoEstatistica(document.getElementById("estatisticaDataReferencia").value)
    : "";

  const atual = select.value || atualPorData || anos[0] || "";

  select.innerHTML = anos.map(a => `<option value="${a}">${a}</option>`).join("");

  if (atual && anos.includes(atual)) select.value = atual;
  else if (anos.length) select.value = anos[0];
}

function atualizarSelectMesMensalEstatistica(forcarPrimeiroComDados = false) {
  const select = document.getElementById("estatisticaMesMesReferencia");
  const anoSelect = document.getElementById("estatisticaMesAnoReferencia");
  if (!select || !anoSelect) return;

  const ano = anoSelect.value || anosComDadosEstatistica()[0] || "";
  const mesesComDados = mesesComDadosNoAno(ano);
  const meses = ["01","02","03","04","05","06","07","08","09","10","11","12"];

  const atualPorData = document.getElementById("estatisticaDataReferencia")?.value &&
    anoEstatistica(document.getElementById("estatisticaDataReferencia").value) === ano
      ? mesEstatistica(document.getElementById("estatisticaDataReferencia").value)
      : "";

  let atual = forcarPrimeiroComDados ? "" : (select.value || atualPorData);

  if (!atual || !mesesComDados.has(atual)) {
    atual = [...mesesComDados].sort((a, b) => Number(b) - Number(a))[0] || "";
  }

  select.innerHTML = meses.map(m => {
    const habilitado = mesesComDados.has(m);
    return `<option value="${m}" ${habilitado ? "" : "disabled"}>${nomeMesEstatistica(m)}</option>`;
  }).join("");

  if (atual) select.value = atual;
}

function atualizarSelectAnoReferenciaEstatistica() {
  const select = document.getElementById("estatisticaAnoReferencia");
  if (!select) return;

  const anos = anosComDadosEstatistica();
  const atualPorData = document.getElementById("estatisticaDataReferencia")?.value
    ? anoEstatistica(document.getElementById("estatisticaDataReferencia").value)
    : "";

  const atual = select.value || atualPorData || anos[0] || "";

  select.innerHTML = anos.map(a => `<option value="${a}">${a}</option>`).join("");

  if (atual && anos.includes(atual)) select.value = atual;
  else if (anos.length) select.value = anos[0];
}

function montarCamposEstatistica() {
  const container = document.getElementById("camposCategoriasEstatistica");
  if (!container) return;

  container.innerHTML = CATEGORIAS_ESTATISTICA.map(cat => {
    const classeTrotes = cat.id === "trotes" ? " campo-estatistica-trotes" : "";

    return `
      <div class="campo-estatistica${classeTrotes}">
        <label>
          <strong>${cat.nome}</strong>
          <input type="number" min="0" step="1" data-categoria="${cat.id}" data-tipo="dia" placeholder="0">
        </label>
      </div>
    `;
  }).join("");
}

function fecharModalEstatistica() {
  document.getElementById("modalEstatistica")?.classList.add("escondido");
}

function garantirModalEstatisticaFuncionando() {
  const btnIncluir = document.getElementById("btnIncluirEstatistica");
  const btnFechar = document.getElementById("btnFecharModalEstatistica");
  const btnCancelar = document.getElementById("btnCancelarEstatistica");
  const modal = document.getElementById("modalEstatistica");
  const form = document.getElementById("formEstatistica");

  if (btnIncluir && btnIncluir.dataset.okEstV50 !== "1") {
    btnIncluir.dataset.okEstV50 = "1";
    btnIncluir.addEventListener("click", abrirModalEstatistica);
  }

  if (btnFechar && btnFechar.dataset.okEstV50 !== "1") {
    btnFechar.dataset.okEstV50 = "1";
    btnFechar.addEventListener("click", fecharModalEstatistica);
  }

  if (btnCancelar && btnCancelar.dataset.okEstV50 !== "1") {
    btnCancelar.dataset.okEstV50 = "1";
    btnCancelar.addEventListener("click", fecharModalEstatistica);
  }

  if (modal && modal.dataset.okEstV50 !== "1") {
    modal.dataset.okEstV50 = "1";
    modal.addEventListener("click", (event) => {
      if (event.target === modal) fecharModalEstatistica();
    });
  }

  if (form && form.dataset.okEstV50 !== "1") {
    form.dataset.okEstV50 = "1";
    form.addEventListener("submit", incluirEstatistica);
  }
}

function abrirModalEstatistica() {
  if (!podeIncluirNota()) {
    negarAcesso("Você não tem permissão para incluir dados estatísticos.");
    return;
  }

  montarCamposEstatistica();
  garantirModalEstatisticaFuncionando();

  const ultima = ultimaEstatistica();
  if (ultima) {
    selecionarDataEstatistica(ultima.data);
    mesCalendarioEstatistica = parseDataBR(ultima.data);
  } else {
    const hoje = new Date();
    const dataBRHoje = `${String(hoje.getDate()).padStart(2, "0")}/${String(hoje.getMonth() + 1).padStart(2, "0")}/${hoje.getFullYear()}`;
    selecionarDataEstatistica(dataBRHoje);
    mesCalendarioEstatistica = hoje;
  }

  prepararCalendarioEstatistica();
  document.getElementById("modalEstatistica")?.classList.remove("escondido");
}

function prepararCalendarioEstatistica() {
  const btn = document.getElementById("btnCalendarioEstatistica");
  const painel = document.getElementById("painelCalendarioEstatistica");
  const anterior = document.getElementById("mesAnteriorEstatistica");
  const proximo = document.getElementById("mesProximoEstatistica");

  if (!mesCalendarioEstatistica) {
    const dataAtual = document.getElementById("estatisticaData")?.value;
    mesCalendarioEstatistica = dataAtual ? parseDataBR(dataAtual) : (ultimaEstatistica() ? parseDataBR(ultimaEstatistica().data) : new Date());
  }

  if (btn && btn.dataset.v50 !== "1") {
    btn.dataset.v50 = "1";
    btn.addEventListener("click", () => {
      painel.classList.toggle("escondido");
      renderizarCalendarioEstatistica();
    });
  }

  if (anterior && anterior.dataset.v50 !== "1") {
    anterior.dataset.v50 = "1";
    anterior.addEventListener("click", () => {
      mesCalendarioEstatistica.setMonth(mesCalendarioEstatistica.getMonth() - 1);
      renderizarCalendarioEstatistica();
    });
  }

  if (proximo && proximo.dataset.v50 !== "1") {
    proximo.dataset.v50 = "1";
    proximo.addEventListener("click", () => {
      mesCalendarioEstatistica.setMonth(mesCalendarioEstatistica.getMonth() + 1);
      renderizarCalendarioEstatistica();
    });
  }

  renderizarCalendarioEstatistica();
}

function renderizarCalendarioEstatistica() {
  const grade = document.getElementById("gradeCalendarioEstatistica");
  const titulo = document.getElementById("mesAnoCalendarioEstatistica");
  if (!grade || !titulo || !mesCalendarioEstatistica) return;

  const datasComDados = new Map(estatisticas.map(e => [chaveData(e.data), e]));
  const dataSelecionada = document.getElementById("estatisticaData")?.value || "";

  const nomesMeses = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const ano = mesCalendarioEstatistica.getFullYear();
  const mes = mesCalendarioEstatistica.getMonth();

  titulo.textContent = `${nomesMeses[mes]} de ${ano}`;
  grade.innerHTML = "";

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  for (let i = 0; i < primeiroDia.getDay(); i++) {
    const vazio = document.createElement("button");
    vazio.className = "dia-calendario vazio";
    vazio.type = "button";
    grade.appendChild(vazio);
  }

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const dataBR = `${String(dia).padStart(2, "0")}/${String(mes + 1).padStart(2, "0")}/${ano}`;
    const existente = datasComDados.get(chaveData(dataBR));

    const btn = document.createElement("button");
    btn.className = "dia-calendario";
    btn.type = "button";
    btn.textContent = dia;

    if (existente) {
      btn.classList.add("com-estatistica");
      btn.title = `Dados já inseridos em ${dataBR}`;
    } else {
      btn.title = `Selecionar ${dataBR}`;
    }

    if (dataSelecionada === dataBR) btn.classList.add("selecionado-estatistica");

    btn.addEventListener("click", () => {
      selecionarDataEstatistica(dataBR);
      document.getElementById("painelCalendarioEstatistica")?.classList.add("escondido");
    });

    grade.appendChild(btn);
  }
}

function selecionarDataEstatistica(dataBR) {
  const input = document.getElementById("estatisticaData");
  const botao = document.getElementById("btnCalendarioEstatistica");
  const aviso = document.getElementById("avisoEstatisticaExistente");

  if (input) input.value = dataBR;
  if (botao) botao.textContent = dataBR;

  mesCalendarioEstatistica = parseDataBR(dataBR);

  limparCamposEstatistica();

  const existente = estatisticas.find(e => e.data === dataBR);
  if (existente) {
    preencherFormularioEstatistica(existente);
    aviso?.classList.remove("escondido");
  } else {
    aviso?.classList.add("escondido");
  }

  renderizarCalendarioEstatistica();
}

function limparCamposEstatistica() {
  document.querySelectorAll('#camposCategoriasEstatistica input[data-categoria]').forEach(input => {
    input.value = "";
  });
}

function preencherFormularioEstatistica(item) {
  CATEGORIAS_ESTATISTICA.forEach(cat => {
    const input = document.querySelector(`[data-categoria="${cat.id}"][data-tipo="dia"]`);
    if (input) input.value = Number(item.categorias?.[cat.id]?.dia || 0);
  });
}

function calcularTotalDia(e) {
  if (!e) return 0;
  return CATEGORIAS_ESTATISTICA.reduce((total, cat) => total + Number(e.categorias?.[cat.id]?.dia || 0), 0);
}

function somaCategoria(lista, categoriaId) {
  return lista.reduce((total, e) => total + Number(e.categorias?.[categoriaId]?.dia || 0), 0);
}

function somaTotal(lista) {
  return lista.reduce((total, e) => total + calcularTotalDia(e), 0);
}

function somaTrotes(lista) {
  return lista.reduce((total, e) => total + Number(e.categorias?.trotes?.dia || 0), 0);
}

function estatisticaSelecionada() {
  if (!estatisticas.length) return null;

  if (visaoEstatistica === "diario") {
    const data = document.getElementById("estatisticaDataReferencia")?.value || ultimaEstatistica()?.data;
    return estatisticas.find(e => e.data === data) || ultimaEstatistica();
  }

  if (visaoEstatistica === "mes") {
    const ano = document.getElementById("estatisticaMesAnoReferencia")?.value;
    const mes = document.getElementById("estatisticaMesMesReferencia")?.value;
    return estatisticas
      .filter(e => anoEstatistica(e.data) === ano && mesEstatistica(e.data) === mes)
      .sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data))[0] || ultimaEstatistica();
  }

  if (visaoEstatistica === "ano") {
    const ano = document.getElementById("estatisticaAnoReferencia")?.value;
    return estatisticas
      .filter(e => anoEstatistica(e.data) === ano)
      .sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data))[0] || ultimaEstatistica();
  }

  return ultimaEstatistica();
}

function obterBasePeriodo(ref) {
  if (!ref) return [];

  if (visaoEstatistica === "diario") return [ref];

  if (visaoEstatistica === "mes") {
    const ano = document.getElementById("estatisticaMesAnoReferencia")?.value;
    const mes = document.getElementById("estatisticaMesMesReferencia")?.value;
    return estatisticas.filter(e => anoEstatistica(e.data) === ano && mesEstatistica(e.data) === mes);
  }

  if (visaoEstatistica === "ano") {
    const ano = document.getElementById("estatisticaAnoReferencia")?.value || anoEstatistica(ref.data);
    return estatisticas.filter(e => anoEstatistica(e.data) === ano);
  }

  return [ref];
}

function obterBaseAno(ref) {
  if (!ref) return [];
  const ano = visaoEstatistica === "ano"
    ? (document.getElementById("estatisticaAnoReferencia")?.value || anoEstatistica(ref.data))
    : anoEstatistica(ref.data);

  return estatisticas.filter(e => anoEstatistica(e.data) === ano);
}

function valorCategoriaParaVisao(ref, cat) {
  return somaCategoria(obterBasePeriodo(ref), cat.id);
}

function obterTituloVisao() {
  const titulos = {
    diario: "Total diário",
    mes: "Total mensal",
    ano: "Total anual"
  };
  return titulos[visaoEstatistica] || "Total diário";
}

function renderizarEstatistica() {
  atualizarFiltroPeriodoEstatistica();

  const ref = estatisticaSelecionada();
  const grid = document.getElementById("estatisticaGrid");
  const resumo = document.getElementById("estatisticaResumo");
  const subtitulo = document.getElementById("estatisticaSubtitulo");

  if (!grid || !resumo || !subtitulo) return;

  if (!ref) {
    grid.innerHTML = '<div class="vazio">Nenhum dado estatístico cadastrado.</div>';
    resumo.innerHTML = "";
    subtitulo.textContent = "Nenhum dado estatístico cadastrado.";
    return;
  }

  const basePeriodo = obterBasePeriodo(ref);
  const baseAno = obterBaseAno(ref);

  let referencia = ref.data;
  if (visaoEstatistica === "mes") {
    const ano = document.getElementById("estatisticaMesAnoReferencia")?.value;
    const mes = document.getElementById("estatisticaMesMesReferencia")?.value;
    referencia = `${nomeMesEstatistica(mes)} de ${ano}`;
  } else if (visaoEstatistica === "ano") {
    referencia = document.getElementById("estatisticaAnoReferencia")?.value || anoEstatistica(ref.data);
  }

  subtitulo.textContent = `${obterTituloVisao()} • Referência: ${referencia}`;

  const totalPeriodo = somaTotal(basePeriodo);
  const trotesPeriodo = somaTrotes(basePeriodo);
  const totalAno = somaTotal(baseAno);
  const trotesAno = somaTrotes(baseAno);

  const totalDiaRef = calcularTotalDia(ref);
  const trotesDiaRef = Number(ref.categorias?.trotes?.dia || 0);

  const diasPeriodo = Math.max(basePeriodo.length, 1);
  const mesesAno = Math.max(new Set(baseAno.map(e => chaveMesEstatistica(e.data))).size, 1);
  const diasAnoAteRef = calcularDiasDoAnoAteData(ref.data);

  const mediaHoraDia = (totalDiaRef - trotesDiaRef) / 24;
  const mediaHoraAcumulado = (totalAno - trotesAno) / (diasAnoAteRef * 24);
  const mediaDiaria = (totalPeriodo - trotesPeriodo) / diasPeriodo;
  const mediaMensal = (totalAno - trotesAno) / mesesAno;

  resumo.innerHTML = `
    <div class="resumo-card"><span>Total eventos dia/ano</span><strong>${formatarNumeroEstatistica(totalDiaRef)} / ${formatarNumeroEstatistica(totalAno)}</strong></div>
    <div class="resumo-card"><span>Média por hora/dia</span><strong>${formatarNumeroEstatistica(mediaHoraDia)}</strong></div>
    <div class="resumo-card"><span>Média por hora/acumulado</span><strong>${formatarNumeroEstatistica(mediaHoraAcumulado)}</strong></div>
    <div class="resumo-card"><span>Média diária</span><strong>${formatarNumeroEstatistica(mediaDiaria)}</strong></div>
    <div class="resumo-card"><span>Média mensal</span><strong>${formatarNumeroEstatistica(mediaMensal)}</strong></div>
  `;

  grid.innerHTML = CATEGORIAS_ESTATISTICA.map(cat => {
    const valor = valorCategoriaParaVisao(ref, cat);
    return `
      <article class="estatistica-card">
        <div class="estatistica-card-cabecalho">${cat.nome}</div>
        <div class="estatistica-card-valor">${formatarNumeroEstatistica(valor)}</div>
        <div class="estatistica-card-icone">${renderizarIconeEstatistica(cat)}</div>
      </article>
    `;
  }).join("");
}

function incluirEstatistica(event) {
  event.preventDefault();

  if (!podeIncluirNota()) {
    negarAcesso("Você não tem permissão para incluir dados estatísticos.");
    return;
  }

  const dataBR = document.getElementById("estatisticaData")?.value;
  if (!dataBR) {
    alert("Selecione a data da estatística.");
    return;
  }

  const categorias = {};
  CATEGORIAS_ESTATISTICA.forEach(cat => {
    const input = document.querySelector(`#camposCategoriasEstatistica input[data-categoria="${cat.id}"][data-tipo="dia"]`);
    const valor = Number(input?.value || 0);
    categorias[cat.id] = { dia: valor };
  });

  const novo = {
    id: `estatistica-${dataBR.split("/").reverse().join("-")}-${Date.now()}`,
    data: dataBR,
    categorias
  };

  estatisticas = estatisticas.filter(e => e.data !== dataBR);
  estatisticas.push(novo);
  estatisticas.sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));

  salvarEstatisticas();

  selecionarDataReferenciaEstatistica(dataBR, false);
  atualizarFiltroPeriodoEstatistica();
  renderizarEstatistica();

  registrarAuditoria("INCLUIU_ESTATISTICA", {
    data: dataBR,
    totalDia: calcularTotalDia(novo)
  });

  document.getElementById("formEstatistica")?.reset();
  fecharModalEstatistica();
}


/* v51 - ligação definitiva dos botões de visão estatística */
function ligarBotoesEstatisticaDefinitivo() {
  const controles = document.getElementById("estatisticaControles") || document.querySelector(".estatistica-controles");
  if (!controles) return;

  controles.onclick = function(event) {
    const btn = event.target.closest(".btn-estatistica");
    if (!btn || !controles.contains(btn)) return;

    event.preventDefault();
    event.stopPropagation();

    const visao = btn.dataset.visao || "diario";
    ativarVisaoEstatistica(visao);
  };
}

function configurarBotoesVisaoEstatistica() {
  ligarBotoesEstatisticaDefinitivo();

  document.querySelectorAll(".btn-estatistica").forEach(btn => {
    btn.classList.toggle("ativo", btn.dataset.visao === visaoEstatistica);
  });
}

function ativarVisaoEstatistica(visao) {
  if (!["diario", "mes", "ano"].includes(visao)) {
    visao = "diario";
  }

  visaoEstatistica = visao;

  document.querySelectorAll(".btn-estatistica").forEach(btn => {
    btn.classList.toggle("ativo", btn.dataset.visao === visao);
  });

  if (visao === "diario") {
    const dataAtual = document.getElementById("estatisticaDataReferencia")?.value;
    const ultima = ultimaEstatistica();

    if (!dataAtual && ultima) {
      selecionarDataReferenciaEstatistica(ultima.data, false);
    }
  }

  if (visao === "mes") {
    atualizarSelectAnoMesReferenciaEstatistica();
    atualizarSelectMesMensalEstatistica();
  }

  if (visao === "ano") {
    atualizarSelectAnoReferenciaEstatistica();
  }

  atualizarFiltroPeriodoEstatistica();
  renderizarEstatistica();
}

function prepararPaginaEstatistica() {
  carregarEstatisticas();
  montarCamposEstatistica();
  configurarBotoesVisaoEstatistica();
  configurarFiltroPeriodoEstatistica();
  garantirModalEstatisticaFuncionando();

  const ultima = ultimaEstatistica();
  if (ultima && !document.getElementById("estatisticaDataReferencia")?.value) {
    selecionarDataReferenciaEstatistica(ultima.data, false);
  }

  ativarVisaoEstatistica(visaoEstatistica || "diario");
}

document.addEventListener("DOMContentLoaded", () => {
  ligarBotoesEstatisticaDefinitivo();
});


/* v52 - Total mensal atualiza pelos selects de Ano/Mês */
function configurarFiltroPeriodoEstatistica() {
  configurarCalendarioReferenciaDiario();

  const selAnoMensal = document.getElementById("estatisticaMesAnoReferencia");
  const selMesMensal = document.getElementById("estatisticaMesMesReferencia");
  const selAno = document.getElementById("estatisticaAnoReferencia");

  if (selAnoMensal) {
    selAnoMensal.onchange = function() {
      atualizarSelectMesMensalEstatistica(true);
      visaoEstatistica = "mes";
      renderizarEstatistica();
    };
  }

  if (selMesMensal) {
    selMesMensal.onchange = function() {
      visaoEstatistica = "mes";
      renderizarEstatistica();
    };
  }

  if (selAno) {
    selAno.onchange = function() {
      visaoEstatistica = "ano";
      renderizarEstatistica();
    };
  }
}

function obterBasePeriodo(ref) {
  if (!ref) return [];

  if (visaoEstatistica === "diario") {
    return [ref];
  }

  if (visaoEstatistica === "mes") {
    const anoSelecionado = document.getElementById("estatisticaMesAnoReferencia")?.value;
    const mesSelecionado = document.getElementById("estatisticaMesMesReferencia")?.value;

    return estatisticas.filter(e =>
      anoEstatistica(e.data) === anoSelecionado &&
      mesEstatistica(e.data) === mesSelecionado
    );
  }

  if (visaoEstatistica === "ano") {
    const anoSelecionado = document.getElementById("estatisticaAnoReferencia")?.value || anoEstatistica(ref.data);
    return estatisticas.filter(e => anoEstatistica(e.data) === anoSelecionado);
  }

  return [ref];
}

function estatisticaSelecionada() {
  if (!estatisticas.length) return null;

  if (visaoEstatistica === "diario") {
    const data = document.getElementById("estatisticaDataReferencia")?.value || ultimaEstatistica()?.data;
    return estatisticas.find(e => e.data === data) || ultimaEstatistica();
  }

  if (visaoEstatistica === "mes") {
    const anoSelecionado = document.getElementById("estatisticaMesAnoReferencia")?.value;
    const mesSelecionado = document.getElementById("estatisticaMesMesReferencia")?.value;

    const lista = estatisticas
      .filter(e =>
        anoEstatistica(e.data) === anoSelecionado &&
        mesEstatistica(e.data) === mesSelecionado
      )
      .sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));

    return lista[0] || ultimaEstatistica();
  }

  if (visaoEstatistica === "ano") {
    const anoSelecionado = document.getElementById("estatisticaAnoReferencia")?.value;

    const lista = estatisticas
      .filter(e => anoEstatistica(e.data) === anoSelecionado)
      .sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));

    return lista[0] || ultimaEstatistica();
  }

  return ultimaEstatistica();
}

function valorCategoriaParaVisao(ref, cat) {
  const base = obterBasePeriodo(ref);
  return somaCategoria(base, cat.id);
}

function renderizarEstatistica() {
  atualizarFiltroPeriodoEstatistica();

  const ref = estatisticaSelecionada();
  const grid = document.getElementById("estatisticaGrid");
  const resumo = document.getElementById("estatisticaResumo");
  const subtitulo = document.getElementById("estatisticaSubtitulo");

  if (!grid || !resumo || !subtitulo) return;

  if (!ref) {
    grid.innerHTML = '<div class="vazio">Nenhum dado estatístico cadastrado.</div>';
    resumo.innerHTML = "";
    subtitulo.textContent = "Nenhum dado estatístico cadastrado.";
    return;
  }

  const basePeriodo = obterBasePeriodo(ref);
  const baseAno = obterBaseAno(ref);

  let referencia = ref.data;

  if (visaoEstatistica === "mes") {
    const anoSelecionado = document.getElementById("estatisticaMesAnoReferencia")?.value;
    const mesSelecionado = document.getElementById("estatisticaMesMesReferencia")?.value;
    referencia = `${nomeMesEstatistica(mesSelecionado)} de ${anoSelecionado}`;
  }

  if (visaoEstatistica === "ano") {
    referencia = document.getElementById("estatisticaAnoReferencia")?.value || anoEstatistica(ref.data);
  }

  subtitulo.textContent = `${obterTituloVisao()} • Referência: ${referencia}`;

  const totalPeriodo = somaTotal(basePeriodo);
  const trotesPeriodo = somaTrotes(basePeriodo);
  const totalAno = somaTotal(baseAno);
  const trotesAno = somaTrotes(baseAno);

  const totalDiaRef = calcularTotalDia(ref);
  const trotesDiaRef = Number(ref.categorias?.trotes?.dia || 0);

  const diasPeriodo = Math.max(basePeriodo.length, 1);
  const mesesAno = Math.max(new Set(baseAno.map(e => chaveMesEstatistica(e.data))).size, 1);
  const diasAnoAteRef = calcularDiasDoAnoAteData(ref.data);

  const mediaHoraDia = (totalDiaRef - trotesDiaRef) / 24;
  const mediaHoraAcumulado = (totalAno - trotesAno) / (diasAnoAteRef * 24);
  const mediaDiaria = (totalPeriodo - trotesPeriodo) / diasPeriodo;
  const mediaMensal = (totalAno - trotesAno) / mesesAno;

  resumo.innerHTML = `
    <div class="resumo-card"><span>Total eventos dia/ano</span><strong>${formatarNumeroEstatistica(totalDiaRef)} / ${formatarNumeroEstatistica(totalAno)}</strong></div>
    <div class="resumo-card"><span>Média por hora/dia</span><strong>${formatarNumeroEstatistica(mediaHoraDia)}</strong></div>
    <div class="resumo-card"><span>Média por hora/acumulado</span><strong>${formatarNumeroEstatistica(mediaHoraAcumulado)}</strong></div>
    <div class="resumo-card"><span>Média diária</span><strong>${formatarNumeroEstatistica(mediaDiaria)}</strong></div>
    <div class="resumo-card"><span>Média mensal</span><strong>${formatarNumeroEstatistica(mediaMensal)}</strong></div>
  `;

  grid.innerHTML = CATEGORIAS_ESTATISTICA.map(cat => {
    const valor = valorCategoriaParaVisao(ref, cat);

    return `
      <article class="estatistica-card">
        <div class="estatistica-card-cabecalho">${cat.nome}</div>
        <div class="estatistica-card-valor">${formatarNumeroEstatistica(valor)}</div>
        <div class="estatistica-card-icone">${renderizarIconeEstatistica(cat)}</div>
      </article>
    `;
  }).join("");
}


/* v53 - Total mensal usa exatamente o mês/ano selecionados */
function mesAnoMensalSelecionado() {
  const ano = document.getElementById("estatisticaMesAnoReferencia")?.value || "";
  const mes = document.getElementById("estatisticaMesMesReferencia")?.value || "";

  return { ano, mes };
}

function baseMensalSelecionada() {
  const { ano, mes } = mesAnoMensalSelecionado();

  return estatisticas.filter(e =>
    anoEstatistica(e.data) === ano &&
    mesEstatistica(e.data) === mes
  );
}

function configurarFiltroPeriodoEstatistica() {
  configurarCalendarioReferenciaDiario();

  const selAnoMensal = document.getElementById("estatisticaMesAnoReferencia");
  const selMesMensal = document.getElementById("estatisticaMesMesReferencia");
  const selAno = document.getElementById("estatisticaAnoReferencia");

  if (selAnoMensal) {
    selAnoMensal.onchange = function() {
      atualizarSelectMesMensalEstatistica(true);
      visaoEstatistica = "mes";
      renderizarEstatisticaSemResetarFiltro();
    };
  }

  if (selMesMensal) {
    selMesMensal.onchange = function() {
      visaoEstatistica = "mes";
      renderizarEstatisticaSemResetarFiltro();
    };
  }

  if (selAno) {
    selAno.onchange = function() {
      visaoEstatistica = "ano";
      renderizarEstatisticaSemResetarFiltro();
    };
  }
}

function atualizarFiltroPeriodoEstatistica() {
  const filtroData = document.getElementById("filtroEstatisticaData");
  const filtroMes = document.getElementById("filtroEstatisticaMes");
  const filtroAno = document.getElementById("filtroEstatisticaAno");

  filtroData?.classList.add("escondido");
  filtroMes?.classList.add("escondido");
  filtroAno?.classList.add("escondido");

  if (visaoEstatistica === "diario") {
    filtroData?.classList.remove("escondido");
    configurarCalendarioReferenciaDiario();
    atualizarCalendarioReferenciaEstatistica();
  }

  if (visaoEstatistica === "mes") {
    filtroMes?.classList.remove("escondido");

    // Só monta os selects se estiverem vazios.
    // Isso evita resetar o mês que o usuário acabou de escolher.
    const selAno = document.getElementById("estatisticaMesAnoReferencia");
    const selMes = document.getElementById("estatisticaMesMesReferencia");

    if (!selAno?.value) atualizarSelectAnoMesReferenciaEstatistica();
    if (!selMes?.value) atualizarSelectMesMensalEstatistica();
  }

  if (visaoEstatistica === "ano") {
    filtroAno?.classList.remove("escondido");
    if (!document.getElementById("estatisticaAnoReferencia")?.value) {
      atualizarSelectAnoReferenciaEstatistica();
    }
  }
}

function estatisticaSelecionada() {
  if (!estatisticas.length) return null;

  if (visaoEstatistica === "diario") {
    const data = document.getElementById("estatisticaDataReferencia")?.value || ultimaEstatistica()?.data;
    return estatisticas.find(e => e.data === data) || ultimaEstatistica();
  }

  if (visaoEstatistica === "mes") {
    const base = baseMensalSelecionada()
      .sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));

    return base[0] || null;
  }

  if (visaoEstatistica === "ano") {
    const anoSelecionado = document.getElementById("estatisticaAnoReferencia")?.value;

    const lista = estatisticas
      .filter(e => anoEstatistica(e.data) === anoSelecionado)
      .sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));

    return lista[0] || null;
  }

  return ultimaEstatistica();
}

function obterBasePeriodo(ref) {
  if (!ref) return [];

  if (visaoEstatistica === "diario") {
    return [ref];
  }

  if (visaoEstatistica === "mes") {
    return baseMensalSelecionada();
  }

  if (visaoEstatistica === "ano") {
    const anoSelecionado = document.getElementById("estatisticaAnoReferencia")?.value || anoEstatistica(ref.data);
    return estatisticas.filter(e => anoEstatistica(e.data) === anoSelecionado);
  }

  return [ref];
}

function valorCategoriaParaVisao(ref, cat) {
  return somaCategoria(obterBasePeriodo(ref), cat.id);
}

function renderizarEstatisticaSemResetarFiltro() {
  const ref = estatisticaSelecionada();
  const grid = document.getElementById("estatisticaGrid");
  const resumo = document.getElementById("estatisticaResumo");
  const subtitulo = document.getElementById("estatisticaSubtitulo");

  if (!grid || !resumo || !subtitulo) return;

  if (!ref) {
    grid.innerHTML = '<div class="vazio">Nenhum dado estatístico cadastrado para esta referência.</div>';
    resumo.innerHTML = "";
    subtitulo.textContent = "Nenhum dado estatístico cadastrado para esta referência.";
    return;
  }

  const basePeriodo = obterBasePeriodo(ref);
  const baseAno = obterBaseAno(ref);

  let referencia = ref.data;

  if (visaoEstatistica === "mes") {
    const { ano, mes } = mesAnoMensalSelecionado();
    referencia = `${nomeMesEstatistica(mes)} de ${ano}`;
  }

  if (visaoEstatistica === "ano") {
    referencia = document.getElementById("estatisticaAnoReferencia")?.value || anoEstatistica(ref.data);
  }

  subtitulo.textContent = `${obterTituloVisao()} • Referência: ${referencia}`;

  const totalPeriodo = somaTotal(basePeriodo);
  const trotesPeriodo = somaTrotes(basePeriodo);
  const totalAno = somaTotal(baseAno);
  const trotesAno = somaTrotes(baseAno);

  const totalDiaRef = calcularTotalDia(ref);
  const trotesDiaRef = Number(ref.categorias?.trotes?.dia || 0);

  const diasPeriodo = Math.max(basePeriodo.length, 1);
  const mesesAno = Math.max(new Set(baseAno.map(e => chaveMesEstatistica(e.data))).size, 1);
  const diasAnoAteRef = calcularDiasDoAnoAteData(ref.data);

  const mediaHoraDia = (totalDiaRef - trotesDiaRef) / 24;
  const mediaHoraAcumulado = (totalAno - trotesAno) / (diasAnoAteRef * 24);
  const mediaDiaria = (totalPeriodo - trotesPeriodo) / diasPeriodo;
  const mediaMensal = (totalAno - trotesAno) / mesesAno;

  resumo.innerHTML = `
    <div class="resumo-card"><span>Total eventos dia/ano</span><strong>${formatarNumeroEstatistica(totalDiaRef)} / ${formatarNumeroEstatistica(totalAno)}</strong></div>
    <div class="resumo-card"><span>Média por hora/dia</span><strong>${formatarNumeroEstatistica(mediaHoraDia)}</strong></div>
    <div class="resumo-card"><span>Média por hora/acumulado</span><strong>${formatarNumeroEstatistica(mediaHoraAcumulado)}</strong></div>
    <div class="resumo-card"><span>Média diária</span><strong>${formatarNumeroEstatistica(mediaDiaria)}</strong></div>
    <div class="resumo-card"><span>Média mensal</span><strong>${formatarNumeroEstatistica(mediaMensal)}</strong></div>
  `;

  grid.innerHTML = CATEGORIAS_ESTATISTICA.map(cat => {
    const valor = somaCategoria(basePeriodo, cat.id);

    return `
      <article class="estatistica-card">
        <div class="estatistica-card-cabecalho">${cat.nome}</div>
        <div class="estatistica-card-valor">${formatarNumeroEstatistica(valor)}</div>
        <div class="estatistica-card-icone">${renderizarIconeEstatistica(cat)}</div>
      </article>
    `;
  }).join("");
}

function renderizarEstatistica() {
  atualizarFiltroPeriodoEstatistica();
  renderizarEstatisticaSemResetarFiltro();
}


/* v55 - corrige Total mensal e remove tooltips */
function obterAnoMesMensalSelecionado() {
  const ano = document.getElementById("estatisticaMesAnoReferencia")?.value || "";
  const mes = document.getElementById("estatisticaMesMesReferencia")?.value || "";
  return { ano, mes };
}

function obterBaseMensalSelecionada() {
  const { ano, mes } = obterAnoMesMensalSelecionado();

  return estatisticas.filter(item =>
    anoEstatistica(item.data) === ano &&
    mesEstatistica(item.data) === mes
  );
}

function obterBasePeriodo(ref) {
  if (!ref) return [];

  if (visaoEstatistica === "diario") {
    return [ref];
  }

  if (visaoEstatistica === "mes") {
    return obterBaseMensalSelecionada();
  }

  if (visaoEstatistica === "ano") {
    const anoSelecionado = document.getElementById("estatisticaAnoReferencia")?.value || anoEstatistica(ref.data);
    return estatisticas.filter(item => anoEstatistica(item.data) === anoSelecionado);
  }

  return [ref];
}

function estatisticaSelecionada() {
  if (!estatisticas.length) return null;

  if (visaoEstatistica === "diario") {
    const data = document.getElementById("estatisticaDataReferencia")?.value || ultimaEstatistica()?.data;
    return estatisticas.find(item => item.data === data) || ultimaEstatistica();
  }

  if (visaoEstatistica === "mes") {
    const base = obterBaseMensalSelecionada()
      .sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));

    return base[0] || null;
  }

  if (visaoEstatistica === "ano") {
    const anoSelecionado = document.getElementById("estatisticaAnoReferencia")?.value;

    const base = estatisticas
      .filter(item => anoEstatistica(item.data) === anoSelecionado)
      .sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));

    return base[0] || null;
  }

  return ultimaEstatistica();
}

function renderizarEstatisticaSemResetarFiltro() {
  const ref = estatisticaSelecionada();
  const grid = document.getElementById("estatisticaGrid");
  const resumo = document.getElementById("estatisticaResumo");
  const subtitulo = document.getElementById("estatisticaSubtitulo");

  if (!grid || !resumo || !subtitulo) return;

  if (!ref) {
    grid.innerHTML = '<div class="vazio">Nenhum dado estatístico cadastrado para esta referência.</div>';
    resumo.innerHTML = "";
    subtitulo.textContent = "Nenhum dado estatístico cadastrado para esta referência.";
    return;
  }

  const basePeriodo = obterBasePeriodo(ref);
  const baseAno = obterBaseAno(ref);

  let referencia = ref.data;

  if (visaoEstatistica === "mes") {
    const { ano, mes } = obterAnoMesMensalSelecionado();
    referencia = `${nomeMesEstatistica(mes)} de ${ano}`;
  }

  if (visaoEstatistica === "ano") {
    referencia = document.getElementById("estatisticaAnoReferencia")?.value || anoEstatistica(ref.data);
  }

  subtitulo.textContent = `${obterTituloVisao()} • Referência: ${referencia}`;

  const totalPeriodo = somaTotal(basePeriodo);
  const trotesPeriodo = somaTrotes(basePeriodo);
  const totalAno = somaTotal(baseAno);
  const trotesAno = somaTrotes(baseAno);

  const totalDiaRef = calcularTotalDia(ref);
  const trotesDiaRef = Number(ref.categorias?.trotes?.dia || 0);

  const diasPeriodo = Math.max(basePeriodo.length, 1);
  const mesesAno = Math.max(new Set(baseAno.map(item => chaveMesEstatistica(item.data))).size, 1);
  const diasAnoAteRef = calcularDiasDoAnoAteData(ref.data);

  const mediaHoraDia = (totalDiaRef - trotesDiaRef) / 24;
  const mediaHoraAcumulado = (totalAno - trotesAno) / (diasAnoAteRef * 24);
  const mediaDiaria = (totalPeriodo - trotesPeriodo) / diasPeriodo;
  const mediaMensal = (totalAno - trotesAno) / mesesAno;

  resumo.innerHTML = `
    <div class="resumo-card"><span>Total eventos dia/ano</span><strong>${formatarNumeroEstatistica(totalDiaRef)} / ${formatarNumeroEstatistica(totalAno)}</strong></div>
    <div class="resumo-card"><span>Média por hora/dia</span><strong>${formatarNumeroEstatistica(mediaHoraDia)}</strong></div>
    <div class="resumo-card"><span>Média por hora/acumulado</span><strong>${formatarNumeroEstatistica(mediaHoraAcumulado)}</strong></div>
    <div class="resumo-card"><span>Média diária</span><strong>${formatarNumeroEstatistica(mediaDiaria)}</strong></div>
    <div class="resumo-card"><span>Média mensal</span><strong>${formatarNumeroEstatistica(mediaMensal)}</strong></div>
  `;

  grid.innerHTML = CATEGORIAS_ESTATISTICA.map(cat => {
    const valor = somaCategoria(basePeriodo, cat.id);

    return `
      <article class="estatistica-card">
        <div class="estatistica-card-cabecalho">${cat.nome}</div>
        <div class="estatistica-card-valor">${formatarNumeroEstatistica(valor)}</div>
        <div class="estatistica-card-icone">${renderizarIconeEstatistica(cat)}</div>
      </article>
    `;
  }).join("");
}

function renderizarEstatistica() {
  atualizarFiltroPeriodoEstatistica();
  renderizarEstatisticaSemResetarFiltro();
}


/* v56 - Total mensal mostra somente o mês/ano selecionado */
function obterPeriodoMensalSelecionado() {
  const ano = document.getElementById("estatisticaMesAnoReferencia")?.value || "";
  const mes = document.getElementById("estatisticaMesMesReferencia")?.value || "";
  return { ano, mes };
}

function obterBaseMensalSelecionadaExata() {
  const { ano, mes } = obterPeriodoMensalSelecionado();

  if (!ano || !mes) return [];

  return estatisticas.filter(item =>
    anoEstatistica(item.data) === String(ano) &&
    mesEstatistica(item.data) === String(mes)
  );
}

function obterBasePeriodo(ref) {
  if (!ref) return [];

  if (visaoEstatistica === "diario") {
    return [ref];
  }

  if (visaoEstatistica === "mes") {
    return obterBaseMensalSelecionadaExata();
  }

  if (visaoEstatistica === "ano") {
    const anoSelecionado = document.getElementById("estatisticaAnoReferencia")?.value || anoEstatistica(ref.data);
    return estatisticas.filter(item => anoEstatistica(item.data) === String(anoSelecionado));
  }

  return [ref];
}

function estatisticaSelecionada() {
  if (!estatisticas.length) return null;

  if (visaoEstatistica === "diario") {
    const data = document.getElementById("estatisticaDataReferencia")?.value || ultimaEstatistica()?.data;
    return estatisticas.find(item => item.data === data) || ultimaEstatistica();
  }

  if (visaoEstatistica === "mes") {
    const base = obterBaseMensalSelecionadaExata()
      .sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));

    return base[0] || null;
  }

  if (visaoEstatistica === "ano") {
    const anoSelecionado = document.getElementById("estatisticaAnoReferencia")?.value;

    const base = estatisticas
      .filter(item => anoEstatistica(item.data) === String(anoSelecionado))
      .sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data));

    return base[0] || null;
  }

  return ultimaEstatistica();
}

function configurarFiltroPeriodoEstatistica() {
  configurarCalendarioReferenciaDiario();

  const selAnoMensal = document.getElementById("estatisticaMesAnoReferencia");
  const selMesMensal = document.getElementById("estatisticaMesMesReferencia");
  const selAno = document.getElementById("estatisticaAnoReferencia");

  if (selAnoMensal) {
    selAnoMensal.onchange = function() {
      atualizarSelectMesMensalEstatistica(true);
      visaoEstatistica = "mes";
      renderizarEstatisticaSemResetarFiltro();
    };
  }

  if (selMesMensal) {
    selMesMensal.onchange = function() {
      visaoEstatistica = "mes";
      renderizarEstatisticaSemResetarFiltro();
    };
  }

  if (selAno) {
    selAno.onchange = function() {
      visaoEstatistica = "ano";
      renderizarEstatisticaSemResetarFiltro();
    };
  }
}

function renderizarEstatisticaSemResetarFiltro() {
  const ref = estatisticaSelecionada();
  const grid = document.getElementById("estatisticaGrid");
  const resumo = document.getElementById("estatisticaResumo");
  const subtitulo = document.getElementById("estatisticaSubtitulo");

  if (!grid || !resumo || !subtitulo) return;

  if (!ref) {
    grid.innerHTML = '<div class="vazio">Nenhum dado estatístico cadastrado para esta referência.</div>';
    resumo.innerHTML = "";
    subtitulo.textContent = "Nenhum dado estatístico cadastrado para esta referência.";
    return;
  }

  const basePeriodo = obterBasePeriodo(ref);
  const baseAno = obterBaseAno(ref);

  let referencia = ref.data;
  let tituloTotalPeriodo = "Total eventos dia/ano";
  let valorTotalPeriodo = calcularTotalDia(ref);

  if (visaoEstatistica === "mes") {
    const { ano, mes } = obterPeriodoMensalSelecionado();
    referencia = `${nomeMesEstatistica(mes)} de ${ano}`;
    tituloTotalPeriodo = "Total eventos mês/ano";
    valorTotalPeriodo = somaTotal(basePeriodo);
  }

  if (visaoEstatistica === "ano") {
    referencia = document.getElementById("estatisticaAnoReferencia")?.value || anoEstatistica(ref.data);
    tituloTotalPeriodo = "Total eventos ano";
    valorTotalPeriodo = somaTotal(basePeriodo);
  }

  subtitulo.textContent = `${obterTituloVisao()} • Referência: ${referencia}`;

  const totalPeriodo = somaTotal(basePeriodo);
  const trotesPeriodo = somaTrotes(basePeriodo);
  const totalAno = somaTotal(baseAno);
  const trotesAno = somaTrotes(baseAno);

  const totalDiaRef = calcularTotalDia(ref);
  const trotesDiaRef = Number(ref.categorias?.trotes?.dia || 0);

  const diasPeriodo = Math.max(basePeriodo.length, 1);
  const mesesAno = Math.max(new Set(baseAno.map(item => chaveMesEstatistica(item.data))).size, 1);
  const diasAnoAteRef = calcularDiasDoAnoAteData(ref.data);

  const mediaHoraDia = (totalDiaRef - trotesDiaRef) / 24;
  const mediaHoraAcumulado = (totalAno - trotesAno) / (diasAnoAteRef * 24);
  const mediaDiaria = (totalPeriodo - trotesPeriodo) / diasPeriodo;
  const mediaMensal = (totalAno - trotesAno) / mesesAno;

  const totalAnoTexto = visaoEstatistica === "ano"
    ? ""
    : ` / ${formatarNumeroEstatistica(totalAno)}`;

  resumo.innerHTML = `
    <div class="resumo-card"><span>${tituloTotalPeriodo}</span><strong>${formatarNumeroEstatistica(valorTotalPeriodo)}${totalAnoTexto}</strong></div>
    <div class="resumo-card"><span>Média por hora/dia</span><strong>${formatarNumeroEstatistica(mediaHoraDia)}</strong></div>
    <div class="resumo-card"><span>Média por hora/acumulado</span><strong>${formatarNumeroEstatistica(mediaHoraAcumulado)}</strong></div>
    <div class="resumo-card"><span>Média diária</span><strong>${formatarNumeroEstatistica(mediaDiaria)}</strong></div>
    <div class="resumo-card"><span>Média mensal</span><strong>${formatarNumeroEstatistica(mediaMensal)}</strong></div>
  `;

  grid.innerHTML = CATEGORIAS_ESTATISTICA.map(cat => {
    const valor = somaCategoria(basePeriodo, cat.id);

    return `
      <article class="estatistica-card">
        <div class="estatistica-card-cabecalho">${cat.nome}</div>
        <div class="estatistica-card-valor">${formatarNumeroEstatistica(valor)}</div>
        <div class="estatistica-card-icone">${renderizarIconeEstatistica(cat)}</div>
      </article>
    `;
  }).join("");
}

function renderizarEstatistica() {
  atualizarFiltroPeriodoEstatistica();
  renderizarEstatisticaSemResetarFiltro();
}


/* v57 - renderização direta do Total Mensal */
function obterAnoMesMensalSelecionadoDireto() {
  const ano = document.getElementById("estatisticaMesAnoReferencia")?.value || "";
  const mes = document.getElementById("estatisticaMesMesReferencia")?.value || "";
  return { ano, mes };
}

function obterRegistrosDoMesSelecionadoDireto() {
  const { ano, mes } = obterAnoMesMensalSelecionadoDireto();

  if (!ano || !mes) return [];

  return estatisticas.filter(item => {
    return anoEstatistica(item.data) === String(ano) &&
           mesEstatistica(item.data) === String(mes);
  });
}

function configurarFiltroPeriodoEstatistica() {
  configurarCalendarioReferenciaDiario();

  const selAnoMensal = document.getElementById("estatisticaMesAnoReferencia");
  const selMesMensal = document.getElementById("estatisticaMesMesReferencia");
  const selAno = document.getElementById("estatisticaAnoReferencia");

  if (selAnoMensal) {
    selAnoMensal.onchange = function() {
      visaoEstatistica = "mes";
      atualizarSelectMesMensalEstatistica(true);
      renderizarTotalMensalDireto();
    };
  }

  if (selMesMensal) {
    selMesMensal.onchange = function() {
      visaoEstatistica = "mes";
      renderizarTotalMensalDireto();
    };
  }

  if (selAno) {
    selAno.onchange = function() {
      visaoEstatistica = "ano";
      renderizarEstatisticaSemResetarFiltro();
    };
  }
}

function ativarVisaoEstatistica(visao) {
  if (!["diario", "mes", "ano"].includes(visao)) {
    visao = "diario";
  }

  visaoEstatistica = visao;

  document.querySelectorAll(".btn-estatistica").forEach(btn => {
    btn.classList.toggle("ativo", btn.dataset.visao === visao);
  });

  atualizarFiltroPeriodoEstatistica();

  if (visao === "mes") {
    atualizarSelectAnoMesReferenciaEstatistica();
    atualizarSelectMesMensalEstatistica();
    renderizarTotalMensalDireto();
    return;
  }

  if (visao === "ano") {
    atualizarSelectAnoReferenciaEstatistica();
    renderizarEstatisticaSemResetarFiltro();
    return;
  }

  const dataAtual = document.getElementById("estatisticaDataReferencia")?.value;
  const ultima = ultimaEstatistica();

  if (!dataAtual && ultima) {
    selecionarDataReferenciaEstatistica(ultima.data, false);
  }

  renderizarEstatisticaSemResetarFiltro();
}

function renderizarTotalMensalDireto() {
  const grid = document.getElementById("estatisticaGrid");
  const resumo = document.getElementById("estatisticaResumo");
  const subtitulo = document.getElementById("estatisticaSubtitulo");

  if (!grid || !resumo || !subtitulo) return;

  const { ano, mes } = obterAnoMesMensalSelecionadoDireto();
  const baseMes = obterRegistrosDoMesSelecionadoDireto();

  if (!baseMes.length) {
    grid.innerHTML = '<div class="vazio">Nenhum dado estatístico cadastrado para este mês.</div>';
    resumo.innerHTML = "";
    subtitulo.textContent = `Nenhum dado estatístico cadastrado para ${nomeMesEstatistica(mes)} de ${ano}.`;
    return;
  }

  const referencia = `${nomeMesEstatistica(mes)} de ${ano}`;
  subtitulo.textContent = `Total mensal • Referência: ${referencia}`;

  const ultimoRegistroDoMes = [...baseMes].sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data))[0];

  const baseAno = estatisticas.filter(item => anoEstatistica(item.data) === String(ano));

  const totalMes = somaTotal(baseMes);
  const trotesMes = somaTrotes(baseMes);
  const totalAno = somaTotal(baseAno);
  const trotesAno = somaTrotes(baseAno);

  const totalDiaRef = calcularTotalDia(ultimoRegistroDoMes);
  const trotesDiaRef = Number(ultimoRegistroDoMes.categorias?.trotes?.dia || 0);

  const diasPeriodo = Math.max(baseMes.length, 1);
  const mesesAno = Math.max(new Set(baseAno.map(item => chaveMesEstatistica(item.data))).size, 1);
  const diasAnoAteRef = calcularDiasDoAnoAteData(ultimoRegistroDoMes.data);

  const mediaHoraDia = (totalDiaRef - trotesDiaRef) / 24;
  const mediaHoraAcumulado = (totalAno - trotesAno) / (diasAnoAteRef * 24);
  const mediaDiaria = (totalMes - trotesMes) / diasPeriodo;
  const mediaMensal = (totalAno - trotesAno) / mesesAno;

  resumo.innerHTML = `
    <div class="resumo-card"><span>Total eventos mês/ano</span><strong>${formatarNumeroEstatistica(totalMes)} / ${formatarNumeroEstatistica(totalAno)}</strong></div>
    <div class="resumo-card"><span>Média por hora/dia</span><strong>${formatarNumeroEstatistica(mediaHoraDia)}</strong></div>
    <div class="resumo-card"><span>Média por hora/acumulado</span><strong>${formatarNumeroEstatistica(mediaHoraAcumulado)}</strong></div>
    <div class="resumo-card"><span>Média diária</span><strong>${formatarNumeroEstatistica(mediaDiaria)}</strong></div>
    <div class="resumo-card"><span>Média mensal</span><strong>${formatarNumeroEstatistica(mediaMensal)}</strong></div>
  `;

  grid.innerHTML = CATEGORIAS_ESTATISTICA.map(cat => {
    const valor = somaCategoria(baseMes, cat.id);

    return `
      <article class="estatistica-card">
        <div class="estatistica-card-cabecalho">${cat.nome}</div>
        <div class="estatistica-card-valor">${formatarNumeroEstatistica(valor)}</div>
        <div class="estatistica-card-icone">${renderizarIconeEstatistica(cat)}</div>
      </article>
    `;
  }).join("");
}

function renderizarEstatistica() {
  atualizarFiltroPeriodoEstatistica();

  if (visaoEstatistica === "mes") {
    renderizarTotalMensalDireto();
    return;
  }

  renderizarEstatisticaSemResetarFiltro();
}


/* v58 - Total Mensal: leitura direta dos selects e atualização imediata */
function lerAnoMesMensalAtual() {
  const anoSelect = document.getElementById("estatisticaMesAnoReferencia");
  const mesSelect = document.getElementById("estatisticaMesMesReferencia");

  return {
    ano: anoSelect ? String(anoSelect.value || "") : "",
    mes: mesSelect ? String(mesSelect.value || "") : ""
  };
}

function registrosDoMesAtual() {
  const { ano, mes } = lerAnoMesMensalAtual();

  if (!ano || !mes) return [];

  return estatisticas.filter(item => {
    return String(anoEstatistica(item.data)) === ano &&
           String(mesEstatistica(item.data)) === mes;
  });
}

function atualizarSelectAnoMesReferenciaEstatistica() {
  const select = document.getElementById("estatisticaMesAnoReferencia");
  if (!select) return;

  const anos = [...new Set(estatisticas.map(item => anoEstatistica(item.data)))]
    .sort((a, b) => Number(b) - Number(a));

  const valorAnterior = select.value;
  const anoDaData = document.getElementById("estatisticaDataReferencia")?.value
    ? anoEstatistica(document.getElementById("estatisticaDataReferencia").value)
    : "";

  const valor = valorAnterior || anoDaData || anos[0] || "";

  select.innerHTML = anos.map(ano => `<option value="${ano}">${ano}</option>`).join("");

  if (valor && anos.includes(valor)) select.value = valor;
  else if (anos.length) select.value = anos[0];
}

function atualizarSelectMesMensalEstatistica(forcarPrimeiroComDados = false) {
  const anoSelect = document.getElementById("estatisticaMesAnoReferencia");
  const mesSelect = document.getElementById("estatisticaMesMesReferencia");

  if (!anoSelect || !mesSelect) return;

  const ano = String(anoSelect.value || "");
  const mesesComDados = new Set(
    estatisticas
      .filter(item => anoEstatistica(item.data) === ano)
      .map(item => mesEstatistica(item.data))
  );

  const meses = ["01","02","03","04","05","06","07","08","09","10","11","12"];

  let valor = forcarPrimeiroComDados ? "" : String(mesSelect.value || "");

  if (!valor || !mesesComDados.has(valor)) {
    // Pega o mês mais recente com dados naquele ano
    valor = [...mesesComDados].sort((a, b) => Number(b) - Number(a))[0] || "";
  }

  mesSelect.innerHTML = meses.map(mes => {
    const habilitado = mesesComDados.has(mes);
    return `<option value="${mes}" ${habilitado ? "" : "disabled"}>${nomeMesEstatistica(mes)}</option>`;
  }).join("");

  if (valor) mesSelect.value = valor;
}

function configurarFiltroPeriodoEstatistica() {
  configurarCalendarioReferenciaDiario();

  const anoMensal = document.getElementById("estatisticaMesAnoReferencia");
  const mesMensal = document.getElementById("estatisticaMesMesReferencia");
  const anoAnual = document.getElementById("estatisticaAnoReferencia");

  if (anoMensal) {
    anoMensal.onchange = function() {
      visaoEstatistica = "mes";
      atualizarSelectMesMensalEstatistica(true);
      renderizarTotalMensalAgora();
    };
  }

  if (mesMensal) {
    mesMensal.onchange = function() {
      visaoEstatistica = "mes";
      renderizarTotalMensalAgora();
    };
  }

  if (anoAnual) {
    anoAnual.onchange = function() {
      visaoEstatistica = "ano";
      renderizarEstatisticaSemResetarFiltro();
    };
  }
}

function ativarVisaoEstatistica(visao) {
  if (!["diario", "mes", "ano"].includes(visao)) visao = "diario";

  visaoEstatistica = visao;

  document.querySelectorAll(".btn-estatistica").forEach(btn => {
    btn.classList.toggle("ativo", btn.dataset.visao === visao);
  });

  atualizarFiltroPeriodoEstatistica();

  if (visao === "mes") {
    atualizarSelectAnoMesReferenciaEstatistica();
    atualizarSelectMesMensalEstatistica();
    configurarFiltroPeriodoEstatistica();
    renderizarTotalMensalAgora();
    return;
  }

  if (visao === "ano") {
    atualizarSelectAnoReferenciaEstatistica();
    renderizarEstatisticaSemResetarFiltro();
    return;
  }

  const dataAtual = document.getElementById("estatisticaDataReferencia")?.value;
  const ultima = ultimaEstatistica();

  if (!dataAtual && ultima) {
    selecionarDataReferenciaEstatistica(ultima.data, false);
  }

  renderizarEstatisticaSemResetarFiltro();
}

function atualizarFiltroPeriodoEstatistica() {
  const filtroData = document.getElementById("filtroEstatisticaData");
  const filtroMes = document.getElementById("filtroEstatisticaMes");
  const filtroAno = document.getElementById("filtroEstatisticaAno");

  filtroData?.classList.add("escondido");
  filtroMes?.classList.add("escondido");
  filtroAno?.classList.add("escondido");

  if (visaoEstatistica === "diario") {
    filtroData?.classList.remove("escondido");
    configurarCalendarioReferenciaDiario();
    atualizarCalendarioReferenciaEstatistica();
  }

  if (visaoEstatistica === "mes") {
    filtroMes?.classList.remove("escondido");
  }

  if (visaoEstatistica === "ano") {
    filtroAno?.classList.remove("escondido");
  }
}

function renderizarTotalMensalAgora() {
  const grid = document.getElementById("estatisticaGrid");
  const resumo = document.getElementById("estatisticaResumo");
  const subtitulo = document.getElementById("estatisticaSubtitulo");

  if (!grid || !resumo || !subtitulo) return;

  const { ano, mes } = lerAnoMesMensalAtual();
  const baseMes = registrosDoMesAtual();

  if (!ano || !mes) {
    grid.innerHTML = '<div class="vazio">Selecione ano e mês de referência.</div>';
    resumo.innerHTML = "";
    subtitulo.textContent = "Selecione ano e mês de referência.";
    return;
  }

  if (!baseMes.length) {
    grid.innerHTML = '<div class="vazio">Nenhum dado estatístico cadastrado para este mês.</div>';
    resumo.innerHTML = "";
    subtitulo.textContent = `Nenhum dado estatístico cadastrado para ${nomeMesEstatistica(mes)} de ${ano}.`;
    return;
  }

  const baseAno = estatisticas.filter(item => anoEstatistica(item.data) === ano);
  const ultimoDoMes = [...baseMes].sort((a, b) => parseDataBR(b.data) - parseDataBR(a.data))[0];

  const totalMes = somaTotal(baseMes);
  const trotesMes = somaTrotes(baseMes);
  const totalAno = somaTotal(baseAno);
  const trotesAno = somaTrotes(baseAno);

  const totalDiaRef = calcularTotalDia(ultimoDoMes);
  const trotesDiaRef = Number(ultimoDoMes.categorias?.trotes?.dia || 0);

  const diasPeriodo = Math.max(baseMes.length, 1);
  const mesesAno = Math.max(new Set(baseAno.map(item => chaveMesEstatistica(item.data))).size, 1);
  const diasAnoAteRef = calcularDiasDoAnoAteData(ultimoDoMes.data);

  const mediaHoraDia = (totalDiaRef - trotesDiaRef) / 24;
  const mediaHoraAcumulado = (totalAno - trotesAno) / (diasAnoAteRef * 24);
  const mediaDiaria = (totalMes - trotesMes) / diasPeriodo;
  const mediaMensal = (totalAno - trotesAno) / mesesAno;

  subtitulo.textContent = `Total mensal • Referência: ${nomeMesEstatistica(mes)} de ${ano}`;

  resumo.innerHTML = `
    <div class="resumo-card"><span>Total eventos mês/ano</span><strong>${formatarNumeroEstatistica(totalMes)} / ${formatarNumeroEstatistica(totalAno)}</strong></div>
    <div class="resumo-card"><span>Média por hora/dia</span><strong>${formatarNumeroEstatistica(mediaHoraDia)}</strong></div>
    <div class="resumo-card"><span>Média por hora/acumulado</span><strong>${formatarNumeroEstatistica(mediaHoraAcumulado)}</strong></div>
    <div class="resumo-card"><span>Média diária</span><strong>${formatarNumeroEstatistica(mediaDiaria)}</strong></div>
    <div class="resumo-card"><span>Média mensal</span><strong>${formatarNumeroEstatistica(mediaMensal)}</strong></div>
  `;

  grid.innerHTML = CATEGORIAS_ESTATISTICA.map(cat => {
    const valor = somaCategoria(baseMes, cat.id);

    return `
      <article class="estatistica-card">
        <div class="estatistica-card-cabecalho">${cat.nome}</div>
        <div class="estatistica-card-valor">${formatarNumeroEstatistica(valor)}</div>
        <div class="estatistica-card-icone">${renderizarIconeEstatistica(cat)}</div>
      </article>
    `;
  }).join("");
}

function renderizarEstatistica() {
  atualizarFiltroPeriodoEstatistica();

  if (visaoEstatistica === "mes") {
    renderizarTotalMensalAgora();
    return;
  }

  renderizarEstatisticaSemResetarFiltro();
}



function renderizarIconeEstatistica(cat) {
  if (cat.iconeImg) {
    return `<img class="estatistica-icone-img" src="${cat.iconeImg}" alt="${escapeHtml(cat.nome)}">`;
  }

  return cat.icone || "";
}


/* v67 - indicador visual de data com dados já inseridos */
function atualizarAvisoDataEstatisticaExistente(dataBR) {
  const aviso = document.getElementById("avisoEstatisticaExistente");
  const campoData = document.querySelector("#modalEstatistica .campo-data-estatistica");
  const botao = document.getElementById("btnCalendarioEstatistica");

  const existente = estatisticas.find(item => item.data === dataBR);

  if (existente) {
    aviso?.classList.remove("escondido");
    campoData?.classList.add("data-ja-cadastrada");
    if (botao) botao.textContent = `${dataBR} — dados já inseridos`;
  } else {
    aviso?.classList.add("escondido");
    campoData?.classList.remove("data-ja-cadastrada");
    if (botao) botao.textContent = dataBR || "Selecionar data";
  }
}

function selecionarDataEstatistica(dataBR) {
  const input = document.getElementById("estatisticaData");

  if (input) input.value = dataBR;

  mesCalendarioEstatistica = parseDataBR(dataBR);

  limparCamposEstatistica();

  const existente = estatisticas.find(item => item.data === dataBR);

  if (existente) {
    preencherFormularioEstatistica(existente);
  }

  atualizarAvisoDataEstatisticaExistente(dataBR);
  renderizarCalendarioEstatistica();
}


/* v68 - indicador compacto com check na Data da Estatística */
function atualizarAvisoDataEstatisticaExistente(dataBR) {
  const aviso = document.getElementById("avisoEstatisticaExistente");
  const campoData = document.querySelector("#modalEstatistica .campo-data-estatistica");
  const botao = document.getElementById("btnCalendarioEstatistica");

  const existente = estatisticas.find(item => item.data === dataBR);

  if (existente) {
    aviso?.classList.remove("escondido");
    campoData?.classList.add("data-ja-cadastrada");
    if (botao) botao.textContent = `${dataBR} ✅`;
  } else {
    aviso?.classList.add("escondido");
    campoData?.classList.remove("data-ja-cadastrada");
    if (botao) botao.textContent = dataBR || "Selecionar data";
  }
}


/* v69 - fecha calendário da Data de Referência ao clicar fora */
function configurarFechamentoExternoCalendarioReferencia() {
  if (document.body.dataset.fechaCalendarioReferenciaV69 === "1") return;
  document.body.dataset.fechaCalendarioReferenciaV69 = "1";

  document.addEventListener("click", (event) => {
    const painel = document.getElementById("painelCalendarioReferenciaEstatistica");
    const botao = document.getElementById("btnCalendarioReferenciaEstatistica");

    if (!painel || painel.classList.contains("escondido")) return;

    const clicouNoPainel = painel.contains(event.target);
    const clicouNoBotao = botao && botao.contains(event.target);

    if (!clicouNoPainel && !clicouNoBotao) {
      painel.classList.add("escondido");
    }
  });
}

function configurarCalendarioReferenciaDiario() {
  const btnCal = document.getElementById("btnCalendarioReferenciaEstatistica");
  const painel = document.getElementById("painelCalendarioReferenciaEstatistica");
  const anterior = document.getElementById("mesAnteriorReferenciaEstatistica");
  const proximo = document.getElementById("mesProximoReferenciaEstatistica");

  configurarFechamentoExternoCalendarioReferencia();

  if (btnCal && btnCal.dataset.v69 !== "1") {
    btnCal.dataset.v69 = "1";
    btnCal.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!painel) return;

      painel.classList.toggle("escondido");

      const dataAtual = document.getElementById("estatisticaDataReferencia")?.value;
      if (dataAtual) {
        mesCalendarioReferenciaEstatistica = parseDataBR(dataAtual);
      } else if (ultimaEstatistica()) {
        mesCalendarioReferenciaEstatistica = parseDataBR(ultimaEstatistica().data);
      } else {
        mesCalendarioReferenciaEstatistica = new Date();
      }

      atualizarCalendarioReferenciaEstatistica();
    });
  }

  if (anterior && anterior.dataset.v69 !== "1") {
    anterior.dataset.v69 = "1";
    anterior.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!mesCalendarioReferenciaEstatistica) {
        const dataAtual = document.getElementById("estatisticaDataReferencia")?.value;
        mesCalendarioReferenciaEstatistica = dataAtual ? parseDataBR(dataAtual) : new Date();
      }

      mesCalendarioReferenciaEstatistica.setMonth(mesCalendarioReferenciaEstatistica.getMonth() - 1);
      atualizarCalendarioReferenciaEstatistica();
    });
  }

  if (proximo && proximo.dataset.v69 !== "1") {
    proximo.dataset.v69 = "1";
    proximo.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (!mesCalendarioReferenciaEstatistica) {
        const dataAtual = document.getElementById("estatisticaDataReferencia")?.value;
        mesCalendarioReferenciaEstatistica = dataAtual ? parseDataBR(dataAtual) : new Date();
      }

      mesCalendarioReferenciaEstatistica.setMonth(mesCalendarioReferenciaEstatistica.getMonth() + 1);
      atualizarCalendarioReferenciaEstatistica();
    });
  }
}

document.addEventListener("DOMContentLoaded", configurarFechamentoExternoCalendarioReferencia);


/* v157 - Calendário da Data de Referência com escolha Ano > Mês > Dia */
let modoCalendarioReferenciaEstatisticaV157 = "dias";
let anoSelecionadoReferenciaEstatisticaV157 = null;

function datasComEstatisticasV157() {
  const datas = new Set();

  try {
    (dados.estatisticas || []).forEach(reg => {
      if (reg?.data) datas.add(String(reg.data));
      if (reg?.dataReferencia) datas.add(String(reg.dataReferencia));
      if (reg?.dataEstatistica) datas.add(String(reg.dataEstatistica));
    });
  } catch {}

  try {
    (dados.estatisticasSocorros || []).forEach(reg => {
      if (reg?.data) datas.add(String(reg.data));
      if (reg?.dataReferencia) datas.add(String(reg.dataReferencia));
      if (reg?.dataEstatistica) datas.add(String(reg.dataEstatistica));
    });
  } catch {}

  try {
    (estatisticasSocorros || []).forEach(reg => {
      if (reg?.data) datas.add(String(reg.data));
      if (reg?.dataReferencia) datas.add(String(reg.dataReferencia));
      if (reg?.dataEstatistica) datas.add(String(reg.dataEstatistica));
    });
  } catch {}

  return Array.from(datas).filter(Boolean);
}

function parseDataReferenciaV157(dataBR) {
  try {
    if (typeof parseDataBR === "function") return parseDataBR(dataBR);
  } catch {}

  const m = String(dataBR || "").match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

function chaveDataReferenciaV157(data) {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function mapaDatasReferenciaEstatisticaV157() {
  const anos = new Set();
  const mesesPorAno = new Map();
  const diasPorMesAno = new Map();

  datasComEstatisticasV157().forEach(dataBR => {
    const data = parseDataReferenciaV157(dataBR);
    if (!data || Number.isNaN(data.getTime())) return;

    const ano = data.getFullYear();
    const mes = data.getMonth();
    const dia = data.getDate();

    anos.add(ano);

    if (!mesesPorAno.has(ano)) mesesPorAno.set(ano, new Set());
    mesesPorAno.get(ano).add(mes);

    const chaveMes = `${ano}-${String(mes + 1).padStart(2, "0")}`;
    if (!diasPorMesAno.has(chaveMes)) diasPorMesAno.set(chaveMes, new Set());
    diasPorMesAno.get(chaveMes).add(dia);
  });

  return { anos, mesesPorAno, diasPorMesAno };
}

function obterMesCalendarioReferenciaV157() {
  try {
    if (typeof mesCalendarioReferenciaEstatistica !== "undefined" && mesCalendarioReferenciaEstatistica) {
      return mesCalendarioReferenciaEstatistica;
    }
  } catch {}

  try {
    if (typeof mesReferenciaEstatistica !== "undefined" && mesReferenciaEstatistica) {
      return mesReferenciaEstatistica;
    }
  } catch {}

  return new Date();
}

function definirMesCalendarioReferenciaV157(data) {
  try {
    if (typeof mesCalendarioReferenciaEstatistica !== "undefined") {
      mesCalendarioReferenciaEstatistica = data;
    }
  } catch {}

  try {
    if (typeof mesReferenciaEstatistica !== "undefined") {
      mesReferenciaEstatistica = data;
    }
  } catch {}

  window.mesCalendarioReferenciaEstatistica = data;
}

function renderizarDiasReferenciaEstatisticaV157() {
  modoCalendarioReferenciaEstatisticaV157 = "dias";

  try {
    if (typeof renderizarCalendarioReferenciaEstatisticaOriginalV157 === "function") {
      renderizarCalendarioReferenciaEstatisticaOriginalV157();
    } else if (typeof renderizarCalendarioReferenciaEstatistica === "function") {
      renderizarCalendarioReferenciaEstatistica();
    }
  } catch {}

  setTimeout(destacarDiasReferenciaEstatisticaV157, 0);
  setTimeout(destacarDiasReferenciaEstatisticaV157, 120);
}

function renderizarSeletorMesesReferenciaEstatisticaV157(ano) {
  const grade = document.getElementById("gradeCalendarioReferenciaEstatistica");
  const titulo = document.getElementById("mesAnoCalendarioReferenciaEstatistica");
  if (!grade || !titulo) return;

  const { mesesPorAno } = mapaDatasReferenciaEstatisticaV157();
  const mesesComDados = mesesPorAno.get(ano) || new Set();

  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril",
    "Maio", "Junho", "Julho", "Agosto",
    "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  modoCalendarioReferenciaEstatisticaV157 = "meses";
  anoSelecionadoReferenciaEstatisticaV157 = ano;

  titulo.textContent = "Escolher ano";
  titulo.classList.add("titulo-calendario-referencia-v157");
  titulo.title = `Clique para escolher outro ano. Ano atual: ${ano}`;

  grade.innerHTML = "";
  grade.classList.remove("grade-calendario-referencia-anos-v157");
  grade.classList.add("grade-calendario-referencia-meses-v157");

  nomesMeses.forEach((nome, mes) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "mes-calendario-referencia-v157";
    btn.innerHTML = `<span>${nome.substring(0, 3)}</span><small>${ano}</small>`;

    if (mesesComDados.has(mes)) {
      btn.classList.add("tem-dados");
      btn.title = "Há dados estatísticos neste mês";
    } else {
      btn.classList.add("sem-dados");
      btn.title = "Sem dados estatísticos neste mês";
    }

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      definirMesCalendarioReferenciaV157(new Date(ano, mes, 1));
      renderizarDiasReferenciaEstatisticaV157();
    });

    grade.appendChild(btn);
  });
}

function renderizarSeletorAnosReferenciaEstatisticaV157() {
  const grade = document.getElementById("gradeCalendarioReferenciaEstatistica");
  const titulo = document.getElementById("mesAnoCalendarioReferenciaEstatistica");
  if (!grade || !titulo) return;

  const { anos } = mapaDatasReferenciaEstatisticaV157();
  const mesAtual = obterMesCalendarioReferenciaV157();
  const anoAtual = anoSelecionadoReferenciaEstatisticaV157 || mesAtual.getFullYear();
  const anosComDados = Array.from(anos).sort((a, b) => b - a);

  let inicio;
  let fim;

  if (anosComDados.length) {
    inicio = Math.min(...anosComDados, anoAtual);
    fim = Math.max(...anosComDados);
  } else {
    inicio = anoAtual - 5;
    fim = anoAtual;
  }

  const anosParaMostrar = [];
  for (let ano = fim; ano >= inicio; ano--) anosParaMostrar.push(ano);

  modoCalendarioReferenciaEstatisticaV157 = "anos";

  titulo.textContent = "Escolha o ano";
  titulo.classList.add("titulo-calendario-referencia-v157");
  titulo.title = "Escolha um ano para ver os meses";

  grade.innerHTML = "";
  grade.classList.remove("grade-calendario-referencia-meses-v157");
  grade.classList.add("grade-calendario-referencia-anos-v157");

  anosParaMostrar.forEach(ano => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ano-calendario-referencia-v157";
    btn.textContent = String(ano);

    if (ano === anoAtual) btn.classList.add("atual");
    if (anos.has(ano)) {
      btn.classList.add("tem-dados");
      btn.title = "Há dados estatísticos neste ano";
    } else {
      btn.classList.add("sem-dados");
      btn.title = "Sem dados estatísticos neste ano";
    }

    btn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      renderizarSeletorMesesReferenciaEstatisticaV157(ano);
    });

    grade.appendChild(btn);
  });
}

function destacarDiasReferenciaEstatisticaV157() {
  const grade = document.getElementById("gradeCalendarioReferenciaEstatistica");
  const mesAtual = obterMesCalendarioReferenciaV157();

  if (!grade || !mesAtual || modoCalendarioReferenciaEstatisticaV157 !== "dias") return;

  const { diasPorMesAno } = mapaDatasReferenciaEstatisticaV157();
  const chave = `${mesAtual.getFullYear()}-${String(mesAtual.getMonth() + 1).padStart(2, "0")}`;
  const diasComDados = diasPorMesAno.get(chave) || new Set();

  grade.classList.remove("grade-calendario-referencia-anos-v157", "grade-calendario-referencia-meses-v157");
  grade.classList.add("grade-calendario-referencia-dias-v157");

  grade.querySelectorAll("button, .dia, .calendario-dia, [data-data], [data-date]").forEach(btn => {
    const texto = (btn.textContent || "").trim();
    if (!/^\d{1,2}$/.test(texto)) return;

    const dia = Number(texto);

    if (diasComDados.has(dia)) {
      btn.classList.add("tem-dados", "dia-com-dados", "dia-com-estatistica", "calendario-dia-referencia-com-dados-v157");
      btn.title = "Há dados estatísticos neste dia";
    }
  });
}

function configurarTituloReferenciaEstatisticaV157() {
  const titulo = document.getElementById("mesAnoCalendarioReferenciaEstatistica");
  if (!titulo || titulo.dataset.v157 === "1") return;

  titulo.dataset.v157 = "1";
  titulo.classList.add("titulo-calendario-referencia-v157");
  titulo.title = "Clique para escolher mês ou ano";

  titulo.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (modoCalendarioReferenciaEstatisticaV157 === "dias") {
      const ano = obterMesCalendarioReferenciaV157().getFullYear();
      renderizarSeletorMesesReferenciaEstatisticaV157(ano);
      return;
    }

    if (modoCalendarioReferenciaEstatisticaV157 === "meses") {
      renderizarSeletorAnosReferenciaEstatisticaV157();
      return;
    }

    if (modoCalendarioReferenciaEstatisticaV157 === "anos") {
      const ano = anoSelecionadoReferenciaEstatisticaV157 || obterMesCalendarioReferenciaV157().getFullYear();
      renderizarSeletorMesesReferenciaEstatisticaV157(ano);
    }
  });
}

function configurarFechamentoDiaReferenciaEstatisticaV157() {
  const painel = document.getElementById("painelCalendarioReferenciaEstatistica");
  if (!painel || painel.dataset.fechaDiaV157 === "1") return;

  painel.dataset.fechaDiaV157 = "1";

  painel.addEventListener("click", (event) => {
    if (modoCalendarioReferenciaEstatisticaV157 !== "dias") return;

    const alvo = event.target.closest("button, .dia, .calendario-dia, [data-data], [data-date]");
    if (!alvo || !painel.contains(alvo)) return;

    const texto = (alvo.textContent || "").trim();
    if (!/^\d{1,2}$/.test(texto)) return;

    setTimeout(() => {
      painel.classList.add("escondido");
    }, 0);
  }, false);
}

function configurarCalendarioReferenciaEstatisticaAvancadoV157() {
  configurarTituloReferenciaEstatisticaV157();
  configurarFechamentoDiaReferenciaEstatisticaV157();

  const btn = document.getElementById("btnCalendarioReferenciaEstatistica");
  const painel = document.getElementById("painelCalendarioReferenciaEstatistica");

  if (btn && btn.dataset.v157 !== "1") {
    btn.dataset.v157 = "1";
    btn.addEventListener("click", () => {
      setTimeout(() => {
        configurarTituloReferenciaEstatisticaV157();
        configurarFechamentoDiaReferenciaEstatisticaV157();

        if (painel && !painel.classList.contains("escondido")) {
          modoCalendarioReferenciaEstatisticaV157 = "dias";
          renderizarDiasReferenciaEstatisticaV157();
        }
      }, 0);
    });
  }

  ["mesAnteriorReferenciaEstatistica", "mesProximoReferenciaEstatistica"].forEach(id => {
    const nav = document.getElementById(id);
    if (!nav || nav.dataset.v157 === "1") return;

    nav.dataset.v157 = "1";
    nav.addEventListener("click", () => {
      modoCalendarioReferenciaEstatisticaV157 = "dias";
      setTimeout(destacarDiasReferenciaEstatisticaV157, 0);
      setTimeout(destacarDiasReferenciaEstatisticaV157, 100);
    });
  });
}

if (typeof renderizarCalendarioReferenciaEstatistica === "function" && !window.renderizarCalendarioReferenciaEstatisticaOriginalV157) {
  window.renderizarCalendarioReferenciaEstatisticaOriginalV157 = renderizarCalendarioReferenciaEstatistica;

  renderizarCalendarioReferenciaEstatistica = function(...args) {
    const resultado = window.renderizarCalendarioReferenciaEstatisticaOriginalV157.apply(this, args);

    if (modoCalendarioReferenciaEstatisticaV157 !== "anos" && modoCalendarioReferenciaEstatisticaV157 !== "meses") {
      modoCalendarioReferenciaEstatisticaV157 = "dias";
    }

    configurarTituloReferenciaEstatisticaV157();
    configurarFechamentoDiaReferenciaEstatisticaV157();
    setTimeout(destacarDiasReferenciaEstatisticaV157, 0);

    return resultado;
  };
}

document.addEventListener("DOMContentLoaded", () => {
  configurarCalendarioReferenciaEstatisticaAvancadoV157();
  setTimeout(configurarCalendarioReferenciaEstatisticaAvancadoV157, 300);
  setTimeout(() => {
    configurarCalendarioReferenciaEstatisticaAvancadoV157();
    destacarDiasReferenciaEstatisticaV157();
  }, 900);
});
